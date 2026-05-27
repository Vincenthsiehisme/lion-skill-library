---
name: skill-create
schema_version: v2
description: |
  Skill 組裝器。把 intent + reference 組成 Anthropic 規範的 SKILL.md。

  Trigger: 寫 SKILL.md、組裝 skill、skill 初稿、把 intent 變 skill;或已有 intent.md 要動筆。

  Do NOT: 釐清構想 → skill-brain;審查 → skill-review;跑 eval → 不採用。
version: 0.1.0
category: writing
---

# Skill Create — Skill 組裝器

定位：skill 生命週期的**執行階段**。把上游 brain 釐清的 intent + search 撈來的 reference，組成一份符合 Anthropic skill 設計原則的 SKILL.md（含 references/ 子檔結構與中文 trigger 寫法）。

不做：不釐清（brain 已做）、不審查（review 會做）、不跑 eval（不採用 Anthropic eval-driven loop）。

---

## Step 0：檢查上游材料

每次進入 create，**第一件事是盤點手上的材料**：

| 情境 | 判讀訊號 | 做法 |
|---|---|---|
| **A. 有 intent + reference** | 使用者附 `skill-intent.md` + `reference-bundle.md` 路徑 | 直接進維度 1 組裝 |
| **B. 只有 intent** | 使用者附 `skill-intent.md`，無 reference | 先評估是否需要呼叫 `skill-search` 補料；常見模式直接寫，特殊段落不會寫才搜 |
| **C. 沒有 intent，但有想法** | 使用者直接描述要做什麼 skill | **退回 `skill-brain`**——create 不接收口頭描述，避免重複 brain 的釐清流程 |
| **D. 有舊 skill 要修改** | 使用者附既有 SKILL.md 路徑 | 先 view 現況，識別要保留 / 要改寫 / 要新增的段落，再進維度 1 |

**關鍵紀律**：情境 C 必須退回 brain。如果在 create 內接手釐清，會違反五 skill 分工架構，且輸出品質不穩定。

---

## 核心流程：四個維度的組裝

skill-create 的工作是把材料組裝成 SKILL.md。**不必逐一機械式提問**——能從上游材料判讀的就判讀，缺什麼補什麼。各維度的詳細規範見 `references/skill-anatomy.md`（skill 標準骨架）和 `references/section-recipes.md`（各段落寫法）。

### 維度 1 — 骨架選型

判斷這個 skill 的類型，套用對應骨架。skill 設計常見 4 類骨架：

| 類型 | 特徵 | 範例 | 對應骨架 |
|---|---|---|---|
| **顧問類** | 釐清概念 / 提供知識 / 不寫檔案 | group-tour-advisor / data-dictionary-advisor | A：問診式 |
| **查詢類** | 查 schema / API / 資料字典 | erp-schema / pcm-schema / cms-schema | B：索引式 |
| **流程類** | 多步驟工作流 / 編排其他 skill | task-dispatcher / story-orchestrator | C：階段式 |
| **產出類** | 寫文件 / 寫報告 / 寫 SKILL.md | prd-writer / strategy-case-report / skill-create 自己 | D：交付物式 |

**判型方法**：
- 看 intent 中「做什麼」的動詞（釐清 / 查詢 / 編排 / 產出）
- 看「不做什麼」清單（顧問類常排除「寫檔」）
- 不確定時優先選**顧問類 A**（最通用，後續調整成本低）

每種骨架的具體段落配置見 `references/skill-anatomy.md`。

### 維度 2 — Description 撰寫

description 是 skill 的觸發機制，**這是 create 階段最重要的一步**。

**v2 規格（schema_version: v2）**——從 intent 的 trigger 詞組裝成 description，套用三段式：

```
[一句話定位句，≤ 40 字。寫「X 做什麼，給誰用」]

Trigger: [鑽石詞 3–6 個，頓號分隔]；或[1 條兜底情境句，≤ 50 字]。

Do NOT: [場景 1] → [neighbor-skill-1]；[場景 2] → [neighbor-skill-2]；[場景 3] → [neighbor-skill-3]。
```

**硬性規格**：
- 定位句 ≤ 40 字
- 鑽石詞 3–6 個（高特異性，看到就觸發）
- 情境句 1 條 ≤ 50 字（兜底召回，抓沒講關鍵字的意圖）
- Do NOT 2–3 條（只列**最易誤觸**的鄰居，不列所有鄰居）
- description 全段 ≤ 250 字（含換行）

**鑽石詞 vs 兜底句怎麼分**：
- 鑽石詞：該領域的「術語 / 工具名 / 動詞片語」，使用者一講就該觸發（例：「寫 sprint PRD」「萃取我的 fingerprint」）
- 兜底句：抓「沒講關鍵字但意圖明確」的情境，通常用第一人稱（例：「使用者已有 FR 草稿要組規格」）

**Do NOT 怎麼選最易誤觸鄰居**：
- 想像 Claude 路由時會卡在哪 2–3 個語感相近的 skill
- 不列「我做 A 不做 B」當中 B 跟 A 沒有語感重疊的鄰居（那是噪音）
- 統一格式：`<場景> → <skill-name>`

