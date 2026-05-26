---
name: prd-writer
version: 0.1.0
category: planning
tags:
  - prd
  - PM
  - product-management
  - opportunity
description: |
  Use for structured product planning output: PRD drafting, user story breakdown, KPI/metrics definition, competitive analysis, or roadmap planning. Trigger on: 寫PRD, 需求文件, 拆user story, 定義KPI, 定義指標, 競品分析, roadmap, 產品規劃, feature spec, 寫需求, 對主管提案, 跨部門說明, 提案文件, 主管要看的 PRD.

  **也在以下模糊階段觸發**:「這個問題值不值得解」「幫我探索這個機會」「我有個想法但不知道從哪開始」「問題定義書」「HMW」「這個值不值得做」「用戶一直反映 X 但我不知道根本原因」。

  DO NOT trigger for: general product chat, technical architecture discussion, code review, or one-line questions about product concepts.
---

# PRD Writer（含模糊探索前置階段）

---

## Global Execution Contract

本 skill 只有兩種執行模式。所有 reference 文件的規則都必須對齊本契約，與本契約衝突時以本契約為準。

### Draft Mode（預設）

一次輸出完整草稿，不逐章停、不每則 Story 停、不每個 Metric 停。
所有缺口以 `[待確認]`、`[從對話推斷，待確認]`、`[待工程確認]`、`[待數據確認]`、`[待確認門檻]` 標記，並同步進入 Unknown Register。
最後只輸出一次「校準清單」與 Unknown Register。

### Guided Mode

只有使用者明示下列訊號時啟用：「一步步來」「逐章討論」「guided」「慢慢來」「一段一段寫」「先寫第 X 章」。
此模式才允許每章輸出 Status Snapshot 並等待 A / B / C 回應。

### Reference 規則優先序

若 reference 文件出現「輸出後停下來」「等待 A / B / C」等規則，**僅在 Guided Mode 生效**。
Draft Mode 一律不得逐章停，改為在全文輸出後統一列入校準清單。

---

## Metrics Maturity

PRD 初稿預設停在 L1。除非使用者明示要進入工程量測或埋點規格階段，否則不要求 L2 / L3。

### L1：指標假設聲明（PRD 初稿預設層級）

需要包含：
- 主指標方向
- 對應的行為假設
- 預期影響的商業結果
- 失敗訊號（可觀察的具體訊號）
- 護欄選擇理由

**不要求**：event_name、baseline、分子、分母、SQL、目標門檻、追蹤工具。

### L2：量測定義（進入工程 / 數據交付時才需要）

需要包含：
- 分子
- 分母
- 時間窗口
- 追蹤來源
- baseline 狀態（已建立 / 待建立 / 無歷史數據）

### L3：埋點 / 數據規格（資料交付階段）

需要包含：
- event_name
- parameters
- data owner
- dashboard / query
- QA 驗證方式

**評分對齊**：build-report 的 Metrics 評分依當前 maturity 套用對應標準，不得用 L3 標準評 L1 草稿。

---

## Problem Maturity

Metrics 有 L1/L2/L3 成熟度，問題本身也有。PM 進來時對問題的清楚程度，決定該交付什麼——不是「都寫一份 PRD，差別只在 `[待確認]` 多寡」。

| P 級 | PM 能講出什麼 | 該交付物 | 寫 PRD 嗎 |
|---|---|---|---|
| **P0 訊號級** | 老闆說要做 X / 客服一直反映 / 看到競品做了 | 訊號筆記 | 否（**硬擋**） |
| **P1 問題級** | 使用者在 X 情境下做不到 Y | Problem Definition Canvas | 否（**硬擋**） |
| **P1.5 部分機會級** | P1 + 部分機會證據（規模未量化） | Brief（草稿狀態） | 否（**軟擋警告**） |
| **P2 機會級** | 問題 + Why now + **影響規模有具體數字 / 範圍** | Opportunity Brief（確認狀態） | 可寫，**軟擋警告** |
| **P3 方案級** | 3 條 FR + 目標用戶 + Why now | PRD 草稿 | 正常寫 |
| **P4 拍板級** | FR + AC + Delivery Fit 齊 | sprint PRD | **跳出本 skill，走 prd-spec** |

### 止損規則

