# Dim 7 — Memory / State

本維度判斷 skill 是否需要跨次記住狀態、歷史、設定、索引或使用者偏好，以及它是否使用穩定、安全、可維護的儲存策略。不要把「沒有 memory」直接扣分；先判斷任務是否真的有 stateful 需求。

---

## 先判斷是否適用

| Skill 類型 | 對 memory/state 的期待 |
|---|---|
| 一次性 review / 改寫 / 分析 | 多數可標 N/A |
| Weekly recap / standup / recurring report | 通常需要記錄歷史、上次摘要或對照基準 |
| User/team automation | 可能需要偏好、頻道、專案、模板與執行紀錄 |
| Data monitoring / alert review | 可能需要 baseline、已處理事件、例外清單 |
| Index / knowledge skill | 可能需要索引版本、來源快照與更新時間 |

**N/A**：skill 每次都能只靠當前輸入與 package references 完成，不需要跨次狀態時，排除 Overall 分母。

---

## Hard Gate

- skill 明確需要跨次狀態才能避免錯誤操作，但沒有任何儲存策略。
- 將重要狀態寫入 skill package 內，升級或重裝會遺失，且遺失會造成錯誤執行。
- 儲存敏感資料但沒有說明範圍、用途、保護方式或刪除方式。
- 狀態過期仍被當成最新真相，可能導致錯誤決策或外部寫入。

---

## Quality Gate

- 需要記住歷史或偏好，但沒有說明資料結構、更新時機與讀取時機。
- 沒有區分 durable memory、temporary cache、run log。
- 沒有處理狀態不存在、版本不相容、資料過期或格式壞掉。
- 沒有說明何時該忽略舊狀態，以避免 stale context 污染新任務。

---

## Style / Heuristic

以下只能作建議，不應單獨擋 ship：

- 是否固定使用 `${CLAUDE_PLUGIN_DATA}` 這個變數名稱。
- memory section 是否固定叫 `## Memory`。
- 狀態檔是否採 JSON、YAML、SQLite 或 Markdown。
- 是否每次都輸出 memory 更新摘要。

---

## Score Rubric

**Score 5 — Excellent**
- 明確判斷哪些資訊需要持久化，哪些不需要。
- 使用穩定、package 外的使用者資料位置儲存狀態。
- 說明資料結構、讀寫時機、過期策略與錯誤恢復。
- 不把敏感資訊或過期狀態無限制帶入新任務。

**Score 4 — Good**
- 有穩定儲存位置與基本讀寫規則。
- 過期、版本或錯誤恢復說明略不足，但主要風險可控。

**Score 3 — Acceptable**
- 有 state concept，但結構或生命週期不完整。
- 一般情境可用，長期維護可能累積問題。

**Score 2 — Weak**
- 明顯需要狀態，卻只口頭提到「記錄」或「參考上次」。
- 儲存位置、格式與更新規則不清。

**Score 1 — Poor**
- stateful skill 完全沒有 memory/state 策略。
- 或狀態儲存方式會造成資料遺失、外洩、過期誤用。

---

## Reviewer 判讀問題

- 這個 skill 是否真的需要跨次狀態？若不需要，標 N/A。
- 狀態是 durable memory、cache、run log，還是 user preference？
- 狀態儲存位置是否會因 skill 升級被覆蓋？
- 是否需要過期時間、版本號、來源快照或重建機制？
- 舊狀態是否可能污染新任務？有沒有忽略或重置規則？

---

## 常見誤判

- **誤判 1：所有 skill 都要 memory。** 一次性 review / analysis skill 不需要記憶時應標 N/A。
- **誤判 2：有 run log 就等於有 memory。** log、cache、preference、baseline 是不同狀態類型，需要不同規則。
- **誤判 3：把狀態存在 skill 目錄就算完成。** package 內資料可能在升級、分享、重新安裝時遺失或外洩。
