#!/bin/bash
# scan-skills.sh — 結構化掃描 skill 庫的 frontmatter
#
# 用法：
#   ./scan-skills.sh              # 全部三層
#   ./scan-skills.sh user         # 只掃 user 層
#   ./scan-skills.sh examples
#   ./scan-skills.sh public
#   ./scan-skills.sh user "審查"  # 只列 description 含「審查」的 skill
#
# 輸出格式（TSV，欄位：layer / name / description_first_line）：
#   user	skill-brain	Skill 規劃階段的釐清顧問...
#
# 設計原則：
# - 只讀 frontmatter 前 30 行，速度快
# - TSV 格式好被 Claude 後續處理（grep / awk / 直接讀）
# - 過濾關鍵字時用 grep -i 不分大小寫

set -euo pipefail

LAYER="${1:-all}"
KEYWORD="${2:-}"

declare -a DIRS
case "$LAYER" in
  user)     DIRS=("/mnt/skills/user") ;;
  examples) DIRS=("/mnt/skills/examples") ;;
  public)   DIRS=("/mnt/skills/public") ;;
  all)      DIRS=("/mnt/skills/user" "/mnt/skills/examples" "/mnt/skills/public") ;;
  *)        echo "用法: $0 [user|examples|public|all] [keyword]" >&2; exit 1 ;;
esac

for dir in "${DIRS[@]}"; do
  [ -d "$dir" ] || continue
  layer=$(basename "$dir")

  for skill in "$dir"/*/SKILL.md; do
    [ -f "$skill" ] || continue

    # 萃取 name（去掉 "name: " 前綴）
    name=$(grep -m1 '^name:' "$skill" 2>/dev/null | sed 's/^name: *//' | tr -d '\r' || echo "?")

    # 萃取 description 第一行（含 description: 後第一段內容）
    # 支援兩種寫法：description: xxx 或 description: | / >  接下行
    desc=$(awk '
      /^description: *\|/ || /^description: *>/  { in_block=1; next }
      in_block && /^[a-z_]+: */ { exit }
      in_block && /^---$/ { exit }
      in_block && NF { gsub(/^  /, ""); print; exit }
      /^description: / { sub(/^description: */, ""); print; exit }
    ' "$skill" 2>/dev/null | head -c 300)

    # TSV 輸出
    printf "%s\t%s\t%s\n" "$layer" "$name" "$desc"
  done
done | {
  if [ -n "$KEYWORD" ]; then
    grep -i "$KEYWORD" || true
  else
    cat
  fi
}
