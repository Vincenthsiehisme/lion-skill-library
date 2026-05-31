#!/usr/bin/env python3
"""Skill mechanical validator.

This script intentionally checks only objective / near-objective issues:
- platform or packaging blockers
- missing referenced files
- executable entry scripts
- obvious trigger / anti-trigger signals
- high-risk shell patterns that need human guardrail review

Semantic quality still belongs to skill-review's dimension files.
"""

from __future__ import annotations

import json
import os
import re
import stat
import sys
from pathlib import Path
from typing import Any

try:
    import yaml  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    yaml = None

VALID_REF_SUFFIXES = {
    ".md",
    ".sh",
    ".py",
    ".js",
    ".ts",
    ".json",
    ".yaml",
    ".yml",
    ".txt",
    ".csv",
}

HIGH_RISK_PATTERNS = [
    r"\brm\s+-rf\b",
    r"\bmkfs\b",
    r"\bdd\s+if=",
    r"\bshutdown\b",
    r"\breboot\b",
    r"curl\b.*\|\s*(?:sh|bash)",
    r"wget\b.*\|\s*(?:sh|bash)",
    r"\bsend_email\b",
    r"\bdelete_[A-Za-z0-9_]*\b",
    r"\bDROP\s+TABLE\b",
]

TRIGGER_SPLIT_RE = re.compile(r"[、,，;；。.!?！？/｜|]+|\bor\b|\n|•|- ", re.I)
ANTI_RE = re.compile(r"DO NOT|Do NOT|不要觸發|不適用|不處理|轉\s*[^，。；;]+|改用|交給", re.I)


class Reporter:
    def __init__(self) -> None:
        self.warning_count = 0
        self.error_count = 0
        self.info_count = 0

    def ok(self, msg: str) -> None:
        print(f"  ✅ {msg}")

    def info(self, msg: str) -> None:
        self.info_count += 1
        print(f"  ℹ️  {msg}")

    def warn(self, msg: str) -> None:
        self.warning_count += 1
        print(f"  ⚠️  {msg}")

    def error(self, msg: str) -> None:
        self.error_count += 1
        print(f"  ❌ {msg}")


def parse_frontmatter(skill_md: Path) -> tuple[dict[str, Any] | None, str | None, bool]:
    """Return (metadata, error, used_fallback_parser)."""
    text = skill_md.read_text(encoding="utf-8", errors="ignore")
    if not text.startswith("---"):
        return None, "no frontmatter start", False

    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None, "frontmatter must start with --- on its own line", False

    end_idx = None
    for idx in range(1, len(lines)):
        if lines[idx].strip() == "---":
            end_idx = idx
            break
    if end_idx is None:
        return None, "no frontmatter end", False

    raw = "\n".join(lines[1:end_idx])
    if yaml is not None:
        try:
            data = yaml.safe_load(raw) or {}
            if not isinstance(data, dict):
                return None, "frontmatter is not a mapping", False
            return data, None, False
        except Exception as exc:
            return None, f"YAML parse error: {exc}", False

    # Conservative fallback for environments without PyYAML.
    data: dict[str, Any] = {}
    idx = 0
    while idx < len(lines[1:end_idx]):
        line = lines[1:end_idx][idx]
        if not line.strip() or line.lstrip().startswith("#"):
            idx += 1
            continue
        m_block = re.match(r"^([A-Za-z0-9_-]+):\s*[|>]\s*$", line)
        if m_block:
            key = m_block.group(1)
            idx += 1
            block: list[str] = []
            while idx < len(lines[1:end_idx]):
                child = lines[1:end_idx][idx]
                if child and not child.startswith((" ", "\t")):
                    break
                block.append(child[2:] if child.startswith("  ") else child.lstrip("\t"))
                idx += 1
            data[key] = "\n".join(block) + ("\n" if block else "")
            continue
        m_scalar = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if m_scalar:
            key, value = m_scalar.groups()
            data[key] = value.strip().strip('"\'')
            idx += 1
            continue
        return None, f"unsupported frontmatter line without PyYAML: {line}", True
    return data, None, True


def split_terms(fragment: str) -> list[str]:
    out: list[str] = []
    for part in TRIGGER_SPLIT_RE.split(fragment):
        term = part.strip(" \t\r\n。.:：；;，,「」『』\"'`()[]")
        if term and len(term) <= 40:
            out.append(term)
    return out


