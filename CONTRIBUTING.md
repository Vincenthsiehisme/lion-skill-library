# 新增 Skill 規範

## 目錄結構

每個 skill 一個資料夾,名稱必須與 SKILL.md frontmatter 的 `name` 完全一致:

```
skills/
└── prd-writer/                  ← 資料夾名 = name
    ├── SKILL.md                 ← 必須,主檔
    ├── references/              ← 可選,progressive disclosure 子檔
    │   ├── templates.md
    │   └── examples.md
    ├── scripts/                 ← 可選,執行腳本
    └── assets/                  ← 可選,靜態資源
```

## SKILL.md frontmatter 規範

```yaml
---
name: prd-writer                  # 必填,須與資料夾名一致
description: |                    # 必填,給 Claude 看的觸發條件
  寫 PRD、需求文件、user story、KPI/指標定義時觸發。
  觸發詞:寫 PRD、需求文件、定義 KPI、競品分析、roadmap…

  DO NOT trigger for: 已拍板的小功能(用 prd-spec)、純技術架構討論。
version: 0.10.2                   # 必填,semver
category: planning                # 必填,見下方分類列表
group: pm-workflow                # 建議,見下方群組列表
license: MIT                      # 可選,預設 MIT
author: Vt                        # 可選
tags:                             # 可選,多個關鍵字
  - product
  - documentation
related:                          # 可選,其他 skill 名稱
  - skill-brain
feeds_into:                       # 可選,我的輸出餵給誰
  - critical-reviewer
consumes_from: []                 # 可選,我的輸入來自誰
---
```

### 必填欄位

| 欄位 | 說明 |
|---|---|
| `name` | kebab-case,必須等於資料夾名 |
| `description` | 給 Claude 看的觸發條件,≥ 20 字 |
| `version` | semver(`0.1.0` 這種格式) |
| `category` | 從下方枚舉選一個 |

### 兩個分類軸:`category` vs `group`

`category` 與 `group` 同時存在但描述不同的事:

- **`category`** 描述「這個 skill 在做什麼類型的事」(planning / writing / review …)。
  屬於工作性質分類,用於頂部 filter bar。
- **`group`** 描述「這個 skill 跟哪些 skill 是一夥的」(skill-meta / pm-workflow …)。
  屬於家族分類,用於首頁分組區塊。同一 group 內常見 pipeline 關係。

一個 skill **同時有一個 category 跟一個 group**。

#### category 枚舉值

| category | 中文 | 用於 |
|---|---|---|
| `planning` | 規劃 | skill-brain, prd-writer, coding-planner |
| `writing` | 寫作 | skill-create, prd-spec |
| `review` | 審查 | skill-review, critical-reviewer, knowledge-extractor |
| `summary` | 沉澱 | skill-summary, skill-evolve, session-handoff |
| `data` | 資料 | data-* 系列 |
| `utility` | 工具 | caveman, zoom-out |
| `domain` | 領域 | 雄獅特定(暫不公開上架) |

#### group 枚舉值

| group | 標籤 | 包含什麼 |
|---|---|---|
| `skill-meta` | Skill 元工具 | 規劃、寫、審、沉澱 skill 本身的工具 |
| `pm-workflow` | PM 工作流 | PRD、審查、派工、故事拆解 |
| `data-pipeline` | 資料 pipeline | 清整、整形、檢定、解讀、視覺化 |
| `lion-schema` | 雄獅資料知識 | 資料庫 schema 與 API 對照 |
| `lion-system` | 雄獅系統架構 | 系統架構顧問與故障診斷 |
| `personal-style` | 個人風格資產 | 個人偏好、視覺、輸出風格 |
| `marketing-seo` | 行銷與 SEO | 行銷 context、SEO 體檢、價格帶 |
| `specialty` | 專項工具 | 不屬於既有 pipeline 的單兵 skill |

不填 `group` 會 fallback 到 `specialty`,build 時 lint 印 warning。
要新增 category 或 group:同步更新 `scripts/schema.ts`、`site/src/types.ts`、
`site/src/pages/index.astro` 的 `GROUP_META`(三處)。

### Pipeline 關係:`feeds_into` 與 `consumes_from`