- **P0 / P1 硬擋**：本 skill 不寫 PRD 章節，只產上位交付物。詳見 Blocking Input Policy 第 6 條
- **P1.5 / P2 軟擋警告**：可寫 PRD，但動筆前先輸出警告區塊讓 PM 看到風險。詳見「成熟度警告」段
- **P3 正常寫**：但若 PM 自評 P3 而對話訊號顯示更低，需走 Layer 3 反向驗證（見 Step 0）
- **P4 跳出**：建議轉用 prd-spec

### 判讀責任

Claude 判讀 P 級，**不是 PM 自評**——但允許 PM 在 Step 0 互動選項中提供自陳。判讀 P 級的依據：對話訊號 + 互動選項回答 + 反向驗證結果。

短路情境（使用者明示「不要問」/ 對話 ≥ 15 輪 / 帶結構化結論進入）下，跳過互動選項，由 Claude 從訊號自判 P 級——**短路不免除判讀責任**。

---

## Blocking Input Policy

Draft Mode 不因一般資訊不足而停止。一般缺口一律標記 `[待確認]` 並繼續產出。

**只有以下情況可以先問一題，不得直接產出**：

1. 使用者要求寫 PRD，但完全沒有提供功能 / 問題 / 對象。
2. 使用者要求競品分析，但沒有提供任何競品名稱、截圖、描述或可讀來源。
3. 使用者要求 roadmap，但沒有提供任何待排序項目。
4. 使用者要求 metrics，但沒有提供功能或行為目標。
5. 使用者要求輸出報告（build_report），但沒有可整理的既有內容。
6. **成熟度硬擋**：成熟度判讀為 **P0 / P1** 時，本 skill **不寫 PRD 章節**，改為產上位交付物：
   - **P0** → 訊號筆記（走 `references/problem-definition.md` 從 Step 1 開始）
   - **P1** → Problem Definition Canvas（走 Step 3-5）

   此擋**無法用 `[待確認]` / Unknown Register 解套**——再多 `[待確認]` 也救不了一份沒有問題定義的 PRD。

   **例外**：使用者在 Layer 3 反向驗證中明示「直接寫」拒絕驗證 → 標註「P3 未驗證」進 Unknown Register，PRD 章節照寫。但這不適用 P0 / P1——P0 / P1 連反向驗證的入場券都沒有。

   話術範本見 Gotcha「P0/P1 硬擋的擋下話術」。

**除上述情況外，不得因為缺少 baseline、owner、人天、技術細節、設計稿而停止。**
這些內容應進入 Unknown Register。

---

## 成熟度警告（軟擋）

成熟度判讀為 **P1.5** 或 **P2** 時，動筆寫 PRD 前先輸出警告區塊（不擋，但 PM 必須看到）。

### P1.5 警告範本

> ⚠️ 你的成熟度判讀為 **P1.5**——已有問題定義，但機會證據不完整（影響規模待估算）。
>
> 可以寫 PRD，但這個缺口會：
> - 進 Unknown Register 作為 U1 blocker
> - Section「目標」與「成功指標」會大量出現 `[待確認門檻]`
> - 之後接 prd-spec 時，V8 Delivery Fit 大機率不可判
>
> 建議先補規模估算（5 分鐘訪談 / 客服資料盤點 / 簡單 SQL），或在心裡有準備地強寫。

### P2 警告範本（軟擋更輕）

> ✓ 你的成熟度為 **P2**——可以寫 PRD。Brief 的問題陳述、目標用戶、影響規模會直接帶進來，前面相關問診跳過。
>
> 進 metrics 細節後仍會問具體指標。

### 軟擋紀律

- 警告輸出後**直接接寫 PRD**，不打斷流程
- 警告**不取代** Unknown Register——警告是給 PM 看的，Unknown Register 是給後續處理用的
- 警告**不重複輸出**——同一份 PRD 內只警告一次
- P0 / P1 不走軟擋警告，走 Blocking Input Policy 第 6 條的**硬擋**

---

## No Fabrication Policy

不得自行產生以下內容：

- 數字門檻（如「2 秒」「500ms」「99.9%」）
- baseline 數字
- conversion rate / 留存率 / 點擊率等具體數字
- SLA / SLO 門檻
- 人天估算
- 技術架構（具體 service 名稱、雲服務選型）
- API / DB schema
- 權責 owner（具體姓名 / 部門）
- 競品功能現況（未提供來源時）
- 法規或資安要求（具體條文）

**僅在下列來源出現時才可填入**：

1. 使用者明確提供
2. 既有文件明確提供
3. 已知公司標準 / SLA / design system 明確規定
4. 已執行查詢或分析得到（且來源可標註）
5. stakeholder 已決策

