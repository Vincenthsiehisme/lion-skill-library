---
name: skill-brain
description: |
  Skill 規劃階段的釐清顧問。當使用者想做一個新 skill、把某個重複工作流 skill 化、或描述了一個重複工作模式但沒說「skill」時觸發。產出輕量 intent 文件（problem + trigger + boundary）並掃描與既有 skill 的可能重疊。

  觸發關鍵字：我想做一個 skill、這個工作流要不要 skill 化、skill 邊界在哪、會不會跟 XX skill 重疊、值不值得做 skill、skill 的 trigger 怎麼定、幫我想 skill、skill 構想、這個情境適合 skill 嗎、這要不要包成 skill。

  DO NOT trigger for: 要審既有 skill（用 skill-review）、要動筆寫 SKILL.md（用 skill-create）、要為 skill 補對內 reference（用 skill-search）、要對外找 reference / GitHub repo / Anthropic 官方範例（用 skill-discovery）、要寫產品 PRD（用 prd-writer）、要做對話交接（用 session-handoff）、要沉澱單次踩坑（用 skill-summary）。
version: 0.1.0
category: planning
---

# Skill Brain — Skill 規劃釐清顧問

定位：skill 生命週期的**源頭階段**。在動筆寫 SKILL.md 之前，先把「要解什麼問題、誰會觸發、邊界在哪、會不會撞既有 skill」釐清。

不做：不寫 SKILL.md、不改既有 skill、不評分審查。

---

## Step 0：判斷使用者在哪個階段

每次對話開始，**先快速判讀使用者的清楚程度**，不必直接問（多數時候從訊息就看得出來），只在判讀不出時問一次：

> 「你對這個 skill 的構想，現在是哪一種？
> A）只有一個模糊的需求或工作流，還不確定要不要做 skill
> B）知道想做什麼 skill，要釐清邊界和觸發詞
> C）已經有初步草稿，只是想確認方向對不對」

| 回答 | 進入路徑 |
|---|---|
| A（模糊） | → **跑完所有四個維度**（problem → trigger → boundary → 重疊掃描） |
| B（方向清楚） | → **跳過 problem，從 trigger 開始** |
| C（有草稿） | → **只跑 boundary + 重疊掃描** |

**例外**：使用者直接貼出一段重複 prompt 或工作流描述，預設走 A。

---

## 核心流程：四個維度釐清

skill-brain 的工作是確認以下四個維度都已釐清。**不必按順序機械式提問**——從使用者既有訊息中能判讀的就直接判讀，缺什麼補什麼。每個維度的詳細展開、範例、判斷紅燈見 `references/four-dimensions-detail.md`。

### 維度 1 — Problem Statement

確認三件事已經釐清：
- **重複性**：這個任務發生頻率夠高嗎？（低於月 3 次的不該做 skill）
- **Baseline**：沒有 skill 時現在怎麼處理？
- **第一個具體場景**：做完之後第一次會用在哪？

**紅燈**：「以後可能用得到」「每次都不太一樣」「應該很簡單」——出現這類訊號回頭釐清，不往下走。詳見 references。

### 維度 2 — Trigger 邊界

確認三組觸發詞都已收集：
- **Hard trigger**（必觸發）：3–5 個，必須是 skill 獨有動詞
- **Soft trigger**（情境觸發）：2–5 個，附帶上下文條件
- **Anti-trigger**（看起來像但不該觸發）：2 個以上，特別是已 27 個 skill 的環境

某類想不出來本身就是訊號（想不出 hard 代表核心動詞不明確；想不出 anti 代表邊界沒想清楚）。

### 維度 3 — Boundary

寫出兩句話：
- **做**：一句話、動詞開頭、具體
- **不做**：點名 2–3 個最容易混淆的鄰居 skill 職責

「不做」不能寫「不做其他事」——那等於沒寫。

### 維度 4 — 重疊掃描

**這個維度是強制的**，使用者沒問也要做。掃 `/mnt/skills/user/` 所有 SKILL.md 的 frontmatter（只讀 name + description），列出與當前構想可能撞 trigger 或職責的 skill：

| 既有 skill | 重疊點 | 嚴重度 |
|---|---|---|
| `xxx` | trigger 詞 / 動詞 / 名詞重疊 | 🟢/🟡/🔴 |

**只列出，不主動判定 kill/merge/proceed**——處置權在使用者。判準與操作細節見 references。

