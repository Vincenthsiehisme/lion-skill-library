# 新增 Skill 規範

## 目錄結構

每個 skill 一個資料夾，名稱必須與 SKILL.md frontmatter 的 `name` 完全一致：

```
skills/
└── prd-writer/                  ← 資料夾名 = name
    ├── SKILL.md                 ← 必須，主檔
    ├── references/              ← 可選，progressive disclosure 子檔
    │   ├── templates.md
    │   └── examples.md
    ├── scripts/                 ← 可選，執行腳本
    └── assets/                  ← 可選，靜態資源
```

## SKILL.md frontmatter 規範

```yaml
---
name: prd-writer                  # 必填，須與資料夾名一致
description: |                    # 必填，給 Claude 看的觸發條件
  寫 PRD、需求文件、user story、KPI/指標定義時觸發。
  觸發詞：寫 PRD、需求文件、定義 KPI、競品分析、roadmap…
version: 0.10.2                   # 必填，semver
category: planning                # 必填，見下方分類列表
license: MIT                      # 可選，預設 MIT
author: Vt                        # 可選
tags:                             # 可選，多個關鍵字
  - product
  - documentation
---
```

### 分類（category）枚舉值

選一個最貼切的：

| category | 中文 | 用於 |
|---|---|---|
| `planning` | 規劃 | skill-brain, prd-writer, coding-planner |
| `writing` | 寫作 | skill-create, prd-spec |
| `review` | 審查 | skill-review, critical-reviewer, knowledge-extractor |
| `summary` | 沉澱 | skill-summary, skill-evolve, session-handoff |
| `data` | 資料 | data-* 系列 |
| `utility` | 工具 | caveman, zoom-out |
| `domain` | 領域 | 雄獅特定（暫不公開上架） |

未來可加，需同步更新 `scripts/build-catalog.ts`。

## Description 撰寫原則

description 是給 Claude 自動觸發判斷用，不是給人看的廣告詞。

- **第一段**：直述何時觸發
- **觸發關鍵字段**：列出觸發詞
- **DO NOT trigger for**：明確說哪些情境**不**該觸發

範本見 `skills/_template/SKILL.md`。

## 機密內容檢核

**本 repo 是 public**。push 前自己過一遍：

- [ ] 沒有雄獅內部 squad 名稱（S4、S5、S12…）
- [ ] 沒有內部系統代號（GITPCM、LionGroupRPM、ExAPI…）
- [ ] 沒有內部成員名單（squad-members.json 之類）
- [ ] 沒有內部 table 名稱（tppdm*、gitpcm*…）
- [ ] 沒有內部商業邏輯（具體配額規則、定價邏輯）

有內部資訊的 skill 不在此 platform 上架，走公司內部流程。

## 版本管理

- 修改 description / 觸發條件 → minor (`0.10.0` → `0.11.0`)
- 補 reference / 修錯字 → patch (`0.10.0` → `0.10.1`)
- 重大重構、破壞性變更 → major (`0.10.0` → `1.0.0`)

build 時除了讀 frontmatter 的 version，也會自動記錄 git commit hash 與日期，
網站會同時顯示「v0.10.2（最後更新：2 天前）」。即使 version 沒更新，commit 日期也會反映實際變動。

## 跨 skill 引用

如果你的 skill 在 SKILL.md 內引用其他 skill（例如「先跑 skill-brain 再來」），請在 frontmatter 加：

```yaml
related:
  - skill-brain
  - prd-writer
```

網站會在卡片上提示「相依：skill-brain」，使用者就知道要一起裝。

## 上架流程

```bash
# 1. 把 skill 資料夾放進 skills/
cp -r ~/.claude/skills/prd-writer skills/

# 2. 跑檢核（可選，CI 也會跑）
pnpm validate

# 3. push
git add skills/prd-writer
git commit -m "add: prd-writer v0.10.2"
git push

# 4. GitHub Actions 會自動：
#    - 跑 validate（frontmatter 格式、必填欄位）
#    - 為每個 skill 打 zip
#    - 重建 catalog
#    - 部署網站
```

CI 失敗會擋 merge，看 Actions log 修正後重 push。
