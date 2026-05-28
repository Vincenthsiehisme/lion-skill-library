# Changelog — strategy-case-report

本檔記錄 skill 版本變更,只列「改了什麼」。

## 2.7.2 — 2026-04-27
- 清掉殘留的舊視覺/渲染用語(SKILL.md「視覺決策」、case-selection「配圖/image source appendix」、critique-scorecard「截點輸出/路徑 D」、model-library「轉成可上簡報的圖表」),統一改成「對話內 markdown 呈現」口徑。
- 批判機制改為「最小外顯」:scorecard 整張表仍不外顯,但最終報告最末(Cross-case 之後、Source Appendix 之前)新增一段「批判修正摘要」,四個必填欄位(過度推論修正、confirmed 降級、unknown 邊界、what to steal 降級),每案至少 1 條。
- SKILL.md 新增三條輸出規則:Output Chunking Rule(分批輸出順序、分批不再詢問)、Source Citation Rule(confirmed 五元素 + 品牌自述標注)、Style Constraint(全程不使用 emoji)。
- 新增 evals/trigger-queries.md:should-trigger / should-not-trigger 範例、與 prd-writer / critical-reviewer / market-analyst / product-proposal 的邊界對照表、產出品質 rubric(O01–O14)。
- analysis-phases.md 的 Phase 5.5 / Phase 6 措詞與上述調整同步。

## 2.7.1 — 2026-04-27
- 清除 reference 層殘留的 Sprint Mode / Full Mode 字樣;model-library 補入 Reference 讀取規則表;Phase 5「6 單元 + 1 定位句 = 7 頁」用詞一致化;高風險決策清單加開放條款;Hard Rules 重新編號改名為「補充規則」;trigger description 補強與 prd-writer / critical-reviewer 邊界,case-selection 加前置退出條款。

## 2.7.0 — 2026-04-27
- 移除 PDF / Slide / HTML artifact 渲染路徑,預設改為對話內 markdown 邊寫邊展示;移除 Phase 6.5 視覺決策、Phase 7 渲染、與 report-renderer 的銜接;純文字稿改為使用者明確要求才走;移除 Hard Rule 5/6;刪除 report-data-schema.md、build_report.py、report_schema.json;phases-4-7.md 改名 analysis-phases.md;description 改三段式;Gotchas 收斂為 6 條三段式。

## 2.6 — 2026-03-23
- 架構重設:新增 Phase 3.5 扎根搜尋、Phase 5 三欄輸出(confirmed / estimated / unknown);報告與渲染拆兩段 context;渲染交給 report-renderer skill。

## 2.5 — 2026-03-23
- 文件衝突修正、文件契約整理。

## 2.1–2.4 — 2026-03-20~21
- 視覺輸出路徑、視角組合判斷、Blueprint 規格、寫作規則內嵌。

## 2.0 — 2026-03-20
- 新增 Phase 5.5 深挖層、Phase 6 防守型批判、Autonomous Mode、批判沉默執行。

## 1.6
- 基礎版本。