**觀察判讀：領域新穎度**——重疊掃描完成後，若發現「當前構想與既有 user 層 skill 都不相似」（無 🟡 或 🔴），代表這可能是該領域的**第一隻** skill，brain 階段的對內參考素材不足。此時主動建議：「這領域我們沒先例，要不要走 `skill-discovery` 去對外找參考？」由使用者決定是否轉介，不強制。

---

## Step N：結論沉澱建議（brain 收尾前的一問）

四個維度釐清完、即將進入輸出規格之前，**問一句**：

> 「這次釐清過程中冒出來的洞見，要不要沉澱成 CONTEXT.md 或 ADR？」

判讀對話歷程，主動分類三類沉澱物：

### 類型 1 — CONTEXT.md（業務術語 / 共同語言）

如果對話中出現**只在團隊內部用、首次需要正式定義**的詞彙，建議寫進對應系統的 CONTEXT.md：

- 雄獅內部暱稱（「那個跨庫 bug」→ SD-GITA-003）
- 業務縮寫的正式對應（「璽品客」「玩樂369」等）
- 跨 Squad 共識的詞義（「上架」「成團」「出團」的精確定義）

**判讀訊號**：對話中重複出現 ≥3 次、跨 Squad 容易誤解、且字典系統還沒收錄的詞。

對應檔案位置（建議）：
- 單系統範圍 → `lion-codebase-atlas/<system>/CONTEXT.md`
- 跨系統範圍 → `lion-codebase-atlas/LION-CONTEXT-MAP.md` 加索引

### 類型 2 — ADR（架構決策紀錄，1-3 句格式）

如果對話中**做出一個非顯而易見的決定**且該決定符合三條件，建議寫成 ADR：

- 改變代價高（往後改要動到多個地方）
- 沒解釋會讓未來讀者困惑（半年後自己看會問「為什麼這樣決定」）
- 是真實 trade-off 的結果（不是「最佳方案」而是「在 X 限制下選 Y 放棄 Z」）

**格式狠到反直覺**——預設只寫 1-3 句：

```
# {短標題：決定了什麼}

{1-3 句：背景、決定、為什麼。完。}
```

Status / Considered Options / Consequences 段**只在真正需要時才加**。多數 ADR 一段話就結束。

**對應檔案位置**（建議）：`lion-codebase-atlas/<system>/adr/NNNN-<slug>.md`，編號流水。

### 類型 3 — 不沉澱（多數情況）

下列情境**不該**沉澱：

- 釐清過程只是讓使用者自己想清楚，沒新增團隊共識
- 結論是「沿用既有規範」，不需要新文件
- 結論專屬於這次 skill 構想，跟雄獅領域知識無關

**判讀紀律**：寧可少建檔也不要 over-document。Lazy creation 原則——第一個真實使用者需要查時才建檔。

### 銜接 session-handoff

如果對話結束時還有**正向發現**（不只是 skill intent），明示使用者：「這次的其他結論可以用 `session-handoff` 沉澱成交接文件。」

skill-brain 本身**不產出** CONTEXT.md / ADR / handoff——只**建議產出位置**。實際撰寫由使用者或下游 skill 負責。

---

## 輸出規格（雙交付物）

### 交付物 A：對話摘要

在對話最後直接渲染給使用者看，格式：

```
━━━━━━━━━━━━━━━━━━━━━━━
📋 Skill Intent 摘要

【做什麼】[一句話]
【不做什麼】[兩到三件]
【Hard trigger】xxx, xxx, xxx
【Anti-trigger】xxx, xxx
【可能重疊】xxx (🟡), xxx (🟢)
【沉澱建議】CONTEXT.md: N 個 / ADR: M 個 / 無
【建議下一步】交給 skill-create / 先 skill-search / 暫緩
━━━━━━━━━━━━━━━━━━━━━━━
```

### 交付物 B：`skill-intent.md` 檔案

寫到 `/home/claude/skill-intent-<skill-name>.md`，給 skill-create 機器讀。完整結構見 `references/intent-template.md`。

**兩者都要產出**——對話摘要給使用者人眼確認，檔案給下游 skill 機器讀，避免「寫了 intent 但你沒看內容」。

---

## 與其他 skill 的銜接

skill-brain 的職責是**規劃新 skill 本身**。一旦進入 skill-brain，前提是使用者已經確定要做 skill；本 skill 不處理「使用者其實要審既有 skill」「使用者其實要寫產品 PRD」這類觸發誤判，那是 description 觸發層該擋的事。

