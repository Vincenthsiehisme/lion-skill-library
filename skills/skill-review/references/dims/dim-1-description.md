# Dim 1 — Description / Trigger

Description 是模型判斷「是否要載入這個 skill」的主要訊號。本維度不審固定格式，而是審觸發有效性、誤觸發風險與職責邊界。

---

## Hard Gate

以下任一命中，Dim 1 最高只能給 1–2 分，且通常是 ship-blocker：

- `description` 缺失或不是字串。
- `description` >= 1024 byte，可能被平台拒收。
- description 完全看不出使用情境，只剩人類摘要。
- 觸發範圍明顯涵蓋其他已存在 skill，且沒有任何分工、轉交或 anti-trigger 說明。

---

## Quality Gate

以下是高價值改善點，但不一定擋 ship：

- trigger 情境太抽象，例如「幫助處理資料」「改善工作效率」。
- 只有能力描述，沒有使用者會怎麼問、什麼任務會觸發。
- trigger 太窄，使用者換一種自然說法就可能不觸發。
- anti-trigger / Do NOT 只寫空話，沒有說明該交給誰或不處理什麼。
- description 塞入大量背景、流程或理念，增加常駐成本但不幫助觸發。

---

## Style / Heuristic

以下只作建議，不可單獨作為 ship-blocker：

- 觸發詞不是 8–12 個。
- description 不是 8–12 行。
- 沒使用固定句型「當 X 時觸發」。
- Do NOT 沒有剛好點名 2–5 個鄰居。
- 觸發詞使用頓號、分號、英文逗號或 bullet。

---

## Score Rubric

**Score 5 — Excellent**
- 明確說出使用者情境、任務與觸發訊號。
- 能處理同義問法，不依賴單一關鍵字。
- 職責邊界清楚，與鄰近 skill 有可理解的分工。
- 常駐資訊精簡，幾乎都服務於觸發判斷。

**Score 4 — Good**
- trigger 大致明確，但仍可補幾個常見使用者問法。
- 邊界可理解，但 Do NOT 或轉交邏輯可以更具體。
- description 稍長或稍短，但不影響載入或判斷。

**Score 3 — Acceptable**
- 可以看出 skill 用途，但觸發情境偏概括。
- 可能 under-trigger 或和鄰近 skill 有輕度模糊。
- 需要人工從 SKILL.md 正文補理解。

**Score 2 — Weak**
- 像人類摘要，不像模型觸發訊號。
- 任務、輸入、輸出或邊界混在一起，模型難以判斷何時使用。
- 容易與其他 skill 搶觸發或互相漏接。

**Score 1 — Poor**
- 缺 description、超過平台限制，或幾乎無法判斷觸發情境。
- 明顯造成錯誤觸發 / 不觸發，且沒有可接受的補救訊號。

---

## Reviewer 判讀問題

- [ ] description byte 是否 < 1024？
- [ ] 使用者用自然語言描述需求時，模型是否知道要用這個 skill？
- [ ] 是否包含任務詞、場景詞或輸入物訊號？
- [ ] 是否能區分「使用這個 skill」與「轉給其他 skill」？
- [ ] Do NOT / anti-trigger 是否真的降低誤觸發，而不是形式填空？
- [ ] description 中的每句話是否有助於觸發判斷？若否，是否應移到 SKILL.md 正文或 references？

---

## 常見誤判

### 誤判 1：沒有固定模板就扣重分
錯。固定模板只是寫作輔助。只要模型能穩定判斷觸發時機，就不應因句型不同而重扣。

### 誤判 2：沒有 DO NOT 就一定不可 ship
錯。若 skill 沒有明顯鄰居，或正向邊界已足夠清楚，可列為改善而非 ship-blocker。只有在實際存在高重疊鄰居且缺乏分工時，才升為 critical。

### 誤判 3：觸發詞越多越好
錯。過多常見詞會造成 over-trigger。應重視「高辨識度任務詞」與「使用者自然問法」的組合。
