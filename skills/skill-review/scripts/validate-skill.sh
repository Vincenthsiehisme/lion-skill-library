#!/bin/bash
# validate-skill.sh — 驗證skill 結構規範
#
# 用法：
#   ./validate-skill.sh <skill-dir>
#   ./validate-skill.sh /home/claude/skill-create
#
# 檢查項目(8 大類):
#   [SKILL.md]    存在、可讀
#   [長度]        < 200 為佳,< 250 可接受,>= 250 警告
#   [Frontmatter] 含 name / description;description ≤ 1024 byte(平台硬限制)
#   [References]  至少 1 個子檔
#   [Gotchas]     至少 3 條(H3 等級)
#   [觸發關鍵字]  description 中觸發關鍵字 8–12 個為佳,6–15 可接受
#   [description 結構] 行數 8–12 為佳;觸發詞無引號包裹
#   [Anti-trigger] DO NOT trigger 段含 ≥ 2 個鄰居 skill 點名
#
# 退出碼：
#   0 = 全部通過
#   1 = 有警告（可上線但建議修正）
#   2 = 有錯誤（不該上線）

set -u

SKILL_DIR="${1:-}"
if [ -z "$SKILL_DIR" ] || [ ! -d "$SKILL_DIR" ]; then
  echo "用法: $0 <skill-dir>" >&2
  exit 2
fi

SKILL_MD="$SKILL_DIR/SKILL.md"
WARN_COUNT=0
ERROR_COUNT=0

print_ok()    { printf "  ✅ %s\n" "$1"; }
print_warn()  { printf "  ⚠️  %s\n" "$1"; WARN_COUNT=$((WARN_COUNT+1)); }
print_error() { printf "  ❌ %s\n" "$1"; ERROR_COUNT=$((ERROR_COUNT+1)); }

echo "🔍 驗證 skill: $(basename "$SKILL_DIR")"
echo ""

# === 1. SKILL.md 存在 ===
echo "[SKILL.md]"
if [ ! -f "$SKILL_MD" ]; then
  print_error "SKILL.md 不存在於 $SKILL_DIR"
  exit 2
fi
print_ok "SKILL.md 存在"

# === 2. 行數檢查 ===
echo ""
echo "[長度]"
LINES=$(wc -l < "$SKILL_MD")
if [ "$LINES" -lt 200 ]; then
  print_ok "SKILL.md $LINES 行（< 200，理想範圍）"
elif [ "$LINES" -lt 250 ]; then
  print_warn "SKILL.md $LINES 行（200–250，可接受但建議下放部分到 references/）"
else
  print_warn "SKILL.md $LINES 行（>= 250，建議重新評估 progressive disclosure；如有理由保留請在交付物摘要說明）"
fi

# === 3. Frontmatter ===
echo ""
echo "[Frontmatter]"
if ! head -1 "$SKILL_MD" | grep -q "^---$"; then
  print_error "缺 YAML frontmatter 開頭 ---"
else
  print_ok "frontmatter 開頭 --- 存在"
fi

if ! grep -m1 -q "^name:" "$SKILL_MD"; then
  print_error "frontmatter 缺 name 欄位"
else
  NAME=$(grep -m1 "^name:" "$SKILL_MD" | sed 's/^name: *//')
  print_ok "name: $NAME"
fi

if ! grep -m1 -q "^description:" "$SKILL_MD"; then
  print_error "frontmatter 缺 description 欄位"
