# build_report 指南

當使用者說「build report」「產出報告」「輸出文件」「幫我整理成報告」時，執行以下流程。

---

## Step 0A：讀取 Anchor

1. 搜尋對話中版本號最高的 `## Anchor vN`
2. 若 Anchor 存在，直接從以下欄位抽取資料，不需重新掃描整個對話：
   - 功能名稱、目標使用者、本季 OKR → PRD 摘要章節
   - 主指標、主假設、護欄指標 → Metrics 表格
   - PRD 章節狀態 → 品質評分的起點
   - 待確認項目 → 直接帶入 Section 5
3. Anchor 沒有的欄位，才掃描對話補充

---

## Step 0B：受眾校準（Audience Calibration）

**Step 0A 完成後，再問這兩個問題。根據答案決定缺口清單的內容。**

```
這份文件要送給誰看？
  A) 工程主管 / 技術 lead
  B) 產品總監 / 業務 stakeholder
  C) 跨部門對齊（多個受眾）
  D) 自己存檔 / 草稿

這次送審的目的是什麼？
  1) 討論方向（早期，允許大量空洞）
  2) 拍板執行（需要工程師可以開始估）
  3) 對外溝通（需要非技術人員也能理解）
```

根據答案，決定哪些缺口是「對這個受眾的 blocker」：

| 受眾 × 目的 | 必須補齊才能送 | 可以帶著洞送 |
|------------|--------------|------------|
| 工程主管 × 拍板 | P0 Story 有 AC、技術考量有內容、Delivery Feasibility 已填 | Metrics L2 / L3 細節、競品分析 |
| 產品總監 × 拍板 | 背景 Why now、Metrics L1 假設聲明完整 | 技術考量、UI/UX 細節 |
| 跨部門 × 對齊 | 背景完整、使用者清晰、不在範圍明確 | AC 細節、技術考量 |
| 任何人 × 討論方向 | 背景問題陳述（最少一句話） | 幾乎所有章節都可以空洞 |
| 自己存檔 | 無強制要求 | 全部 |

**輸出的缺口清單只列「對這個受眾的 blocker」**，不列通用的完整缺口。
若受眾是「討論方向」，缺口清單可能是空的——這是正確行為，不是 bug。

---

## Step 1：從對話中抽取結構化資料

掃描當前對話，找出以下內容並結構化：

### PRD 摘要
- 功能名稱
- 問題陳述（背景）：誰受影響、影響規模、Why now
- 產品目標
- 不在範圍內的項目

### User Story 清單
- 每則 Story 的：優先級（P0/P1/P2）、Story 本體、Acceptance Criteria
- 若某則 Story 缺少 AC，標記 `[缺 AC]`

### Metrics 表格

先判斷當前 PRD 的 Metrics Maturity：

- **L1（假設聲明）**：欄位為 主指標 / 行為假設 / 商業結果 / 失敗訊號 / 護欄理由
- **L2（量測定義）**：在 L1 基礎上加 分子 / 分母 / 時間窗口 / 追蹤來源 / baseline / 目標值
- **L3（埋點規格）**：在 L2 基礎上加 event_name / parameters / data owner

評分標準依 Maturity 套用，**不得用 L3 標準評 L1 草稿**。

### 開放問題清單
欄位：問題描述 / 負責人 / 截止日 / 狀態

### Unknown Register
從 PRD 直接帶入，不重新整理。

### Delivery Feasibility Lite
從 PRD 直接帶入。

### 待確認項目掃描
搜尋所有出現 `[待確認]`、`[待工程確認]`、`[待數據確認]`、`[待確認門檻]`、`[需補充來源]`、`[從對話推斷]`、`[缺口]` 的段落，記錄標記內容與來源章節，確認都已入 Unknown Register。

---

## Step 2：品質評分（Quality Scoring）

舊公式「有寫就算完成」已廢棄。改用內容品質門檻評分，並依 Metrics Maturity 分層。

> **分工說明：** 品質評分用於產生文件狀態快照（透明度），不用於決定是否可以送審。
> 送審建議由 Step 0 受眾校準決定。兩套系統互不干涉。

