# Skill Review: [skill-name]

**Reviewed:** [date]
**Category:** [從 categories.md 選一個]
**Skill Path:** [path/to/skill]

---

## Summary

[1–2 句總體評估。這個 skill 可以 ship 嗎？最大機會點在哪？]

---

## 機械檢查（validate-skill.sh）

```
[直接貼腳本輸出]
```

通過 / 警告 / 錯誤：[整體狀態]

---

## 跨 skill 衝突（check-skill-conflicts.sh）

```
[直接貼腳本輸出]
```

[總結：無衝突 / N 個中度 / N 個高度]

---

## Score Table

| Dimension | Score (1–5 or N/A) | Notes |
|-----------|--------------------|-------|
| Description / Trigger | /5 | |
| Gotchas | /5 | |
| Progressive Disclosure | /5 | |
| Railroading | /5 | |
| Setup & Config | /5 or N/A | |
| Scripts & Code | /5 or N/A | |
| Memory / State | /5 or N/A | |
| Context Efficiency | /5 | |
| **Overall** | **X / Y 維度** | N/A 排除分母外 |

---

## 🔴 Critical Issues

> 會讓 skill 完全失效或嚴重降低可用性的問題。

1. **[Issue 標題]**
   *問題：* [一句話描述]
   *修法：* [具體建議]

---

## 🟡 Improvements

> 高價值改動，會讓 skill 明顯更好。

1. **[Improvement 標題]**
   *現況：* [目前怎麼做]
   *建議：* [該怎麼做]

---

## 🟢 What's Working

> 做得好的地方——保留並強化。

- [具體的好做法]

---

## 推薦改動（優先級 + 工作量）

### 🔴 高優先

1. **[改動標題]**
   *位置：* SKILL.md 第 X 行
   *現況：* [一句話]
   *建議：* [一句話]
   *工作量：* X 分鐘

### 🟡 中優先

1. **[改動標題]**
   *位置：* references/<檔> 第 X 行
   *現況：* [一句話]
   *建議：* [一句話]
   *工作量：* X 分鐘

### 🟢 低優先（nice-to-have）

1. **[改動標題]** — [一句話帶過]

---

## Suggested Rewrites

> 給最重要的 1–3 條 critical issue 提供 before/after 範例。

### [改動 1：Description 重寫]

**Before：**
```
[現況片段]
```

**After：**
```
[建議片段]
```

---

## Suggested Test Prompts

驗證 skill 是否正確觸發與運作，試這幾個 prompt：

1. `[Test prompt 1 — 核心使用情境，應觸發]`
2. `[Test prompt 2 — edge case，應觸發但要小心邊界]`
3. `[Test prompt 3 — 容易誤觸發但應不觸發的情境]`

---

## Ship 判定

- [ ] **可 ship**(無 🔴 issue、無高度衝突)
- [ ] **修完再 ship**(有 🔴 但都可在 X 分鐘內修完)
- [ ] **重新評估**(架構性問題,需回到 skill-brain 重新規劃)

**強制規則**:任何 dim 標 Score 1 因 **Hard Limits 違反**(例如 description 超過 1024 byte)→ 自動歸「修完再 ship」,不論其他維度表現。Hard Limits 是平台層的硬規則,違反就裝不上,沒有「可 ship」選項。

**判定理由**:[一句話]