**否則一律標記為下列之一**：

- `[待確認]`
- `[待工程確認]`
- `[待數據確認]`
- `[待確認門檻]`
- `[從對話推斷，待確認]`

並進入 Unknown Register。

---

## Step 0：判斷現在在哪個階段

本 skill 不問「PM 自評清楚程度」，而是用三層機制判讀成熟度：訊號短路 → 互動選項 → 反向驗證。

### Layer 1：訊號短路（Claude 從訊號自判 P 級）

若下列任一條件成立，**跳過 Layer 2 互動選項**，由 Claude 從對話訊號自判 P 級：

| 短路訊號 | 判讀方式 |
|---|---|
| **使用者明示** | 「不要再問，直接寫」「別問了」「skip questions」「直接出 PRD」 |
| **對話歷史已長** | 當前對話 ≥ 15 輪、且使用者已多次描述問題與目標 |
| **從上游結構化結論帶 context 過來** | 使用者帶著已具備問題陳述、目標用戶、規模、指標假設的結構化結論進入（含 Brief / Canvas） |
| **使用者貼出已成形的問題定義** | 訊息含 HMW 陳述、目標用戶、影響規模量化 |

**短路時的動作**：
1. 一句話 acknowledge：「跳過互動選項，從訊號判讀成熟度」
2. **Claude 從對話訊號判 P 級**——對應證據要明確（哪句話對應哪個欄位）
3. 進入對應 P 級的後續流程：
   - P0 / P1 → 硬擋，走模糊探索（仍要走，短路不免除硬擋）
   - P1.5 / P2 → 軟擋警告 + 寫 PRD
   - P3 → 進 Layer 3 反向驗證才正式寫
4. **在 Unknown Register 標註「成熟度為從訊號推斷，待 PM 校準」**

**短路是功能權衡**：用「省一輪對話」換「可能推斷錯」。**短路不免除成熟度判讀**——詳見 Gotcha「短路時的成熟度判讀責任」。

---

### Layer 2：互動選項（PM 自陳，但 Claude 仍會驗證）

無短路訊號時，問這一題（只問一次）：

> 現在對這件事的清楚程度是？
>
> **A）我有訊號或初步想法**：老闆指派 / 客服反映 / 看到競品做了，但講不清楚要解決什麼問題
> **B）我講得出問題**：使用者在 X 情境下做不到 Y，但不確定值不值得解、影響規模多大
> **C）我講得出機會**：問題 + Why now + 影響規模我都有，要開始規劃功能
> **D）我講得出方案**：3 條以上 FR / 目標用戶 / Why now 都齊了，要直接寫 PRD

**路由**：

| 回答 | 判 P 級 | 後續動作 |
|---|---|---|
| A | P0（部分為 P1） | 走 `references/problem-definition.md` 從 Step 1 開始；**不寫 PRD**（硬擋） |
| B | P1 | 走 `references/problem-definition.md` 從 Step 3 開始；**不寫 PRD**（硬擋） |
| C | P2（或 P1.5） | 走 `references/opportunity-brief.md`；Brief 完成後寫 PRD（軟擋警告）|
| D | P3（待驗證） | **進 Layer 3 反向驗證**才正式寫 PRD |
| 沒選 | 預設 A | 從最保守起跳，省得 P 級判錯 |

**例外**：使用者明示「寫 PRD」「拆 user story」「定義 KPI」等具體任務 → 視為 Layer 1 短路情境（明示），Claude 從訊號判 P 級，不問選項。

---

### Layer 3：反向驗證（PM 選 D 或 Claude 判 P3 時）

PM 在 Layer 2 選 D（或 Layer 1 短路時 Claude 判為 P3），**動筆寫 PRD 前先驗證一次**。話術：

> 好。在動筆寫 PRD 前，先把這 3 件事列一下：
>
> 1. **3 條核心 FR**（這個功能至少要做的 3 件事）
> 2. **目標用戶**（一句話描述：誰，在什麼情境下使用）
> 3. **Why now**（為什麼是現在做，不是 3 個月後）
>
> 列得出來 → 直接進 PRD 主流程。
> 列不出來 → 降到 C，走 Opportunity Brief 把問題陳述跟機會評估補齊，反而比硬寫 PRD 省事。

**驗證結果處置**：

