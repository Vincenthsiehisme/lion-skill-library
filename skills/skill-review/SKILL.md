---
name: skill-review
description: |
  Skill 品質驗收顧問。Trigger: 審 skill、review skill、skill 健檢、觸發異常、輸出不穩、references 與 scripts 結構檢查、跨 skill 衝突初篩、ship 判斷。
  Review 方法: 以 hard gate、quality gate、style heuristic 三層判斷，避免把格式偏好誤判為不可上線。
  Do NOT: 規劃新 skill 轉 skill-brain；從零撰寫或大幅重構轉 skill-create；一般 PRD / 方案批判轉 critical-reviewer。Review 後小修、patch、驗證修正留在 skill-review。
category: review
version: 0.2.0
tags:
  - skill
  - review
---

# Skill Review — Skill 品質驗收顧問

定位：skill 生命週期的**驗收階段**。本 skill 不以某一套 create 模板為唯一標準，而是判斷 skill 是否能在真實使用情境中穩定觸發、清楚分工、低成本載入，並產出可驗收結果。

核心原則：

```text
Review 不是格式稽核器，而是品質驗收器。
格式可以作為 heuristic，但不能取代對觸發有效性、職責邊界、可執行性與維護成本的判斷。
```

---

## Step 0：判讀審查情境

每次進入 review，先判讀使用者要哪一種審查；不要無差別讀完整 reference。

| 情境 | 判讀訊號 | 流程 |
|---|---|---|
| **A. 全面審查** | 「review」「健檢」「完整評估」「能不能 ship」 | 跑 validate + conflicts，讀 8 個 dim，輸出完整報告 |
| **B. 特定問題診斷** | 「為什麼不觸發」「輸出不穩」「token 太多」「script 不能跑」 | 跑 validate，讀對應 dim，快速診斷 |
| **C. 跨 skill 衝突檢查** | 「會不會跟 XX 撞」「觸發詞重疊」「跨 skill 衝突」 | 跑 conflicts，人工判讀是否真衝突 |
| **D. 使用者要求改檔** | 「改給我」「直接修」「產出新版 zip」 | 先形成 patch brief，再進入修改；只做 review 結論可追溯的小修 / patch / 驗證修正；若是從零撰寫或大幅重構，轉 `skill-create`；修改後重新 validate |

**情境 B 對照表**：

| 使用者問題 | 讀取的 dim 檔 |
|---|---|
| 不觸發 / 誤觸發 | `references/dims/dim-1-description.md` |
| description 被平台拒收 / 超 1024 byte | `references/dims/dim-1-description.md` 的 Hard Gate 段 |
| Gotchas 太空泛 | `references/dims/dim-2-gotchas.md` |
| SKILL.md 太長 / reference 結構混亂 | `references/dims/dim-3-progressive-disclosure.md` + `references/dims/dim-8-context-efficiency.md` |
| 指令過死 / 過度 step-by-step | `references/dims/dim-4-railroading.md` |
| setup / config / state 遺失 | `references/dims/dim-5-setup-config.md` + `references/dims/dim-7-memory.md` |
| script 不可執行 / 重造輪子 | `references/dims/dim-6-scripts.md` |
| 存在合理性疑慮 | `references/dims/dim-8-context-efficiency.md` |

---

## 審查哲學：三層 gate

審查時先分層，再給結論。不要把 style heuristic 寫成 ship-blocker。

### 1. Hard Gate：違反才真的不能 ship

任一命中都列為 🔴 Critical Issue，結尾判定不得為「可 ship」。

```text
- SKILL.md 不存在或不可讀
- YAML frontmatter 無效
- name / description 缺失
- description >= 1024 byte，導致平台可能拒收
- SKILL.md 引用的 references / assets / scripts 不存在
- SKILL.md 指令要求執行的 script 不可執行
- script 存在高風險破壞性操作，卻沒有 guardrail / confirm / dry-run
- 觸發範圍與既有 skill 高度重疊，且沒有明確分工或轉交邏輯
```

### 2. Quality Gate：高優先改善，但不一定擋 ship

命中時列為 🔴 或 🟡，依影響判斷是否「修完再 ship」。

```text
- trigger 情境太抽象，模型不容易判斷何時使用
- description 像人類摘要，不像模型觸發訊號
- Do NOT / 邊界沒有說清楚，且實際存在鄰近 skill
- Gotchas 是空話或全是假設，不能防止實際錯誤
- SKILL.md 把大量偶發內容常駐載入，沒有 progressive disclosure
- 輸出格式沒有可驗收標準
- setup / state / script 依賴沒有 first-run 或錯誤處理
```

