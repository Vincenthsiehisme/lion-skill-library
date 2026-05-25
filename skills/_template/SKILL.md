---
name: _template
description: |
  範本 skill,展示 Lion Skill Library 上架格式。
  實際上不會被 validate / package(_template 是保留名稱,會被忽略),
  但可作為你新建 skill 時的複製範本。
version: 0.1.0
category: utility
license: MIT
author: Vt
tags:
  - template
  - reference
related: []
---

# 範本 Skill

這是一個說明用 skill,展示 Lion Skill Library 期待的 SKILL.md 結構。
新增 skill 時可從這份複製出發。

## Frontmatter 必填欄位

- `name`:資料夾名,小寫 kebab-case
- `description`:給 Claude 看的觸發條件,至少 20 字元
- `version`:semver
- `category`:planning / writing / review / summary / data / utility / domain

## Description 撰寫原則

description 是 skill 的核心 — Claude 靠它判斷該不該觸發。

寫法:

1. 第一段直述何時觸發
2. 列出觸發關鍵字(可以中英混雜)
3. 用「DO NOT trigger for」明說哪些情境**不**該觸發

範例:

```
description: |
  寫 PRD、需求文件、user story、KPI/指標定義時觸發。
  
  觸發關鍵字:寫 PRD、需求文件、定義 KPI、競品分析、roadmap、產品規劃。
  
  DO NOT trigger for: 一般產品聊天、技術架構討論、code review、
  或單行的產品概念問題。
```

## 內容組織

Progressive disclosure 是 skill 設計的核心 — SKILL.md 本身保持精簡,
詳細參考資料放在 `references/` 子資料夾,在需要時才引用。

```
my-skill/
├── SKILL.md              ← 主檔,精簡核心邏輯
├── references/           ← 詳細參考,按需載入
│   ├── examples.md
│   ├── templates.md
│   └── edge-cases.md
└── scripts/              ← (可選) 可執行腳本
```

## 跨 skill 引用

如果你的 skill 會引用另一個 skill(「先跑 skill-brain」、「最後交給 prd-spec」),
在 frontmatter 加 `related:`,網站會顯示提示讓使用者一起裝。

```yaml
related:
  - skill-brain
  - prd-spec
```

## 機密內容檢核

上架前自我檢核:

- [ ] 沒有雄獅內部 squad / 系統代號 / 成員名單
- [ ] 沒有內部 table 名稱
- [ ] 沒有內部商業邏輯

有內部資訊的 skill 不在此 platform 上架。