def first_sentence(fragment: str) -> str:
    """Return the first sentence-like segment from a trigger declaration."""
    return re.split(r"[。.!?！？]", fragment, maxsplit=1)[0]


def positive_trigger_fragment(raw: str) -> str:
    """Exclude anti-trigger / boundary text before extracting positive triggers."""
    return re.split(r"DO NOT|Do NOT|不要觸發|不適用|不處理", raw, maxsplit=1, flags=re.I)[0]


def unique_preserve_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def extract_description_meta(meta: dict[str, Any]) -> dict[str, Any]:
    desc = meta.get("description", "")
    if desc is None:
        desc = ""
    if not isinstance(desc, str):
        desc = str(desc)

    trigger_terms: list[str] = []
    trigger_sources: list[str] = []
    for raw_line in desc.splitlines():
        raw = raw_line.strip()
        if not raw:
            continue
        positive = positive_trigger_fragment(raw)
        if "觸發關鍵字" in positive or "觸發詞" in positive:
            frag = re.split(r"觸發關鍵字[：:]|觸發詞[：:]", positive, maxsplit=1)[-1]
            trigger_terms.extend(split_terms(first_sentence(frag)))
            trigger_sources.append("觸發關鍵字")
        if re.search(r"\bTrigger\s*:", positive, flags=re.I):
            frag = re.split(r"\bTrigger\s*:", positive, maxsplit=1, flags=re.I)[-1]
            trigger_terms.extend(split_terms(first_sentence(frag)))
            trigger_sources.append("Trigger")

    trigger_sentence_count = len(
        re.findall(r"(當.+?時|用於|適用於|use when|trigger on|review|audit|檢查|健檢|審查)", desc, flags=re.I)
    )
    anti_signal = bool(ANTI_RE.search(desc))
    clean_terms = unique_preserve_order([t for t in trigger_terms if len(t) <= 40])
    return {
        "name": str(meta.get("name", "") or ""),
        "schema_version": str(meta.get("schema_version", "") or ""),
        "description": desc,
        "desc_chars": len(desc),
        "desc_bytes": len(desc.encode("utf-8")),
        "desc_lines": desc.count("\n") + (1 if desc else 0),
        "trigger_terms": clean_terms,
        "trigger_sources": sorted(set(trigger_sources)),
        "trigger_sentence_count": trigger_sentence_count,
        "anti_signal": anti_signal,
    }


def strip_code_fences(text: str) -> str:
    return re.sub(r"```.*?```", "", text, flags=re.S)


def referenced_paths(skill_md: Path) -> list[str]:
    text = strip_code_fences(skill_md.read_text(encoding="utf-8", errors="ignore"))
    patterns = [
        r"`((?:references|assets|scripts)/[^`\s]+)`",
        r"\b((?:references|assets|scripts)/[A-Za-z0-9_./\-]+)",
    ]
    seen: set[str] = set()
    paths: list[str] = []
    for pat in patterns:
        for match in re.findall(pat, text):
            path = match.strip(".,;:()[]")
            if path in seen:
                continue
            seen.add(path)
            if any(ch in path for ch in '*?[]'):
                continue
            if Path(path).suffix in VALID_REF_SUFFIXES:
                paths.append(path)
    return paths


def requested_entry_scripts(skill_md: Path) -> set[str]:
    text = skill_md.read_text(encoding="utf-8", errors="ignore")
    refs: set[str] = set()
    # Only explicit executable-style calls count as requested entry scripts.
    # Plain documentation references such as `scripts/lib/helper.py` remain helper/lib files.
    for match in re.findall(r"\./(scripts/[A-Za-z0-9_./\-]+\.(?:sh|py|js|ts))", text):
        refs.add(match)
    return refs


def is_entry_script(path: Path, skill_dir: Path, requested: set[str]) -> bool:
    rel = path.relative_to(skill_dir).as_posix()
    if rel in requested:
        return True
    if path.parent == skill_dir / "scripts" and path.suffix == ".sh":
        return True
    try:
        first = path.read_text(encoding="utf-8", errors="ignore").splitlines()[0]
    except Exception:
        first = ""
    return path.parent == skill_dir / "scripts" and first.startswith("#!")


