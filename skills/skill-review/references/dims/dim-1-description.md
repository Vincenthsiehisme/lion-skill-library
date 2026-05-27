# Dim 1 — Description / Trigger

The description is the primary triggering mechanism. Claude scans it to decide "is there a skill for this request?"

**Score 5 — Excellent**
- Contains concrete trigger phrases ("trigger on...", "use when user says...")
- Describes the specific contexts and tasks it handles
- Has a slight "pushy" quality — nudges Claude to use the skill proactively
- Distinct from other skills (no ambiguity about when to use this vs another)

**Score 4 — Good**
- Has trigger phrases but they're too broad or overlap with other skills
- "Pushy" quality present but could be stronger

**Score 3 — Acceptable**
- Describes what the skill does, but trigger phrases are implicit
- No explicit "use when..." framing
- Might under-trigger in edge cases

**Score 2 — Weak**
- Vaguely describes scope but mixes human-readable summary with model triggers
- Trigger is guessable but unreliable

**Score 1 — Poor**
- Written as a human-readable summary, not a trigger signal
- Generic description ("a helper for X") with no specificity
- Would cause Claude to under-trigger or miss relevant requests

**Hard Limits(平台硬規則,違反直接 Score 1 + Critical Issue)**

- **description ≤ 1024 字元(byte)**:Anthropic 平台 frontmatter 對 `description` 欄位有 1024 上限,超過會被拒收、skill 根本載不進來。中文一字 3 byte,實務上中英混寫到約 340 中文字就會逼近上限。
  - 違反處理:不論其他維度表現,dim-1 一律判 **Score 1**,列為 🔴 Critical Issue,**ship-blocker**——使用者必須先瘦身才能繼續審其他維度。
  - 警戒線:byte ≥ 900 雖未違反,但已逼近上限,標 🟡 提醒瘦身(常見手法:把「DO NOT trigger」清單下放到 SKILL.md 正文、合併重複觸發關鍵字)。

---

## Specific Checks（對應 skill-create 寫作規範）

這 6 條是 skill-create 在 `references/section-recipes.md`「Description 段」訂下的具體寫作規範。review 必須逐條檢查，違反條數對應到下方「Score Downgrade」表的降級判準。

| # | 規範 | 通過判準 | 違反處理 |
|---|---|---|---|
| **SC-1** | 定位句含「當 X 時觸發」 | description 首段含「當…時觸發」字樣 | 違反 → 標 🟡（語意夠強可豁免，但需在報告註明） |
| **SC-2** | 觸發關鍵字 8–12 個 | 用頓號分隔的觸發詞數量介於 8–12 | 6–7 或 13–15 標 🟡；< 6 或 > 15 標 🔴 |
| **SC-3** | 觸發關鍵字用頓號分隔、無引號包裹 | 觸發詞段內無「」『』" " ' ' 包裹觸發詞 | 違反 → 標 🟡（可能有刻意原因，需人工確認） |
| **SC-4** | DO NOT trigger 點名 2–5 個鄰居 skill | 含括號 +「-」連字符 token 且 ≥ 2 個 | 0 個 → 標 🔴；1 個 → 標 🟡 |
| **SC-5** | description 8–12 行（含 `description: \|` 那行） | 行數介於 8–12 | 6–7 或 13–15 標 🟡；< 6 或 > 15 標 🔴 |
| **SC-6** | byte ≤ 1024（Anthropic 平台硬上限） | validate-skill.sh 自動量 | 見 Hard Limits 段（直接 Score 1 + ship-blocker） |

**判讀順序**：先跑 validate-skill.sh 拿機械檢查結果（SC-2/3/4/5/6 都有自動量），再人工判 SC-1（語意層面）。

**例外處理**：
- SC-3（引號）若觸發詞本身是「某句完整短句」性質的中文詞（例如「這要不要包成 skill」），引號是斷句需要不是錯誤——但**腳本仍會標 🟡 要求人工確認**，review 在報告中註明「刻意使用，豁免」即可。
- SC-1 若採用其他強觸發語（例如「立即啟動這個 skill，當…」「使用此 skill 當…」），語意等效，可豁免標記。

---

## Score Downgrade（違反 Specific Checks 的扣分判準）

依違反條數與嚴重度，**自 Score 5 起降級**：

| 違反情況 | 降級 |
|---|---|
| 0 條違反 | 不降，按 Score 1–5 主表評定 |
| 1–2 條 🟡 違反 | Score 降 1 級（5 → 4，4 → 3，以此類推） |
| 3+ 條 🟡 違反 **或** 1 條 🔴 違反 | Score ≤ 2（標 🔴 Critical Issue，列入 Improvements 段） |
| SC-6 違反（byte > 1024）**或** SC-4 完全 0 個鄰居 skill | 直接 Score 1 + ship-blocker（與 Hard Limits 同級） |

**Critical Issue 觸發條件（任一即 ship-blocker）**：
- SC-6 違反（description byte > 1024）
- SC-4 完全違反（DO NOT trigger 空話 / 0 個鄰居 skill）
- SC-2 嚴重違反（觸發詞 < 6 個或 > 15 個）
- SC-5 嚴重違反（description 行數 < 6 或 > 15）

**Improvement 觸發條件（標 🟡，可上線但建議修）**：
- SC-1 違反（缺「當 X 時觸發」字樣）
- SC-3 違反（觸發詞被引號包裹）
- SC-2 / SC-5 輕度違反（在 🟡 區間）
- SC-4 輕度違反（只點名 1 個鄰居）

---

**Key questions:**
- [ ] SC-6: description byte 數 ≤ 1024?（機械檢查由 validate-skill.sh 自動量）
- [ ] SC-1: 定位句含「當 X 時觸發」字樣？
- [ ] SC-2: 觸發關鍵字數量 8–12 個？
- [ ] SC-3: 觸發關鍵字用頓號分隔、無引號包裹？
- [ ] SC-4: DO NOT trigger 點名 2–5 個鄰居 skill？
- [ ] SC-5: description 行數 8–12 行？
- [ ] Does it include explicit trigger phrases?
- [ ] Is it written for the model, not humans?
- [ ] Is it distinct enough from other skills to prevent ambiguity?
- [ ] Is it appropriately "pushy"?