| 驗證結果 | P 級確認 | 後續 |
|---|---|---|
| 3 件全列出 | P3 確認 | 進 PRD 主流程 |
| 列得出 1-2 件，1 件含糊 | 降為 P2 | 走 Brief 補齊缺項，再回頭寫 PRD |
| 列不出來 / 列出的內容是解法描述（非 FR） | 降為 P1.5 | 走 Brief，且明示「先前自評偏 D，實際為 P1.5」 |
| 拒絕驗證，明示「直接寫」 | 標 **P3 未驗證** | 強寫但進 Unknown Register 並標註「P3 未驗證，預期 ≥ 3 條 blocker」 |

**重要**：反向驗證不是審查 PM——選的權力給 PM，驗證的權力留給 Claude。話術要中性、不諷刺，**不要說「真的嗎？」「你確定嗎？」**這類質疑語氣。

---

## 模糊探索流程（Fuzzy Front End）

> 適用：問題還不清楚、機會還沒評估、不知道從哪開始。

### 判斷子路徑

| 使用者狀態 | 載入的 reference |
|-----------|----------------|
| 「有訊號但不知道問題是什麼」 | `references/problem-definition.md` |
| 「知道問題但不確定值不值得解」 | `references/opportunity-sizing.md` |
| 「我要做 X 功能」「老闆說要做 Y」（帶著解法進來） | `references/solution-first.md` |
| 「老闆指派方向，想確認框架」 | `references/solution-first.md` |
| 「完全不確定，從頭開始」 | 先 `problem-definition.md`，完成後 `opportunity-sizing.md` |

### 模糊探索的輸出

兩個子路徑都有各自的中間產出（Problem Definition Canvas / Opportunity Snapshot），最終收斂到：

**Opportunity Brief** → 載入 `references/opportunity-brief.md`

### 從模糊探索跳到 PRD Writer

Opportunity Brief 完成後，詢問 PM：

> 「Opportunity Brief 完成了。要繼續開始寫 PRD 嗎？Brief 的問題陳述和目標用戶可以直接回答 PRD 主流程的前兩個問診問題，不需要重填。」

若 PM 說是 → 帶著 Brief 的資訊進入下方的 **PRD Writer 主流程**，自動跳過重複的問診問題。

---

## PRD Writer 主流程

### 1. 檢查 Anchor

搜尋對話中是否存在 Anchor Statement（格式為 `## Anchor vN`）。

- **有 Anchor** → 讀取版本號最高的那個，帶入後續所有任務
- **沒有 Anchor** → 正常從問診開始，第一個階段完成後初始化 Anchor v1

**如果剛從模糊探索流程過來**，把 Opportunity Brief 的內容視為 Anchor 的初始資料，不要重問已有答案的問題。

### 2. 確認任務類型，載入對應 reference

| 任務 | 載入的文件 |
|------|-----------|
| 寫 PRD | `references/prd-template.md` |
| 拆 User Story / Ticket | `references/user-story-guide.md` |
| 定義 Metrics / KPI | 先 `references/metrics-hypothesis.md`，問診後 `references/metrics-guide.md` |
| 競品分析 | `references/competitive-analysis.md` |
| Roadmap 規劃 | `references/roadmap-guide.md` |
| 不確定 / 全面規劃 | 載入全部五個 |
| build_report | `references/build-report.md` |
| 每次輸出章節後（Guided Mode 限定） | `references/status-snapshot.md` |
| 每個階段完成後 | 輸出更新的 Anchor（見 `references/anchor.md`） |
| 首次對話、無 Anchor 時 | `references/anchor.md` |

### 3. 詢問 context

依 Brief 帶入狀態與成熟度走三條分支：

**分支 A：從 Brief 帶入（成熟度 P2 / Brief 狀態 = 確認）**

跳過已有答案的問診問題，直接從問診的第 4 題（或對應 metrics 細節題）開始。Brief 內容自動填入：
- 問題陳述 → PRD 「背景」欄位
- 目標用戶 → PRD 「目標用戶」欄位
- 影響規模 → PRD 「目標」欄位起點
- 待確認假設 → Unknown Register 初始項

**分支 B：從 Brief 帶入但狀態 = 草稿（成熟度 P1.5）**

先輸出 P1.5 軟擋警告（見「成熟度警告」段），再跳過已填欄位、仍問影響規模相關問題。

**分支 C：無 Brief，且使用者只說「幫我寫 PRD」但沒說功能是什麼**