### 3. Style / Heuristic：只作建議，不擋 ship

這些只能列為 🟢 或 🟡 微調，不能單獨導致「不可 ship」。

```text
- 觸發詞是否剛好 8–12 個
- description 是否剛好 8–12 行
- 是否使用固定句型「當 X 時觸發」
- DO NOT 是否剛好點名 2–5 個鄰居
- 觸發詞是否使用頓號、分號或 bullet
- 文字風格是否完全一致
```

---

## 核心流程：三段式審查

### 第一段：機械檢查

先跑腳本取得客觀基礎資料：

```bash
./scripts/validate-skill.sh <skill-dir>
./scripts/check-skill-conflicts.sh <skill-dir> [skills-base]
```

`validate-skill.sh` 是薄入口，實際檢查集中在 `scripts/lib/validate_skill.py`。它檢查 hard gate 與常見 quality warning：frontmatter、description byte、引用檔案、入口 script 可執行性、helper/lib 可讀性、Gotchas、trigger 訊號、anti-trigger 訊號。

`check-skill-conflicts.sh` 是薄入口，實際邏輯集中在 `scripts/lib/check_skill_conflicts.py`。它只做**字面重疊初篩**，不是最終語意判決。它的結果必須人工判讀：常見詞重疊不等於衝突；不同詞但職責相近也可能衝突。若技能庫不在預設位置，可傳入 `[skills-base]`，或設定 `SKILLS_BASE` 環境變數。

機械檢查 exit code 解讀：

| 工具 | Exit Code | Review 判讀 |
|---|---:|---|
| `validate-skill.sh` | 2 | 視為 Hard Gate，修完再 ship |
| `validate-skill.sh` | 1 | 進入語意審查；warning 不自動擋 ship |
| `validate-skill.sh` | 0 | 機械檢查通過 |
| `check-skill-conflicts.sh` | 2 | 需人工判讀是否高度職責衝突；若無明確分工才升為 Hard Gate |
| `check-skill-conflicts.sh` | 1 | 列為需檢視，不自動擋 ship |
| `check-skill-conflicts.sh` | 0 | 未發現明顯字面重疊 |


### 第二段：語意審查

依 Step 0 讀取需要的 dim 檔。全面審查時使用全部 8 維度：

| # | Dimension | 評分重點 |
|---|---|---|
| 1 | **Description / Trigger** | 觸發有效性、誤觸發風險、職責邊界 |
| 2 | **Gotchas Section** | 是否能防止真實或高可信失敗 |
| 3 | **Progressive Disclosure** | SKILL.md 是否為 hub，細節是否按需載入 |
| 4 | **Railroading** | 是否保留推理彈性；必要 runbook 是否有合理步驟 |
| 5 | **Setup & Config** | 首次執行與設定缺失是否優雅處理 |
| 6 | **Scripts & Code** | script 是否可重用、可執行、具安全邊界 |
| 7 | **Memory / State** | 狀態是否需要持久化，若需要是否有安全位置 |
| 8 | **Context Efficiency** | 常駐成本是否值得，skill 是否有存在理由 |

N/A 維度要從 Overall 分母排除，不要硬打低分。

### 第三段：改動建議

Review 預設只給建議；當使用者明確說「改給我」時，可以依 review 結論直接修改檔案。修改範圍限於小修、patch、驗證修正、邊界補強與 reference 同步；若需求已變成從零撰寫或大幅重構，應轉 `skill-create`。每個改動要能追溯到 gate 或 dim，不做無來源的風格大改。

推薦改動格式：

```text
🔴/🟡/🟢 [改動標題]
層級：Hard Gate / Quality Gate / Style Heuristic
位置：<檔案> 第 X 行 / X 段
現況：[一句話]
建議：[一句話]
工作量：X 分鐘
```

優先級判準：

| 優先級 | 判準 |
|---|---|
| 🔴 | Hard Gate、會導致不觸發/誤觸發/不可執行、或高度職責衝突 |
| 🟡 | Quality Gate，明顯影響穩定性但不一定阻擋 ship |
| 🟢 | Style / Heuristic，改善一致性或可讀性 |

---

## 輸出規格

完整報告詳見 `assets/review-template.md`。核心結構：

```text
## Skill Review: <skill-name>

### Summary
### Gate 判定
### 機械檢查
### 跨 skill 衝突初篩
### Score Table
### 🔴 Critical Issues
### 🟡 Improvements
### 🟢 What's Working
### 推薦改動
### Suggested Rewrites
### Ship 判定
```

結尾必須明確判定：

