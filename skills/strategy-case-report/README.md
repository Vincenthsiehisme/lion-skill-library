# Strategy Case Report Skill

**版本：2.7.2 ｜ 更新：2026-04-27**

AI 主導全程的策略型案例報告生產 skill。人類只在兩個停止點提供 input，其餘由 AI 自主推進，輸出可直接用於策略判斷與提案決策的高品質 insight。

---

## 這個 skill 做什麼

不是整理案例，不是泛用型簡報生成。

AI 自主執行從案例搜尋、扎根搜尋、策略拆解、模型分析到批判修正的完整流程。遇到資訊缺口，AI 先提案再繼續，不等人告訴它下一步。深度分析的目標不是答完所有問題，而是把「能確認、能估算、無法判斷」切清楚。

**典型用途：**
- 市場趨勢月報
- 品牌案例觀察報告
- 策略型案例深拆報告
- 提案前置策略文件
- 決策前置研究

---

## 安裝方式

### Claude.ai
1. 前往 Claude.ai → Settings → Capabilities → Skills
2. 上傳 skill 資料夾（必須包含資料夾本身在根目錄）
3. 安裝完成後，在對話中提到「案例報告」「策略 deck」「品牌案例分析」「幫我研究」等關鍵字即會自動觸發

### Claude Code
將資料夾放入專案的 `.claude/skills/` 目錄：
```
your-project/
└── .claude/
    └── skills/
        └── strategy-case-report/
            ├── SKILL.md
            └── references/
```

---

## 執行模式

**單一模式：AI 自主執行，輸出在對話中以 markdown 格式邊寫邊展示。**

兩個停止點：
1. **啟動確認**：AI 完成 Intake 後，輸出一句話任務確認（含對決策情境的判斷），等 OK 才往前
2. **Shortlist 確認**：AI 輸出案例名單 + 每案決策相關性 + 視角組合說明，確認後全速執行至最終輸出

> **注意**：「全速執行」不覆蓋高風險決策清單。Phase 3.5 扎根搜尋若觸發替換案例條件（壓力層 + 張力層同時 unknown），AI 會停止並提案，等確認後繼續。

報告完成後 AI 主動提案是否整理成獨立 markdown 檔下載；使用者明確要求純文字稿時，改走 `references/plain-text-format.md` 的純文字格式。

---

## 報告結構

每個案例 7 頁分析：

| 頁面 | 功能 |
|------|------|
| Case in one line | 一句話定義案例價值 |
| The real problem | 定義品牌面對的真實市場問題 |
| The tension | 拆解 tension / insight，不停在表面觀察 |
| The strategic reframe | 說明品牌怎麼重做說法 |
| The system | 用 IMC / Journey 呈現執行系統 |
| Why it lands | 區分已被證明的事實與判讀（confirmed / estimated / unknown 三欄） |
| What to steal | 萃取可被借用的策略方法（scenarios 結構） |

整份報告結構：開場、案例總覽、3 案 × 7 頁、對照 Recap、結論（含知識邊界聲明）、來源附錄（含批判執行摘要與待補資料）。

---

## 分析框架

內建 12 個策略模型，按需配置，每案最多使用 3 個：

**核心模型庫（8 個）**
SWOT → TOWS、STP、JTBD、Brand Ladder、Brand Essence Pyramid、Golden Circle、Consumer Journey、CEPs

**條件式模型庫（4 個）**
4P、Binet & Field、COM-B、Kapferer Brand Identity Prism

模型使用規則：每案 2–3 個、不平均分配、嵌在案例邏輯裡而非章節主角。

---

## 檔案結構

```
strategy-case-report/
├── SKILL.md                    # 主流程（角色定位、Hard Rules、Phase 1–3、Gotchas）
└── references/
    ├── case-selection.md       # 案例篩選規則與 Shortlist 評估標準
    ├── root-search.md          # Phase 3.5 扎根搜尋規格（三層問題 + 兩階段搜尋）
    ├── analysis-phases.md      # Phase 3.5–6 完整執行規格
    ├── model-library.md        # 12 模型庫、決策樹、使用規則、圖表設計原則
    ├── writing-rules.md        # 寫作規則、各頁功能定義
    ├── deepdive-protocol.md    # Phase 5.5 三軸深挖追問協議
    ├── critique-scorecard.md   # Phase 6 批判問題庫（含可知/不可知批判層）
    └── plain-text-format.md    # 純文字稿輸出格式（使用者明確要求時讀取）
```

---

## 品質機制

**扎根搜尋（Phase 3.5）**
Shortlist 確認後，AI 對每個入選案例執行三層扎根搜尋（壓力層 / 張力層 / 邊界層），每層先搜直接資料，找不到才改找代理變數。兩層都找不到資料時，AI 主動提案替換案例。

**三欄輸出格式（Phase 5）**
每個分析單元輸出三欄：`confirmed`（直接資料支撐，附 source_ref）、`estimated`（代理推論，附 proxy + assumption）、`unknown`（無法判斷，說明 needed + impact）。深度分析的價值不是答完所有問題，而是把可知與不可知切清楚。

