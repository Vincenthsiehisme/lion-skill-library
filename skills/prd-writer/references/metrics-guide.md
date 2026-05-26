# Metrics Guide（L2 / L3 量測規格）

**載入時機：** 在 `metrics-hypothesis.md`（L1 假設聲明）完成後，且使用者明示要進入工程量測或埋點規格階段時才載入。
PRD 初稿預設停在 L1，不應該載入本文件填分子分母。

## 前置步驟：讀取 Anchor

載入此文件後，先執行：
1. 搜尋對話中版本號最高的 `## Anchor vN`
2. 若 Anchor 有「目標使用者」欄位，直接用來確認各指標的分母定義（不重新問）
3. 若 Anchor 有「主假設」，確認現在要定義的指標與假設聲明一致
4. 定義完成後，更新 Anchor 的「主指標」欄位（若尚未填入）

---

## 四層指標框架

### 1. 北極星指標（North Star Metric）
整個產品只有一個。反映核心價值交付。
範例：「每週活躍創作者數」、「每月完成訂單數」

### 2. 驅動指標（Input Metrics）
直接影響北極星的行為指標，PM 日常追蹤用。
範例：「新功能採用率」、「Day-7 留存率」

### 3. 護欄指標（Guardrail Metrics）
**確保主指標改善的同時，沒有犧牲最關鍵的副作用。**
護欄指標的選擇邏輯來自 `metrics-hypothesis.md` 的「護欄選擇理由」。
沒有在假設聲明中說明理由的護欄，不應該出現在這裡。

範例：「客訴率 ≤ [待確認門檻]」、「任務完成時間 ≤ 現況基準」

### 4. 診斷指標（Diagnostic Metrics）
出問題時用來 debug，不需要每天看。
範例：「步驟 2 的 drop-off rate」

---

## L2 量測定義：定義一個好的 Metric

每個 L2 指標必須包含以下全部欄位：

| 欄位 | 說明 | 常見錯誤 |
|------|------|---------|
| **分子** | 數什麼，精確到 event name 或欄位 | 「使用功能的用戶數」→ 要精確到 `event_name = 'X'` |
| **分母** | 除以什麼 | 「所有用戶」→ 要說是 active users / logged-in users / trial users |
| **時間窗口** | 日 / 滾動 7 天 / 月 | 「最近」→ 要精確到幾天 |
| **追蹤方式** | BigQuery / GA4 / mParticle，精確到 event_name | 「系統會記錄」→ 要說是哪個系統的哪個 event |
| **目標值** | 上線後第幾週達到多少（需要 baseline 數字） | 「提升 30%」→ 30% 是從多少提升到多少 |
| **指標類型** | 北極星 / 驅動 / 護欄 / 診斷 | 同時列多種類型 → 一個指標只屬於一種類型 |

**完整範例（欄位齊全，數字來自 stakeholder 決策）：**
```
指標名稱：個人化設定完成率
指標類型：驅動指標
分子：上線後 7 天內完成個人化設定的 unique users
分母：同期完成註冊的 unique users
時間窗口：滾動 7 天（以註冊日為起點）
追蹤方式：BigQuery，event_name = 'onboarding_personalization_complete'
Baseline：[待數據確認] — 需跑過去 30 天歷史
目標值：[待確認門檻] — baseline 建立 + stakeholder 決策後填入
```

---

## L3 埋點 / 數據規格

進入資料交付階段時補上：

- `event_name`：明確命名
- `parameters`：每個欄位的型態、是否必填、可能值
- `data owner`：誰負責維護 event schema
- `dashboard / query`：上線後在哪看
- `QA 驗證方式`：如何確認 event 有真的被打、欄位有真的填對

L3 不在 PRD 初稿範圍。除非使用者明示要產資料規格，否則不要求。

---

## Leading vs Lagging

| 類型 | 特性 | 範例 | 觀察時間 |
|------|------|------|---------|
| Leading（領先） | 快速反饋，行為訊號 | 功能點擊率、設定完成率 | 上線後 1–2 週可看到 |
| Lagging（落後） | 真正的商業結果 | 訂閱轉換率、D30 留存 | 上線後 4–8 週才有意義 |

**兩者的關係：**
Leading 指標告訴你假設的方向對不對（行為有沒有改變），Lagging 指標告訴你假設的商業結果有沒有實現。

如果 Leading 指標動了但 Lagging 沒有動，代表假設的中間連結是錯的。
這正是 `metrics-hypothesis.md` 裡「失敗訊號」要預先定義的原因。

---

## L2 完成標準

**Guided Mode：每定義完一個指標，對照一次，然後輸出狀態快照等待 PM 回應，不自動繼續下一個指標。**
**Draft Mode：一次定義完所有指標，缺口統一進入 Unknown Register，不逐個停。**

- [ ] L1 指標假設聲明已完成（`metrics-hypothesis.md` 的問診已跑過）
- [ ] 分子精確到 event name 或資料欄位
- [ ] 分母不是「所有用戶」等模糊說法，有明確的用戶群定義
- [ ] 時間窗口精確到天數
- [ ] 追蹤方式精確到系統名稱 + event_name 或查詢邏輯
- [ ] 有 baseline 數字，或明確標記 `[待數據確認]` 並說明建立路徑
- [ ] 目標值是絕對數字（從 X% 到 Y%）或明確標記 `[待確認門檻]`
- [ ] 護欄指標的選擇理由已在假設聲明中說明

**快照格式（Guided Mode 限定，每個指標輸出後使用）：**
```
─────────────────────────────
Metric 完成：[指標名稱]

完整度：
[達標]：[達標項目]
[缺口]：[缺口描述]（[若影響後續才給建議理由]）
[未填]：[項目]

→ A) 現在補  B) 標記待補，繼續下一個指標  C) 直接繼續
─────────────────────────────
```

PM 選 C 代表有意識跳過，之後不再提醒同一個缺口。
Draft Mode 不出快照，缺口直接寫入 PRD 的 Unknown Register。

---

## Baseline 不存在時的處理

「提升 X%」不是完整目標值，需要有 baseline 數字才能換算。

若 baseline 未知，給使用者明確的兩步驟：

1. **確認追蹤方式**：event_name 或 BigQuery 查詢語法已確定，確認 event 有在被記錄
2. **上線前建立 baseline**：跑過去 30 天歷史數字，記錄現況

**依追蹤工具的 baseline 建立方式：**
- BigQuery：`SELECT COUNT(DISTINCT user_id) FROM events WHERE event_name = 'X' AND date >= DATE_SUB(TODAY(), INTERVAL 30 DAY)`
- GA4：Custom Report → 選 event_name，設時間範圍為過去 30 天
- mParticle：確認 event schema 已定義，跑 data plan 確認覆蓋率，再用 API 查歷史數量

**Baseline 建立後才能設目標值。**

---

## 目標值（target value）設定原則

目標值**必須**來自下列來源，否則一律標記 `[待確認門檻]`：

1. 歷史 baseline + 業務目標（例：本季 OKR 要求轉換率達 X%）
2. SLA / SLO（例：頁面載入時間契約門檻）
3. 實驗設計（例：A/B 測試的 MDE 設定）
4. stakeholder 決策（例：產品總監拍板「Q4 完成率要過 50%」）

**不得**使用通用比例（如「baseline 的 110–130%」「激進目標 150%」）自行估算目標值。
通用比例是一種沒有來源的假數字，會誘導 PM 把猜測當決策。

在 baseline 確認前，目標值欄位填 `[待確認門檻]`，並在 Unknown Register 標註「需要 baseline + stakeholder 決策」，不要填估計值。
