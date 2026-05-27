---
name: skill-summary
description: |
  Skill 錯誤沉澱顧問。當使用者描述剛才用某個 skill 時踩到坑、skill 沒抓到該抓的事、輸出不如預期時觸發。把錯誤模式結構化（症狀/正確做法/為什麼），產生可貼入該 skill Gotchas section 的草稿；若判定為重要錯誤，同步產出可貼到 GitHub `claude-evolve` repo 的 log 條目供 skill-evolve 做趨勢診斷。

  觸發關鍵字：這次踩坑、補一條 Gotcha、寫進 Gotchas、沉澱錯誤、skill 沒觸發、skill 沒抓到、skill 漏掉、skill 又出錯、剛才 skill 沒做對、補 skill 的踩坑、skill 又踩雷、Gotchas 補一條。

  DO NOT trigger for: 審 skill 結構（用 skill-review）、規劃新 skill（用 skill-brain）、找 skill 範例（用 skill-search）、寫新 SKILL.md（用 skill-create）、寫產品 PRD（用 prd-writer）、批判性概念設計審查（用 critical-reviewer，那是審 PRD/方案的麥肯錫式批判）、累積錯誤趨勢診斷（用 skill-evolve，那是讀 GitHub log 做結構性建議；summary 產 log 條目、evolve 讀 log 做診斷）。
version: 0.1.0
category: summary
---

# Skill Summary — Skill 錯誤沉澱顧問

定位：skill 生命週期的**回饋階段**。使用者用 skill 踩坑後，把錯誤結構化為 Gotcha 條目，產草稿給使用者貼回該 skill 的 Gotchas section；若判定為重要錯誤，同步產出 GitHub `claude-evolve` repo 的 log 條目 + deep link，使用者點連結貼上即可，供 skill-evolve 做累積診斷。

不做：不審查 skill 結構、不修改 Gotchas 以外的段落、不自動寫入檔案（產草稿給使用者手動套用）、不做趨勢診斷（讀 GitHub log 做趨勢是 skill-evolve 的職責）。

---

## Step 0：判讀錯誤類型

每次進入 summary，**先判讀踩到的是哪一種坑**——不同類型對應不同處置：

| 錯誤類型 | 判讀訊號 | 處置 |
|---|---|---|
| **A. 觸發失敗** | 「skill 沒觸發」「描述了但沒進入該 skill」 | 寫 Gotcha 給該 skill；通常是 description 觸發詞不夠明確的副作用，建議併同呼叫 `skill-review` 的 dim-1 |
| **B. 過程踩坑** | 「進到 skill 了但流程中漏問 X」「該檢查的沒檢查」 | 寫 Gotcha 給該 skill；最常見的類型 |
| **C. 輸出不對** | 「skill 給的答案不對」「結構錯了」 | 寫 Gotcha 給該 skill；要釐清是「指令不清」還是「Claude 自己錯」 |
| **D. 跨 skill 路由錯** | 「該用 X skill 結果觸發到 Y」 | 雙向處理：給 Y 加 anti-trigger Gotcha、給 X 加觸發詞 Gotcha |

判讀不出時直接走 B（最常見），讓使用者描述細節時自然分流。

---

## Step 0.5：判斷是否產 GitHub log 條目

判讀完錯誤類型後，**先判斷是否值得產 log 條目給使用者貼到 GitHub `claude-evolve` repo**——不是每個踩坑都要,否則 log 倉會被雜訊淹沒。

### 客觀規則（任一成立 → 產 log 條目）

| # | 規則 | 訊號 |
|---|---|---|
| 1 | 使用者明確不滿訊號 | 「不對」「又錯了」「應該要 X 你沒做」「為什麼沒抓到」 |
| 2 | 錯誤導致實質返工 | 使用者要重問、手動補資訊、切換 skill 重來 |
| 3 | 跨 skill 衝突（Step 0 類型 D） | 一律產 log 條目給 `cross-skill/scope-overlap.md` |

### 主觀規則（補充用）