如果你的 skill 跟其他 skill 有「我的輸出餵給它」或「我吃它的輸出」的關係,
在 frontmatter 宣告。內容是 skill `name`(陣列)。

```yaml
feeds_into:
  - critical-reviewer    # 我寫完 PRD,常餵給 critical-reviewer 審
consumes_from:
  - skill-brain          # 我吃 skill-brain 的 intent 產出
```

build 時會檢查對稱性:如果 A 寫了 `feeds_into: [B]` 但 B 沒寫
`consumes_from: [A]`,build-catalog 會印 warning(不會 fail)。

## Description 撰寫原則

description 是給 Claude 自動觸發判斷用,不是給人看的廣告詞。

- **第一段**:直述何時觸發
- **觸發關鍵字段**:列出觸發詞
- **DO NOT trigger for**:明確說哪些情境**不**該觸發

build 時會用 regex 從 description 自動抽出 `triggerKeywords` 與
`doNotTrigger` 兩段,渲染成首頁卡片的「不是這個? → ...」消歧義 hint
與 skill 詳情頁的「At a glance」區塊。寫得清楚會直接讓 UX 變好。

範本見 `skills/_template/SKILL.md`。

## Gotchas 區塊(可選)

如果 SKILL.md body 內有 `## Gotchas` 區段(常見踩坑),build 會自動撈底下的
H3 標題(`### G1: xxx`)或列表項粗體(`- **xxx**:`)當作「常見踩雷」清單,
顯示在詳情頁 At a glance。

寫 Gotchas 時建議用一致格式,build 才抓得到:

```markdown
## Gotchas

### G1: Description 第一行太長

description 第一行用作 hero 區塊的 pitch,> 100 字會擠。

### G2: ...
```

## 機密內容檢核

**本 repo 是 public**。push 前自己過一遍:

- [ ] 沒有雄獅內部 squad 名稱(S4、S5、S12…)
- [ ] 沒有內部系統代號(GITPCM、LionGroupRPM、ExAPI…)
- [ ] 沒有內部成員名單(squad-members.json 之類)
- [ ] 沒有內部 table 名稱(tppdm*、gitpcm*…)
- [ ] 沒有內部商業邏輯(具體配額規則、定價邏輯)

有內部資訊的 skill 不在此 platform 上架,走公司內部流程。

## 版本管理

- 修改 description / 觸發條件 → minor (`0.10.0` → `0.11.0`)
- 補 reference / 修錯字 → patch (`0.10.0` → `0.10.1`)
- 重大重構、破壞性變更 → major (`0.10.0` → `1.0.0`)

build 時除了讀 frontmatter 的 version,也會自動記錄:

- `lastModified`:該資料夾任何檔案的最後 commit 日期
- `firstPublished`:該資料夾的首次 commit 日期(「新發布」判定)
- `versionBumpedAt`:`version:` 那行最後一次實際變動的 commit 日期(「新版本」判定)

網站首頁的「最近動態」用這三個欄位算「14 天內新發布 / 新版本」清單。
即使 version 沒更新,commit 日期也會反映實際變動。

## 跨 skill 引用

如果你的 skill 在 SKILL.md 內引用其他 skill(例如「先跑 skill-brain 再來」),
請在 frontmatter 加:

```yaml
related:
  - skill-brain
  - prd-writer
```

網站會在卡片上提示「相依:skill-brain」,使用者就知道要一起裝。
`related` 與 `feeds_into / consumes_from` 是不同的關係:

- `related`:廣義「一起裝可能更好用」
- `feeds_into / consumes_from`:明確的 pipeline 上下游

## 上架流程

```bash
# 1. 把 skill 資料夾放進 skills/
cp -r ~/.claude/skills/prd-writer skills/

# 2. 跑檢核(可選,CI 也會跑)
npm run validate

# 3. push
git add skills/prd-writer
git commit -m "add: prd-writer v0.10.2"
git push

# 4. GitHub Actions 會自動:
#    - 跑 validate(frontmatter 格式、必填欄位)
#    - 為每個 skill 打 zip
#    - 重建 catalog(含 atGlance / pipeline 對稱性 lint)
#    - 部署網站
```

CI 失敗會擋 merge,看 Actions log 修正後重 push。