else
  print_ok "description 欄位存在"

  # description 字元/byte 數檢查(Anthropic 平台硬限制 1024 byte)
  # 用 python3+pyyaml 解 frontmatter,比 bash 切字串穩(顧到 |、"..."、單行三種寫法)
  DESC_INFO=$(python3 - "$SKILL_MD" <<'PYEOF' 2>/dev/null
import sys, yaml
try:
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        content = f.read()
    # 抽 frontmatter(--- 包起來的第一個 block)
    if not content.startswith('---'):
        sys.exit(1)
    parts = content.split('---', 2)
    if len(parts) < 3:
        sys.exit(1)
    fm = yaml.safe_load(parts[1])
    desc = fm.get('description', '')
    if not isinstance(desc, str):
        sys.exit(1)
    # 用 byte 數對齊 Anthropic 平台限制(保守路線)
    print(f"{len(desc)}|{len(desc.encode('utf-8'))}")
except Exception:
    sys.exit(1)
PYEOF
)
  if [ -n "$DESC_INFO" ]; then
    DESC_CHARS=$(echo "$DESC_INFO" | cut -d'|' -f1)
    DESC_BYTES=$(echo "$DESC_INFO" | cut -d'|' -f2)
    if [ "$DESC_BYTES" -ge 1024 ]; then
      print_error "description $DESC_CHARS 字元 / $DESC_BYTES byte(>= 1024 byte,超過 Anthropic 平台硬上限,skill 將被拒收)"
    elif [ "$DESC_BYTES" -ge 900 ]; then
      print_warn "description $DESC_CHARS 字元 / $DESC_BYTES byte(逼近 1024 byte 上限,建議瘦身)"
    else
      print_ok "description $DESC_CHARS 字元 / $DESC_BYTES byte(< 1024 byte 上限)"
    fi
  else
    print_warn "description 長度檢查跳過(YAML 解析失敗,請人工確認 ≤ 1024 byte)"
  fi
fi

# === 4. References 子檔 ===
echo ""
echo "[References]"
REF_DIR="$SKILL_DIR/references"
if [ ! -d "$REF_DIR" ]; then
  print_warn "無 references/ 目錄（極簡 skill 可例外，但需在交付物摘要說明）"
