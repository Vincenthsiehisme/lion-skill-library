# 新增 / 修改 Skill 規範

## 上架模式

目前本 repo 採 maintainer gatekeeping 模式。

```text
其他人交付 skill
  ↓
maintainer 放到 incoming/
  ↓
maintainer 跑 intake 腳本
  ↓
skill 進入 skills/
  ↓
release:plan 產生 AI 可讀 release draft
  ↓
AI 產 release-notes.json
  ↓
release:apply 更新 version + CHANGELOG
  ↓
validate / check:changelogs / build
  ↓
push 後 GitHub Actions 自動部署
```

不建議其他人直接手動改 `skills/` 後 push。Skill 會影響網站 catalog、下載包、manifest 與分類篩選，統一透過 intake / release scripts 可以減少格式錯誤與 CHANGELOG 卡關。

## 最低交付格式

別人交給 maintainer 的 skill，最低只需要：

```text
some-skill/
├── SKILL.md
└── references/
    └── optional.md
```

其中只有 `SKILL.md` 必須存在。

`references/`、`scripts/`、`assets/` 都是可選。

## Maintainer 上架流程

### 1. 放入 incoming/

```bash
mkdir -p incoming
cp -r /path/to/submitted-skill incoming/
```

`incoming/` 是暫存收件區，不會被 commit。

### 2. dry run

```bash
npm run intake -- ./incoming/submitted-skill --category review --dry-run
```

確認輸出中的：

```text
target
category
version
copied entries
warnings
```

### 3. 正式匯入

```bash
npm run intake -- ./incoming/submitted-skill --category review
```

如果來源 `SKILL.md` 已經有合法 category，可以省略 `--category`。

如果沒有 category，腳本會互動式詢問。

### 4. 產生 release plan

```bash
npm run release:plan -- --only submitted-skill
```

這會產生：

```text
.lion-stage/release-plan.md
.lion-stage/release-notes.template.json
```

`release-plan.md` 是給 AI 解析 diff 用；`release-notes.template.json` 是 AI 回填格式參考。

### 5. 讓 AI 產 release-notes.json

把 `.lion-stage/release-plan.md` 貼給 AI，請它只輸出 JSON。

格式：

```json
{
  "entries": [
    {
      "skill": "submitted-skill",
      "releaseType": "patch",
      "version": "0.1.0",
      "summary": [
        "初次上架 submitted-skill，提供特定工作情境下的標準化操作流程。"
      ]
    }
  ]
}
```

存成：

```text
.lion-stage/release-notes.json
```

### 6. 套用 release notes

```bash
npm run release:apply
```

它會自動：

```text
更新 skills/<name>/SKILL.md 的 version
在 skills/<name>/CHANGELOG.md 插入對應版本段落
略過 releaseType: none 的項目
```

### 7. 本地 build

```bash
npm run build
```

`npm run build` 會跑：

```text
validate
check:changelogs
build:zips
build:catalog
build:site
```

### 8. Commit / push

```bash
git add -A
git commit -m "add: submitted-skill"
git push
```

## intake 腳本做什麼？

`npm run intake` 負責：

- 找 `SKILL.md` 或 `skill.md`
- 正規化 skill name 成 lowercase kebab-case
- 確保資料夾名稱與 frontmatter `name` 一致
- 補 `version: 0.1.0`
- 補 `license: MIT`
- 補 `category`
- 正規化 `tags`
- 正規化 `related`
- 保留 `references/`、`scripts/`、`assets/` 等補充資料
- 建立空的 `CHANGELOG.md` shell，正式條目交給 `release:apply`
- 匯入後執行 `npm run validate`

`intake` 不負責：

- 判斷 skill 內容是否合理
- 自動改寫 skill 本文
- 寫正式 CHANGELOG 條目
- 幫既有 skill 改版
- git add / commit / push

## release:plan 做什麼？

`npm run release:plan` 負責掃描 `origin/main` 到目前 working tree 的 skill 變更，產生 AI 可讀的 release draft。

它會輸出：

```text
baseRef
changedSkills
每個 skill 的 status / currentVersion / suggestedVersion
changed files
diff
AI 輸出 JSON 格式要求
```

常用指令：

```bash
npm run release:plan
npm run release:plan -- --only skill-review
npm run release:plan -- --only skill-review,skill-create
npm run release:plan -- --base main
npm run release:plan -- --summary-only
```

## release:apply 做什麼？

`npm run release:apply` 讀取：

```text
.lion-stage/release-notes.json
```

並套用：

```text
SKILL.md version
CHANGELOG.md version section
```

它會檢查：

- skill 必須存在
- releaseType 必須是 `major` / `minor` / `patch` / `none`
- 非 `none` 的項目必須有 semver version
- summary 不可空
- 目標 version 不可小於目前 version
- CHANGELOG 不可已存在同 version 段落
- 同一份 JSON 不可重複出現同一個 skill

dry run：

```bash
npm run release:apply -- --dry-run
```

指定 input：

```bash
npm run release:apply -- --input .lion-stage/release-notes.json
```

## releaseType 判斷

| releaseType | 用於 | 是否 bump version | 是否寫 CHANGELOG |
|---|---|---:|---:|
| `major` | skill 行為大改、使用方式改、破壞性變更 | 是 | 是 |
| `minor` | description、trigger、主流程、判斷框架改 | 是 | 是 |
| `patch` | 補 reference、修 typo、補範例、修小錯 | 是 | 是 |
| `none` | README、CHANGELOG、非行為性整理、格式化、暫存檔 | 否 | 否 |