def has_high_risk_pattern(path: Path) -> bool:
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return False
    # Avoid self-matching the validator's own pattern definitions.
    if path.name == "validate_skill.py":
        text = re.sub(r"HIGH_RISK_PATTERNS\s*=\s*\[.*?\]\n", "", text, flags=re.S)
    for pattern in HIGH_RISK_PATTERNS:
        if re.search(pattern, text, flags=re.I):
            return True
    return False


def validate(skill_dir: Path) -> int:
    r = Reporter()
    skill_md = skill_dir / "SKILL.md"

    print(f"🔍 驗證 skill: {skill_dir.name}")
    print()

    print("[SKILL.md]")
    if not skill_md.exists():
        r.error(f"SKILL.md 不存在於 {skill_dir}")
        return 2
    if not os.access(skill_md, os.R_OK):
        r.error("SKILL.md 不可讀")
        return 2
    skill_text = skill_md.read_text(encoding="utf-8", errors="ignore")
    skill_lines = skill_text.splitlines()
    if not skill_text.strip():
        r.error("SKILL.md 為空")
        return 2
    r.ok("SKILL.md 存在且可讀")

    print("\n[長度]")
    line_count = len(skill_lines)
    if line_count < 250:
        r.ok(f"SKILL.md {line_count} 行（精實）")
    elif line_count < 400:
        r.warn(f"SKILL.md {line_count} 行（偏長，請確認是否有內容可下放 references/）")
    else:
        r.warn(f"SKILL.md {line_count} 行（很長，需人工檢查 progressive disclosure 是否合理）")

    print("\n[Frontmatter]")
    first_line = skill_lines[0].strip() if skill_lines else ""
    if first_line != "---":
        r.error("缺 YAML frontmatter 開頭 ---")
        meta = None
        desc_meta = None
    else:
        r.ok("frontmatter 開頭 --- 存在")
        meta, parse_error, used_fallback = parse_frontmatter(skill_md)
        if used_fallback:
            r.info("PyYAML 不可用，已使用保守 frontmatter parser")
        if parse_error or meta is None:
            r.error(f"frontmatter YAML 解析失敗：{parse_error}")
            desc_meta = None
        else:
            desc_meta = extract_description_meta(meta)
            name = desc_meta["name"]
            desc_bytes = desc_meta["desc_bytes"]
            desc_chars = desc_meta["desc_chars"]
            desc_lines = desc_meta["desc_lines"]
            schema_version = desc_meta["schema_version"]

            if not name:
                r.error("frontmatter 缺 name 欄位")
            else:
                r.ok(f"name: {name}")

            if desc_chars == 0:
                r.error("frontmatter 缺 description 或 description 為空")
            elif desc_bytes >= 1024:
                r.error(f"description {desc_chars} 字元 / {desc_bytes} byte（>= 1024 byte，平台硬限制，ship-blocker）")
            elif desc_bytes >= 900:
                r.warn(f"description {desc_chars} 字元 / {desc_bytes} byte（逼近 1024 byte，建議瘦身）")
            else:
                r.ok(f"description {desc_chars} 字元 / {desc_bytes} byte（< 1024 byte）")

            if schema_version:
                r.info(f"schema_version: {schema_version}（僅作資訊，不決定好壞）")
            r.info(f"description {desc_lines} 行（行數僅作 style heuristic，不作 hard gate）")

    print("\n[引用檔案]")
    missing: list[str] = []
    for ref in referenced_paths(skill_md):
        if not (skill_dir / ref).exists():
            missing.append(ref)
    if missing:
        for ref in missing:
            r.error(f"引用檔不存在: {ref}")
    else:
        r.ok("未發現缺失的 references/assets/scripts 引用")

    ref_dir = skill_dir / "references"
    if ref_dir.is_dir():
        ref_count = sum(1 for _ in ref_dir.rglob("*.md"))
        r.info(f"references/ 含 {ref_count} 個 markdown 子檔")
    else:
        r.warn("無 references/ 目錄（極簡 skill 可接受，需人工判斷）")

    print("\n[Scripts]")
    script_dir = skill_dir / "scripts"
    if script_dir.is_dir():
        scripts = sorted(
            p for p in script_dir.rglob("*")
            if p.is_file() and "__pycache__" not in p.parts and p.suffix != ".pyc"
        )
        if not scripts:
            r.info("scripts/ 存在但沒有檔案")
        requested = requested_entry_scripts(skill_md)
        entry_count = 0
        helper_count = 0
        for script in scripts:
            rel = script.relative_to(skill_dir).as_posix()
            entry = is_entry_script(script, skill_dir, requested)
            if entry:
                entry_count += 1
                if os.access(script, os.X_OK):
                    r.ok(f"{rel} 可執行")
                else:
                    r.error(f"{rel} 不可執行（SKILL.md 或入口規則要求直接執行）")
            else:
                helper_count += 1
                if os.access(script, os.R_OK):
                    r.info(f"{rel} 為 helper/lib 檔，僅要求可讀，不要求 executable")
                else:
                    r.error(f"{rel} 不可讀")
            if has_high_risk_pattern(script):
                r.warn(f"{rel} 含高風險命令關鍵字，需人工確認 guardrail / dry-run / confirm")
        if entry_count == 0 and scripts:
            r.info("scripts/ 沒有偵測到直接執行入口；若 SKILL.md 不要求執行 script，這是可接受的")
        if helper_count:
            r.info(f"scripts/ 含 {helper_count} 個 helper/lib 檔")
    else:
        r.info("無 scripts/ 目錄（可接受，視 skill 類型而定）")

    print("\n[Gotchas]")
    text = skill_md.read_text(encoding="utf-8", errors="ignore")
    gotchas_match = re.search(r"^## Gotchas\s*$", text, flags=re.M)
    if not gotchas_match:
        r.warn("無 ## Gotchas section（不一定擋 ship，但高風險 skill 需補 guardrail）")
    else:
        after = text[gotchas_match.end() :]
        next_section = re.search(r"^## ", after, flags=re.M)
        gotchas_body = after[: next_section.start()] if next_section else after
        g_count = len(re.findall(r"^### ", gotchas_body, flags=re.M))
        if g_count == 0:
            r.warn("Gotchas section 存在但未偵測到 ### 條目")
        else:
            r.ok(f"Gotchas 含 {g_count} 條")

    print("\n[Trigger 訊號]")
    if desc_meta:
        trigger_count = len(desc_meta["trigger_terms"])
        trigger_sources = ", ".join(desc_meta["trigger_sources"]) or "unknown"
        trigger_sentence_count = int(desc_meta["trigger_sentence_count"])
        anti_signal = bool(desc_meta["anti_signal"])
        if trigger_count > 0:
            r.ok(f"偵測到 {trigger_count} 個明示 trigger 詞 / 片語（來源: {trigger_sources}）")
            if trigger_count > 18:
                r.warn(f"trigger 詞很多（{trigger_count} 個），需人工檢查是否 over-trigger")
            elif trigger_count < 3:
                r.warn(f"trigger 詞偏少（{trigger_count} 個），需人工檢查是否 under-trigger")
        elif trigger_sentence_count > 0:
            r.warn(f"未偵測到明示 trigger list，但有 {trigger_sentence_count} 個觸發語句訊號；需人工判讀是否足夠")
        else:
            r.warn("未偵測到明確 trigger 訊號；需人工檢查 Dim 1")

        if anti_signal:
            r.ok("偵測到 anti-trigger / 邊界 / 轉交訊號")
        else:
            r.warn("未偵測到 anti-trigger / 邊界訊號；若存在鄰近 skill，需補分工")
    else:
        r.warn("跳過 trigger 訊號檢查（frontmatter 解析失敗）")

    print("\n━━━━━━━━━━━━━━━━━━━━━━━")
    if r.error_count > 0:
        print(f"❌ 發現 {r.error_count} 個 hard error、{r.warning_count} 個 warning——修完再 ship")
        return 2
    if r.warning_count > 0:
        print(f"⚠️  發現 {r.warning_count} 個 warning、{r.info_count} 個 info——可進入語意審查；是否 ship 需看 quality gate")
        return 1
    print(f"✅ 無 hard error、無 warning、{r.info_count} 個 info——可進入 skill-review 語意審查")
    return 0


def main() -> int:
    if len(sys.argv) != 2:
        print(f"用法: {Path(sys.argv[0]).name} <skill-dir>", file=sys.stderr)
        return 2
    skill_dir = Path(sys.argv[1]).resolve()
    if not skill_dir.is_dir():
        print(f"用法: {Path(sys.argv[0]).name} <skill-dir>", file=sys.stderr)
        return 2
    return validate(skill_dir)


if __name__ == "__main__":
    raise SystemExit(main())
