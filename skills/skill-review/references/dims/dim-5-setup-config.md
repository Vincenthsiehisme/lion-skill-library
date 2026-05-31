# Dim 5 — Setup & Config

本維度判斷 skill 是否需要使用者、專案或環境設定，以及它是否能在缺少設定時優雅啟動。不要把「沒有 config」直接扣分；先判斷這個 skill 是否真的需要 config。

---

## 先判斷是否適用

| Skill 類型 | 對 setup/config 的期待 |
|---|---|
| 純 review / 寫作 / 分析 | 多數可標 N/A，除非需要固定輸出偏好、團隊規範或外部路徑 |
| Data / monitoring / API skill | 通常需要資料源、環境、帳號、project id 或 endpoint 設定 |
| Team automation | 通常需要頻道、專案、收件人、模板或儲存位置 |
| Local tool / script wrapper | 至少要說明依賴、路徑、權限與 first-run 檢查 |
| Scaffold / template skill | 可能需要預設框架、命名規則、repo layout 或輸出位置 |

**N/A**：skill 不需要使用者特定設定，且沒有外部系統、固定路徑、憑證、偏好或環境依賴時，排除 Overall 分母。

---

## Hard Gate

- SKILL.md 要求使用不存在的固定路徑、工具或設定檔，且沒有替代路徑。
- 指令要求讀取憑證、token、private key，卻沒有安全處理方式。
- 缺少必要設定會導致寫入、刪除、寄送、部署等高風險操作作用到錯誤目標。
- 要求把敏感設定寫入 skill package 本身，導致升級、分享或版本控管時外洩。

---

## Quality Gate

- 需要設定，但沒有 first-run 行為：缺值時不知道要問使用者、使用預設值，還是停止。
- 沒有說明設定欄位、格式、範例、儲存位置或讀取時機。
- 每次執行都要求使用者重複提供同一批資訊。
- 將環境依賴寫在散落段落，沒有集中成 setup/config contract。
- 沒有區分「必要設定」與「可選偏好」。

---

## Style / Heuristic

以下只能作建議，不應單獨擋 ship：

- 是否一定命名為 `config.json`。
- setup section 是否固定叫 `## Setup`。
- 設定檔格式是 JSON、YAML 還是 Markdown。
- 是否使用固定範本或固定欄位排序。

---

## Score Rubric

**Score 5 — Excellent**
- 明確說明是否需要設定；需要時列出必要 / 可選設定。
- 有 first-run 行為：缺值時詢問、提示或安全停止。
- 說明設定儲存位置，且不把敏感資訊放進 skill package。
- 對缺值、錯值、環境不存在有明確錯誤處理。

**Score 4 — Good**
- setup/config 大致清楚，缺值時多半能處理。
- 少數欄位或錯誤處理不完整，但不會造成高風險誤動作。

**Score 3 — Acceptable**
- 有提到設定需求，但格式、儲存位置或 first-run 行為偏模糊。
- 需要人工補判斷，但一般情境仍可用。

**Score 2 — Weak**
- 明顯需要設定，卻只零散提到依賴或路徑。
- 缺值時容易卡住或反覆追問。

**Score 1 — Poor**
- 明顯依賴使用者 / 專案 / 外部系統設定，但完全沒有 setup/config contract。
- 可能把操作導向錯誤目標或造成敏感資訊風險。

---

## Reviewer 判讀問題

- 這個 skill 是否真的需要使用者或環境設定？若不需要，標 N/A。
- 哪些設定是任務必需，哪些只是偏好？
- 缺少設定時，skill 會問、會停、還是會猜？
- 設定是否可能包含敏感資料？儲存方式是否安全？
- 是否把固定路徑、帳號、project、repo、channel 寫死？

---

## 常見誤判

- **誤判 1：沒有 `config.json` 就扣分。** 正確判斷是：是否有穩定 setup contract，而不是檔名是否固定。
- **誤判 2：純 review skill 被要求有 setup。** 若任務不依賴個人或環境設定，應標 N/A。
- **誤判 3：把敏感設定寫入 skill 目錄當成成熟。** skill package 可能被分享或升級覆蓋，敏感資訊不應放在包內。