4. **Claude 自評有結構性訊號**——這次答錯不是偶然,是 reference / description 結構就有缺

### 不產 log 的情境

- 使用者改主意、追加新需求（任務變了,不是 skill 錯）
- 純粹 typo 或單次失誤（無結構性意義）
- 使用者只是想換角度問同一問題

### 判斷後的動作

| 判斷結果 | 動作 |
|---|---|
| **不產 log 條目** | 跑既有流程（維度 1–4）,結束 |
| **產 log 條目** | 跑既有流程 + 維度 5（tag 分類 + 產 log 條目 + GitHub deep link） |

---

## 核心流程：四個維度的錯誤萃取

**依 Step 0 判讀的錯誤類型執行不同模式**：

| 錯誤類型 | 執行模式 |
|---|---|
| **A、B、C** | 跑單條 Gotcha 流程（4 個維度走一輪，產 1 份草稿） |
| **D 跨 skill 路由錯** | **雙向處理**——對誤觸發的 Y 跑一輪、對該觸發的 X 跑一輪，產 2 份草稿（範本見 `assets/gotcha-template.md` 變體 2） |

skill-summary 的工作是把使用者描述的錯誤，萃取成標準 Gotcha 三段式結構。**不必逐一機械式提問**——能從敘述判讀的就判讀，缺什麼補什麼。各維度詳細寫法見 `references/gotcha-extraction-guide.md`。

### 維度 1 — 目標 skill 識別

確認三件事：
- **哪個 skill 踩到坑**：使用者必須明確告知（路徑或名稱）
- **既有 Gotchas 狀態**：跑 `scripts/inspect-gotchas.sh <skill-dir>` 取得 GOTCHAS_LINE / COUNT / NEXT_ID / STATUS
- **是否該寫 Gotcha**：如果 STATUS=over-limit（已 6+ 條），先建議使用者考慮**重構 skill** 而非加第 7 條（呼叫 skill-review 評估）

**紅燈**：如果使用者沒指定 skill 名稱、或描述的不是 skill 觸發的場景，回頭釐清。

### 維度 2 — 錯誤事實萃取（症狀）

從使用者敘述中萃取**具體可驗證的事實**，不是模糊感受：

| ❌ 模糊敘述 | ✅ 具體事實 |
|---|---|
| 「skill 不太準」 | 「使用者貼出 SKILL.md 問是否要重寫，skill-review 沒先跑 validate 就直接給評分」 |
| 「我覺得卡卡的」 | 「skill-brain 在維度 1 連續問了 3 個重複問題,使用者已經在開頭講過答案」 |
| 「XX 出錯」 | 「使用者說『幫我寫 PRD』,skill-prd-writer 直接跳到模板填寫,沒做模糊探索」 |

具體事實是 Gotcha 的「症狀」段。**模糊敘述要追問細節**，不接受。

### 維度 3 — 正確做法判讀

從錯誤事實推出「下次該怎麼做才對」。三種來源：
- 使用者直接告知：「應該先問 X 再做 Y」
- 從鄰居 skill 的處理方式借鏡：「skill-brain 維度 1 是這樣處理的」
- 從原則推導：「skill 設計原則是 X，所以該 Y」

**寫法**：一句話、動詞開頭、可執行（不寫「請小心 X」這種空話）。

### 維度 4 — 為什麼有見解

不只是寫「因為這樣不好」，要給**設計層面的洞察**：
- 違反了哪條設計原則？
- 為什麼這個錯誤容易發生？
- 為什麼這個正確做法是對的？

「為什麼」是 Gotcha 中**訊號最高**的一段——它讓 Claude 下次能舉一反三，而非只記住單一情境。

### 維度 5 — Tag 分類 + 產 GitHub log 條目（僅 Step 0.5 判定為「產 log」時執行）

**僅當 Step 0.5 判定為「產 log」才跑此維度**。不產 log 時跳過。

#### 5.1 — 自動分類 tag

從 Step 0 已判讀的錯誤類型推 tag：