| 判定 | 使用時機 |
|---|---|
| **可 ship** | 無 hard gate，無高風險 quality issue |
| **可 ship，但建議修** | 無 hard gate，只有 quality/style 改善 |
| **修完再 ship** | 有 hard gate 或明顯會影響觸發/執行的 critical issue |
| **重新評估** | skill 存在理由、邊界或架構本身不成立，需回到 skill-brain |

---

## 與其他 skill 的銜接

| 需求 | 銜接方式 |
|---|---|
| 規劃新 skill | 轉 `skill-brain` |
| 從零撰寫或大幅重構 skill | 轉 `skill-create` |
| 審查既有 skill 是否合理 | 留在 `skill-review` |
| 使用者要求「改給我」做 review 後小修 / patch / 驗證修正 | 留在 `skill-review`，先定義 patch brief，再修改並重新 validate |
| 一般 PRD / 商業方案批判 | 轉 `critical-reviewer` |

---

## Gotchas

### G1：把格式偏好誤判為 ship-blocker
**症狀**：因為觸發詞不是 8–12 個、description 不是 8–12 行，就判定不可 ship。  
**正確做法**：先問是否違反 hard gate 或造成真實觸發風險；純格式問題只列 Style / Heuristic。  
**為什麼**：Review 的價值是品質判斷，不是逼所有 skill 長得一樣。

### G2：conflict script 結果沒有人工判讀
**症狀**：看到 1–2 個重疊詞就斷言兩個 skill 衝突。  
**正確做法**：把腳本視為初篩；再檢查任務、輸入、輸出、上下游與 DO NOT 是否能分工。  
**為什麼**：字面重疊可能是假陽性，語意相近也可能是假陰性。

### G3：N/A 維度打低分拉低 Overall
**症狀**：純 reference skill 不需要 memory，卻因沒有 `${CLAUDE_PLUGIN_DATA}` 被打 1 分。  
**正確做法**：Setup & Config、Scripts & Code、Memory/State 不適用時標 N/A，排除分母。  
**為什麼**：硬打低分會讓使用者誤判真正問題。

### G4：跳過 validate 直接做語意審查
**症狀**：肉眼數 frontmatter、description byte、script 權限與引用檔案。  
**正確做法**：先跑 validate；把機械檢查和語意判斷分開。validator 本身若失敗，先修 validator，不要把失敗輸出硬解讀成 skill 問題。  
**為什麼**：機械問題應由工具穩定檢查，語意判斷才留給 reviewer。

### G5：把新 skill 的預期風險全判為假 Gotchas
**症狀**：新 skill 尚無真實事故，所以所有 Gotchas 都被判不合格。  
**正確做法**：允許以「高可信預期風險」作為初始 Gotchas，但要求後續用真實失敗案例替換或補強。  
**為什麼**：新 skill 也需要初始 guardrail；重點是具體、可操作、可驗證。

### G6：反 step-by-step 反過頭
**症狀**：看到 Step 1 / Step 2 就扣分。  
**正確做法**：區分「思考被寫死」與「操作順序必要」。runbook、部署、驗證、資料修復類 skill 可以有明確步驟。  
**為什麼**：好的 skill 不是永遠少步驟，而是在需要彈性時保留彈性，在需要安全時固定順序。

### G7：把 helper/lib 當入口 script 驗證
**症狀**：`scripts/lib/*.py`、fixtures、templates 沒有 executable permission，就判為 hard error。  
**正確做法**：只有 SKILL.md 明確要求執行的 script，或 `scripts/` 第一層入口 script，需要 executable；helper/lib 只要求可讀與可引用。  
**為什麼**：入口與輔助程式的驗收條件不同，混在一起會造成假陽性。

---

## Reference Files

- `references/dims/dim-1-description.md` — 觸發有效性與邊界審查
- `references/dims/dim-2-gotchas.md` — Gotchas 是否能防錯
- `references/dims/dim-3-progressive-disclosure.md` — folder/context 結構
- `references/dims/dim-4-railroading.md` — 彈性與步驟化判斷
- `references/dims/dim-5-setup-config.md` — setup/config 首次執行
- `references/dims/dim-6-scripts.md` — scripts/code reuse 與安全
- `references/dims/dim-7-memory.md` — memory/state
- `references/dims/dim-8-context-efficiency.md` — token 成本與存在合理性
- `references/common-failure-patterns.md` — 常見反模式
- `references/categories.md` — skill 類型參考
- `assets/review-template.md` — 報告範本
- `scripts/lib/validate_skill.py` — validate-skill.sh 使用的穩定機械檢查核心
- `scripts/lib/check_skill_conflicts.py` — check-skill-conflicts.sh 使用的字面重疊初篩核心
