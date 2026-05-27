#!/bin/bash
# validate-skill.sh — 驗證 skill 結構規範(支援 v1 legacy / v2 新規格雙模式)
#
# 用法:
#   ./validate-skill.sh <skill-dir>           # 依 frontmatter schema_version 自動切換
#   ./validate-skill.sh --strict <skill-dir>  # 強制走 v2 規格
#
# Schema 版本判讀:
#   - frontmatter 含 schema_version: v2  → 走 v2 新規格
#   - 否則 → 走 v1 legacy(向後相容)
#
# 檢查項目:
#   [v1+v2 共用] SKILL.md 存在、長度、frontmatter name/description、references、Gotchas
#   [v1 only]    觸發關鍵字 6–15 個、DO NOT trigger 段存在
#   [v2 only]    Trigger 鑽石詞 3–6 個、情境句存在、Do NOT 2–3 條、description 總字數 ≤ 250
#
# 退出碼:
#   0 = 全部通過
#   1 = 有警告(可上線但建議修正)
#   2 = 有錯誤(不該上線)

set -u

STRICT_MODE=0
SKILL_DIR=""

while [ $# -gt 0 ]; do
  case "$1" in
    --strict) STRICT_MODE=1; shift ;;
    -h|--help)
      sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) SKILL_DIR="$1"; shift ;;
  esac
done

if [ -z "$SKILL_DIR" ] || [ ! -d "$SKILL_DIR" ]; then
  echo "用法: $0 [--strict] <skill-dir>" >&2
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

# === 2. Schema 版本判讀 ===
echo ""
echo "[Schema 版本]"
SCHEMA_VERSION=$(grep -m1 "^schema_version:" "$SKILL_MD" 2>/dev/null | sed 's/^schema_version: *//' | tr -d ' ' || true)
if [ "$STRICT_MODE" -eq 1 ]; then
  SCHEMA="v2"
  print_ok "走 v2 規格(--strict 強制)"
elif [ "$SCHEMA_VERSION" = "v2" ]; then
  SCHEMA="v2"
  print_ok "走 v2 規格(frontmatter schema_version: v2)"
else
  SCHEMA="v1"
  if [ -z "$SCHEMA_VERSION" ]; then
    print_ok "走 v1 legacy(無 schema_version 標記)"
  else
    print_warn "未知 schema_version: '$SCHEMA_VERSION',降級走 v1 legacy"
  fi
fi

# === 3. 行數檢查(共用) ===
echo ""
echo "[長度]"
LINES=$(wc -l < "$SKILL_MD")
if [ "$LINES" -lt 200 ]; then
  print_ok "SKILL.md $LINES 行(< 200,理想範圍)"
elif [ "$LINES" -lt 250 ]; then
  print_warn "SKILL.md $LINES 行(200–250,可接受但建議下放部分到 references/)"
else
  print_warn "SKILL.md $LINES 行(>= 250,建議重新評估 progressive disclosure)"
fi

# === 4. Frontmatter(共用) ===
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
fi

# === 5. References 子檔(共用) ===
echo ""
echo "[References]"
REF_DIR="$SKILL_DIR/references"
if [ ! -d "$REF_DIR" ]; then
  print_warn "無 references/ 目錄(極簡 skill 可例外)"