先問一題（屬於 Blocking Input Policy 第 1 條的合法停止）：

> 「這個功能主要解決什麼問題？目標使用者是誰？」

拿到答案後直接進入 prd-template 的問診流程，不要再問第二輪。

**重要**：若成熟度判讀為 P0 / P1，不會走到本段——已被 Blocking Input Policy 第 6 條硬擋，改去走 problem-definition.md。

### 4. 收尾與銜接工程規格

PRD 草稿完成、PM 校準完開放問題、Unknown Register 收斂後，**主動詢問是否需要轉成工程規格**。

判斷訊號：

- 使用者明示「要交給工程了」「下個 sprint 要做」「拍板了」「準備發包」→ 直接給銜接提示
- PRD 內 `[待確認]` 已收斂、開放問題已關閉、AC 與 Story 已完整、Unknown Register 無 blocker → 主動詢問
- PRD 還在反覆改、開放問題未解、metrics 仍是 L1 假設 → 不催銜接，留在本 skill

銜接提示（逐字輸出，不得簡化或省略；可按使用者語境調整稱呼）：

> **下一步：準備進 sprint 了嗎？**
>
> 這份 PRD 適合用來對主管或跨部門說明需求。
> 如果需求已經拍板、準備交給工程師執行，建議使用工程規格 skill 產出薄 PRD——
> 補上邊界 Case、驗收標準（AC）、Delivery Fit 驗算，讓 RD/QA 拿到就能動。
>
> 只要明示「要進工程規格」就可以開始。

**重要差異**：本 skill 的 AC 是 user story 層級（Given/When/Then），工程規格 skill 的 AC 是 sprint 交付層級（誰驗 / 怎麼驗 / 在哪驗 / 怎樣算通過）。從本 skill 帶過去的 AC 是參考輸入，不是最終版——工程規格 skill 會根據 sprint 交付紀律重新組裝。

---

## Output Principles

- **語言**：繁體中文，除非使用者要求英文
- **格式**：Markdown，可直接貼到 Notion / Confluence / GitHub
- **長度**：PRD 完整展開；User Story 一個功能 3–5 則；Metrics 明確列出層級（L1 / L2 / L3）
- **不捏造**：遵守 No Fabrication Policy
- **執行模式**：遵守 Global Execution Contract（預設 Draft Mode，明示才進 Guided Mode）

### Status Snapshot 適用範圍

Status Snapshot（見 `references/status-snapshot.md`）**僅在 Guided Mode 啟用**。

Guided Mode 下每次輸出章節、Story 或 Metric 後，必須：

1. 輸出狀態快照
2. 等待 PM 回應 A / B / C
3. 根據回應決定下一步

Draft Mode 下不出 Status Snapshot，改為在全文輸出後統一附上 Unknown Register 與校準清單。

**PM 的回應決定節奏，不是本 skill 自行判斷。**

### 校準回應的處理

若 PM 未回應校準問題，**不得視為正式確認**。
下次延續時，沿用本次草稿作為工作版本，但所有 `[待確認]` 與 `[從對話推斷]` 仍維持未確認狀態。

---

## Unknown Register

所有 `[待確認]`、`[從對話推斷，待確認]`、`[待工程確認]`、`[待數據確認]`、`[待確認門檻]` 都必須同步進入 PRD 末段的 Unknown Register 章節。
不能只散落在正文。

格式：

| 編號 | 未知項目 | 類型 | 目前處理方式 | 對決策的影響 | 建議確認對象 | 是否阻擋下一步 |
|---|---|---|---|---|---|---|
| U1 | [未知項目描述] | 產品 / 技術 / 數據 / 權責 / 時程 | 暫以 [本次假設] 推進 | 影響 P0 scope / AC / 指標 / 估時 | PM / RD / QA / Data | 是 / 否 |

---

## Gotchas

**模糊探索階段**
- **把解法當問題**：PM 說「我想做推薦功能」→ 先問「推薦功能要解決什麼問題？」，不接受解法作為問題陳述
- **問題太大無法操作**：「用戶不夠黏」是症狀，不是問題定義。追問到具體行為場景
- **跳過 evidence 直接結論**：問題的嚴重程度必須有數據或訪談佐證
- **HMW 太廣或太窄**：「HMW 讓用戶更快樂」太廣；HMW 應該有具體情境但仍有設計空間

