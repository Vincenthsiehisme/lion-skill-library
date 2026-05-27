#!/bin/bash
# check-skill-conflicts.sh — 偵測目標 skill 與既有 skill 庫的觸發詞衝突
#
# 用法：
#   ./check-skill-conflicts.sh <target-skill-dir> [skills-base]
#
# 範例：
#   ./check-skill-conflicts.sh /home/claude/skill-create
#   ./check-skill-conflicts.sh /home/claude/skill-create /mnt/skills/user
#
# 預設 skills-base = /mnt/skills/user
#
# 工作流程：
#   1. 從目標 skill 的 description 萃取觸發關鍵字（中文頓號分隔的詞）
#   2. 對 skills-base 下每個鄰居 skill，檢查 description 是否包含這些詞
#   3. 列出可能衝突的 skill + 重疊的詞 + 嚴重度
#
# 嚴重度判準：
#   🔴 高：3+ 個觸發詞重疊，或核心動詞詞組重疊
#   🟡 中：1–2 個觸發詞重疊
#   🟢 低：description 中有相關詞但未列為觸發詞
#
# 退出碼：
#   0 = 無衝突
#   1 = 有低/中度衝突（可上線但建議檢視）
#   2 = 有高度衝突（必須處理）

set -u

TARGET="${1:-}"
BASE="${2:-/mnt/skills/user}"

if [ -z "$TARGET" ] || [ ! -d "$TARGET" ]; then
  echo "用法: $0 <target-skill-dir> [skills-base]" >&2
  exit 2
fi

TARGET_MD="$TARGET/SKILL.md"
TARGET_NAME=$(grep -m1 "^name:" "$TARGET_MD" 2>/dev/null | sed 's/^name: *//' | tr -d '\r')

if [ -z "$TARGET_NAME" ]; then
  echo "❌ 無法從 $TARGET_MD 取得 name" >&2
  exit 2
fi

# === 萃取目標 skill 的觸發關鍵字 ===
# 抓「觸發關鍵字：」那行,用頓號切割
TRIGGER_LINE=$(grep -m1 "觸發關鍵字" "$TARGET_MD" 2>/dev/null || true)

if [ -z "$TRIGGER_LINE" ]; then
  echo "⚠️  目標 skill ($TARGET_NAME) description 中找不到「觸發關鍵字」段" >&2
  echo "   無法執行衝突檢查。請先在 description 中加入「觸發關鍵字：xxx、yyy、...」段落"
  exit 1
fi

# 萃取觸發詞 (移除「觸發關鍵字：」前綴,移除句號和換行,按頓號切)
# 注意: tr 是 byte-based 不能切 UTF-8 多位元組字元(頓號「、」),改用 awk RS
TRIGGERS=$(echo "$TRIGGER_LINE" \
  | sed 's/.*觸發關鍵字[：:]//' \
  | sed 's/。.*//' \
  | awk 'BEGIN{RS="、"} {gsub(/^[[:space:]]+|[[:space:]]+$/, ""); if(NF) print}')

TRIGGER_COUNT=$(echo "$TRIGGERS" | wc -l)

echo "🔍 衝突檢查: $TARGET_NAME"
echo "   目標 skill 觸發關鍵字: $TRIGGER_COUNT 個"
echo "   掃描範圍: $BASE"
echo ""

# === 掃描鄰居 skill ===
HIGH_COUNT=0
MID_COUNT=0
LOW_COUNT=0

declare -A NEIGHBOR_HITS

for skill in "$BASE"/*/SKILL.md; do
  [ -f "$skill" ] || continue

  NEIGHBOR_NAME=$(grep -m1 "^name:" "$skill" 2>/dev/null | sed 's/^name: *//' | tr -d '\r')

  # 跳過自己
  [ "$NEIGHBOR_NAME" = "$TARGET_NAME" ] && continue
  [ -z "$NEIGHBOR_NAME" ] && continue

  # 取鄰居的 hard trigger 區域,排除 anti-trigger
  # Hard trigger 區 = description 中「觸發關鍵字：」那段 + 定位句
  # 排除: 「DO NOT trigger」段及之後的所有內容
  NEIGHBOR_HARD=$(awk '
    /^description:/ { in_desc=1; next }
    in_desc && /^---$/ { exit }
    in_desc && /^[a-z_]+: */ { exit }
    in_desc {
      # 遇到 DO NOT trigger 段就停,排除 anti-trigger
      if (/DO NOT trigger/) exit
      print
    }
  ' "$skill" 2>/dev/null)

  # 檢查每個觸發詞是否出現在鄰居 description
  HITS=()
  while IFS= read -r trigger; do
    [ -z "$trigger" ] && continue
    if echo "$NEIGHBOR_HARD" | grep -qF "$trigger"; then
      HITS+=("$trigger")
    fi
  done <<< "$TRIGGERS"

  HIT_COUNT=${#HITS[@]}
  [ "$HIT_COUNT" -eq 0 ] && continue

  # 判定嚴重度
  if [ "$HIT_COUNT" -ge 3 ]; then
    SEVERITY="🔴 高"
    HIGH_COUNT=$((HIGH_COUNT+1))
  elif [ "$HIT_COUNT" -ge 1 ]; then
    SEVERITY="🟡 中"
    MID_COUNT=$((MID_COUNT+1))
  fi

  # 組合輸出 (頓號是 3-byte UTF-8,bash IFS 處理不好,用 printf 手動拼)
  HITS_STR=""
  for hit in "${HITS[@]}"; do
    if [ -z "$HITS_STR" ]; then
      HITS_STR="$hit"
    else
      HITS_STR="$HITS_STR、$hit"
    fi
  done
  echo "  [$SEVERITY] $NEIGHBOR_NAME"
  echo "         重疊詞 ($HIT_COUNT): $HITS_STR"
  echo ""
done

# === 總結 ===
echo "━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((HIGH_COUNT + MID_COUNT))
if [ "$TOTAL" -eq 0 ]; then
  echo "✅ 無衝突——觸發關鍵字與其他 skill 無重疊"
  exit 0
else
  echo "📊 衝突統計："
  [ "$HIGH_COUNT" -gt 0 ] && echo "   🔴 高: $HIGH_COUNT 個"
  [ "$MID_COUNT" -gt 0 ]  && echo "   🟡 中: $MID_COUNT 個"
  echo ""
  echo "💡 處置建議："
  echo "   - 🔴 高度衝突：考慮合併鄰居 skill 或大幅調整觸發詞"
  echo "   - 🟡 中度衝突：在 DO NOT trigger 點名鄰居 skill，避免搶觸發"

  if [ "$HIGH_COUNT" -gt 0 ]; then
    exit 2
  else
    exit 1
  fi
fi