**AI 自主批判（Phase 5.5 + Phase 6）**
Phase 5.5 追問目標是「把 estimated 層的假設說清楚，把 unknown 層的問題拆成可回答的子問題」。Phase 6 批判問題庫含「可知與不可知是否切清楚」批判層，防止把 estimated 寫成 confirmed 的幻覺。批判內化執行，紀錄寫入報告來源附錄。

**成功標準**
案例選得準、問題切得準、Insight 足夠深、模型用得準而不重、可知與不可知切清楚、內容能扛質疑、每案都能被轉成提案素材。詳見 SKILL.md「成功標準」段。

---

## 適用環境

| 環境 | 支援狀況 |
|------|---------|
| Claude.ai（網頁 / App） | ✅ 完整支援 |
| Claude Code | ✅ 完整支援 |
| Claude Desktop / Cowork | ✅ 完整支援 |

所有環境均直接在對話中以 markdown 呈現報告，不需額外渲染工具。

---

## License

MIT

---

## 版本變更記錄

| 版本 | 日期 | 主要變更 |
|------|------|---------|
| v1.6 | — | 基礎版本 |
| v2.0 | 2026-03-20 | Phase 5.5 深挖層、Phase 6 防守型批判、Autonomous Mode、批判沉默執行 |
| v2.1–v2.4 | 2026-03-20 ~ 21 | 視覺輸出路徑、視角組合判斷、Blueprint 規格、寫作規則內嵌 |
| v2.5 | 2026-03-23 | 文件衝突修正、文件契約整理 |
| v2.6 | 2026-03-23 | **架構重設**：Phase 3.5 扎根搜尋、Phase 5 三欄輸出（confirmed / estimated / unknown）、報告與渲染拆兩段 context、報告渲染交給 report-renderer skill |
| **v2.7.0** | **2026-04-27** | **架構簡化**：移除 PDF / Slide / HTML artifact 等視覺渲染輸出路徑，預設改為「在對話中以 markdown 格式邊寫邊展示」，Phase 6 完成後 AI 自主提案是否整理成獨立 markdown 檔；移除 Phase 6.5 視覺決策、Phase 7 渲染輸出、與 report-renderer skill 的所有銜接；純文字稿改為使用者明確要求時才走的例外路徑；移除 Hard Rule 5/6（媒介確認 / A4 vs Slide）；移除 `report-data-schema.md`、`scripts/build_report.py`、`scripts/report_schema.json`；`phases-4-7.md` 改名為 `analysis-phases.md`；SKILL.md description 改為標準三段式（含觸發關鍵字 + DO NOT trigger）；Gotchas 收斂為 6 條三段式（症狀 / 正確做法 / 為什麼） |
| **v2.7.1** | **2026-04-27** | **內部清理**：(1) 清除 reference 層所有 Sprint Mode / Full Mode 殘留（v2.7.0 已單一化主流程，但子文件未同步）；(2) `model-library.md` 補入 SKILL.md 的 Reference 讀取規則表格；(3) Phase 5「6 個分析單元」與外顯「7 頁分析」的用詞一致化（明寫 6 單元 + 1 個 Case in one line 定位句 = 7 頁）；(4) 高風險決策清單加開放條款「任何錯了會讓整份報告方向偏掉的判斷」呼應 Gotcha G1；(5) Hard Rules 重新從 Rule 1 編號並改名為「Hard Rules（補充規則）」，移除「對應原則 1–4」的非直觀註腳；(6) Trigger description 補強與 prd-writer / critical-reviewer 的邊界（「找佐證 / 已有假設」應退出本 skill），`case-selection.md` 加前置退出條款。 |
| **v2.7.2** | **2026-04-27** | **審查修正**：(1) 清除 v2.7 後仍殘留的舊路徑詞——SKILL.md 原則 1「視覺決策」、`case-selection.md`「配圖使用時 / image source appendix」、`critique-scorecard.md`「截點輸出 / 路徑 D」、`model-library.md`「都要轉成可上簡報的圖表」全部改為 v2.7 對話內呈現口徑；(2) 原則 5 從「批判內化，不外顯」調整為「批判內化執行，最小外顯紀錄」——scorecard 整張表仍不外顯，但批判修正後**必須**產出一段「批判修正摘要」寫入最終報告（位置：報告最末，Cross-case 之後、Source Appendix 之前），含四個必填欄位（過度推論修正 / Confirmed 降級 / Unknown 邊界 / What to steal 降級），對應強化 Gotcha G3；(3) 新增三條輸出規則 Output Chunking Rule（分批輸出順序與不再詢問）、Source Citation Rule（confirmed 五元素 + 品牌自述標注）、Style Constraint（不使用 emoji）；(4) 新增 `evals/trigger-queries.md`，含 should-trigger / should-not-trigger 範例、與 prd-writer / critical-reviewer / market-analyst / product-proposal 的邊界判斷對照表、輸出品質 rubric（O01–O14）；(5) `analysis-phases.md` Phase 5.5 / Phase 6 措詞同步。 |
