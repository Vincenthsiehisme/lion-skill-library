# GitHub Log 條目寫入規範

> skill-summary 主流程「維度 5 — Tag 分類 + 產 GitHub log 條目」的詳細指引。
> 主檔保留決策邏輯,寫入格式、URL 模板、各段撰寫要求等機械細節在此。

---

## 路徑規則

### 單 skill 內錯誤
```
logs/{skill-name}/{tag}.md
```

範例：
- `logs/erp-schema/coverage-gap.md`
- `logs/prd-writer/intent-misread.md`
- `logs/task-dispatcher/coverage-stale.md`

### 跨 skill 衝突
```
logs/cross-skill/scope-overlap.md
```

**注意**：跨 skill 衝突一律放在這個檔,不放進個別 skill 目錄。理由是這類問題不屬於單一 skill 的內部錯誤,獨立放才不會被誤算。

---

## 寫入格式

### 標準格式（單 skill）

```markdown
## YYYY-MM-DD — <一句話標題>

**Symptom**：<具體事實,含情境>
**Root cause**：<推測的根因>
**Suggested fix**：<優化方向,不寫具體 SKILL.md 改動>
```

### Cross-skill 特殊格式

```markdown
## YYYY-MM-DD — <一句話標題>

**Symptom**：<具體事實>
**Root cause**：<推測的根因>
**Suggested fix**：<優化方向>
**Skills involved**：[skill-A] ↔ [skill-B]
```

`Skills involved` 欄是 cross-skill 特有,**必填**,且 skill 名稱要按字母排序（`[skill-evolve] ↔ [skill-review]` 而非 `[skill-review] ↔ [skill-evolve]`）。理由是字母排序方便 skill-evolve 用 grep 比對「同一對 skill 是否累積 ≥ 2 次」（R7 規則觸發條件）。

---

## 首次建檔規則

判斷依據：使用者過去是否在該 skill + tag 組合上產過 log。有疑慮直接問使用者。

### 首次建檔（new URL）

Deep link 模板：
```
https://github.com/{user}/claude-evolve/new/main/logs/{skill}?filename={tag}.md
```

**使用者需要做的事**：

1. 點 deep link → GitHub 跳到「新建檔案」頁
2. 加 H1 標題到檔案開頭：
   ```markdown
   # {skill-name} — {tag} 錯誤累積
   ```
3. 空一行,貼 log 條目
4. Commit

5. **同步更新 `index.md`**——在「Skill 內部錯誤」段加一行：
   ```
   - {skill-name} / {tag} — 自 YYYY-MM-DD 起累積
   ```
   index.md 編輯連結：`https://github.com/{user}/claude-evolve/edit/main/index.md`

### Append 既有檔（edit URL）

Deep link 模板：
```
https://github.com/{user}/claude-evolve/edit/main/logs/{skill}/{tag}.md
```

**使用者需要做的事**：

1. 點 deep link → GitHub 跳到「編輯檔案」頁
2. 滾到檔案末尾,空一行
3. 貼 log 條目
4. Commit
5. **不用動 index.md**

---

## URL 變數值來源

| 變數 | 來源 | 範例 |
|---|---|---|
| `{user}` | 使用者首次提供,後續對話沿用 | `Vincenthsiehisme` |
| `{skill}` | 主流程維度 1 識別的目標 skill 名 | `erp-schema` |
| `{tag}` | 維度 5.1 自動分類後 + 5.2 confirm 的 tag | `coverage-gap` |

預設：repo 名 = `claude-evolve`、分支 = `main`。若使用者改用其他名稱會主動提供。

---

## Cross-skill 衝突的特殊處理

跨 skill 衝突（Step 0 類型 D）的 log 寫入有三個特殊規則：

1. **路徑固定**：永遠寫到 `logs/cross-skill/scope-overlap.md`,不分 skill 目錄
2. **必加 Skills involved 欄**：列涉及的 skill 對,字母排序
3. **不更新 index.md**：cross-skill 已預設在 index.md 中

但 Gotcha 草稿仍需**雙向處理**——分別給兩個 skill 都產一份 Gotcha 草稿(主檔 G4)。Log 條目只產一份，因為 cross-skill log 本身就涵蓋雙方資訊。

---

## Symptom 段的撰寫要求

**具體可驗證的事實**,不是模糊感受。對齊主檔維度 2 的標準：

