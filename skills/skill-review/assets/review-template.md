# Skill Review: [skill-name]

**Reviewed:** [date]  
**Category:** [從 categories.md 選一個]  
**Skill Path:** [path/to/skill]

---

## Summary

[1–2 句總體評估。先說是否可 ship，再說最大風險或最大改善點。]

---

## Gate 判定

| Gate | Result | Notes |
|---|---|---|
| Hard Gate | Pass / Fail | [平台限制、frontmatter、引用檔、script 權限、安全 guardrail] |
| Quality Gate | Pass / Needs Work | [觸發、邊界、Gotchas、結構、輸出穩定性] |
| Style / Heuristic | OK / Suggestions | [格式一致性、命名、行數、觸發詞數量等] |

---

## 機械檢查（validate-skill.sh）

```text
[直接貼腳本輸出]
```

整體狀態：[通過 / 有警告 / 有錯誤]

---

## 跨 skill 衝突初篩（check-skill-conflicts.sh）

```text
[直接貼腳本輸出]
```

人工判讀：[無實質衝突 / 需補分工 / 高度衝突]

注意：conflict script 是字面初篩，不是最終語意判決。

---

## Score Table

| Dimension | Score (1–5 or N/A) | Gate Level | Notes |
|---|---:|---|---|
| Description / Trigger | /5 | Hard / Quality / Style | |
| Gotchas | /5 or N/A | Hard / Quality / Style | |
| Progressive Disclosure | /5 | Quality | |
| Railroading | /5 | Quality | |
| Setup & Config | /5 or N/A | Quality | |
| Scripts & Code | /5 or N/A | Hard / Quality | |
| Memory / State | /5 or N/A | Quality | |
| Context Efficiency | /5 | Quality | |
| **Overall** | **X / Y 維度** |  | N/A 排除分母外 |

Overall 計算方式：只計入適用維度；N/A 不進分母。若某維度有 hard gate，仍需優先服從 Gate 判定，不以平均分覆蓋 ship 判斷。

---

## 🔴 Critical Issues

> Hard Gate，或會導致不觸發、誤觸發、不可執行、危險操作的問題。

1. **[Issue 標題]**  
   層級：[Hard Gate / Quality Gate]  
   問題：[一句話描述]  
   影響：[會造成什麼失敗]  
   修法：[具體建議]

---

## 🟡 Improvements

> 高價值改動，會讓 skill 明顯更穩，但不一定擋 ship。

1. **[Improvement 標題]**  
   層級：[Quality Gate / Style Heuristic]  
   現況：[目前怎麼寫]  
   建議：[怎麼改]  
   預期效果：[改善什麼]

---

## 🟢 What's Working

1. **[亮點]** — [為什麼這點有效]

---

## 推薦改動

```text
🔴/🟡/🟢 [改動標題]
層級：Hard Gate / Quality Gate / Style Heuristic
位置：<檔案> 第 X 行 / X 段
現況：[一句話]
建議：[一句話]
工作量：X 分鐘
```

---

## Suggested Rewrites

### 1. [最重要段落]

**Before**
```markdown
[原文]
```

**After**
```markdown
[建議改寫]
```

---

## Ship 判定

**判定：** 可 ship / 可 ship，但建議修 / 修完再 ship / 重新評估

**理由：** [用 gate 語言說明，不要只說分數]

**下一步：** [最小必要改動]