| Step 0 類型 | 推薦 tag |
|---|---|
| A. 觸發失敗 | `trigger-miss` 或 `trigger-overreach` |
| B. 過程踩坑 | `coverage-gap` / `intent-misread` / `coverage-stale` |
| C. 輸出不對 | `output-drift` |
| D. 跨 skill 路由錯 | `routing-error` 或 `scope-overlap` |

**7 個 tag 的詳細定義見 `references/log-conventions.md`**——若邊界模糊不確定該選哪個,讀那份檔案。

#### 5.2 — 跟使用者 confirm tag

**這步驟不能省**——智能判斷會飄,confirm 是穩定 log 品質的關鍵。

```
🏷️ 建議 tag：<auto-classified-tag>
　 替代選項：<alternative-tag>(若邊界模糊)
　 確認後產出 log 條目 + GitHub 編輯連結
```

使用者可選擇接受、改 tag、或取消產 log 動作。

#### 5.3 — 產 log 條目

確認 tag 後,產出格式化好的 log 條目（純 markdown 文字,讓使用者複製,5 行內,Symptom / Root cause / Suggested fix 三段）。跨 skill 衝突額外加 `Skills involved` 欄,字母排序。

**完整寫入規範**（路徑規則、寫入格式、各段撰寫要求、邊界情境處理）見 `references/log-conventions.md`。

#### 5.4 — 產 GitHub deep link

依**檔案是否首次建立**選 URL 模板：

| 情境 | URL 類型 | 額外動作 |
|---|---|---|
| 首次新建（該 skill+tag 組合從未產過 log） | `new/main/logs/{skill}?filename={tag}.md` | 提示使用者加 H1 標題 + **同步更新 index.md** |
| Append 既有 | `edit/main/logs/{skill}/{tag}.md` | 不用動 index.md |
| Cross-skill 衝突 | `edit/main/logs/cross-skill/scope-overlap.md` | 永遠是 edit URL（已 placeholder） |

**判斷依據**：使用者過去是否在該組合上產過 log。有疑慮直接問使用者。

**URL 模板細節與 index.md 同步規範**見 `references/log-conventions.md`。

#### 5.5 — 取得 user 名

第一次產 deep link 時若使用者沒在訊息中提供 GitHub user,詢問一次：「請提供你的 GitHub user 名（用於組 deep link）」,後續對話沿用。

預設假設：使用者已建立 `claude-evolve` repo 在 main 分支（依 README.md 規範）。

---

## 輸出規格（雙交付物 / 三交付物）

**產不產 log 決定交付物數**：
- Step 0.5 判定不產 log → 雙交付物（A + B）
- Step 0.5 判定產 log → 三交付物（A + B + C）

### 交付物 A：Gotcha 草稿（可直接貼入）

格式對齊Gotcha 三段式：

    ### G<N>：<症狀的一句話標題>
    **症狀**：<具體事實，含情境>
    **正確做法**：<一句話、動詞開頭、可執行>
    **為什麼**：<設計層面的洞察>

`<N>` 由 `inspect-gotchas.sh` 提供的 `NEXT_ID` 決定。

### 交付物 B：插入指引

明確告訴使用者怎麼把草稿放進去：

```
━━━━━━━━━━━━━━━━━━━━━━━
📝 Gotcha 草稿產出

【目標 skill】<skill-name>
【SKILL.md 路徑】<path>
【建議插入位置】第 <LAST_LINE+1> 行（最後一條 Gotcha 之後）
【新編號】<NEXT_ID>
【現況】skill 目前有 <COUNT> 條 Gotchas
【插入後狀態】<COUNT+1> 條（<判定: ok / 接近上限 / 已超上限>）

📋 草稿內容（直接複製貼入）:
<草稿>

⚠️ 提醒（如有）:
- <若 COUNT 將 ≥ 6,提醒考慮重構而非新增>
- <若觸發詞需同步調整,提醒呼叫 skill-review>
━━━━━━━━━━━━━━━━━━━━━━━
```

