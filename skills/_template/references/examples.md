# References 範例

這個檔案展示如何放 progressive disclosure 的詳細資料。

SKILL.md 主檔保持精簡(< 200 行),詳細範例 / 模板 / edge case 放在這裡,
讓 Claude 在需要時才載入。

## 用法

在 SKILL.md 主文件中,可以用以下方式引導 Claude 載入:

```markdown
詳細範例見 `references/examples.md`,需要時 view 該檔案。
```

Claude 會在判斷需要更詳細資訊時自動 view 對應檔案。

## 為什麼這樣設計

- **降低主檔 token 消耗**:主檔精簡,大部分對話不用載 references
- **更清晰的層次**:核心邏輯 vs 範例 vs edge case 分層
- **更好的維護**:改一個範例不用動主檔