詳細寫法與反例見 `references/section-recipes.md`「Description 段」。

**v1 legacy 規格**：既有 skill 沒寫 `schema_version: v2` 就走 v1（觸發關鍵字 8–12 個 + DO NOT trigger 2–5 條）。漸進派路線——既有 skill 不需改，新 skill 一律用 v2。

### 維度 3 — 主體段落組裝

依照維度 1 選定的骨架類型，組裝主體段落。skill 共通的標配段落：

| 段落 | 必有 / 可選 | 來源 |
|---|---|---|
| **Step 0 問診** | 顧問類必有；其他可選 | 從 intent 的問題情境推出 A/B/C 三選一 |
| **核心流程：N 個維度** | 必有 | 從 intent 的工作項拆出維度（不要寫成 Step 1→2→3） |
| **輸出規格** | 產出類必有；其他可選 | 從 intent 的「交付物」推出格式 |
| **與其他 skill 的銜接** | 必有 | 從 intent 的「不做什麼」+ 上下游關係寫 |
| **Gotchas** | 強烈建議有 | 從 reference-bundle 借鏡 + 預判使用者會踩的坑 |

**Gotchas 是 Anthropic 8-dim rubric 的 dim-2 規範**——使用者既有 27 個 skill 中超過 60% 都有，必須維持這個傳統。Gotchas 寫法：

```
### G1：[症狀標題]
**症狀**：[一句話描述使用者遇到的問題]
**正確做法**：[一句話說明該怎麼做]
**為什麼**：[一句話說明背後原因]
```

詳見 `references/section-recipes.md`「Gotchas 段」。

### 維度 4 — Progressive Disclosure 與檔案結構

決定主檔保留什麼、references/ 拆什麼。skill 的判準：

| 主檔保留 | references/ 下放 |
|---|---|
| 觸發機制（description, Step 0） | 詳細操作指令、判準表 |
| 核心流程綱要 | 各段落的詳細寫法、範例 |
| 輸出規格摘要 | 模板檔案（template.md） |
| 與其他 skill 銜接 | scripts/ 下的執行腳本 |
| Gotchas（**強制保留主檔**） | 不下放——這是高訊號內容 |

**長度判準**：
- 主檔 SKILL.md：150–200 行為佳
- 單個 references 子檔：100–200 行
- 主檔超過 250 行**通常**代表沒做下放。但若內容本質緊密（多步驟流程、單一連貫概念），允許超過——條件是**在交付物摘要中標註理由**：「本 skill 主檔 XXX 行，因 <理由> 未拆 references」。

**References 判準**：至少 1 個 references 子檔是**預期值**。例外：極簡 skill（< 80 行、無外部規範參考）可不拆，但需在交付物摘要說明。

**起手式**：可從 `assets/skill-template.md` 複製基礎骨架（含所有共通段落的填空版），再依骨架類型補足特殊段落。

**驗證**：完成後執行 `scripts/validate-skill.sh <skill-dir>` 自動檢查行數、frontmatter、references、Gotchas、Trigger / Do NOT 結構。腳本依 `schema_version` 切換規格：

- 沒寫 `schema_version` → 走 **v1 legacy**（觸發關鍵字 6–15 個 + DO NOT trigger 段存在）
- 寫 `schema_version: v2` → 走 **v2 新規格**（鑽石詞 3–6、情境句 1 條、Do NOT 2–3 條、description ≤ 250 字）
- 加 `--strict` flag 強制走 v2 規格（用於把舊 skill 升 v2 的檢查）

腳本回報通過 / 警告 / 錯誤三種狀態，警告可上線但建議檢視，錯誤需修正。

---

## 輸出規格（雙交付物）

### 交付物 A：完整 skill 目錄

寫到 `/home/claude/<skill-name>/`，結構：

```
<skill-name>/
├── SKILL.md                    # 主檔（必須）
├── references/                 # 至少 1 個子檔（必須）
│   ├── <topic-1>.md
│   └── <topic-2>.md
└── scripts/                    # 可選（如有重複程式工作）
    └── <script>.sh
```

### 交付物 B：對話摘要

在對話最後直接渲染給使用者看：

```
━━━━━━━━━━━━━━━━━━━━━━━
🛠️ Skill Created: <skill-name>

【骨架類型】顧問類 / 查詢類 / 流程類 / 產出類
【主檔】SKILL.md（XXX 行）
【References】<list>
【Scripts】<list>（如有）
【Gotchas】N 條
【Validate】✅ 通過 / ⚠️ N 個警告 / ❌ N 個錯誤
【建議下一步】交給 skill-review 審查
━━━━━━━━━━━━━━━━━━━━━━━
```

**兩者都要產出**——目錄給使用者部署用、摘要給人眼快速確認骨架對不對。

---

## 與其他 skill 的銜接

### 正向銜接（誰呼叫 / 完成後給誰）