**PRD 撰寫階段**
- **PRD 滑移成 Tech Spec**：使用者提到「資料庫」「API」時，強制標記 `[待工程確認]`，PRD 開頭加「本文件為產品需求，技術實作另見 Tech Spec」
- **Metrics 沒有 L1 假設就跳 L2**：PRD 初稿應停在 L1（假設聲明）。除非使用者明示要進 L2，否則不問分子分母。違反此條等於把 PRD 拉成工程量測規格
- **目標值自行估算**：「合理目標通常是 baseline 的 110–130%」這類通用比例**不得**用來自行估算目標。目標值必須來自歷史 baseline、業務目標、SLA / SLO、實驗設計或 stakeholder 決策，缺料就標記 `[待確認門檻]`
- **User Story 沒有 AC**：每則 Story 至少一條 Given/When/Then 才算完成
- **AC 內出現未驗證的數字門檻**：例如「Then the page loads within 2 seconds」——若無 SLA / SLO / 工程確認來源，必須改為 `[待確認門檻]` 或 `[待工程確認]`
- **競品分析變通用摘要**：只用使用者提供的資料，不足標記 `[需補充來源]`，不捏造
- **Roadmap 沒定義 horizon**：先問 Now/Next/Later 各幾個月，再排優先級

**Unknown Register**
- **散落 `[待確認]` 不集中**：每出現一個未知標記就要同步寫入 Unknown Register。PM 看不到集中清單，等於不知道有哪些缺口會擋下一步
- **把通用未知當 blocker**：Unknown Register 的「是否阻擋下一步」要實事求是，不是每個缺口都 blocker

**短路模式（Step 0 直接跳主流程）**
- **短路不附校準清單**：使用者明示「不要問直接寫」，本 skill 推斷一通就 ship，沒列「需要 PM 校準」清單與 Unknown Register。短路是「省一輪對話」不是「省掉校準責任」——產出後**必須**列出關鍵推斷讓 PM 確認
- **短路訊號誤判**：對話才 5 輪、context 還不足，本 skill 看到「直接寫」就短路。判讀紀律：短路需要**滿足條件**（明示 / 對話 ≥ 15 輪 / 上游帶 context / 已有 HMW 陳述），單純「我想趕快寫」不算短路訊號，這時要禮貌反問「願意先回答兩個關鍵問題嗎？只要 2 分鐘」
- **短路後又開始問釐清問題**：短路宣告完，卻在 PRD 中段又冒出來問「目標用戶到底是誰」。短路就是短路——不確定的資訊全部標 `[從對話推斷，待確認]` 或 `[待 PM 確認]`，不在中段反悔

**成熟度判讀（P0-P4）**
- **PM 自評偏 D / 高估成熟度**：PM 在 Layer 2 選 D（方案級），但對話訊號明顯是 P1（沒有 Why now、目標用戶含糊），本 skill 照寫 PRD 就出爛草稿。**正確做法**：Layer 3 反向驗證——「請列出 3 條 FR、目標用戶、Why now」，列不出來自動降 C。**選的權力給 PM，驗證的權力留給 Claude**。話術要中性不諷刺，不要說「真的嗎？」「你確定嗎？」
- **Unknown Register 不是萬用免責**：成熟度判 P0/P1 還是強寫 PRD，所有空格塞 `[待確認]`、Unknown Register 列 12 條 blocker，自我感覺良好覺得「有標記就 ok」。**正確做法**：Unknown Register 只能補**單點未知**（baseline 數字、owner 姓名、技術細節），不能補**整體未定義**（沒有問題陳述、沒有目標用戶、沒有 Why now）。P0/P1 是「整個問題還沒被定義」，沒有任何單點標記能補救——必須走 Blocking Input Policy 第 6 條硬擋
- **短路時的成熟度判讀責任**：使用者說「不要問」，本 skill 跳過互動選項，**同時也跳過成熟度判讀**直接照寫。**正確做法**：短路只跳過 Layer 2 互動選項，**不跳過 P 級判讀**——Claude 仍從對話訊號自判 P 級，並在 Unknown Register 標註「成熟度為從訊號推斷，待 PM 校準」。「不要問」是要求效率，不是要求免檢——短路 PRD 若推斷錯級別，PM 拿到還是要退稿

**P0/P1 硬擋的擋下話術**
擋下時話術要溫和但不退讓。以下範本（PM 進來說「我想做一個推薦功能」，Claude 判 P0）：