每個評分項目三個等級：
- [達標] 1 分：達到最低品質門檻
- [缺口] 0.5 分：有內容但未達門檻（空洞、缺要素、缺量測）
- [未填] 0 分：空白、僅有 [待確認]、或內容明顯捏造

### PRD 章節評分（共 8 項，滿分 8）

| 章節 | [達標] 達門檻條件 | [缺口] 未達門檻 | [未填] 不計分 |
|------|-------------|------------|---------|
| 背景 | 有誰受影響 + 規模/頻率 + Why now | 只有問題描述，缺規模或 urgency | 空白或一句話帶過 |
| 目標 | L1 假設聲明完整（主指標 + 行為假設 + 商業結果 + 失敗訊號 + 護欄理由） | 只有文字目標 / 缺失敗訊號 / 缺護欄理由 | 空白 |
| 使用者 | 角色 + 使用情境 + 現有 workaround | 只有角色，無情境或 workaround | 空白或只寫「一般用戶」 |
| 功能需求 | P0 Story ≥1 則，且每則有 AC | 有 Story 但缺 AC | 空白或只有功能列表 |
| 技術考量 | 有實質內容或明確 [待工程確認] | 只寫「需要 API」等模糊描述 | 空白 |
| 開放問題 | 有問題清單或明確「本次無開放問題」 | — | 空白 |
| Unknown Register | 正文所有未知標記都已入冊 | 部分未入冊 | 整節缺失 |
| Delivery Feasibility | 六欄全填（含 [待確認] 標記） | 缺欄位 | 整節空白 |

### User Story 評分（每則獨立計分）

| 條件 | 分數 |
|------|------|
| who + what + why 齊全，且有 ≥1 條 AC | [達標] 1 |
| Story 本體完整，但 AC 缺 Given/When/Then 格式 | [缺口] 0.5 |
| 缺 why，或 AC 完全沒有 | [未填] 0 |

**AC 額外檢查**：AC 內若含具體數字門檻（如「2 秒」「500ms」），且未標記 `[待確認門檻]` 或 `[待工程確認]`，整則 Story 降為 [缺口] 0.5。

### Metrics 評分（依 Maturity 分層，每個獨立計分）

**L1 假設聲明評分**：

| 條件 | 分數 |
|------|------|
| 主指標方向 + 行為假設 + 商業結果 + 失敗訊號 + 護欄理由全齊 | [達標] 1 |
| 五項中缺一到兩項 | [缺口] 0.5 |
| 缺主指標或缺失敗訊號 | [未填] 0 |

**L2 量測定義評分（僅在 PRD 已進 L2 階段才套用）**：

| 條件 | 分數 |
|------|------|
| L1 全齊 + 分子 + 分母 + 時間窗口 + 追蹤來源 + baseline 狀態明確 | [達標] 1 |
| 有分子分母，但缺追蹤來源或 baseline 狀態 | [缺口] 0.5 |
| 缺分子或分母 | [未填] 0 |

**L3 埋點規格評分（僅在 PRD 已進 L3 階段才套用）**：

| 條件 | 分數 |
|------|------|
| L2 全齊 + event_name + parameters + data owner | [達標] 1 |
| 有 event_name 但缺 parameters 或 owner | [缺口] 0.5 |
| 缺 event_name | [未填] 0 |

**重要：** PRD 初稿預設 L1。若 PRD 還在 L1 階段，**不得**用 L2 或 L3 標準評分（會把 L1 草稿全評為 [未填]，產生誤導）。

### 完成度計算

完成度 = 實際得分總和 / 滿分總和 × 100%
滿分總和 = PRD 章節 8 + Story 數量 N + Metrics 數量 M

完成度等級（依文字標籤，無顏色 emoji）：
- 80%+：Ready for review
- 50–79%：In progress
- <50%：Needs more input

---

## Step 3：輸出三種格式