| 上下游 | 動作 |
|---|---|
| 上游：`skill-brain` | 接收 `skill-intent.md`，判讀完成度，缺料就回頭呼叫 brain 補 |
| 上游：`skill-search`（選用） | 接收 `reference-bundle.md`，作為段落寫法參考 |
| 下游：`skill-review` | 完成後**強烈建議**交給 review 用 8-dim rubric 審 |
| 下游：`skill-summary`（後續） | 使用後若踩坑，由 summary 寫回 Gotchas |

### Create 內部不處理的事

下列情境不該進到 skill-create 主流程，已在 description 的 DO NOT trigger 中排除：

- 釐清 skill 構想 → 應走 `skill-brain`
- 找 skill 範例 → 應走 `skill-search`
- 審查既有 skill → 應走 `skill-review`
- 寫產品 PRD → 應走 `prd-writer`
- 跑 eval / benchmark / variance 測試 → 工具鏈**不採用** Anthropic eval-driven loop，改由 `skill-review`（結構審查）+ `skill-summary`（錯誤沉澱）取代

如果在 create 對話中**才發現**使用者要的是上面這些，做法是：直接告知並導向對應 skill，**結束 create 對話**。

---

## Gotchas

### G1：把 brain 該做的事在 create 重做
**症狀**：使用者口頭描述 skill 想法，create 直接開始問「你的 skill 要解什麼問題？」
**正確做法**：發現沒有 `skill-intent.md` 就退回 brain，**不要自己接手釐清**。
**為什麼**：違反五 skill 分工架構；create 內做釐清會缺重疊掃描，容易做出第 28 個重複 skill。

### G2：抄外部骨架，又不學自己 review 過的教訓
**症狀**：兩種模式：
（a）抄 Anthropic skill-creator 的 "Capture Intent / Interview / Write" 流程，全英文 + 含 eval 段；
（b）寫新 skill 時沒檢查既有 skill 的 review 結論，重蹈已修過的覆轍（例如範例 heading 汙染、Step 0 沒對應主流程）。
**正確做法**：（a）套**四種骨架（顧問/查詢/流程/產出）**（顧問/查詢/流程/產出），中文、含 Gotchas、雙交付物；（b）寫主檔前掃 `/home/claude/skill-*/SKILL.md` 既有設計，特別注意已修過的常見模式（縮排格式取代 fenced 範例、Step 0 對應流程指引、主檔 < 200 行）。
**為什麼**：Anthropic skill-creator 是 mega-skill 把 create+test+eval 綁一起，跟你的五 skill 分工衝突——骨架不能直接套，但寫作規範可參考。同時，每個 skill 獨立寫但 review 教訓需要系統化沉澱——不主動參考前面修正，後面的 skill 會踩同樣的坑（skill-summary 自我審查時就同時踩到 skill-create 和 skill-review 已修過的兩個問題）。

### G3：Do NOT 寫成空話或列太多鄰居
**症狀**：兩種：（a）寫成「不處理其他無關需求」這種空話；（b）列了 5–8 個鄰居 skill，每個都加括號註解，讀起來像律師條款。
**正確做法**：**v2 規格 Do NOT 2–3 條，只列最容易誤觸的鄰居**。想像 Claude 路由時會卡在哪 2–3 個語感相近的 skill；其他鄰居寫了等於噪音。格式統一：`<場景> → <skill-name>`。
**為什麼**：使用者已 50+ skill，沒點名鄰居會搶觸發。但 Anti-trigger 寫太多反而稀釋訊號——Claude 路由時只會卡在 2–3 個語感相近的鄰居上，列第 4 條以後純粹增加 description 字數無助於辨別。

### G4：Gotchas 寫成空泛警告
**症狀**：「注意要小心 X」「使用時要謹慎」這種一句話 Gotcha。
**正確做法**：強制三段式（症狀 / 正確做法 / 為什麼），且來自**真實預判**的踩坑情境，不是泛泛建議。
**為什麼**：Gotchas 是 8-dim rubric 中分數最高的維度（dim 2），空泛 Gotcha 會被 review 打回。

### G5：主檔超過 250 行還不下放也不解釋
**症狀**：SKILL.md 寫到 300+ 行，所有判準、範例、模板全塞主檔，且交付物摘要沒說明理由。
**正確做法**：超過 200 行就主動評估能不能下放到 references/。如果內容本質緊密無法拆，必須在交付物摘要標註「本 skill 主檔 XXX 行，因 <理由> 未拆 references」。
**為什麼**：違反 progressive disclosure 三層架構（metadata < SKILL.md < references），主檔太長會吃 context 預算。標註理由的目的是讓 review 階段能判斷是合理例外還是漏拆。

### G6：跳過交付前的強制動作
**症狀**：完成 SKILL.md 後直接進對話摘要，沒跑 validate、也沒交給 review。
**正確做法**：交付前**兩個動作都要做**——(1) 跑 `scripts/validate-skill.sh` 把結果寫進對話摘要；(2) 摘要的「建議下一步」必須寫「交給 skill-review 審查」。
**為什麼**：validate 是機械檢查（行數、frontmatter、Gotchas 數量），review 是語意審查（rubric 8 維度）。兩者分工互補，跳過任一個都會讓盲點 ship 出去。
