# 搜尋與萃取機制細節

`skill-search` 主檔保留四個維度的綱要，本檔提供搜尋指令、萃取判準、性能優化策略。

---

## 維度 1 — Query 釐清的判讀線索

### 從訊息直接判讀「要找什麼類型」

| 使用者訊息中的線索 | 對應 skill 類型 |
|---|---|
| 「審查」「review」「rubric」「評分」 | 審查類（skill-reviewer / critical-reviewer） |
| 「顧問」「advisor」「釐清」「決策」 | 顧問類（group-tour-advisor / data-dictionary-advisor） |
| 「流程」「拆解」「story」「orchestrator」 | 流程類（story-orchestrator / task-dispatcher） |
| 「schema」「table」「FK」「資料庫」 | 資料查詢類（erp-schema / pcm-schema） |
| 「報告」「deck」「slide」「render」 | 報告產出類（strategy-case-report / report-renderer） |

### 從訊息直接判讀「要找哪個段落」

| 使用者卡關描述 | 要找的段落 |
|---|---|
| 「不會觸發」「trigger 怎麼定」 | description / trigger 寫法 |
| 「使用者問題很模糊」「怎麼問清楚」 | Step 0 問診結構 |
| 「主流程怎麼設計」 | 核心流程章節 |
| 「踩坑沒地方寫」「Gotchas 怎麼寫」 | Gotchas section |
| 「太長了要拆」「分檔怎麼分」 | progressive disclosure 結構 |

---

## 維度 2 — 三層搜尋的執行指令

**統一入口**：使用 `scripts/scan-skills.sh` 取得結構化清單，TSV 格式（`layer / name / description_first_line`）。

```bash
./scripts/scan-skills.sh [layer] [keyword]
# layer: user | examples | public | all (default: all)
# keyword: 選填，過濾 description 含此字的 skill（不分大小寫）
```

### L1 — User 層（強制優先）

```bash
./scripts/scan-skills.sh user
./scripts/scan-skills.sh user "審查"   # 帶關鍵字
```

- 預設撈 3 個結構最像的
- 比對方法：先用 query 中的關鍵字（類型 / 段落）找名稱相近的，再 `view` 命中的 SKILL.md 確認職責
- 至少要有 1 個是**最近 3 個月內建立或更新**的（風格較新）

### L2 — Examples 層

```bash
./scripts/scan-skills.sh examples
```

- 撈 1–2 個對照
- 預期撈到的：`skill-creator`（如果是找 skill 結構）、`doc-coauthoring`（如果是找文件協作）
- 注意：examples 多數是英文，萃取時要轉換成中文風格

### L3 — Public 層

```bash
./scripts/scan-skills.sh public
```

- 撈 0–2 個（多數時候不需要）
- 適合查的場景：找 progressive disclosure 範本（`pdf-reading`、`xlsx`）、找 SKILL.md 的 YAML frontmatter 格式

### 性能策略

| skill 庫規模 | 策略 |
|---|---|
| < 30 個（目前） | `scan-skills.sh all` 約 4 秒，可接受 |
| 30–50 個 | 用 keyword 參數過濾，避免讀全部 description |
| 50+ 個 | 維護一份 skill-index.json（name + 一句話職責），先讀 index 再選擇性深入 |

目前在 < 30 階段，scan-skills.sh 全讀即可。

---

## 維度 3 — 模式萃取判準

### 「2+ 範例都有」才算模式

| 出現次數 | 標籤 | 寫進 bundle 的方式 |
|---|---|---|
| 3 個都有 | **強模式** | 「在 A/B/C 都出現，建議採用」 |
| 2 個有 | **中模式** | 「在 A/B 出現，可參考」 |
| 1 個有 | **個別範例** | 「在 A 出現，作為個別案例參考」 |

不要把個別範例稱為「模式」——這是 G3 Gotcha 的成因。

### 常見可萃取的模式類別

#### 結構模式
- 四段式 description（定位 / 觸發詞 / 模糊情境 / DO NOT trigger）
- Step 0 三選一問診（A/B/C 路徑分流）
- 維度式主流程（vs 步驟式）
- 三段式 Gotcha（症狀 / 正確做法 / 為什麼）
- 雙交付物（對話摘要 + 檔案）

#### 風格模式
- 中文觸發詞 8–12 個密度
- Anti-trigger 點名鄰居 skill（用 + skill 名）
- references 子檔下放細節（200 行內主檔）
- 「不做：點名 2–3 個鄰居職責」邊界宣告

#### 銜接模式
- 「正向銜接 / 內部不處理」雙段式宣告
- 上下游呼叫關係明確標註

---

## 維度 4 — Bundle 組裝原則

### 三類片段必含

| 片段類型 | 來源 | 用途 |
|---|---|---|
| **結構框架** | 從 2+ 範例萃取的共同骨架 | 給 create 當骨架照搬 |
| **關鍵段落樣本** | 從最佳範例摘出 1–2 段精華 | 給 create 當寫法參考 |
| **反例警示** | 萃取過程中發現的差異點 | 提醒 create 要避免哪些寫法 |

### Bundle 長度控制

- 對話摘要：壓在 30 行內
- `reference-bundle.md` 檔案：100–200 行為佳，超過 250 行代表沒做萃取，是在搬範例

### 命名規則

`/home/claude/reference-bundle-<topic>.md`

`<topic>` 用 kebab-case，反映查找需求：
- `reference-bundle-skill-description-writing.md`
- `reference-bundle-gotchas-section.md`
- `reference-bundle-step-0-triage.md`