### 格式 A：Markdown（report.md）
純文字，可直接貼到 Confluence / Notion。
使用 `assets/report-template.md` 作為基底填入資料。
[缺口] 標記在 Markdown 中以 `> [缺口] ...` blockquote 呈現。

### 格式 B：HTML（report.html）
使用 `assets/report-template.html` 作為基底。
功能：側邊固定導覽列、品質評分進度條 + badge、[待確認] 黃色高亮、[缺口] 橘色高亮。

### 格式 C：PDF（report.pdf）
從 HTML 版本轉換，使用 Python weasyprint 或 pdfkit 產生。
若環境不支援，改用 Markdown 版本並明確告知使用者。

---

## Step 4：輸出確認

輸出後告知使用者，格式根據 Step 0 的受眾校準結果調整：

```
報告已產生：report.md / report.html / report.pdf

文件狀態
背景 [達標] / 目標 [缺口] / 使用者 [達標] / 功能需求 [達標] / 技術考量 [本次未涉及] / 開放問題 [缺口] / Unknown Register [達標] / Delivery Feasibility [缺口]
User Stories：N 則（P0: X 則 / P1: Y 則）
Metrics：M 個定義（Maturity: L1 / L2 / L3）

─────────────────────────────────
針對 [受眾] × [目的] 的缺口評估：

[Blocker - 送出前必須補齊]：       ← 只列對這個受眾真正重要的 blocker
  - [具體缺口 + 一句話說明為什麼對這個受眾重要]

[建議補齊但可以帶著送]：
  - [具體缺口]

[對這個受眾已足夠]：
  - [列出已達標且對受眾關鍵的章節]
─────────────────────────────────
```

**若受眾是「自己存檔」或「討論方向」**：
跳過缺口評估區塊，只輸出文件狀態，不給任何建議，讓 PM 自己判斷。

**若缺口清單是空的**：
輸出「針對 [受眾] × [目的]，目前文件已足夠送出。」不要強行製造問題。

---

## Gotchas

- 「有寫」不等於「完成」：背景寫了一句話但缺規模和 urgency，算 [缺口] 0.5 分，不算 [達標]
- 對話中沒有的內容不要捏造：若對話中沒有 Metrics，表格留空並標記「本次未定義，建議補充」
- User Story 優先級未標記時預設 P1：不要猜測 P0
- HTML 要能離線開啟：不引用外部 CDN
- PDF 轉換失敗時不要靜默跳過：明確告知失敗原因
- 品質問題清單要具體可執行：不要只寫「背景不完整」，要寫「背景缺少 Why now，請說明為什麼現在要解決這個問題」
- **受眾校準不能跳過**：沒有問受眾就輸出通用缺口清單，等於把 PM 的判斷責任搶過來做，這是錯的
- **缺口清單是空的時候不要填東西**：若受眾是「討論方向」，幾乎所有空洞都是允許的，不要為了顯得有用而製造假問題
- **不同受眾的 blocker 不同，不要混用**：技術考量對工程主管是 blocker，對產品總監通常不是，區別對待
- **Metrics 評分必須先判斷 Maturity**：直接用 L2 或 L3 標準評 L1 草稿，會把整份 PRD 評到 <50%，誤導 PM 以為文件很差。先看 PRD 階段，再選評分標準
- **AC 內未驗證的數字門檻要扣分**：「2 秒」「99.9% uptime」等具體數字未標 `[待確認門檻]` 時，要降為 [缺口]，避免報告把「捏造數字」當「完整 AC」放行
- **Unknown Register 與正文要對得起來**：正文有 5 個 `[待確認]`，Unknown Register 只列 3 個，就是 [缺口]，必須補

---

## HTML Placeholder 填充規則

`assets/report-template.html` 使用 `{{PLACEHOLDER}}` 標記。填充時逐一替換：

