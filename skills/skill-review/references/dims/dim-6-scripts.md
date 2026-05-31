# Dim 6 — Scripts & Code

本維度判斷 script 是否把「可機械化、可重複、可驗證」的工作穩定化，而不是要求每個 skill 都必須有 scripts。沒有程式化需求時，標 N/A；有程式化需求但沒有工具支援時，才扣分。

---

## 先判斷是否適用

| Skill 類型 | 對 scripts/code 的期待 |
|---|---|
| 純策略 / 寫作 / 溝通 | 多數可標 N/A |
| Review / Audit | 可用 script 做機械檢查，但語意判斷仍需人工 |
| Data / API / 批次處理 | 通常應有 reusable helper 或查詢模板 |
| Product verification | 通常應有可執行驗證腳本與 pass/fail criteria |
| Deployment / ops | 必須有 guardrail、dry-run、確認點與錯誤處理 |
| Scaffold / template | 可用 assets/scripts 產生一致骨架 |

**N/A**：skill 沒有程式化、查詢、批次、驗證或工具包裝需求時，排除 Overall 分母。

---

## Hard Gate

- SKILL.md 明確要求執行的 script 不存在或不可執行。
- script 執行會寫入、刪除、寄送、部署或改外部狀態，但沒有 guardrail、dry-run、confirm 或範圍限制。
- script 使用硬編碼危險路徑、憑證或環境，可能導致錯誤目標被修改。
- script 沒有錯誤處理，失敗時仍可能輸出成功訊號。
- 入口 script 依賴 helper/lib，但 package 沒有包含或路徑錯誤。

---

## Quality Gate

- 有 script，但 SKILL.md 沒說何時用、怎麼用、輸入輸出是什麼。
- script 只覆蓋玩具案例，真實情境仍要每次重寫。
- script 混合太多職責，難以測試與維護。
- helper/lib、fixtures、templates 被當作入口 script，導致權限與驗證規則混亂。
- script 輸出不可解析，難以放進 review report 或下一步判斷。

---

## Style / Heuristic

以下只能作建議，不應單獨擋 ship：

- script 是否使用 Bash、Python、JS 或其他語言。
- helper 是否放在 `scripts/lib/`、`lib/` 或其他目錄。
- 是否每支 helper 都有 executable permission。
- 註解或 docstring 的風格是否完全一致。

---

## Score Rubric

**Score 5 — Excellent**
- 將 deterministic work 放進 script/helper，讓模型專注語意判斷。
- 入口、helper、fixtures 分工清楚；只有入口需要 executable。
- SKILL.md 清楚說明使用時機、參數、輸出與錯誤碼。
- 高風險操作有 dry-run / confirm / scope guard / rollback 或安全停止。
- script 可重複執行，輸出穩定且可貼進報告。

**Score 4 — Good**
- script 可用且大致穩定，少數輸出格式或錯誤處理可改善。
- helper 結構合理，但文件稍不足。

**Score 3 — Acceptable**
- 有基本 script 或 code snippet，可降低重複工作。
- 真實情境仍需要模型補一些 glue code。

**Score 2 — Weak**
- 有 script 但過窄、脆弱或未文件化。
- 使用者或模型仍常需要重新寫相似邏輯。

**Score 1 — Poor**
- 明顯需要程式化驗證 / 查詢 / 批次處理，卻完全沒有可重用 code。
- 或 script 存在但不可執行、危險、結果不可信。

---

## Reviewer 判讀問題

- 這件事是否真的需要 script？若不需要，標 N/A。
- script 是入口、helper、fixture，還是 template？驗證規則是否分開？
- SKILL.md 是否告訴模型何時執行、何時不要執行？
- 輸出是否能被人類 review，也能被下一步流程引用？
- 是否有高風險操作？若有，guardrail 是否足夠？

---

## 常見誤判

- **誤判 1：沒有 scripts 就扣分。** 純判斷、寫作或 reference skill 可以是 N/A。
- **誤判 2：scripts/ 底下所有檔案都必須 executable。** 只有入口 script 或 SKILL.md 明確要求執行的檔案需要 executable；helper/lib/fixtures 只需可讀。
- **誤判 3：有 script 就加分。** script 若不穩、危險或無文件，反而是 hard/quality issue。