| ❌ 模糊 | ✅ 具體 |
|---|---|
| 「skill 不太準」 | 「使用者問 tppdm/bookm 的 FK,erp-schema 沒指出 FK 是 tpno」 |
| 「漏掉了」 | 「Step 0 應推 trigger-miss,但實際分類為 coverage-gap」 |
| 「答錯了」 | 「prd-writer 觸發後直接寫模板,沒判讀使用者在模糊探索階段」 |

---

## Root cause 段的撰寫要求

**推測**根因,不是斷言。措辭模式：

- 「references/X.md 漏寫了 Y 規則」
- 「description 缺 Z 觸發詞」
- 「主流程沒判讀 W 情境」

**不要寫**：「使用者表達不清」「Claude 理解錯誤」(歸因到使用者或 Claude 對 skill 改善無幫助,而 skill 改善才是 log 的目的)。

---

## Suggested fix 段的撰寫要求

**優化方向**,不寫具體 SKILL.md 改動細節：

- ✅ 「補一份 references/tppdm-relations.md 集中關聯規則」
- ✅ 「Step 0 加意圖判讀分流」
- ✅ 「description 補『欄位設計』『table 結構』兩個觸發變體」
- ❌ 「在 SKILL.md 第 47 行 str_replace XXX 為 YYY」（太細,動筆是 skill-create 或使用者的事）
- ❌ 「應該重寫整個 SKILL.md」（太粗,沒給可行方向）

理由：log 是給 skill-evolve 做趨勢診斷用的,提供「方向」就夠;具體 patch 細節留給 evolve 第三段建議產出時組裝。

---

## 跟 Gotcha 草稿的區別

注意 log 條目跟 Gotcha 草稿是**兩件不同的事**：

| 項目 | Gotcha 草稿 | Log 條目 |
|---|---|---|
| **寫入位置** | 該 skill 的 SKILL.md Gotchas section | GitHub `claude-evolve` repo 的 logs/ |
| **訊號層級** | 「下次別再犯」的具體指引 | 「這個錯誤又發生了」的累積證據 |
| **內容三段** | 症狀 / 正確做法 / 為什麼 | Symptom / Root cause / Suggested fix |
| **使用者動作** | 手動貼回 SKILL.md | 點 deep link 跳到 GitHub 貼 |
| **讀者** | Claude 下次跑該 skill 時讀 | skill-evolve 用 web_fetch 讀回做趨勢診斷 |

**為什麼兩件事都要做**：Gotcha 是「點對點防線」(直接擋下次)、log 是「趨勢累積」(看是否該結構改動)。一個沒有另一個都不完整。

---

## 邊界情境處理

### Q1：同一個錯誤要寫兩份還是一份？

如果使用者描述的錯誤需要同時補 Gotcha **且**值得產 log（多數重要錯誤都是）,**兩份都產**：

1. 跑既有維度 1–4 → 產 Gotcha 草稿（交付物 A + B）
2. 跑維度 5 → 產 log 條目 + deep link（交付物 C）

兩份內容不會重複——Gotcha 是「下次怎麼做」,log 是「這次發生了什麼」。

### Q2：跨 skill 衝突要寫幾份 Gotcha 跟幾份 log？

依主檔 G4——**Gotcha 雙向處理**（給 X 加觸發詞 Gotcha + 給 Y 加 anti-trigger Gotcha）。

但 log **只產一份到 cross-skill/scope-overlap.md**,不重複寫到兩個 skill 的目錄下。

### Q3：log 寫錯了能改嗎？

可以,但建議不直接改既有紀錄,而是：

1. 在檔尾加一條更正紀錄,註明對應日期
2. 嚴重錯誤可請使用者直接編輯 markdown

理由：log 的時間語意很重要,改既有紀錄會破壞「事件發生的時序」這個訊號。

### Q4：使用者 GitHub user 名沒提供怎麼辦？

第一次產 deep link 前主動詢問一次：「請提供你的 GitHub user 名（用於組 deep link，例如 `Vincenthsiehisme`）」。

取得後**在當前對話內沿用**,不需要每次都問。

---

## 不更新 index.md 的後果（提醒使用者）

如果使用者跳過 index.md 同步：

- skill-evolve 跑診斷時讀不到該 log 檔的存在,會以為沒累積
- 該筆紀錄等於白寫

所以首次新建 log 檔時,主檔交付物 C 的「同步維護」提醒**不能省**——強制把 index.md 連結也給使用者。