### 正向銜接（brain 完成後往下走）

| 情境 | 動作 |
|---|---|
| 對內 reference 不足（想找既有 user 層 skill 範例） | 呼叫 `skill-search`，補完再回來繼續 brain |
| 領域新穎，或使用者明示要對外找 reference / GitHub repo / Anthropic 官方範例 | 呼叫 `skill-discovery`，產出 external reference bundle 後再回來繼續 brain |
| intent 確認後 | 產出 `skill-intent.md` 交給 `skill-create`，附上檔案路徑 |
| 暫緩決定 | 把 `skill-intent.md` 標記為 `parked`，等使用者多踩幾次坑再回來 |

### Brain 內部不處理的事

下列情境不該進到 skill-brain 主流程，已在 description 的 DO NOT trigger 中排除：

- 要審既有 skill → 應走 `skill-review`
- 要為某個 skill 補對內 reference → 應走 `skill-search`
- 要對外找 reference / GitHub repo / Anthropic 官方範例 → 應走 `skill-discovery`
- 要直接動筆寫 SKILL.md → 應走 `skill-create`
- 要寫產品 PRD（不是 skill）→ 應走 `prd-writer`
- **連「這是不是 skill 該解的問題」都還不確定** → 建議先用 `prd-writer` 的模糊探索流程把問題探索清楚，再回來 brain。skill-brain 的前提是使用者已認定「這是 skill 的事」，不處理「這到底是不是 skill 的事」。

如果在 brain 對話中**才發現**使用者要的不是 skill，做法是：直接告知「這個需求不是 skill 範疇，建議改用 [對應 skill]」，然後**結束 brain 對話**。不要在 brain 內部接手非 skill 的需求。

---

## Gotchas

### G1：使用者描述的不是 skill 而是「一次性任務」
**症狀**：使用者貼了一個具體任務（「幫我把這份報告改成條列」），問「這要不要做 skill」。
**正確做法**：先問「這個任務你一個月會做幾次？」少於 3 次的不該做 skill。
**為什麼**：skill 的成本是寫 + 維護 + 觸發判讀，低頻任務直接用 prompt 比較划算。

### G2：重疊掃描只看 description 不看內文
**症狀**：兩個 skill description 看起來不重疊，但實際內文職責有大量重疊。
**正確做法**：description 看似不重疊但 trigger 詞有交集時，再深入讀內文確認。
**為什麼**：skill 觸發機制只看 description，但**職責重疊**會讓使用者搞不清該用哪個。

### G3：Hard trigger 列太抽象
**症狀**：使用者列「skill」「工具」「幫忙」當 hard trigger。
**正確做法**：要求 hard trigger 必須是**該 skill 獨有的動詞或場景詞**。
**為什麼**：通用詞會被所有 skill 搶觸發，等於沒設 trigger。

### G4：把 boundary 寫成「不做其他事」
**症狀**：「不做」清單寫「不做其他無關的事」。
**正確做法**：點名最容易混淆的 2–3 個鄰居 skill 的職責，明確排除。
**為什麼**：模糊的 boundary 等於沒 boundary，使用者和 Claude 都會在邊界上猶豫。

### G5：跳過重疊掃描直接進 create
**症狀**：使用者催「快點寫 SKILL.md」，brain 階段跳過維度 4。
**正確做法**：重疊掃描是強制步驟，最多濃縮成 30 秒（讀 frontmatter 即可），不能跳過。
**為什麼**：使用者已經 27 個 skill，跳過掃描容易做出第 28 個重複的。

### G6：沉澱建議混為一談或用錯格式
**症狀**：兩種模式——（a）建議使用者沉澱 ADR 時，附上完整 Context / Decision / Consequences / Status 範本；（b）建議把對話結論「都寫進 CONTEXT.md」，包含進度、開放問題、術語、決策。
**正確做法**：（a）ADR 預設 1-3 句格式（短標題 + 一段話），不附範本；（b）三類分流——CONTEXT.md 存**術語 / 共同語言**、ADR 存**決策 + 理由**、handoff 存**對話進度 + 開放問題**（走 session-handoff）。brain 只做分類建議，不附範本、不混類別。
**為什麼**：ADR 的價值是「記下有做過這個決定 + 為什麼」不是填表格；三類沉澱物用途不同（CONTEXT.md lazy 累積、ADR 一次性決定、handoff session 切片），格式對了 + 分流對了才會真的被產出和使用。