> 你描述的訊號是「我想做推薦功能」，但這是解法，不是問題。**寫 PRD 前需要先回答：要解決什麼問題？誰會遇到？怎麼判斷有解？**
>
> 建議先做一份**訊號筆記**：
> - 為什麼想做推薦？是老闆指派、客服反映、還是看到競品？
> - 誰會遇到「沒有推薦」這件事？他們現在怎麼處理？
> - 有沒有具體數據（CTR / 轉換率 / 客服票）支持這是個問題？
>
> 訊號筆記做完後，如果問題定義清楚了，可以直接跳 P2 寫 PRD——不會重來。如果發現其實不該做推薦，也省下了寫一份白寫 PRD 的時間。

**擋話術的紀律**：
- 不誇大時間承諾（不寫「10 分鐘搞定」「3 分鐘就好」這類）
- 不質疑 PM 智商（不寫「你確定嗎」「真的想清楚了嗎」）
- 給具體下一步動作，不只說「你還沒準備好」
- 結尾不過度討好——「要開始嗎？」不寫，因為訊號筆記是 P0 必經之路，不是選項


**銜接工程規格**
- **每次寫完 PRD 就無腦催銜接**：PRD 才出 v0.1 草稿、開放問題還一堆、metrics 是 L1 假設、`[待確認]` 滿天飛，本 skill 就丟出銜接提示。這違反 Step 4 的判斷訊號——「PRD 還在反覆改 / 開放問題未解」就不催銜接。**只在使用者明示拍板、或 PRD 收斂到可發包狀態時才提**，把銜接當成 graduation，不是 PRD 寫完的固定 footer
- **把本 skill 的 AC 當工程規格的 AC 直接交付**：Story 的 Given/When/Then 是行為描述，工程規格要的是「誰驗 / 怎麼驗 / 在哪驗 / 怎樣算通過」的交付驗收路徑——兩者格式相近但用途不同。銜接時要明說「AC 是參考輸入」，避免 PM 誤以為 PRD 帶過去就能直接發包

---

## Reference Files

**模糊探索（Fuzzy Front End）**
- `references/problem-definition.md` — 訊號收集 → 根本原因分析 → HMW 收斂
- `references/opportunity-sizing.md` — 機會評估框架（真實性 / 影響範圍 / 策略連結）
- `references/solution-first.md` — 解法假設拆解 → 還原問題陳述 → 判斷是否需重新定義
- `references/opportunity-brief.md` — Opportunity Brief 模板、完成門檻、銜接 PRD 主流程邏輯

**PRD 撰寫**
- `references/prd-template.md` — PRD 問診流程 + 各章節完成門檻
- `references/user-story-guide.md` — User Story 格式、拆解方法、覆蓋度檢查
- `references/metrics-hypothesis.md` — L1 指標假設聲明：OKR 連結、假設透明、護欄邏輯
- `references/metrics-guide.md` — L2/L3 量測定義、baseline 建立（僅在使用者明示進工程量測時載入）
- `references/competitive-analysis.md` — 競品分析框架、功能矩陣、差異化洞察
- `references/roadmap-guide.md` — Now/Next/Later 框架、Impact vs Effort 矩陣
- `references/build-report.md` — 受眾校準、品質評分（依 Metrics Maturity 分層）、三種格式輸出
- `references/anchor.md` — Anchor 機制：跨階段共享 context、版本號規則
- `references/status-snapshot.md` — 狀態快照格式與品質門檻（**僅 Guided Mode 啟用**）

**Assets**
- `assets/prd-blank.md` — 空白 PRD 模板
- `assets/report-template.md` — Markdown 報告模板
- `assets/report-template.html` — HTML 報告模板

---

## 版本迭代

PRD 需要更新時（使用者說「更新 PRD」「這個要改」「工程說做不到」）：

1. 先問清楚變更範圍
2. 版本號遞增：v0.1 → v0.2
3. 標記變更：`> v0.2 更新：[一句話說明]`
4. 保留歷史：舊內容加刪除線 `~~舊內容~~`，新內容寫在下方
5. 開放問題同步：已解決的標記 `[已解決]`
6. 更新 Anchor：加入改動記錄，受影響欄位加 `←更新`
7. 更新 Unknown Register：已確認的條目移除或標記 `[已確認]`

**版本狀態**：`草稿` → `審閱中` → `確認` → `v[N] 修訂`

**Gotcha**：使用者說「改一下」但沒說改哪裡 → 先列章節摘要，問「要更新哪個章節？」，不猜。
