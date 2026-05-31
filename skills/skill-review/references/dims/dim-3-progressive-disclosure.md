# Dim 3 — Progressive Disclosure

Progressive Disclosure 檢查的是：`SKILL.md` 是否只常駐放「模型每次都需要知道的判斷規則」，而把大型範例、背景資料、模板、API 文件、案例庫與腳本細節下放到 `references/`、`assets/`、`scripts/`，讓模型按需載入。

核心判準：skill 是資料夾，不是單一檔案；檔案系統本身就是 context engineering。

---

## Hard Gate

通常不因「沒有拆很多檔」單獨擋 ship，除非出現下列情況：

- `SKILL.md` 明確要求讀取某 reference / asset / script，但檔案不存在。
- 必要流程、模板或資料被拆到外部檔案，但 `SKILL.md` 沒有告訴模型何時讀取。
- 常駐內容過大到明顯影響觸發與執行，且大部分不是每次任務都需要。
- reference 結構造成錯誤執行，例如不同版本規則互相矛盾，且沒有優先序。

---

## Quality Gate

- `SKILL.md` 把大量偶發內容、長範例、完整模板、API 說明或背景知識全部常駐。
- 有 `references/`，但只是資料堆放，`SKILL.md` 沒有讀取時機或分流規則。
- 所有情境都要求讀完整 reference，沒有依任務類型分流。
- `assets/`、`scripts/`、`references/` 邊界混亂，導致模型不知道哪些是模板、哪些是規則、哪些是工具。
- reference 檔名或章節命名過於抽象，無法從使用者問題對應到應讀檔案。

---

## Style / Heuristic

這些只能作為建議，不應單獨擋 ship：

- `SKILL.md` 是否一定小於 500 行。
- reference 是否一定要分成固定數量的檔案。
- 目錄名稱是否完全符合某個模板。
- 每個 dim / reference 是否行數一致。

行數與檔案數只是訊號，不是結論。真正要判斷的是「常駐內容是否值得」與「按需載入是否可執行」。

---

## Score Rubric

**Score 5 — Excellent**
- `SKILL.md` 是清楚的 hub：常駐任務邊界、流程分流、gate、輸出規格與 gotchas。
- 大型內容已下放到 `references/`、`assets/`、`scripts/`，並有明確讀取時機。
- 使用者問單點問題時，模型能只讀相關 reference，不必全量載入。
- reference 命名與分類能反映任務語境，容易定位。

**Score 4 — Good**
- 已有合理拆檔，`SKILL.md` 大致維持精實。
- 少數內容仍可再下放，但不明顯影響執行。
- 讀取時機大致清楚，偶有模糊處。

**Score 3 — Acceptable**
- 有 references / assets / scripts，且主流程可用。
- `SKILL.md` 稍長或部分 reference 分流不足，但不至於讓模型迷路。
- 需要人工判斷哪些檔案該讀，但成本尚可接受。

**Score 2 — Weak**
- 有拆檔，但 `SKILL.md` 仍塞入大量偶發細節。
- reference 像資料倉庫，缺少讀取規則。
- 模型容易為了小問題讀太多內容，或漏讀必要檔案。

**Score 1 — Poor**
- 所有深度內容都塞在單一 `SKILL.md`，且任務明顯需要分層。
- reference 缺失、混亂或與主流程矛盾。
- 常駐 token 成本明顯高於 skill 提供的穩定性價值。

**N/A**：極小型、無模板、無腳本、無背景資料、只處理單一簡短任務的 skill 可標 N/A，但需說明為何不需要 progressive disclosure。

---

## Reviewer 判讀問題

- [ ] `SKILL.md` 是否只放每次執行都需要的判斷規則？
- [ ] 大型範例、模板、背景知識、API 文件是否已下放？
- [ ] 使用者只問單點問題時，模型是否知道只讀哪個檔？
- [ ] references / assets / scripts 的責任邊界是否清楚？
- [ ] 拆出去的內容是否仍能被主流程正確召回？
- [ ] 檔案命名是否能讓 reviewer 快速定位問題來源？

---

## 常見誤判

### 誤判 1：看到 `SKILL.md` 超過 500 行就直接判不可 ship

行數只是 heuristic。若內容都是每次執行都必要的安全規則、輸出契約或工具說明，偏長不一定錯；若 200 行裡有大量偶發背景，也可能需要拆。

### 誤判 2：把「有 references」等同於 progressive disclosure 良好

有檔案不代表有分流。要看 `SKILL.md` 是否說清楚何時讀、讀哪個、讀完如何影響決策。

### 誤判 3：為了拆檔而拆檔

過度拆檔會讓模型頻繁跳轉，反而增加定位成本。拆檔應服務於任務分流、降低常駐成本與維護一致性。
