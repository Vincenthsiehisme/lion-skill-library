# Common Failure Patterns 快查表

審查時常見的 5 種致命模式。出現任一即在 review 報告中標 🔴 Critical Issue。

這份檔案在審查時**按需讀取**——當主檔的 Step 0 判讀後決定要做語意審查時，建議併同 dim 檔一起讀。

---

## ❌ Pattern 1：Description 寫給人看不是給模型看

**症狀**：description 像產品說明文，沒有觸發詞、沒講「使用者問什麼會觸發」。

description 是觸發信號，必須含具體觸發詞和情境。

❌ Bad:
```
"A helper for the billing module"
```

✅ Good:
```
"處理發票、按比例計費、Stripe webhook 時觸發。
觸發關鍵字：charge、invoice、refund、proration、webhook"
```

**對應 dim 評分**：dim-1 = 1–2 分。

---

## ❌ Pattern 2：沒有 Gotchas 段

**症狀**：整份 SKILL.md 找不到 `## Gotchas` 章節，或 Gotchas 全是「請小心 X」「使用時要謹慎」這種假設性警告。

Gotchas 是 skill 中訊號最高的內容。沒寫等於不完整。Gotchas 必須來自**真實 Claude 失敗案例**，不是想像出來的可能風險。

**對應 dim 評分**：dim-2 = 1 分（缺段）；2 分（有但全空話）。

---

## ❌ Pattern 3：過度規範步驟（Railroading）

**症狀**：Step 1→2→3→...→10 線性步驟，每一步都寫死要怎麼問、要 Claude 回什麼。

過度規定的後果：Claude 無法處理 edge case，使用者敘述跟步驟順序不對應就卡住。

優先用「意圖 + 約束」取代條列步驟：

❌ Bad:
```
Step 1: 問使用者 X 是什麼
Step 2: 問使用者 Y 是什麼
Step 3: 把 X+Y 組合成 Z
```

✅ Good:
```
維度 1 — 確認 X 與 Y 都已釐清
（從使用者既有訊息能判讀的就判讀，不必逐一問）
```

**對應 dim 評分**：dim-4 = 1–2 分。

---

## ❌ Pattern 4：單檔扁平化

**症狀**：整個 skill 只有一個 SKILL.md，沒有 `references/` 子檔、沒有 `scripts/`、沒有 `assets/`。

Skill 是**資料夾**不是**檔案**。沒有子檔代表：
- 沒做 progressive disclosure
- 重複內容沒地方下放
- 範本/腳本沒地方放

**對應 dim 評分**：dim-3 = 1–2 分。

---

## ❌ Pattern 5：有狀態 skill 不用 `${CLAUDE_PLUGIN_DATA}`

**症狀**：skill 會寫日誌、存設定，但路徑寫死在 skill 目錄下（例如 `./logs/`）。

skill 升級或重新部署時，目錄下的檔案會被覆蓋——所有狀態遺失。

正確做法：用環境變數 `${CLAUDE_PLUGIN_DATA}` 指向使用者資料目錄，存放穩定狀態。

**對應 dim 評分**：dim-7 = 1–2 分（如該 skill 有狀態需求）。

---

## 與 dim 檔的分工

| 檔案 | 用途 | 何時讀 |
|---|---|---|
| 本檔案 | **快查反模式**：直接判 🔴 Critical | 全面審查、特定診斷時併讀 |
| `dims/dim-N-*.md` | **分等級評分**：5/4/3/2/1 詳細判準 | 全面審查時依 Step 0 對照表選讀 |

兩者不衝突——本檔抓「死線」，dim 檔給「分數」。