**為什麼產草稿不直接寫入**：跟 skill-review 的「不自動修改」原則一致——Gotchas 是高訊號內容，使用者應該過目；此外 summary 在使用者踩坑情境下被觸發，這時直接改檔風險高，產草稿讓使用者明確決策更安全。

### 交付物 C：GitHub log 條目 + Deep Link（僅產 log 時）

```
━━━━━━━━━━━━━━━━━━━━━━━
📊 GitHub Log 條目產出

【Tag】<final-tag>(使用者 confirm 後)
【目標路徑】logs/<skill>/<tag>.md (或 logs/cross-skill/scope-overlap.md)
【檔案狀態】首次新建 / append 既有

📋 Log 條目內容(複製):
<格式化好的 5 行 log 條目>

🔗 GitHub Deep Link(點擊跳到編輯頁):
<根據檔案狀態給 edit URL 或 new URL>

📌 操作步驟:
1. 點上方 deep link 跳到 GitHub 編輯頁
2. (僅首次新建) 把預設內容換成 H1 標題 + 上面的 log 條目
   (append 情境) 在檔案末尾貼上 log 條目,空一行隔開既有紀錄
3. Commit changes

⚠️ 同步維護(僅首次新建檔案時):
請也順手更新 index.md 加入這行:
- <skill-name> / <tag> — 自 YYYY-MM-DD 起累積
編輯連結: https://github.com/<user>/claude-evolve/edit/main/index.md
━━━━━━━━━━━━━━━━━━━━━━━
```

**為什麼要單獨產交付物 C**：跟 A/B（給使用者貼回 SKILL.md）不同,C 是「給機器讀」的累積資料寫入入口。分開呈現讓使用者清楚知道「這次踩坑除了補 Gotcha,還在進化系統留下了一筆紀錄」。

---

## 與其他 skill 的銜接

### 正向銜接

| 上下游 | 動作 |
|---|---|
| 上游：使用者使用任何 skill 踩坑 | 直接呼叫 summary，附上 skill 名稱 + 錯誤敘述 |
| 下游：使用者手動套用草稿 | 用 str_replace 或編輯器把草稿貼進 SKILL.md |
| 下游：`skill-review`（特殊情境） | 如果 over-limit 或觸發詞需調整,建議呼叫 review 評估重構 |
| 下游：使用者手動貼 log 到 GitHub | 點 deep link 跳到 `claude-evolve` repo,貼上交付物 C 的 log 條目 |
| 下游：`skill-evolve`（累積觸發） | 同 tag 累積 ≥ 3 條、或 cross-skill 同對 skill ≥ 2 次,主動建議呼叫 evolve 跑趨勢診斷 |

### Summary 內部不處理的事

- 審查 skill 結構 → 應走 `skill-review`（summary 只寫 Gotcha,不評分）
- 規劃新 skill → 應走 `skill-brain`
- 修改 Gotchas 以外的段落 → 拒絕——避免變成隱性 review/edit
- 自動寫入 SKILL.md → **不做**——只產草稿,使用者手動套用
- 自動寫入 GitHub repo → **不做**——只產 log 條目 + deep link,使用者手動貼
- 批判性概念設計審查（PRD/方案）→ 應走 `critical-reviewer`（麥肯錫式批判，不同於 Gotcha 沉澱）
- 累積錯誤趨勢診斷 → 應走 `skill-evolve`（summary 產 log、evolve 讀 log,不要在 summary 內讀回 log 做分析）

如果在 summary 對話中**發現使用者要的不是補 Gotcha**（例如其實要全面審查），直接告知並導向對應 skill，**結束 summary 對話**。

---

## Gotchas

### G1：把模糊感受當成 Gotcha 寫入
**症狀**：使用者說「skill 不太準」，summary 直接寫成 Gotcha「skill 有時不準」。
**正確做法**：要求使用者具體敘述——「不準」是什麼意思？哪一步？什麼情境？沒有具體事實就不寫 Gotcha。
**為什麼**：模糊 Gotcha 違反「必須來自真實失敗」原則,寫進去反而拉低 skill 品質,被 skill-review 打回。

