---
name: skill-search
description: |
  Skill 範例搜尋與模式萃取顧問。**只在本機三層 skill 庫(user > examples > public)內搜尋**——當使用者在規劃或撰寫 skill 時缺乏範例參考、不確定某個段落該怎麼寫、想找類似 skill 的結構模式，或被 skill-brain / skill-create 主動呼叫補料時觸發。

  觸發關鍵字：找 skill 範例、reference 不足、有沒有類似的 skill 可參考、這個段落怎麼寫、Gotchas 怎麼寫、description 範本、skill 範本、找個範本、這類 skill 長怎樣、抄一個來改、模式萃取。

  DO NOT trigger for: 規劃新 skill（用 skill-brain）、動筆寫 SKILL.md（用 skill-create）、審查既有 skill（用 skill-review）、雄獅商品/ES/IntentionSearch（用 search-map）、找產品需求範例（用 prd-writer）、找外部 GitHub/部落格 skill 範例（用 skill-discovery）、已有外部 URL 要精讀（用 knowledge-extractor）。
---

# Skill Search — Skill 範例搜尋與模式萃取

定位：skill 生命週期的**補料階段(對內)**。當 brain 或 create 階段卡在「不知道這類 skill 該長怎樣」時，從三層 skill 庫搜出範例、萃取共同模式，產出可複用的 reference。

不做：不規劃 skill（brain）、不撰寫 SKILL.md（create）、不評分審查（review）、**不上網找外部 reference**(對外覓食用 `skill-discovery`,外部單篇文章餵 `knowledge-extractor`)。

---

## Step 0：判讀呼叫情境

skill-search 有三種呼叫情境，**判讀正確才能給對的輸出**：

| 情境 | 判讀訊號 | 輸出重點 |
|---|---|---|
| **A. 由 skill-brain 呼叫** | 對話中提到「規劃 skill」「不知道這類 skill 該長怎樣」 | 偏重 description / trigger 寫法、整體結構 |
| **B. 由 skill-create 呼叫** | 對話中提到「寫不出某段」「Gotchas 怎麼寫」 | 偏重該段落的具體寫法、行文風格 |
| **C. 使用者直接呼叫** | 「找 skill 範例」「有沒有類似的」 | 完整 reference bundle，由使用者挑選需要的部分 |

判讀不出時直接走 C（最完整），不要為了省事走 A 或 B。

**進入後仍需檢查是否誤觸發**：使用者一提到「商品搜不到」「ES」「IntentionSearch」「字典維運」立刻退出，導向 `search-map`——description 的擋牆會漏接這類沒寫「搜尋」字眼的查詢。

---

## 核心流程：三個維度的搜尋與萃取

skill-search 的工作是針對使用者的 reference 需求，跑完以下三個維度。**不必按順序機械式提問**——能直接判讀的就判讀，缺什麼補什麼。各維度的詳細操作見 `references/search-mechanics.md`。

### 維度 1 — Query 釐清

確認三件事：
- **要找什麼類型的 skill**：審查類 / 顧問類 / 流程類 / 資料查詢類 / 報告產出類
- **要找哪個段落**：description / Step 0 問診 / 主流程 / Gotchas / references 結構
- **要找什麼風格**：中文 trigger 詞 / 英文 / progressive disclosure / 步驟式

從使用者既有訊息能判讀的就判讀，不必逐一問。

### 維度 2 — 三層搜尋（user > examples > public）

**搜尋順序強制按優先級**，不能反過來：

| 層級 | 路徑 | 為什麼優先 |
|---|---|---|
| **L1 — User** | `/mnt/skills/user/` | 最貼近使用者風格（中文、中文 skill 慣例、Gotchas 文化） |
| **L2 — Examples** | `/mnt/skills/examples/` | Anthropic 官方範例，泛用模式 |
| **L3 — Public** | `/mnt/skills/public/` | 系統內建技能（pptx/xlsx/docx 等），結構參考 |

**操作方式**：使用 `scripts/scan-skills.sh` 取得結構化清單，避免手動組 bash：

```bash
# 全層掃描
./scripts/scan-skills.sh all

# 只掃 user 層
./scripts/scan-skills.sh user

# 用關鍵字過濾（不分大小寫）
./scripts/scan-skills.sh user "審查"
./scripts/scan-skills.sh all "schema"
```

輸出 TSV 格式（`layer / name / description_first_line`），可用 awk/grep 進一步處理。

**操作要點**：
- L1 至少撈 3 個結構最像的；L2/L3 各撈 1–2 個對照
- 命中後再 `view` 該 SKILL.md 看完整結構，不要一開始就深入 references 子檔
- 撈完即進維度 3 萃取，不要把全部範例丟給使用者
- **若 L1+L2+L3 加總 = 0**:在對話摘要末尾追問「對內三層庫無命中,要不要切 `skill-discovery` 去對外覓食?」由使用者決定是否轉介,不主動跳過去

### 維度 3 — 模式萃取

**這個維度是 skill-search 的核心價值**，不是「找到範例」就結束。

從撈出的 3–5 個範例中，萃取**共同結構**：

| 萃取維度 | 範例輸出 |
|---|---|
| **Description 結構** | 「定位句 + 觸發詞列表 + DO NOT trigger」三段式 |
| **主流程結構** | 「Step 0 問診 → 核心 X 維度 → 輸出規格 → 與其他 skill 銜接 → Gotchas」 |
| **Gotchas 寫法** | 「症狀 / 正確做法 / 為什麼」三段式 |
| **觸發詞密度** | 中文觸發詞 8–12 個、Anti-trigger 3–5 個 |

