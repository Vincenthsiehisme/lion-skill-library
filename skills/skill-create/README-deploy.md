# skill-create v2 升級部署說明

## 改動範圍 (5 個檔,全部覆蓋既有目錄)

| 來源 | 部署目標 | 改動類型 |
|---|---|---|
| `SKILL.md` | `~/.claude/skills/user/skill-create/SKILL.md` | frontmatter 升 v2、維度 2 改 v2 三段式、validate 註記補雙模式、G3 改 2–3 條鄰居 |
| `assets/skill-template.md` | `~/.claude/skills/user/skill-create/assets/skill-template.md` | template 改 v2 結構 + 預填 schema_version + 內嵌規格註解 |
| `scripts/validate-skill.sh` | `~/.claude/skills/user/skill-create/scripts/validate-skill.sh` | 加 v1/v2 雙模式 + --strict flag |
| `references/section-recipes.md` | `~/.claude/skills/user/skill-create/references/section-recipes.md` | **Description 段重寫**為 v2 三段式 + 補 v1 legacy 規格區段 |
| `references/skill-anatomy.md` | `~/.claude/skills/user/skill-create/references/skill-anatomy.md` | 顧問類 / 查詢類 frontmatter 範例升 v2 + 查詢類觸發詞規範校準 |

## 部署指令

```bash
# 備份既有版本
cp -r ~/.claude/skills/user/skill-create ~/.claude/skills/user/skill-create.backup-$(date +%Y%m%d)

# 覆蓋 5 個檔案
cp SKILL.md ~/.claude/skills/user/skill-create/SKILL.md
cp assets/skill-template.md ~/.claude/skills/user/skill-create/assets/skill-template.md
cp scripts/validate-skill.sh ~/.claude/skills/user/skill-create/scripts/validate-skill.sh
cp references/section-recipes.md ~/.claude/skills/user/skill-create/references/section-recipes.md
cp references/skill-anatomy.md ~/.claude/skills/user/skill-create/references/skill-anatomy.md
chmod +x ~/.claude/skills/user/skill-create/scripts/validate-skill.sh

# 驗證新版自己跑得過(dogfood)
~/.claude/skills/user/skill-create/scripts/validate-skill.sh ~/.claude/skills/user/skill-create
```

預期結果:`Schema 模式: v2`、`description 共 246 字`、所有 v2 規格欄位 ✅、長度欄位 1 個 warning(240 行,可接受)。

## v2 規格摘要 (寫新 skill 時參考)

```yaml
---
name: <skill-name>
schema_version: v2
description: |
  <定位句,≤ 40 字>。

  Trigger: <鑽石詞 3-6 個,頓號分隔>;或<1 條情境句,≤ 50 字>。

  Do NOT: <場景 1> → <skill-1>;<場景 2> → <skill-2>。
---
```

**硬性規格**:
- 定位句 ≤ 40 字
- 鑽石詞 3-6 個
- 情境句 1 條 ≤ 50 字
- Do NOT 2-3 條 (只列最易誤觸鄰居)
- description 全段 ≤ 250 字

## 向後相容性 (漸進派路線)

- 既有 skill 沒寫 `schema_version` → 自動走 v1 legacy,行為跟原 script 一致
- 寫新 skill 一律用 v2(template 已預填)
- 想升舊 skill 時用 `validate-skill.sh --strict <skill-dir>` 找該改的位置

## 本次跟 v1 比較的 5 個檔案改動細節

### SKILL.md
- frontmatter 升 v2 + 自己作為示範案例
- 維度 2「Description 撰寫」從教 v1 四段式改為教 v2 三段式
- 驗證註記補上 v1/v2 雙模式說明
- G3「忘記點名鄰居」改為「Do NOT 寫成空話或列太多鄰居」

### references/section-recipes.md (這次補的)
- 「Description 段」原本只教 v1 四段式,改為:
  - **v2 規格 (主推)**:三段式 + 鑽石詞/情境句/Do NOT 細則 + 250 字上限
  - **v1 legacy 規格 (副)**:既有 skill 用,標明適用條件與升級工具
- 「與其他 skill 銜接段」中 `DO NOT trigger` 字串校準為 `Do NOT 段`

### references/skill-anatomy.md (這次補的)
- 顧問類 frontmatter 範例升 v2 (加 schema_version + Trigger/Do NOT 結構)
- 查詢類 frontmatter 範例升 v2
- 查詢類觸發詞規範:「觸發詞」→「鑽石詞 (v2 規格 3-6 個)」
- 流程類 / 產出類範例維持省略寫法 (用 `description: | ...`),讀者回頭看顧問類

## 接下來建議

1. 試寫一個新 skill,跑 `validate-skill.sh` 體驗 v2 流程
2. 任何時候想把舊 skill 升 v2,用 `--strict` flag 找出該改的位置
3. 不急著一次升完——漸進派精神,遇到再改