原則：只有對使用者使用 skill 有影響，才需要 skill CHANGELOG。

## 目錄結構

正式上架後，每個 skill 一個資料夾，名稱必須與 `SKILL.md` frontmatter 的 `name` 完全一致：

```text
skills/
└── prd-writer/
    ├── SKILL.md
    ├── CHANGELOG.md
    ├── references/
    │   ├── templates.md
    │   └── examples.md
    ├── scripts/
    └── assets/
```

`CHANGELOG.md` 必須存在，並包含目前 version 對應段落。

## SKILL.md frontmatter 規範

```yaml
---
name: prd-writer
description: |
  寫 PRD、需求文件、user story、KPI/指標定義時觸發。
  觸發詞: 寫 PRD、需求文件、定義 KPI、競品分析、roadmap

  DO NOT trigger for: 已拍板的小功能、純技術架構討論。
version: 0.1.0
category: planning
license: MIT
author: Vt
tags:
  - product
  - documentation
related:
  - skill-brain
---
```

### 必填欄位

| 欄位 | 說明 |
|---|---|
| `name` | lowercase kebab-case，必須等於資料夾名 |
| `description` | 給 Claude 看的觸發條件，至少 20 字 |
| `version` | semver，例如 `0.1.0` |
| `category` | 從下方枚舉選一個 |

### 可選欄位

| 欄位 | 說明 |
|---|---|
| `license` | 預設 MIT |
| `author` | 作者或維護者 |
| `tags` | 搜尋與輔助標籤 |
| `related` | 相關 skill name |

## 分類軸：category

`category` 描述「這個 skill 在做什麼類型的事」，屬於工作性質分類，用於網站 filter bar。

一個 skill 有且只有一個 `category`。

| category | 中文 | 用於 |
|---|---|---|
| `planning` | 規劃 | skill-brain、prd-writer、coding-planner |
| `writing` | 寫作 | skill-create、prd-spec |
| `review` | 審查 | skill-review、critical-reviewer、knowledge-extractor |
| `summary` | 沉澱 | skill-summary、skill-evolve、session-handoff |
| `data` | 資料 | data-* 系列 |
| `utility` | 工具 | caveman、zoom-out |
| `domain` | 領域 | 特定領域知識或業務場景 |

要新增 category 時，至少要同步更新：

```text
scripts/schema.ts
site/src/types.ts
site/src/pages/index.astro
site/src/pages/skill/[name].astro
CONTRIBUTING.md
```

## Description 撰寫原則

`description` 是給 Claude 自動觸發判斷用，不是給人看的廣告詞。

建議包含三段：

```text
第一段：何時觸發

觸發詞: xxx、xxx、xxx

DO NOT trigger for: xxx、xxx、xxx
```

build 時會用 regex 從 description 自動抽出：

```text
triggerKeywords
doNotTrigger
```

用於首頁卡片與詳情頁的 At a glance 區塊。

## Gotchas 區塊

如果 `SKILL.md` body 內有 `## Gotchas` 區段，build 會自動撈底下的 H3 標題或列表項粗體，顯示在詳情頁 At a glance。

建議格式：

```md
## Gotchas

### G1: Description 第一行太長

description 第一行用作 hero 區塊的 pitch，太長會擠。

### G2: 觸發條件太泛

如果 description 只寫「協助分析」，會導致觸發邊界不清。
```

## 機密內容檢核

本 repo 是 public。push 前必須確認：

- 沒有內部 squad 名稱
- 沒有內部系統代號
- 沒有內部成員名單
- 沒有內部 table 名稱
- 沒有內部商業邏輯
- 沒有客戶資料、訂單資料、個資或內部憑證
- 沒有 API key、token、cookie、帳密或內部 URL

有內部資訊的 skill 不在此 platform 上架，應走公司內部流程。

## 版本管理

建議規則：

- 新 skill：`0.1.0`
- 修改 description / 觸發條件：minor，例如 `0.10.0` → `0.11.0`
- 補 reference / 修錯字：patch，例如 `0.10.0` → `0.10.1`
- 重大重構、破壞性變更：major，例如 `0.10.0` → `1.0.0`

`release:plan` 會協助偵測改動並建議版號，但最後以 `.lion-stage/release-notes.json` 為準。

build 時除了讀 frontmatter 的 version，也會自動記錄：

- `lastModified`：該資料夾任何檔案的最後 commit 日期
- `firstPublished`：該資料夾的首次 commit 日期
- `versionBumpedAt`：`version:` 那行最後一次實際變動的 commit 日期

網站首頁的最近動態會使用這些欄位。

## 跨 skill 引用

如果你的 skill 在 `SKILL.md` 內引用其他 skill，例如「先跑 skill-brain 再來」，請在 frontmatter 加：

```yaml
related:
  - skill-brain
  - prd-writer
```

`validate.ts` 會檢查 `related` 指向的 skill 是否存在。

## CI / build 流程

`git push` 後 GitHub Actions 會自動：

```text
npm run validate
npm run check:changelogs
npm run build:zips
npm run build:catalog
npm run build:site
```

也就是：

- 檢查 skill schema
- 檢查 CHANGELOG
- 打包 zip
- 產生 `site/src/data/skills.generated.json`
- 產生 `site/public/manifest.json`
- 部署網站

CI 失敗會擋部署，請看 Actions log 修正後重 push。
