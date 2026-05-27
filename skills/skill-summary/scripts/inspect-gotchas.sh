#!/bin/bash
# inspect-gotchas.sh — 分析目標 skill 的 Gotchas section,給 summary 決策用
#
# 用法：
#   ./inspect-gotchas.sh <skill-dir>
#
# 輸出（TSV 格式給 Claude 讀）:
#   GOTCHAS_LINE: 行號（## Gotchas 在第幾行,沒有則 0）
#   COUNT: 現有 Gotcha 條數
#   NEXT_ID: 下一條應該編號為 G?
#   LAST_LINE: 最後一條 G 的最後一行行號（決定插入位置）
#   STATUS: ok / no-gotchas-section / over-limit (>6)
#
# 使用範例:
#   eval $(./inspect-gotchas.sh /home/claude/skill-brain)
#   echo "下一條 ID: $NEXT_ID, 插入行: $LAST_LINE"

set -u

SKILL_DIR="${1:-}"
if [ -z "$SKILL_DIR" ] || [ ! -d "$SKILL_DIR" ]; then
  echo "用法: $0 <skill-dir>" >&2
  exit 2
fi

SKILL_MD="$SKILL_DIR/SKILL.md"
if [ ! -f "$SKILL_MD" ]; then
  echo "❌ SKILL.md 不存在於 $SKILL_DIR" >&2
  exit 2
fi

# === 1. 找 Gotchas section 起始行 ===
GOTCHAS_LINE=$(grep -n "^## Gotchas" "$SKILL_MD" | head -1 | cut -d: -f1)

if [ -z "$GOTCHAS_LINE" ]; then
  cat <<EOF
GOTCHAS_LINE=0
COUNT=0
NEXT_ID=G1
LAST_LINE=0
STATUS=no-gotchas-section
EOF
  exit 0
fi

# === 2. 計算現有 G 條數 ===
# 從 Gotchas 段往下找 ### G 開頭的行,直到下一個 ## section 或檔尾
COUNT=$(awk -v start="$GOTCHAS_LINE" '
  NR > start {
    if (/^## /) exit  # 下一個同級章節,結束
    if (/^### G[0-9]+/) count++
  }
  END { print count+0 }
' "$SKILL_MD")

NEXT_ID="G$((COUNT + 1))"

# === 3. 找最後一條 Gotcha 的結尾位置 ===
# 抓最後一個 ### G 之後,到下一個 ## 或檔尾的最後一個非空行
LAST_LINE=$(awk -v start="$GOTCHAS_LINE" '
  NR > start {
    if (/^## /) { exit }
    if (NF) lastline = NR
  }
  END { print lastline+0 }
' "$SKILL_MD")

# === 4. 判定狀態 ===
if [ "$COUNT" -gt 6 ]; then
  STATUS="over-limit"
elif [ "$COUNT" -ge 3 ]; then
  STATUS="ok"
else
  STATUS="under-min"  # < 3 條,可加但本身已偏少
fi

# === 輸出 ===
cat <<EOF
GOTCHAS_LINE=$GOTCHAS_LINE
COUNT=$COUNT
NEXT_ID=$NEXT_ID
LAST_LINE=$LAST_LINE
STATUS=$STATUS
EOF
