#  Skill 標準骨架

`skill-create` 主檔保留四種骨架類型的綱要，本檔提供每種骨架的具體段落配置、選用範例、判型細節。

---

## 共通段落（4 種骨架都要有）

| 段落 | 位置 | 必有/可選 |
|---|---|---|
| YAML frontmatter | 檔首 | 必有 |
| H1 標題 + 一句話定位 | frontmatter 後 | 必有 |
| 「不做」宣告 | H1 下方 | 必有 |
| 與其他 skill 的銜接 | 倒數第二段 | 必有 |
| Gotchas | 最後一段 | 強烈建議 |

---

## 骨架 A：顧問類（Advisor）

**特徵**：釐清概念、提供領域知識、不寫檔案、互動式問診。

**範例**：
- `group-tour-advisor`（團旅領域顧問）
- `data-dictionary-advisor`（資料字典概念顧問）
- `diagram-advisor`（系統圖視角顧問）
- `skill-brain`（skill 規劃顧問）

### 標配段落

    ---
    name: <skill-name>
    schema_version: v2
    description: |
      <定位句，≤ 40 字>

      Trigger: <鑽石詞>、<鑽石詞>；或<情境句>。

      Do NOT: <場景> → <skill-1>；<場景> → <skill-2>。
    ---

    # <Skill 名> — <一句話定位>

    定位：<簡述>
    不做：<點名鄰居 skill>

    ## Step 0：判斷使用者在哪個階段
    [A/B/C 三選一表格 → 進入路徑]

    ## 核心流程：N 個維度釐清
    [維度 1 / 2 / 3 ...]
    （不是 Step 1→2→3——維度允許跳躍，步驟強制順序）

    ## 與其他 skill 的銜接
    ### 正向銜接
    ### Brain/Advisor 內部不處理的事

    ## Gotchas
    [3–5 條三段式]


### 顧問類的判型訊號

intent 中出現：
- 「釐清」「判斷」「協助理解」「提供觀點」
- 「不寫檔案」「不產出文件」
- 對話式互動為主

---

## 骨架 B：查詢類（Schema/Reference）

**特徵**：查詢資料庫 / API / 字典等結構化參考資料。

**範例**：
- `erp-schema`（ERP 資料庫查詢）
- `pcm-schema` / `cms-schema` / `marketing-system-schema`
- `api-schema-mapping`（API 引用架構查詢）

### 標配段落

    ---
    name: <skill-name>
    schema_version: v2
    description: |
      <定位句，≤ 40 字>

      Trigger: <table 名>、<業務場景詞>、<技術查詢詞>；或<情境句>。

      Do NOT: <場景> → <skill-1>；<場景> → <skill-2>。
    ---

    # <Skill 名>

    ## 索引（必有）
    [模組 / table 群組分類，連結到 references/ 各子檔]

    ## 核心查詢場景
    [3–5 個典型查詢]

    ## 跨庫關聯（如有）
    [與其他 schema 的 FK / JOIN 關係]

    ## 與其他 skill 的銜接

    ## Gotchas
    （查詢類的 Gotchas 通常包含「常見誤解」「容易混淆的欄位」）


### 查詢類的特殊規範

- description 的鑽石詞（v2 規格 3–6 個）**必須包含 table 名 / 欄位名 / 業務術語**三類
- 主檔保留索引，**所有 table 細節下放 references/**
- references 子檔按業務模組分檔（不要按字母排序）

### 判型訊號

intent 中出現：
- 「查 schema」「查 table」「查欄位」
- 處理對象是固定資料結構
- 多筆查詢需求

---

## 骨架 C：流程類（Workflow/Orchestrator）

**特徵**：多步驟工作流，可能編排其他 skill 或子流程。

**範例**：
- `task-dispatcher`（派工編排）
- `story-orchestrator`（user story 拆解流程）
- `pre-market-advisor`（盤前三件事流程）

### 標配段落

    ---
    name: <skill-name>
    description: |
      ...
    ---

    # <Skill 名>

    ## Step 0：判讀情境

    ## Phase 1: <階段名>
    [step 1.1, 1.2, 1.3]

    ## Phase 2: <階段名>
    [step 2.1, 2.2]

    ## Phase 3: <階段名>
    ...

    ## 子流程呼叫關係（如編排其他 skill）
    [mermaid 流程圖或表格]

    ## 輸出規格
    [最終交付物]

    ## 與其他 skill 的銜接

    ## Gotchas


### 流程類的特殊規範

- 用 **Phase + Step** 雙層階層，**不是 Step 1→2→3...→10 平鋪**
- 階段間有明確里程碑（產出 A 完成才能進階段 B）
- 編排其他 skill 時必須畫呼叫關係圖

### 判型訊號

intent 中出現：
- 「拆解」「編排」「分階段處理」
- 多個產出（每階段一個）
- 上下游 skill 呼叫

---

## 骨架 D：產出類（Output/Generator）

**特徵**：寫文件、寫報告、寫程式碼、寫其他 skill。

**範例**：
- `prd-writer`（寫 PRD）
- `strategy-case-report`（寫策略報告）
- `report-renderer`（產出 PDF/HTML）
- `skill-create` 自己

### 標配段落

    ---
    name: <skill-name>
    description: |
      ...
    ---

    # <Skill 名>

    ## Step 0：檢查上游材料
    [盤點輸入]

    ## 核心流程：N 個維度的組裝
    [從輸入 → 組裝 → 產出]

    ## 輸出規格（雙交付物）
    ### 交付物 A：<完整檔案 / 目錄>
    ### 交付物 B：對話摘要

    ## 與其他 skill 的銜接

    ## Gotchas


### 產出類的特殊規範

- **必有「輸出規格」段**，明確列出檔案結構與格式
- **必有「雙交付物」**：完整產出 + 對話摘要（通用慣例）
- 範本檔案放 `assets/` 或 `references/template-*.md`
- 重複組裝邏輯放 `scripts/`

### 判型訊號

intent 中出現：
- 「寫」「產出」「組裝」「生成」
- 有具體交付物（檔案、報告、目錄）
- 通常有上游輸入（資料、規格、需求）

---

## 不確定時的回退策略

| 情況 | 回退選項 |
|---|---|
| 介於顧問與產出之間（如「先釐清再寫」） | 拆兩個 skill：顧問 A + 產出 D |
| 介於查詢與顧問之間（如「查資料 + 解釋」） | 選顧問 A，把查詢當內部步驟 |
| 介於流程與產出之間（如「多步驟最後產出檔案」） | 選產出 D，把流程當核心流程的維度 |
| 完全判不出 | 預設選**顧問類 A**，最通用、後續調整成本低 |

---

## 反例：不要做的事

❌ **混骨架**：description 寫成顧問類但主體段落用流程類的 Phase
→ 結果：使用者預期問診式互動，卻被導入線性流程，體驗錯位

❌ **跳過 Gotchas**：「我這個 skill 簡單沒坑」
→ 結果：使用者首次使用一定踩坑，且無處沉澱錯誤；review 階段會被打回

❌ **平鋪 10+ 個 Step**：流程類寫成 Step 1→2→3→...→12
→ 結果：缺少階段感，使用者無法判斷「我現在在哪」；違反 dim 4 railroading 原則

❌ **產出類沒有雙交付物**：只給檔案不給對話摘要
→ 結果：使用者要重新打開檔案才能確認 skill 做了什麼；違反 progressive disclosure 規範