else
  REF_COUNT=$(find "$REF_DIR" -name "*.md" -type f 2>/dev/null | wc -l)
  if [ "$REF_COUNT" -eq 0 ]; then
    print_warn "references/ 目錄為空"
  else
    print_ok "references/ 含 $REF_COUNT 個子檔(含子目錄)"
    find "$REF_DIR" -name "*.md" -type f 2>/dev/null | sort | while read -r f; do
      rel=${f#"$REF_DIR/"}
      echo "       └─ $rel ($(wc -l < "$f") 行)"
    done
  fi
fi

# === 6. Gotchas section(共用) ===
echo ""
echo "[Gotchas]"
GOTCHAS_LINE=$(grep -n "^## Gotchas" "$SKILL_MD" | head -1 | cut -d: -f1)
if [ -z "$GOTCHAS_LINE" ]; then
  print_warn "無 ## Gotchas section(建議有)"
else
  G_COUNT=$(awk -v start="$GOTCHAS_LINE" 'NR > start && /^### G/' "$SKILL_MD" | wc -l)
  if [ "$G_COUNT" -lt 3 ]; then
    print_warn "Gotchas 只有 $G_COUNT 條(建議 3–5 條)"
  elif [ "$G_COUNT" -gt 6 ]; then
    print_warn "Gotchas 有 $G_COUNT 條(超過 6 條建議合併或下放)"
  else
    print_ok "Gotchas 含 $G_COUNT 條"
  fi
fi

# === 7. 觸發詞檢查(v1 / v2 分流) ===
echo ""
if [ "$SCHEMA" = "v1" ]; then
  # === v1 legacy:沿用原邏輯 ===
  echo "[觸發關鍵字 — v1 legacy]"
  TRIGGER_LINE=$(grep -m1 "觸發關鍵字" "$SKILL_MD" || true)
  if [ -z "$TRIGGER_LINE" ]; then
    print_warn "description 中找不到「觸發關鍵字」段"
  else
    TRIGGER_COUNT=$(echo "$TRIGGER_LINE" | awk -F'、' '{print NF}')
    if [ "$TRIGGER_COUNT" -lt 6 ]; then
      print_warn "觸發關鍵字僅 $TRIGGER_COUNT 個(< 6 容易 undertrigger)"
    elif [ "$TRIGGER_COUNT" -gt 15 ]; then
      print_warn "觸發關鍵字 $TRIGGER_COUNT 個(> 15 容易 overtrigger)"
    else
      print_ok "觸發關鍵字 $TRIGGER_COUNT 個"
    fi
  fi

  echo ""
  echo "[Anti-trigger — v1 legacy]"
  if ! grep -q "DO NOT trigger" "$SKILL_MD"; then
    print_warn "description 缺 DO NOT trigger 段"
  else
    print_ok "DO NOT trigger 段存在"
  fi
else
  # === v2 新規格 ===
  # 抽出 frontmatter 內 description 區塊(從 description: | 起,到下一個 --- 止)
  DESC_BLOCK=$(awk '/^description: \|/{flag=1; next} /^---$/{flag=0} flag' "$SKILL_MD")

  if [ -z "$DESC_BLOCK" ]; then
    print_error "v2 規格要求 description 用多行 block(description: | 開頭)"
  else
    echo "[Trigger 鑽石詞 — v2]"
    # Trigger 行:抓「Trigger:」開頭那行
    TRIGGER_LINE=$(echo "$DESC_BLOCK" | grep -m1 "^[[:space:]]*Trigger:" || true)
    if [ -z "$TRIGGER_LINE" ]; then
      print_warn "v2 description 缺「Trigger:」段"
    else
      # 鑽石詞部分:Trigger: 之後到「;或」或「;或」之前
      DIAMOND_PART=$(echo "$TRIGGER_LINE" | sed 's/^[[:space:]]*Trigger:[[:space:]]*//' | sed 's/[;;]或.*$//')
      DIAMOND_COUNT=$(echo "$DIAMOND_PART" | awk -F'、' '{print NF}')
      if [ "$DIAMOND_COUNT" -lt 3 ]; then
        print_warn "鑽石詞僅 $DIAMOND_COUNT 個(v2 規格要 3–6 個)"
      elif [ "$DIAMOND_COUNT" -gt 6 ]; then
        print_warn "鑽石詞 $DIAMOND_COUNT 個(v2 規格要 3–6 個,過多回到流水帳)"
      else
        print_ok "鑽石詞 $DIAMOND_COUNT 個"
      fi

      # 情境句:檢查有沒有「或」之後的內容
      CONTEXT_PART=$(echo "$TRIGGER_LINE" | sed -n 's/.*[;;]或\(.*\)/\1/p')
      if [ -z "$CONTEXT_PART" ]; then
        print_warn "Trigger 缺情境句(「;或」之後該有 1 條兜底意圖句)"
      else
        CONTEXT_LEN=$(echo -n "$CONTEXT_PART" | wc -m)
        if [ "$CONTEXT_LEN" -gt 80 ]; then
          print_warn "情境句 $CONTEXT_LEN 字(建議 ≤ 50,過長等於塞進第二批觸發詞)"
        else
          print_ok "情境句存在($CONTEXT_LEN 字)"
        fi
      fi
    fi

    echo ""
    echo "[Do NOT — v2]"
    DONOT_LINE=$(echo "$DESC_BLOCK" | grep -m1 "^[[:space:]]*Do NOT:" || true)
    if [ -z "$DONOT_LINE" ]; then
      print_warn "v2 description 缺「Do NOT:」段"
    else
      # 計算條目數:用 ; 或 ; 分隔
      DONOT_PART=$(echo "$DONOT_LINE" | sed 's/^[[:space:]]*Do NOT:[[:space:]]*//')
      DONOT_COUNT=$(echo "$DONOT_PART" | awk -F'[;;]' '{print NF}')
      if [ "$DONOT_COUNT" -lt 2 ]; then
        print_warn "Do NOT 僅 $DONOT_COUNT 條(v2 規格要 2–3 條,點名最易誤觸鄰居)"
      elif [ "$DONOT_COUNT" -gt 3 ]; then
        print_warn "Do NOT 有 $DONOT_COUNT 條(v2 規格要 2–3 條,過多是噪音)"
      else
        print_ok "Do NOT $DONOT_COUNT 條"
      fi
    fi

    echo ""
    echo "[Description 總字數 — v2]"
    # 計算 description 區塊總字數(不含 markdown 標記字元、不含換行)
    DESC_CHAR_COUNT=$(echo "$DESC_BLOCK" | tr -d '\n[:space:]' | wc -m)
    if [ "$DESC_CHAR_COUNT" -gt 250 ]; then
      print_warn "description 共 $DESC_CHAR_COUNT 字(v2 上限 250,流水帳警告)"
    else
      print_ok "description 共 $DESC_CHAR_COUNT 字(≤ 250)"
    fi
  fi
fi

# === 總結 ===
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━"
echo "Schema 模式:$SCHEMA"
if [ "$ERROR_COUNT" -gt 0 ]; then
  echo "❌ 發現 $ERROR_COUNT 個錯誤、$WARN_COUNT 個警告——不建議直接 ship"
  exit 2
elif [ "$WARN_COUNT" -gt 0 ]; then
  echo "⚠️  發現 $WARN_COUNT 個警告——可 ship,但建議檢視"
  exit 1
else
  echo "✅ 全部通過——可交給 skill-review 進一步審查"
  exit 0
fi