### G2：跳過必要前置步驟直接動筆
**症狀**：兩種模式：
（a）沒檢查目標 skill 的 Gotchas 現況,直接寫一條編號 G1 的草稿；
（b）自動分類 tag 後,沒跟使用者 confirm 就直接產 log 條目 + deep link。
**正確做法**：
（a）每次都先跑 `inspect-gotchas.sh`,取得 NEXT_ID 和 LAST_LINE。
（b）每次自動分類 tag 後**強制 confirm**——即使「看起來很確定」也要問,使用者可改 tag 或取消產 log 動作。
**為什麼**：兩者根因相同——summary 在踩坑情境下被觸發,這時直接動筆風險最高。NEXT_ID 錯了會跟既有 Gotcha 衝突;tag 錯了會誤導 skill-evolve 的趨勢診斷規則(特別是 coverage-gap vs intent-misread、trigger-miss vs trigger-overreach 兩組邊界模糊)。**不論寫入 SKILL.md 還是 GitHub log,「先確認 → 再動筆」是不能省的紀律**。

### G3：在 over-limit 情況下硬塞第 7 條
**症狀**：目標 skill 已有 6 條 Gotcha，inspect 報告 STATUS=over-limit，summary 還是寫第 7 條。
**正確做法**：建議使用者**先呼叫 skill-review 評估**——6 條以上代表 skill 結構可能該重構,不是繼續加 Gotcha。
**為什麼**：Gotchas 是「常見錯誤的防線」,超過 6 條代表 skill 設計本身有問題,不是補 Gotcha 能解的。Gotcha 3–6 條為佳（避免 dim-2 過量被打回）。

### G4：把跨 skill 路由錯只給一邊寫 Gotcha
**症狀**：使用者說「該用 skill-X 結果觸發到 skill-Y」,summary 只給 X 加 hard trigger,沒給 Y 加 anti-trigger。
**正確做法**：跨 skill 路由錯（Step 0 類型 D）必須**雙向處理**——給 Y 加 anti-trigger Gotcha + 給 X 加觸發詞 Gotcha。
**為什麼**：路由錯是雙方共病——X 觸發詞不夠強 + Y 沒擋住越界。只修一邊下次還會錯。

### G5：自動寫入 SKILL.md
**症狀**：產出 Gotcha 草稿後，summary 直接用 str_replace 寫進使用者的 SKILL.md。
**正確做法**：**只產草稿 + 插入指引**，使用者自己決定要不要套用、何時套用。
**為什麼**：跟 skill-review「不自動修改」原則一致；Gotchas 是高訊號內容,使用者應該過目；summary 觸發情境是「剛踩坑」,直接改檔風險高。

### G6：GitHub log 流程的兩種失誤
**症狀**：兩種模式：
（a）**雜訊也寫進 log**：使用者改主意、純 typo、或只是換角度問同問題,summary 也判定要產 log,導致 GitHub repo 被雜訊淹沒;
（b）**Deep link 組錯**：把 `edit/` 跟 `new/` 路徑搞混(編輯既有檔卻給 new URL,GitHub 會建重複檔),或忘記提醒「首次新建檔要加 H1 標題 + 更新 index.md」。
**正確做法**：
（a）嚴格套用 Step 0.5 的客觀規則——使用者明確不滿訊號 / 實質返工 / 跨 skill 衝突,**任一成立才產 log**。判斷不出時優先「不產 log」。
（b）產 deep link 前**先判斷檔案是否首次建立**——是首次給 `new/` URL 並提示「需加 H1 + 更新 index.md」;append 給 `edit/` URL。有疑慮直接問使用者。
**為什麼**：兩者根因都是「對 GitHub 流程不夠紀律」。雜訊讓 R1 規則失準,使用者誤改沒問題的 skill;link 組錯造成資料分散、index.md 沒同步讓 evolve 找不到 log。**這套流程能跨 session 累積資料的前提是每筆紀錄都乾淨可信**——失誤一旦發生,後續清理成本很高。
