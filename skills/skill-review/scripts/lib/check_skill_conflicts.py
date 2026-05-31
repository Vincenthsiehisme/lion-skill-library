#!/usr/bin/env python3
"""字面重疊初篩：檢查 target skill 的 trigger 訊號是否與技能庫中其他 skill 重疊。

This checker is intentionally conservative. It does not decide semantic ownership;
it only surfaces likely overlaps for human review.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from typing import Iterable

try:
    import yaml  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    yaml = None

STOPWORDS = {
    "skill",
    "review",
    "create",
    "brain",
    "data",
    "資料",
    "分析",
    "報告",
    "檢查",
    "審查",
    "使用",
    "處理",
    "流程",
    "問題",
    "系統",
    "工具",
    "文件",
    "內容",
    "when",
    "user",
    "use",
    "trigger",
    "audit",
    "check",
    "helper",
    "assistant",
}

COMMON_BASE_CANDIDATES = [
    Path.home() / ".claude" / "skills",
    Path.home() / "skills",
    Path("/home/claude/.claude/skills"),
    Path("/home/claude/skills"),
    Path("/mnt/skills/user"),
]


def read_skill(md: Path) -> tuple[str, str, str]:
    text = md.read_text(encoding="utf-8", errors="ignore")
    name = md.parent.name
    desc = ""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3 and yaml:
            try:
                fm = yaml.safe_load(parts[1]) or {}
                name = str(fm.get("name") or name)
                d = fm.get("description") or ""
                desc = d if isinstance(d, str) else str(d)
            except Exception:
                pass
    if not desc:
        m = re.search(r"description\s*:\s*(.*)", text)
        if m:
            desc = m.group(1)
    return name.strip(), desc.strip(), text


def split_terms(fragment: str) -> list[str]:
    # 中文句號 / 英文句點 / 問號 / 驚嘆號都視為 trigger list 結束或切分點，
    # 避免把後續審查理念、說明文字誤抽成 trigger。
    parts = re.split(r"[、,，;；。.!?！？/｜|]+|\bor\b|\n|•|- ", fragment, flags=re.I)
    out: list[str] = []
    for p in parts:
        term = p.strip(" \t\r\n。.:：；;，,「」『』\"'`()[]")
        if not term:
            continue
        if len(term) > 40:
            continue
        if term.lower() in STOPWORDS:
            continue
        out.append(term)
    return out


def positive_trigger_text(line: str) -> str:
    # 只抽正向 trigger，不抽 Do NOT 後的鄰居 skill 或邊界說明。
    return re.split(r"DO NOT|Do NOT|不要觸發|不適用|不處理", line, maxsplit=1, flags=re.I)[0]


def first_sentence(fragment: str) -> str:
    return re.split(r"[。.!?！？]", fragment, maxsplit=1)[0]


def extract_terms(desc: str) -> list[str]:
    terms: list[str] = []
    lines = [x.strip() for x in desc.splitlines() if x.strip()]
    for line in lines:
        positive = positive_trigger_text(line)
        if "觸發關鍵字" in positive or "觸發詞" in positive:
            frag = re.split(r"觸發關鍵字[：:]|觸發詞[：:]", positive, maxsplit=1)[-1]
            terms.extend(split_terms(first_sentence(frag)))
        if re.search(r"\bTrigger\s*:", positive, flags=re.I):
            frag = re.split(r"\bTrigger\s*:", positive, maxsplit=1, flags=re.I)[-1]
            terms.extend(split_terms(first_sentence(frag)))

    # Add high-signal quoted phrases and common Chinese task phrases as fallback.
    for q in re.findall(r"[「『\"]([^」』\"]{2,24})[」』\"]", desc):
        if q.lower() not in STOPWORDS:
            terms.append(q.strip())

    # Lightweight fallback: chunks around use/when/review/audit/審/檢查 words.
    if not terms:
        for m in re.findall(
            r"(?:審|檢查|健檢|review|audit|衝突|不觸發|輸出不穩)[\w\-\u4e00-\u9fff]{0,16}",
            desc,
            flags=re.I,
        ):
            terms.append(m.strip())

    seen: set[str] = set()
    out: list[str] = []
    for term in terms:
        key = term.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(term)
    return out


def hard_desc(desc: str) -> str:
    # For matching, exclude anti-trigger section after DO NOT where possible.
    return re.split(r"DO NOT|Do NOT|不要觸發|不適用|不處理", desc, maxsplit=1, flags=re.I)[0]


def contains_term(text: str, term: str) -> bool:
    return bool(term and term.lower() in text.lower())


def existing_dirs(candidates: Iterable[Path]) -> list[Path]:
    seen: set[Path] = set()
    out: list[Path] = []
    for candidate in candidates:
        try:
            resolved = candidate.expanduser().resolve()
        except Exception:
            resolved = candidate.expanduser()
        if resolved in seen:
            continue
        seen.add(resolved)
        if resolved.is_dir():
            out.append(resolved)
    return out


def resolve_base(target: Path, provided: str | None) -> tuple[Path | None, str]:
    if provided:
        return Path(provided).expanduser(), "argument/env"

    env_base = os.environ.get("SKILLS_BASE")
    if env_base:
        return Path(env_base).expanduser(), "SKILLS_BASE"

    candidates = [*COMMON_BASE_CANDIDATES, target.parent]
    dirs = existing_dirs(candidates)
    if dirs:
        return dirs[0], "auto-detected"
    return None, "not found"


def main(argv: list[str]) -> int:
    if len(argv) not in {2, 3}:
        print(f"用法: {Path(argv[0]).name} <target-skill-dir> [skills-base]", file=sys.stderr)
        return 2

    target = Path(argv[1]).resolve()
    provided_base = argv[2] if len(argv) == 3 else None
    base, base_source = resolve_base(target, provided_base)

    target_md = target / "SKILL.md"
    if not target_md.exists():
        print(f"❌ 目標缺 SKILL.md: {target_md}", file=sys.stderr)
        return 2

    target_name, target_desc, _ = read_skill(target_md)
    target_terms = extract_terms(target_desc)

    print(f"🔍 衝突初篩: {target_name}")
    print(f"   目標 trigger 訊號: {len(target_terms)} 個")
    if target_terms:
        print("   " + "、".join(target_terms[:20]) + (" ..." if len(target_terms) > 20 else ""))
    print(f"   掃描範圍: {base if base else '(未找到)'}")
    print(f"   掃描範圍來源: {base_source}")
    print("")
    print("注意：此結果是字面重疊初篩；是否真衝突仍需人工判讀任務、輸入、輸出與邊界。")
    print("")

    if base is None or not base.exists():
        print("⚠️  未找到可用掃描範圍。請傳入 [skills-base] 或設定 SKILLS_BASE。")
        return 1

    if not target_terms:
        print("⚠️  目標 skill 沒有可抽取的 trigger 訊號，無法可靠比對。請先人工檢查 Dim 1。")
        return 1

    high = mid = low = 0
    rows: list[tuple[int, str, str, list[str], int]] = []
    for md in sorted(base.glob("*/SKILL.md")):
        name, desc, _ = read_skill(md)
        if name == target_name or md.resolve() == target_md.resolve():
            continue
        hdesc = hard_desc(desc)
        hits = [t for t in target_terms if contains_term(hdesc, t)]
        if not hits:
            continue
        hits = [h for h in hits if len(h) >= 2 and h.lower() not in STOPWORDS]
        if not hits:
            continue
        hit_count = len(hits)
        neighbor_terms = {x.lower() for x in extract_terms(desc)}
        explicit_overlap = sum(1 for h in hits if h.lower() in neighbor_terms)
        if hit_count >= 4 or explicit_overlap >= 3:
            sev = "🔴 高"
            high += 1
            code = 3
        elif hit_count >= 2 or explicit_overlap >= 1:
            sev = "🟡 中"
            mid += 1
            code = 2
        else:
            sev = "🟢 低"
            low += 1
            code = 1
        rows.append((code, name, sev, hits, explicit_overlap))

    for _, name, sev, hits, explicit in sorted(rows, reverse=True):
        print(f"  [{sev}] {name}")
        print(f"         重疊詞 ({len(hits)}): " + "、".join(hits[:12]) + (" ..." if len(hits) > 12 else ""))
        if explicit:
            print(f"         其中 {explicit} 個也出現在鄰居明示 trigger 中")
        print("")

    print("━━━━━━━━━━━━━━━━━━━━━━━")
    if not rows:
        print("✅ 未發現明顯字面重疊")
        return 0

    print("📊 初篩統計：")
    if high:
        print(f"   🔴 高: {high} 個")
    if mid:
        print(f"   🟡 中: {mid} 個")
    if low:
        print(f"   🟢 低: {low} 個")
    print("")
    print("💡 人工判讀建議：")
    print("   - 先看任務是否相同：同詞不同任務，不一定衝突")
    print("   - 再看輸入/輸出是否相同：輸入物與交付物不同，可用邊界切開")
    print("   - 高重疊但都該保留時，補 Do NOT / 轉交規則")
    print("   - 若職責高度相同，考慮合併或重新切 skill")
    return 2 if high else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
