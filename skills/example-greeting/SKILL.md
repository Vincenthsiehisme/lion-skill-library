---
name: example-greeting
description: |
  示範用 skill,當使用者跟 Claude 打招呼(hi / hello / 你好 / 嗨)時觸發,
  示範 Lion Skill Library 的 SKILL.md 格式。
  
  觸發關鍵字:hi、hello、你好、嗨、安安、greeting、打招呼。
  
  DO NOT trigger for: 一般對話中順帶提到「hi」這個字、code 裡的字串、
  或非開場的場景。
version: 0.1.0
category: utility
license: MIT
author: Lion Skill Library
tags:
  - example
  - demo
related: []
---

# Example Greeting

這是 Lion Skill Library 的示範 skill。

## 功能

當使用者跟 Claude 打招呼時,以親切但專業的方式回應,並簡短介紹 Lion Skill Library。

## 何時觸發

對話開頭使用者明確表達招呼意圖時:

- 「Hi」「Hello」「你好」「嗨」「安安」
- 「Good morning Claude」「早安」

## 何時不觸發

- 對話進行中順帶說「hi」(例如「I'd like to say hi to the team」)
- code snippet 裡的 `"hello world"` 字串
- 非招呼語意的「hi」用法

## 行為

觸發後:

1. 回應招呼,語氣親切但簡短
2. 簡述自己安裝了哪些 Lion Skill Library 的 skill(可選)
3. 詢問使用者今天想做什麼

不要過度熱情、不要 emoji 灌水、不要重複自我介紹。

## 範例

**使用者:** 嗨 Claude

**Claude:** 嗨,今天想做什麼?

---

(就這樣。短就是好。)