**萃取原則**：找出**至少 2 個範例都有**的結構，才算「模式」；只有 1 個範例的不算，避免誤導。

萃取完成後，依下方輸出規格組裝 reference bundle。

---

## 輸出規格（雙交付物）

### 交付物 A：對話摘要

在對話最後直接渲染給使用者看，格式：

```
━━━━━━━━━━━━━━━━━━━━━━━
🔎 Skill Reference Bundle

【查找需求】[使用者要找什麼]
【撈到的範例】
  L1 (user)     : skill-A, skill-B, skill-C
  L2 (examples) : example-X
  L3 (public)   : —
【共同模式】
  - 模式 1：XXX（在 A/B/C 都出現）
  - 模式 2：YYY（在 A/B 出現）
【可複用片段】
  → 詳見 reference-bundle.md
【建議下一步】回到 skill-brain 繼續 / 帶著 bundle 進 skill-create
━━━━━━━━━━━━━━━━━━━━━━━
```

### 交付物 B：`reference-bundle.md` 檔案

寫到 `/home/claude/reference-bundle-<topic>.md`，給呼叫方（brain / create）讀。完整結構見 `references/bundle-template.md`。

**兩者都要產出**——對話摘要給使用者人眼確認，檔案給下游 skill 機器讀。

---

## 與其他 skill 的銜接

### 正向銜接（被誰呼叫、回給誰）

| 呼叫方 | 觸發點 | search 完成後的回流動作 |
|---|---|---|
| `skill-brain` | brain 維度 1–3 卡住、不知道這類 skill 該長怎樣 | 把 bundle 帶回 brain 繼續維度 4 重疊掃描 |
| `skill-create` | create 寫某段卡住（description / Gotchas 等） | 把 bundle 帶回 create 繼續組裝 SKILL.md |
| 使用者直接呼叫 | 「找 skill 範例」 | 輸出 bundle 後，等使用者下一步指示 |

### Search 內部不處理的事

下列情境不該進到 skill-search 主流程，已在 description 的 DO NOT trigger 中排除：

- 規劃新 skill 意圖 → 應走 `skill-brain`
- 動筆寫 SKILL.md → 應走 `skill-create`
- 審查既有 skill → 應走 `skill-review`
- 搜尋系統（搜尋商品/ES/IntentionSearch 等）→ 應走 `search-map`
- 「這個 reference 對嗎」（這是審查，不是搜尋）→ 應走 `skill-review`
- **對外覓食(GitHub repo / Anthropic 官方 / 社群 blog)→ 應走 `skill-discovery`**
- **已有具體 URL / 外部文章要精讀對照 → 應走 `knowledge-extractor`**

如果在 search 對話中**才發現**使用者要的不是搜尋範例，做法是：直接告知並導向對應 skill，**結束 search 對話**。

---

## Gotchas

### G1：把「列出範例」當成最終輸出
**症狀**：撈到 3 個 skill，直接把連結貼給使用者就結束。
**正確做法**：必須跑完維度 3 模式萃取，輸出共同結構，使用者要的是「該怎麼寫」不是「哪裡有範例」。
**為什麼**：使用者已經能 `ls /mnt/skills/user/` 自己看了，skill-search 的價值在萃取，不在搜尋。

### G2：搜尋順序反了
**症狀**：先去 `/mnt/skills/public/` 找官方範例，再回來看 user。
**正確做法**：強制 L1 → L2 → L3 順序。user 層的範本最貼近使用者風格。
**為什麼**：Anthropic 官方範例是英文、泛用、無 Gotchas section，套到中文環境會走味。

### G3：模式只在 1 個範例出現就稱為「模式」
**症狀**：只在 skill-A 看到「Step 0 問診」結構，就告訴使用者這是「模式」。
**正確做法**：至少 2 個範例都有的結構才算模式；只有 1 個的標註為「個別範例參考」。
**為什麼**：1 個範例可能是個案，誤導使用者套用後反而不適合自己的 skill。

### G4：把整份 SKILL.md 內容塞進 bundle
**症狀**：複製整個 skill-reviewer 內容到 reference-bundle.md，幾百行。
**正確做法**：bundle 只放**萃取後的結構框架 + 關鍵段落片段**，不複製整檔。
**為什麼**：bundle 是給下游 skill 機器讀的，太長會讓 create 階段抓不到重點。

### G5：撞到 search-map 的 trigger
**症狀**：使用者問「搜尋怎麼做」，skill-search 觸發但其實要的是搜尋系統。
**正確做法**：description 的 DO NOT trigger 已排除，但對話中也要警覺——使用者一提到「商品搜尋」「ES」「IntentionSearch」立刻退出，導向 search-map。
**為什麼**：兩者字面都有「search」，是 27 個 skill 庫中最容易撞的。

### G6:使用者要找的是外部範例
**症狀**:使用者說「找個範本」「有沒有類似的」,skill-search 觸發後才發現他要的是 GitHub 上別人寫的 skill / 部落格介紹的範例 / Anthropic 官方文件。
**正確做法**:skill-search 只翻本機三層庫。聽到「GitHub」「開源」「別人的 skill」「部落格看到」「Anthropic 官方」立刻退出,建議使用者切 `skill-discovery` 去對外覓食(若已有具體 URL/文章 在手,改餵 `knowledge-extractor` 精讀)。
**為什麼**:scan-skills.sh 只掃 `/mnt/skills/`,使用者帶外部期待會直接失望;區分覓食(discovery)與精讀(knowledge-extractor)兩條對外路徑,避免錯走。
