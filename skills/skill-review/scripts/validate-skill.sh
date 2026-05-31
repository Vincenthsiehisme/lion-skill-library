#!/usr/bin/env bash
# validate-skill.sh — skill 機械檢查入口
#
# 用法：
#   ./scripts/validate-skill.sh <skill-dir>
#
# 退出碼：
#   0 = 無 hard error、無 warning，可進入語意審查
#   1 = 有 warning，仍可進入語意審查
#   2 = 有 hard error，不建議 ship

set -u

SKILL_DIR="${1:-}"
if [ -z "$SKILL_DIR" ] || [ ! -d "$SKILL_DIR" ]; then
  echo "用法: $0 <skill-dir>" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATOR="$SCRIPT_DIR/lib/validate_skill.py"

if [ ! -f "$VALIDATOR" ]; then
  echo "❌ validator 不存在: $VALIDATOR" >&2
  exit 2
fi

python3 "$VALIDATOR" "$SKILL_DIR"
