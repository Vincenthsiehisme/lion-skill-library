# Dim 2 — Gotchas Section

Gotchas 是 skill 中最高訊號的防錯內容。它應該捕捉 Claude 在此任務中容易犯的錯，而不是一般性的提醒。

---

## Hard Gate

通常不因缺 Gotchas 單獨擋 ship，除非該 skill 涉及高風險操作且沒有任何 guardrail，例如：

- 會寫入、刪除、覆蓋或發送外部資料。
- 會產生不可逆部署、資安、金流、郵件或排程行為。
- 會處理隱私、憑證、權限或敏感檔案。

這類 skill 若沒有 Gotchas / Guardrails，列為 🔴 Critical Issue。

---

## Quality Gate

- Gotchas 是空話：「請小心」「注意邊界」「保持一致」。
- 只有抽象原則，沒有症狀、正確做法、原因。
- Gotchas 跟本 skill 任務無關，只是通用 AI 使用提醒。
- 多個 Gotchas 重複同一件事，沒有收斂。

新 skill 可以先用「高可信預期風險」作為初版 Gotchas，但要具體到可操作，並在實際使用後用真實失敗案例補強。

---

## Score Rubric

**Score 5 — Excellent**
- 有 dedicated `## Gotchas`。
- 每條都有症狀、正確做法、原因。
- 多數來自真實失敗案例，或是高可信且具體的預期風險。
- 能明確降低誤觸發、錯誤輸出或危險操作。

**Score 4 — Good**
- Gotchas 具體可操作，但部分仍可補真實案例。
- 覆蓋主要風險，沒有明顯空話。

**Score 3 — Acceptable**
- 有 Gotchas，但部分偏籠統。
- 能提醒方向，但不一定足以防止錯誤。

**Score 2 — Weak**
- Gotchas 很少，或大多是一般性提醒。
- 缺少「症狀 / 正確做法 / 為什麼」。

**Score 1 — Poor**
- 沒有 Gotchas，且任務明顯需要防錯。
- Gotchas 幾乎全是空話，無法改變模型行為。

**N/A**：非常小、純提示型、無狀態且無風險的 skill，可標 N/A，但需說明理由。

---

## Reviewer 判讀問題

- [ ] Gotchas 是否對應此 skill 的真實任務風險？
- [ ] 是否具備「症狀 / 正確做法 / 為什麼」？
- [ ] 是否能防止 Claude 犯具體錯誤？
- [ ] 若是新 skill，預期風險是否足夠具體，而非空話？
- [ ] 是否有高風險操作卻缺 guardrail？
