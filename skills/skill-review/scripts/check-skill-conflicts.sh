#!/usr/bin/env bash
# check-skill-conflicts.sh — 跨 skill 觸發詞 / 語境字面重疊初篩入口
#
# 用法：
#   ./scripts/check-skill-conflicts.sh <target-skill-dir> [skills-base]
#
# 掃描範圍優先序：
#   1. 第二參數 [skills-base]
#   2. SKILLS_BASE 環境變數
#   3. 常見技能庫路徑候選與目標 skill 的父層
#
# 注意：此腳本只做字面初篩，不是最終語意判決。
#       高重疊需要人工判讀任務、輸入、輸出、上下游與 DO NOT 分工。
#
# 退出碼：
#   0 = 無明顯重疊
#   1 = 有低/中度重疊，需人工檢視；或掃描範圍不可用
#   2 = 有高度重疊，通常需補邊界或調整職責；或用法錯誤

set -u

TARGET="${1:-}"
BASE="${2:-${SKILLS_BASE:-}}"

if [ -z "$TARGET" ] || [ ! -d "$TARGET" ]; then
  echo "用法: $0 <target-skill-dir> [skills-base]" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECKER="$SCRIPT_DIR/lib/check_skill_conflicts.py"

if [ ! -f "$CHECKER" ]; then
  echo "❌ conflict checker 不存在: $CHECKER" >&2
  exit 2
fi

ARGS=("$TARGET")
if [ -n "$BASE" ]; then
  ARGS+=("$BASE")
fi

python3 "$CHECKER" "${ARGS[@]}"
