# Skill Intent Template

這份模板是 `skill-brain` 產出 `skill-intent-<skill-name>.md` 的標準格式，下游 `skill-create` 會直接讀這份檔案組裝 SKILL.md。

---

## 檔案路徑

`/home/claude/skill-intent-<skill-name>.md`

`<skill-name>` 用 kebab-case，例如 `skill-intent-tour-quote-checker.md`。

---

## 檔案結構

```markdown
# Skill Intent: <skill-name>

> 由 skill-brain 於 <YYYY-MM-DD> 產出，狀態：<draft / approved / parked>

## 1. Problem Statement

**重複出現的問題**：
[一段話，描述使用者重複遇到的情境]

**目前怎麼處理**：
[baseline，沒有 skill 時的做法]

**第一個觸發場景**：
[具體場景，例如「下週要做 X 任務時會用到」]

## 2. Trigger Words

### Hard trigger（必觸發）
- xxx
- xxx
- xxx

### Soft trigger（情境觸發）
- xxx + 上下文 yyy
- xxx + 上下文 yyy

### Anti-trigger（看起來像但不觸發）
- xxx（應走 skill A）
- xxx（應走 skill B）

## 3. Boundary

**做**：[一句話，動詞開頭]

**不做**：
- [點名鄰居 skill 1 的職責]
- [點名鄰居 skill 2 的職責]
- [點名鄰居 skill 3 的職責]

## 4. Overlap Scan

| 既有 skill | 重疊點 | 嚴重度 | 處置 |
|---|---|---|---|
| xxx | yyy | 🟢/🟡/🔴 | proceed / merge / kill |

> 處置欄位由使用者填寫，skill-brain 不主動判定。

## 5. 下游建議

- [ ] 交給 skill-create 動筆
- [ ] 先呼叫 skill-search 補 reference
- [ ] 暫緩，等使用者多踩幾次坑再回來
- [ ] 改做既有 skill 的擴充：[skill 名]
```

---

## 欄位填寫指引（給 skill-brain 自己看）

### Section 1 — 紅燈警示

如果使用者在三個問題中出現以下回答，**不要往下走**，回頭釐清：

| 紅燈訊號 | 處置 |
|---|---|
| 「以後可能用得到」 | 問：「你最近一個月有遇到這個情境嗎？」 |
| 「每次都不太一樣」 | 建議：「先用 prompt 處理 5 次，找出共同模式再回來」 |
| 「應該很簡單」 | 問：「你之前手動做過嗎？哪些步驟最花時間？」 |

### Section 2 — Trigger 數量

| 類別 | 最少 | 最多 | 備註 |
|---|---|---|---|
| Hard | 3 | 5 | 太多會讓 skill 過度觸發 |
| Soft | 2 | 5 | 必須附帶情境條件 |
| Anti | 2 | 不限 | 寧多勿少，特別是已有 27 個 skill 時 |

### Section 3 — Boundary 寫法

「不做」清單必須符合：
1. **點名具體鄰居**：寫「不做 schema 查詢（用 erp-schema）」，不寫「不做技術類問題」
2. **動詞開頭**：寫「不寫 SKILL.md」，不寫「SKILL.md 撰寫」
3. **2–3 條為佳**：少於 2 條代表邊界沒想清楚，多於 3 條代表 skill 範圍太雜

### Section 4 — 重疊掃描操作

執行步驟：
1. `ls /mnt/skills/user/` 列出所有資料夾
2. 對每個 SKILL.md 只讀 frontmatter（前 30 行內）
3. 比對：
   - 動詞重疊（兩個 skill 都「審查」「設計」「查詢」）
   - 名詞重疊（兩個 skill 都處理「schema」「skill」「PRD」）
   - Trigger 詞字面重疊
4. 列出重疊清單，由使用者填寫處置欄

**只列出，不判定**——這是設計原則，使用者比 brain 更了解業務脈絡。
