---
name: skill-review
description: |
  Skill 結構審查顧問。當使用者已寫好或修改 skill、需要 8-dim rubric 評分、想知道 skill 為何不觸發、輸出不穩定、或想跨比對既有 skill 庫找衝突時觸發。執行 (1) 機械檢查（行數、frontmatter、Gotchas）、(2) 8 維度語意審查、(3) 跨 skill 觸發詞衝突偵測，輸出結構化評審報告與改動建議。

  觸發關鍵字：審 skill、review skill、skill 評分、skill 健檢、這個 skill 寫得對嗎、為什麼 skill 不觸發、skill 輸出不穩、skill 跟誰撞、跨 skill 衝突、audit skill。

  DO NOT trigger for: 規劃新 skill 構想（用 skill-brain）、找 skill 範例（用 skill-search）、動筆寫 SKILL.md（用 skill-create）、批判性審查概念設計（用 critical-reviewer，那是審 PRD/規劃的麥肯錫式批判）、寫產品 PRD（用 prd-writer）。
version: 0.1.0
category: review
---

# Skill Review — Skill 結構審查顧問

定位：skill 生命週期的**驗收階段**。對 create 產出的 skill 跑機械檢查 + 語意審查 + 跨 skill 衝突偵測，產出可執行的改動建議。

不做：不規劃 skill（brain）、不寫 skill（create）、不批判概念設計（critical-reviewer）。

---

## Step 0：判讀審查情境

每次進入 review，**先判讀使用者要哪一種審查**：

| 情境 | 判讀訊號 | 流程 |
|---|---|---|
| **A. 全面審查** | 「review my skill」「全面審查」「健檢」 | 跑全部 8 個 dim + validate + conflicts，輸出完整報告 |
| **B. 特定問題診斷** | 「為什麼不觸發」「輸出不穩」「token 太多」 | 只讀對應 dim 檔（見下方對照表），快速給診斷 |
| **C. 跨 skill 衝突檢查** | 「會不會跟 XX 撞」「跨 skill 衝突」「觸發詞重疊」 | 只跑 conflicts 腳本，不跑 dim rubric |

**情境 B 對照表**（只讀需要的 dim 檔，省 context）：

| 使用者問題 | 讀取的 dim 檔 |
|---|---|
| 不觸發 | `dim-1-description.md` |
| description 被平台拒收 / 超 1024 byte | `dim-1-description.md`(Hard Limits 段) |
| 輸出品質不穩定 | `dim-2-gotchas.md` + `dim-4-railroading.md` |
| 指令結構混亂 | `dim-3-progressive-disclosure.md` + `dim-4-railroading.md` |
| 狀態/資料遺失 | `dim-5-setup-config.md` + `dim-7-memory.md` |
| token 消耗異常 / 存在合理性疑慮 | `dim-8-context-efficiency.md` |
| 全面審查 | 8 個 dim 檔全讀 |

---

## 核心流程：三段式審查

**依 Step 0 判讀的情境執行不同部分**，不必每次都跑完整三段：

| Step 0 情境 | 執行範圍 |
|---|---|
| **A 全面審查** | 全部三段（機械 + 語意 + 推薦） |
| **B 特定問題診斷** | 第一段機械檢查 + 第二段（只讀對應 dim 檔）+ 第三段推薦改動 |
| **C 跨衝突檢查** | 只跑第一段的 `check-skill-conflicts.sh`，跳過第二段語意審查 |

### 第一段 — 機械檢查（自動化）

**先跑兩個腳本**取得客觀數據，不靠肉眼數：

```
./scripts/validate-skill.sh <skill-dir>
./scripts/check-skill-conflicts.sh <skill-dir> [skills-base]
```

`validate-skill.sh` 檢查:行數、frontmatter、**description ≤ 1024 byte(平台硬限制)**、references 子檔數、Gotchas 條數、觸發詞數量。
`check-skill-conflicts.sh` 檢查：跟既有 skill 庫的觸發詞重疊（🔴 高 / 🟡 中 / 🟢 低）。

**腳本結果寫進報告**作為「機械檢查」段，不靠 Claude 重做這些工作。

### 第二段 — 語意審查（8 維度 rubric）

依 Step 0 判讀的情境，讀取需要的 dim 檔（見對照表）。每個 dim 的評分標準在 `references/dims/dim-N-*.md`。

| # | Dimension | 評分重點 |
|---|---|---|
| 1 | **Description / Trigger** | 為模型而寫、含 trigger 詞、夠 pushy、與其他 skill 區隔 |
| 2 | **Gotchas Section** | 真實失敗點、結構化（症狀/做法/為什麼） |
| 3 | **Progressive Disclosure** | 有目錄結構、不單檔倒入 |
| 4 | **Railroading** | 給意圖+彈性、不過度規定步驟 |
| 5 | **Setup & Config** | 首次執行優雅處理（N/A 可跳） |
| 6 | **Scripts & Code** | 給 Claude 程式碼複用，不重造輪子（N/A 可跳） |
| 7 | **Memory / State** | 用 `${CLAUDE_PLUGIN_DATA}` 持久化（N/A 可跳） |
| 8 | **Context Efficiency** | description 簡潔、SKILL.md 精實、有存在合理性 flag |

**N/A 維度從 Overall 分母排除，不要打 1 分拉低總分**。

### 第三段 — 改動建議（推薦但不自動修）

**主動掃出推薦改動點**，但**不自動修改**——保留使用者決策權。

每個推薦改動需含：

```
🔴/🟡/🟢 [改動標題]
位置：<檔案> 第 X 行 / X 段
現況：[一句話]
建議：[一句話]
工作量：X 分鐘
```