### 基本資訊
| Placeholder | 填入內容 |
|-------------|---------|
| `{{FEATURE_NAME}}` | 功能名稱（從 PRD 文件資訊取得） |
| `{{DATE}}` | 今天日期，格式：YYYY-MM-DD |
| `{{COMPLETION_PCT}}` | 完成度百分比數字（整數，如 `72`） |
| `{{COMPLETION_LABEL}}` | 對應等級文字：`Ready for review` / `In progress` / `Needs more input` |
| `{{BADGE_CLASS}}` | 對應 CSS class：`badge-green` / `badge-yellow` / `badge-red` |
| `{{PROGRESS_CLASS}}` | 對應 CSS class：`progress-green` / `progress-yellow` / `progress-red` |
| `{{PENDING_COUNT}}` | 待確認項目總數（整數） |

### PRD 章節
| Placeholder | 填入內容 |
|-------------|---------|
| `{{PRD_BACKGROUND}}` | 背景章節內容，純文字或含 `<br>` 換行 |
| `{{PRD_GOALS}}` | 每個目標一行 `<li>目標內容</li>` |
| `{{PRD_OUT_OF_SCOPE}}` | 每個項目一行 `<li>項目</li>`，若無則填 `<li>本次未定義</li>` |

### User Stories
| Placeholder | 填入內容 |
|-------------|---------|
| `{{USER_STORIES_P0}}` | P0 Stories HTML，使用下方 Story Card 格式 |
| `{{USER_STORIES_P1}}` | P1 Stories HTML，同上格式；若無則填 `<p class="empty">本次未定義 P1 Story</p>` |

**Story Card HTML 格式：**
```html
<div class="story-card">
  <div class="story-header">
    <span class="priority-badge p0">P0</span>
    <span class="story-title">Story 標題</span>
  </div>
  <div class="story-body">
    As a [who], I want to [what], so that [why].
  </div>
  <div class="ac-label">Acceptance Criteria</div>
  <div class="ac-item">Given [條件] When [動作] Then [結果]</div>
  <!-- 缺少 AC 時改用： -->
  <div class="ac-item" style="color: var(--orange);">[缺 AC]</div>
</div>
```

### Metrics
| Placeholder | 填入內容 |
|-------------|---------|
| `{{METRICS_ROWS}}` | 每個 Metric 一行 `<tr>`，使用下方格式；若無則填一行 `<tr><td colspan="6" style="color:var(--text-muted);font-style:italic">本次未定義 Metrics</td></tr>` |

**Metrics Row HTML 格式（L2 欄位範例）：**
```html
<tr>
  <td>指標名稱</td>
  <td>分子內容</td>
  <td>分母內容</td>
  <td>滾動 7 天</td>
  <td>[待確認門檻]</td>
  <td>BigQuery</td>
</tr>
```
若某欄位為空或待確認，填：`<td><span class="hl-yellow">[待確認]</span></td>`

**L1 階段的 Metrics**：表格改用 L1 欄位（主指標 / 行為假設 / 商業結果 / 失敗訊號 / 護欄理由），不要硬塞 L2 欄位然後全部標 `[待確認]`。

### 開放問題
| Placeholder | 填入內容 |
|-------------|---------|
| `{{OPEN_QUESTIONS_ROWS}}` | 每個問題一行 `<tr>`；若無則填 `<tr><td colspan="4" style="color:var(--text-muted);font-style:italic">本次無開放問題</td></tr>` |

**Open Question Row HTML 格式：**
```html
<tr>
  <td>問題描述</td>
  <td>負責人 或 <span class="hl-yellow">[待指定]</span></td>
  <td>截止日 或 <span class="hl-yellow">[待定]</span></td>
  <td>未解決</td>
</tr>
```

### 待確認項目
| Placeholder | 填入內容 |
|-------------|---------|
| `{{PENDING_ITEMS}}` | 每個項目使用下方格式；若無則填 `<p class="empty">本次無待確認項目</p>` |

**Pending Item HTML 格式：**
```html
<div class="pending-item">
  <div class="pending-num">#1</div>
  <div class="pending-content">
    <div class="pending-text"><span class="hl-yellow">[待確認]</span> 具體內容描述</div>
    <div class="pending-source">來源：PRD Section 2 — 目標與指標</div>
  </div>
</div>
```