else
  # 遞迴計算所有 .md 檔案 (含 dims/ 等子目錄)
  REF_COUNT=$(find "$REF_DIR" -name "*.md" -type f 2>/dev/null | wc -l)
  if [ "$REF_COUNT" -eq 0 ]; then
    print_warn "references/ 目錄為空"
  elif [ "$REF_COUNT" -lt 1 ]; then
    print_warn "references/ 子檔不足 1 個"
  else
    print_ok "references/ 含 $REF_COUNT 個子檔（含子目錄）"
    find "$REF_DIR" -name "*.md" -type f 2>/dev/null | sort | while read -r f; do
      # 顯示相對於 REF_DIR 的路徑,讓子目錄結構可見
      rel=${f#"$REF_DIR/"}
      echo "       └─ $rel ($(wc -l < "$f") 行)"
    done
  fi
fi

# === 5. Gotchas section ===
echo ""
echo "[Gotchas]"
GOTCHAS_LINE=$(grep -n "^## Gotchas" "$SKILL_MD" | head -1 | cut -d: -f1)
if [ -z "$GOTCHAS_LINE" ]; then
  print_warn "無 ## Gotchas section（dim-2 規範強烈建議有）"
else
  # 從 Gotchas 段落往下，計算 ### G 開頭的條目數
  G_COUNT=$(awk -v start="$GOTCHAS_LINE" 'NR > start && /^### G/' "$SKILL_MD" | wc -l)
  if [ "$G_COUNT" -lt 3 ]; then
    print_warn "Gotchas 只有 $G_COUNT 條（建議 3–5 條）"
  elif [ "$G_COUNT" -gt 6 ]; then
    print_warn "Gotchas 有 $G_COUNT 條（超過 6 條代表沒收斂，建議合併或下放）"
  else
    print_ok "Gotchas 含 $G_COUNT 條"
  fi
fi

# === 6. 觸發詞數量（粗估）===
echo ""
echo "[觸發關鍵字]"
# 抓 description 中「觸發關鍵字：」那行，數頓號數量 +1
TRIGGER_LINE=$(grep -m1 "觸發關鍵字" "$SKILL_MD" || true)
if [ -z "$TRIGGER_LINE" ]; then
  print_warn "description 中找不到「觸發關鍵字」段"
else
  # 用頓號 、 計數
  TRIGGER_COUNT=$(echo "$TRIGGER_LINE" | awk -F'、' '{print NF}')
  if [ "$TRIGGER_COUNT" -lt 6 ]; then
    print_warn "觸發關鍵字僅 $TRIGGER_COUNT 個（< 6 容易 undertrigger，建議 8–12 個）"
  elif [ "$TRIGGER_COUNT" -gt 15 ]; then
    print_warn "觸發關鍵字 $TRIGGER_COUNT 個（> 15 容易 overtrigger，建議精簡）"
  else
    print_ok "觸發關鍵字 $TRIGGER_COUNT 個"
  fi
fi

# === 7. description 結構（行數 + 引號）===
echo ""
echo "[description 結構]"
# 用 python 抽 description 字串並做兩項檢查:
# B1: 行數(以 description 內容的 \n 數計 +1,對應 SKILL.md 上 description: | 之後縮排塊的行數)
# B2: 觸發關鍵字段是否被引號 「」『』" " ' ' 包裹
DESC_STRUCT=$(python3 - "$SKILL_MD" <<'PYEOF' 2>/dev/null
import sys, yaml, re
try:
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        content = f.read()
    if not content.startswith('---'):
        sys.exit(1)
    parts = content.split('---', 2)
    if len(parts) < 3:
        sys.exit(1)
    fm = yaml.safe_load(parts[1])
    desc = fm.get('description', '')
    if not isinstance(desc, str):
        sys.exit(1)
    # B1: 行數(對應 SKILL.md 上 description: | 連同正文佔的行數)
    # YAML | block 結尾會保留一個 \n,所以 count('\n') 已經 = 內容行數
    # 再 +1 對應 description: | 那一行本身
    line_count = desc.count('\n') + 1
    # B2: 找「觸發關鍵字」那行,看是否含引號包裹的觸發詞
    quote_violation = 0
    quote_samples = []
    for line in desc.split('\n'):
        if '觸發關鍵字' in line or '觸發詞' in line:
            # 偵測中文引號「」『』 + 英文引號 " " ' '
            # 規則: 引號內容若為短詞(< 30 字)且不是整段被引號包覆, 視為觸發詞包裹
            for pattern in [r'「[^」]{1,30}」', r'『[^』]{1,30}』', r'"[^"]{1,30}"', r"'[^']{1,30}'"]:
                matches = re.findall(pattern, line)
                if matches:
                    quote_violation += len(matches)
                    quote_samples.extend(matches[:2])
    print(f"{line_count}|{quote_violation}|{'/'.join(quote_samples[:3])}")
except Exception:
    sys.exit(1)
PYEOF
)
if [ -n "$DESC_STRUCT" ]; then
  DESC_LINES=$(echo "$DESC_STRUCT" | cut -d'|' -f1)
  QUOTE_VIOL=$(echo "$DESC_STRUCT" | cut -d'|' -f2)
  QUOTE_SAMPLES=$(echo "$DESC_STRUCT" | cut -d'|' -f3)

  # B1: 行數判定
  if [ "$DESC_LINES" -lt 6 ] || [ "$DESC_LINES" -gt 15 ]; then
    print_error "description $DESC_LINES 行（< 6 或 > 15，嚴重違反 SC-5，建議 8–12 行）"
  elif [ "$DESC_LINES" -lt 8 ]; then
    print_warn "description $DESC_LINES 行（緊湊三段式；若每段未換行屬正常，建議 8–12 行讓段落呼吸）"
  elif [ "$DESC_LINES" -gt 12 ]; then
    print_warn "description $DESC_LINES 行（13–15 之間，可接受但建議 8–12 行）"
  else
    print_ok "description $DESC_LINES 行（8–12 理想範圍，SC-5 通過）"
  fi

  # B2: 引號偵測
  if [ "$QUOTE_VIOL" -gt 0 ]; then
    print_warn "觸發關鍵字段含 $QUOTE_VIOL 個引號包裹（SC-3），範例: $QUOTE_SAMPLES；若為刻意請於 review 報告註明豁免"
  else
    print_ok "觸發關鍵字段無引號包裹（SC-3 通過）"
  fi
else
  print_warn "description 結構檢查跳過（YAML 解析失敗，請人工確認 SC-3/SC-5）"
fi

# === 8. DO NOT trigger（點名鄰居 skill ≥ 2 個）===
echo ""
echo "[Anti-trigger]"
if ! grep -q "DO NOT trigger" "$SKILL_MD"; then
  print_error "description 缺 DO NOT trigger 段（SC-4 嚴重違反，必須點名 2–5 個鄰居 skill）"
else
  # 抓 DO NOT trigger 那行（可能跨多行，但用單行粗估即可）
  # 用 python 抓括號內含 - 連字符的 token 數量（鄰居 skill 命名通常含 -）
  NEIGHBOR_COUNT=$(python3 - "$SKILL_MD" <<'PYEOF' 2>/dev/null
import sys, yaml, re
try:
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        content = f.read()
    if not content.startswith('---'):
        sys.exit(1)
    parts = content.split('---', 2)
    fm = yaml.safe_load(parts[1])
    desc = fm.get('description', '')
    # 找 DO NOT trigger 段
    m = re.search(r'DO NOT trigger.*', desc, re.DOTALL)
    if not m:
        print(0)
        sys.exit(0)
    block = m.group(0)
    # 偵測「用 xxx-yyy」「（用 xxx-yyy）」「(用 xxx-yyy)」「走 xxx-yyy」格式
    # 鄰居 skill 通常含 - 連字符（skill-brain, prd-writer, erp-schema 等）
    # 也接受不含 - 的單詞 skill 名（caveman, zoom-out 已含 -）—— 用括號內含「用 X」格式偵測
    pattern = r'[（(]用\s*([a-zA-Z][a-zA-Z0-9\-]*)[）)]'
    matches = re.findall(pattern, block)
    # 去重
    unique = set(matches)
    print(len(unique))
except Exception:
    print(-1)
PYEOF
)
  if [ "$NEIGHBOR_COUNT" = "-1" ]; then
    print_warn "DO NOT trigger 鄰居 skill 點名數無法解析（請人工確認 SC-4）"
  elif [ "$NEIGHBOR_COUNT" -eq 0 ]; then
    print_error "DO NOT trigger 段未點名任何鄰居 skill（SC-4 嚴重違反，ship-blocker）"
  elif [ "$NEIGHBOR_COUNT" -eq 1 ]; then
    print_warn "DO NOT trigger 只點名 1 個鄰居 skill（SC-4 輕度違反，建議 2–5 個）"
  elif [ "$NEIGHBOR_COUNT" -gt 5 ]; then
    print_warn "DO NOT trigger 點名 $NEIGHBOR_COUNT 個鄰居 skill（> 5 過多，建議合併或精簡）"
  else
    print_ok "DO NOT trigger 點名 $NEIGHBOR_COUNT 個鄰居 skill（SC-4 通過）"
  fi
fi

# === 總結 ===
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERROR_COUNT" -gt 0 ]; then
  echo "❌ 發現 $ERROR_COUNT 個錯誤、$WARN_COUNT 個警告——不建議直接 ship"
  exit 2
elif [ "$WARN_COUNT" -gt 0 ]; then
  echo "⚠️  發現 $WARN_COUNT 個警告——可 ship，但建議檢視"
  exit 1
else
  echo "✅ 全部通過——可交給 skill-review 進一步審查"
  exit 0
fi
