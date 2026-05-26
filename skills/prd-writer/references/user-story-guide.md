# User Story Guide

## 前置步驟：讀取 Anchor

載入此文件後，先執行：
1. 搜尋對話中版本號最高的 `## Anchor vN`
2. 對照以下欄位，跳過已有答案的問診問題：

| Anchor 欄位有值 | 直接帶入的內容 |
|---------------|-------------|
| 目標使用者 | 所有 Story 的 `As a [who]` 直接用此定義，不重新問 |
| 功能範圍摘要 | 作為 Story 拆解的起點，不需再問「最重要的一件事是什麼」 |

3. Story 拆解完成後，更新 Anchor 的「功能需求」章節狀態和「功能範圍摘要」（若有調整）

---

## 格式

```
As a [具體的使用者角色],
I want to [具體的行為/功能],
so that [明確的業務價值/目的].
```

**Acceptance Criteria 格式（Given/When/Then）：**
```
Given [前置條件]
When [使用者動作]
Then [預期結果]
```

---

## 拆解方法

一個功能通常可以拆成以下幾類 Story：

1. **Happy Path**：正常流程下的主要行為
2. **Edge Case**：邊界情況（空資料、錯誤輸入）
3. **Permission / Role**：不同角色的行為差異
4. **Error Handling**：失敗時怎麼辦

---

## 常見錯誤

**反例：** `As a user, I want a dashboard` — 太模糊，沒有 why
**正例：** `As a content editor, I want to see today's article view count on the dashboard, so that I can adjust publishing strategy immediately`

**反例：** `As a user, I want the system to be fast` — 不是 story，是 NFR（非功能需求）
**正例：** 把效能需求放在 Acceptance Criteria 裡：`Then the page loads within [待確認門檻]`（或 `Then the page meets the agreed performance threshold [待工程確認]`）

**重點**：AC 內若出現具體數字門檻（如「2 秒」「500ms」「99.9%」），必須來自 SLA / SLO / design system / 工程確認，否則一律改 `[待確認門檻]` 或 `[待工程確認]`，不得自行給數字。

---

## Ticket 拆解原則

每個 ticket 應該：
- 可以在 1–3 天內完成
- 有獨立的 value（不是「後端 API」這種半成品）
- 有明確的 done criteria

**拆太大的訊號：** Story point > 8、需要超過一個人、無法單獨 demo

---

## 完成標準

一則 User Story 算「完成」需滿足以下全部條件。
**Guided Mode：每寫完一則，對照一次，然後輸出狀態快照等待 PM 回應，不自動繼續下一則。**
**Draft Mode：一次拆完所有 Story，缺口統一進入 Unknown Register，不逐則停。**

- [ ] Story 本體包含 who / what / why 三個元素，缺一不完整
- [ ] 至少 1 條 AC，格式為 Given / When / Then
- [ ] Happy Path 的 AC 已涵蓋（正常流程走完的預期結果）
- [ ] 若功能涉及不同角色或權限，有對應的 Permission story
- [ ] 若功能有錯誤情境（網路失敗、空資料、權限不足），有對應的 Error Handling AC
- [ ] AC 內若含數字門檻，已標記為 `[待確認門檻]` 或 `[待工程確認]`（除非來源明確）

**快照格式（Guided Mode 限定，每則 Story 輸出後使用）：**
```
─────────────────────────────
Story [N] 完成：[Story 標題]

完整度：
[達標]：[達標項目]
[缺口]：[缺口描述]（[若影響後續才給建議理由]）
[未填]：[項目]

→ A) 現在補  B) 標記待補，繼續下一則  C) 直接繼續
─────────────────────────────
```

PM 選 C 代表有意識跳過，之後不再提醒同一個缺口。
Draft Mode 不出快照，缺口直接寫入 PRD 的 Unknown Register。

---

## 覆蓋度檢查（一個功能寫完幾則才夠）

寫完所有 Story 後，對照以下清單確認覆蓋度。
**不是每個功能都需要全部類型，但每個類型的「需要嗎？」都要問過。**

| Story 類型 | 需要嗎？ | 判斷方式 |
|-----------|---------|---------|
| Happy Path | 永遠需要 | 正常流程走完的主要行為，至少 1 則 |
| Edge Case | 看情況 | 有空資料、邊界值、異常輸入的情境就需要 |
| Permission / Role | 看情況 | 有超過 1 種角色看到不同內容就需要 |
| Error Handling | 幾乎總是需要 | 有網路請求、資料寫入、第三方依賴就需要 |
| Empty State | 常常被遺漏 | 第一次使用、資料為空時使用者看到什麼 |
| Non-functional（NFR） | 看情況 | 效能、無障礙、國際化需求，寫進 AC 而非獨立 Story |

**覆蓋度不足的訊號：**
- 只有 1 則 Story 就完成了整個功能 → 通常代表 edge case 沒寫
- 所有 Story 都是 Happy Path → Error Handling 和 Empty State 被跳過
- Story 數量超過 8 則 → 功能可能太大，考慮拆成兩個功能

**寫完後主動問使用者：**
「這個功能有沒有不同角色（如管理員 vs 一般用戶）看到不同內容？有沒有需要處理空資料或錯誤的情境？」
