# Dim 8 — Context Efficiency / Existence Value

每個已安裝 skill 都會帶來常駐 description 成本；每次觸發也會帶來 SKILL.md 與 references 的載入成本。本維度評估成本是否值得，而不是單純追求越短越好。

---

## Existence Value Flag（不直接計分）

不要只問「Claude 沒 skill 是否也能做 70%」。這太主觀。改用四個證據判斷：

| 證據 | 說明 |
|---|---|
| 內部知識 | 是否包含 Claude 不會知道的流程、標準、環境、路徑、限制？ |
| 失敗沉澱 | 是否沉澱真實或高可信的錯誤案例與防錯規則？ |
| 可驗收格式 | 是否提供固定輸出格式、檢查表、rubric 或驗收標準？ |
| 可重用資產 | 是否有 scripts、templates、references、assets 可降低重工？ |

若四項都很弱，才標：

> ⚠️ **存在合理性偏低**：此 skill 主要重述 Claude 本來就能做的事，缺少內部知識、失敗沉澱、可驗收格式或可重用資產。建議評估是否合併、下架，或補強成真正有價值的 skill。

此 flag 不直接扣 Overall，但會影響 ship 判定與改善建議。

---

## Cost Layers

### Layer 1 — Description 常駐成本

- 必須 < 1024 byte，這是 hard gate。
- 理想上只保留觸發、邊界與必要轉交。
- 長度沒有固定字數硬規則；只問每句是否幫助模型判斷「何時用」。

### Layer 2 — SKILL.md 觸發成本

保留每次觸發都需要的內容：核心流程、輸出格式、gate、gotchas。把偶發細節放到 references。

### Layer 3 — References 按需載入

References 要有明確載入條件。不要在 SKILL.md 中要求每次讀完整 reference library。

---

## Score Rubric

**Score 5 — Excellent**
- Description 精簡且高訊號。
- SKILL.md 只放每次必需內容。
- References 有清楚 load conditions。
- 存在價值明確，至少兩項 existence evidence 很強。

**Score 4 — Good**
- 成本大致合理，少數段落可下放。
- References 載入條件大致清楚。
- 存在價值可被說明。

**Score 3 — Acceptable**
- 有些常駐或觸發內容偏胖，但不致嚴重浪費。
- 存在價值中等，需要再補失敗沉澱或 reusable assets。

**Score 2 — Weak**
- SKILL.md 混入大量偶發背景或長例子。
- References 缺少載入條件。
- 存在價值偏弱，像一般提示詞包裝。

**Score 1 — Poor**
- Description 違反 hard gate，或 SKILL.md/reference 載入策略嚴重失控。
- 幾乎沒有可證明的 skill 存在價值。

**N/A**：極少使用。只有在使用者明確要求審查大型 runbook / ops corpus，且高載入成本是任務本質時，才可 N/A，並需說明理由。

---

## Reviewer 判讀問題

- [ ] description 每句是否都服務於觸發判斷？
- [ ] SKILL.md 是否只保留每次觸發都需要的內容？
- [ ] references 是否有按需載入條件？
- [ ] 此 skill 是否至少具備一項強 existence evidence？
- [ ] 若 token 成本高，是否由任務風險或複雜度合理支持？
