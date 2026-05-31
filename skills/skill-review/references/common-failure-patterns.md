# Common Failure Patterns 快查表

這份檔案用來快速辨識常見高風險模式，但不要把所有 pattern 都自動判成 ship-blocker。先判斷它屬於 Hard Gate、Quality Gate 或 Style / Heuristic。

---

## Pattern 1：Description 寫給人看，不是給模型觸發用

**症狀**：description 像產品說明文，沒有使用者情境、任務詞、輸入物或邊界訊號。

**Gate 層級**：Quality Gate；若完全無法判斷觸發情境，升為 Hard Gate。

❌ Bad:

```text
A helper for the billing module.
```

✅ Good:

```text
當使用者要處理發票、退款、proration、Stripe webhook 或計費邏輯排查時使用。Do NOT: 一般後端架構 review 轉 code-review。
```

**對應 dim**：dim-1。

---

## Pattern 2：Gotchas 是空話或缺 guardrail

**症狀**：Gotchas 全是「請小心」「注意邊界」「保持一致」；或高風險操作沒有防呆。

**Gate 層級**：

- 一般 skill：Quality Gate。
- 會寫入、刪除、部署、寄送、修改外部狀態的 skill：可升為 Hard Gate。

Gotchas 不一定都要來自已發生事故；新 skill 可用高可信預期風險起步，但必須具體、可操作、可驗證。

**對應 dim**：dim-2。

---

## Pattern 3：過度 Railroading

**症狀**：把所有任務都寫成 Step 1 → Step 2 → Step 3，且不允許因使用者情境調整。

**Gate 層級**：Quality Gate；若步驟導致危險或不可逆操作，升為 Hard Gate。

不要反射性懲罰所有 step-by-step。Runbook、部署、驗證、資料修復、批次處理類 skill 本來就需要順序；問題在於是否把「推理判斷」寫死。

**對應 dim**：dim-4。

---

## Pattern 4：單檔扁平化且內容過胖

**症狀**：所有流程、範例、背景、模板、API docs 都塞進 SKILL.md，沒有 `references/`、`assets/` 或 `scripts/` 分層。

**Gate 層級**：Quality Gate。若 SKILL.md 很小、任務單純，沒有子檔不一定是問題。

Skill 是資料夾不是單檔，但也不代表每個 skill 都必須硬拆子目錄。重點是常駐/每次觸發/偶發載入是否分得開。

**對應 dim**：dim-3、dim-8。

---

## Pattern 5：有狀態 skill 沒有穩定儲存策略

**症狀**：skill 需要記錄歷史、設定、索引或使用者偏好，卻把檔案寫在 skill 目錄下，升級時可能遺失。

**Gate 層級**：Quality Gate；若遺失狀態會造成錯誤操作或資料破壞，升為 Hard Gate。

正確做法通常是用 `${CLAUDE_PLUGIN_DATA}` 這類穩定使用者資料位置，並在 SKILL.md 說明記錄什麼、為何記錄、何時讀寫。

**對應 dim**：dim-7。

---

## Pattern 6：腳本存在但不可執行或引用錯路徑

**症狀**：SKILL.md 要求執行 `./scripts/foo.sh`，但檔案不存在、沒有 executable permission，或路徑與實際結構不一致。另一種假陽性是把 `scripts/lib/` helper、fixtures、templates 也當作入口 script 要求 executable。

**Gate 層級**：入口 script 缺失或不可執行是 Hard Gate；helper/lib 沒有 executable permission 通常不是問題，只需確認可讀與被正確引用。

這不是風格問題，而是執行時會直接失敗。應先修檔案路徑與入口權限，再談語意品質；但也不要把輔助檔的權限誤判成 ship-blocker。

**對應 dim**：dim-6。

---

## Pattern 7：把 conflict 初篩當最終判決

**症狀**：只因兩個 skill 重疊幾個詞，就判定必須合併或不可 ship。

**Gate 層級**：Style / Heuristic 或 Quality Gate；只有在任務、輸入、輸出與職責都高度重疊時，才升為 Hard Gate。

衝突判斷要看：

```text
同詞是否同任務？
同任務是否同輸入？
同輸入是否同輸出？
若都相近，是否有明確轉交與 Do NOT？
```

**對應 dim**：dim-1、conflict script。

---

## 與 dim 檔的分工

| 檔案 | 用途 | 何時讀 |
|---|---|---|
| 本檔案 | 快速辨識常見 failure pattern 與 gate 層級 | 全面審查、特定診斷時併讀 |
| `dims/dim-N-*.md` | 分等級評分，提供 1–5 / N/A 細節 | 依 Step 0 對照表選讀 |

原則：先確認 gate 層級，再給分數與建議。不要因為看見 pattern 名稱就直接判不可 ship。