優先級判準：
- 🔴 高：dim 評分 ≤ 2 / 高度衝突 / 缺必要段落
- 🟡 中：dim 評分 = 3 / 中度衝突 / 風格不一致
- 🟢 低：dim 評分 = 4 / 一致性微調 / nice-to-have

---

## 輸出規格

### 完整評審報告格式

報告結構詳見 `assets/review-template.md`。核心欄位：

```
## Skill Review: <skill-name>

### Summary
[1–2 句總體評估]

### 機械檢查（validate-skill.sh）
[直接貼腳本輸出，含 ✅/⚠️/❌]

### 跨 skill 衝突（check-skill-conflicts.sh）
[直接貼腳本輸出，含 🔴/🟡 重疊清單]

### Score Table
| Dimension | Score (1–5 or N/A) | Notes |
| ... | ... | ... |
| **Overall** | **X / Y 維度** | N/A 排除 |

### 🔴 Critical Issues
### 🟡 Improvements
### 🟢 What's Working

### 推薦改動（優先級 + 工作量估算）
🔴 ...
🟡 ...
🟢 ...

### Suggested Rewrites（具體 before/after，給最重要的 1–3 條）
```

### 結尾必有：是否 ship 的判定

最後一段給明確判定：

- **可 ship**（無 🔴 issue、無高度衝突）
- **修完再 ship**（有 🔴 但都可在短時間內修完）
- **重新評估**（架構性問題，需回到 skill-brain 重新規劃）

---

## 與其他 skill 的銜接

### 正向銜接

| 上下游 | 動作 |
|---|---|
| 上游：`skill-create` | 接收剛產出的 skill 目錄，跑三段審查 |
| 上游：使用者直接呼叫 | 對既有 skill（含 user 層 27 個既有）做健檢 |
| 下游：使用者依建議修 | 修完後可再次呼叫 review 驗證 |
| 下游：`skill-summary` | 使用過程踩坑，由 summary 沉澱 Gotchas |

### Review 內部不處理的事

- 規劃新 skill → 應走 `skill-brain`
- 找 skill 範例 → 應走 `skill-search`
- 動筆寫 SKILL.md → 應走 `skill-create`
- 批判性概念設計審查（PRD/方案）→ 應走 `critical-reviewer`（麥肯錫式批判，不同於結構評分）
- 直接幫使用者改寫 skill → 不主動修改，**只推薦**改動點，由使用者決定是否動工

---

## Common Failure Patterns 快查（按需讀取）

審查時若發現符合 5 種致命反模式之一（description 寫給人看、缺 Gotchas、過度 railroading、單檔扁平化、stateful 不用 `${CLAUDE_PLUGIN_DATA}`），直接標 🔴 Critical Issue。

詳細描述、❌ Bad / ✅ Good 對照、對應 dim 分數見 `references/common-failure-patterns.md`。

---

## Gotchas

### G1：N/A 維度打低分拉低 Overall
**症狀**：reference skill 不需要 memory，硬打 1 分拉低 Overall。
**正確做法**：Setup & Config、Scripts & Code、Memory/State 不適用時標記 N/A，從 Overall 分母排除。
**為什麼**：硬打分會讓報告失真，使用者不知道哪個 dim 是真問題。

### G2：硬擠不存在的問題
**症狀**：skill 某維度做得很好，review 為了顯得專業還是寫一條改動建議。
**正確做法**：好就直接說好，列在「What's Working」段。
**為什麼**：製造假問題會讓 review 失去可信度，使用者不知道該優先改什麼。

### G3：跳過 validate-skill.sh 直接做語意審查
**症狀**：肉眼數行數、目測 frontmatter 完整性、用直覺評估 Gotchas 條數。
**正確做法**：先跑 validate（機械檢查 < 10 秒），再做語意審查。腳本結果直接貼進報告。
**為什麼**：機械檢查靠人工會漏（skill-create 自己審查時就漏報過 7 條 Gotchas），且腳本秒出結果，沒道理跳過。

### G4：忘了跑 check-skill-conflicts.sh
**症狀**：給出完整評分但沒提跨 skill 衝突，使用者上線後才發現觸發被搶。
**正確做法**：每次 review **都要**跑衝突檢查（對 `/mnt/skills/user/`），結果寫進報告。
**為什麼**：使用者已 27+ skill，新 skill 不撞詞是運氣，主動掃才能擋。

### G5：自動改寫使用者的 skill
**症狀**：發現 description 不夠 pushy，直接動手改寫使用者的 SKILL.md。
**正確做法**：列出推薦改動（含現況/建議/工作量），但**不主動修改**——使用者按需要再修。
**為什麼**：保留使用者決策權，避免過度改寫。Review 是顧問不是執行者。

### G6：審別人 skill 時放過空話 Gotchas
**症狀**：審別人 skill 時看到「請小心邊界」「使用時要謹慎」這種空話 Gotcha。
**正確做法**：直接指出「Gotcha 是假設性警告而非真實失敗案例」，列為 dim-2 的 🔴 issue。
**為什麼**：空話 Gotcha 違反 Gotchas 段的設計初衷，也違反 progressive disclosure 規範。

---

## Reference Files

**評分 rubric**：`references/dims/dim-1-*.md` 至 `dim-8-*.md`（按 Step 0 情境對照表選讀）

**反模式快查**：`references/common-failure-patterns.md`

**Skill 分類參考**：`references/categories.md`（9 種 skill 類型）

**範本**：`assets/review-template.md`（評審報告範本）

**腳本**：
- `scripts/validate-skill.sh` — 機械檢查（行數、frontmatter、references、Gotchas、觸發詞）
- `scripts/check-skill-conflicts.sh` — 跨 skill 觸發詞衝突偵測
