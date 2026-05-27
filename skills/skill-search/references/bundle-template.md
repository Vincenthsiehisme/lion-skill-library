# Reference Bundle Template

`skill-search` 產出的 `reference-bundle-<topic>.md` 標準格式。下游 `skill-create` 會直接讀這份檔案組裝 SKILL.md。

---

## 檔案結構

```markdown
# Reference Bundle: <topic>

> 由 skill-search 於 <YYYY-MM-DD> 產出
> 呼叫情境：A (brain) / B (create) / C (使用者直接)
> 查找需求：<一句話描述>

## 1. 撈到的範例

| 層級 | Skill 名 | 結構/段落特徵 | 推薦度 |
|---|---|---|---|
| L1 | xxx | yyy | ⭐⭐⭐ |
| L1 | xxx | yyy | ⭐⭐ |
| L2 | xxx | yyy | ⭐ |

## 2. 萃取出的模式

### 強模式（3+ 範例都有）

#### 模式 A：<名稱>
- 出現於：skill-1, skill-2, skill-3
- 結構：[簡述]
- 範例：
  ```
  [從某個 skill 摘出的精華片段]
  ```

### 中模式（2 個範例有）

#### 模式 B：<名稱>
- 出現於：skill-1, skill-2
- 結構：[簡述]

### 個別範例參考（1 個有，僅供參考）

- skill-X 的 <段落>：[簡述特殊處理方式]

## 3. 可複用的結構框架

```
[骨架，給 create 直接照抄調整]
[例如：YAML frontmatter 範本、Step 0 範本、Gotchas 範本]
```

## 4. 關鍵段落樣本

### 樣本 1：<目的>（取自 skill-X）

```
[直接從 skill 摘出的精華段落，5–15 行]
```

**為什麼這段值得參考**：[一句話理由]

## 5. 反例警示

撈範例過程中發現的差異點，提醒 create 階段避免：

- ❌ 寫法 A（出現於 skill-Y）：[簡述為什麼不好]
- ❌ 寫法 B（出現於 skill-Z）：[簡述為什麼不好]

## 6. 給下游 skill 的銜接訊息

- 給 skill-brain：[如果有，補什麼維度資訊]
- 給 skill-create：[如果有，建議用哪個模式組裝]
```

---

## 欄位填寫指引（給 skill-search 自己看）

### Section 1 — 撈到的範例

- L1 至少 3 個、L2 至少 1 個、L3 0–2 個
- 推薦度根據「結構與使用者需求的契合度」評分，不是品質排序

### Section 2 — 模式分級

嚴格遵守 G3 Gotcha：
- **強模式**：3 個以上範例都有此結構
- **中模式**：2 個範例有
- **個別範例**：只有 1 個有，**不能稱為模式**

### Section 3 — 結構框架

把骨架抽出來，例如：
```
---
name: <skill-name>
description: |
  <定位句>
  觸發關鍵字：<8-12 個中文詞>
  DO NOT trigger for: <點名鄰居 skill>
---

# <Skill 名> — <一句話定位>

定位：<簡述>
不做：<點名鄰居 skill>

## Step 0：判斷使用者在哪個階段
[A/B/C 三選一表格]

## 核心流程：<X 個維度>
[維度 1 / 2 / 3 ...]

## 輸出規格
[雙交付物：對話摘要 + 檔案]

## Gotchas
[3–5 條三段式]
```

### Section 4 — 關鍵段落樣本

- 一份 bundle 通常含 1–3 個樣本
- 每個樣本 5–15 行
- 必須附「為什麼值得參考」的一句話理由——這是萃取的核心價值

### Section 5 — 反例警示

- 不必每份 bundle 都有；發現有差異才寫
- 寫成「❌ 寫法 + 出現於哪個 skill + 為什麼不建議」三段式

### Section 6 — 銜接訊息

只在被 brain/create 呼叫時填。使用者直接呼叫時可省略。
