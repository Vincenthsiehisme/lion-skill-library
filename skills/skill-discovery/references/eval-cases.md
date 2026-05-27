# Trigger and Boundary Eval Cases

Use these cases to test whether `skill-discovery` triggers correctly and stays within scope.

| Case | User prompt | Expected behavior |
|---|---|---|
| 1 | 「Anthropic 官方有沒有 skill description 的寫法建議？」 | Trigger. Route C. Search L1 first; return official docs if found. |
| 2 | 「GitHub 上找一下有沒有 anthropics/skills 類似範例」 | Trigger. Route C. Search L2 after L1 or alongside L1. |
| 3 | 「skill-search 沒找到內部範本，幫我對外找 reference」 | Trigger. Route A. Focus on comparable external structures. |
| 4 | 「這領域我們沒先例，外部 agent workflow 怎麼做？」 | Trigger. Route B. Focus on broader workflow structures. |
| 5 | 「幫我讀這篇 URL，整理重點」 | Do not trigger. Route to `knowledge-extractor`. |
| 6 | 「找一個 skill 範本」 | Do not trigger immediately. Route to `skill-search` first unless the user explicitly asks for external sources. |
| 7 | 「找 5 個業界案例做橫向比較並整理成策略」 | Do not trigger. Route to `strategy-case-report`. |
| 8 | 「ES 為什麼搜不到親子行程？」 | Do not trigger. Route to `search-map`. |
| 9 | 「今天 AI 產業有什麼新聞？」 | Do not trigger. Use direct web search. |
| 10 | 「幫我找 external reference，但不要讀，只列清單」 | Trigger. Route C. Exact match to skill scope. |
| 11 | 「幫我找 Anthropic 官方 reference，並順便整理成採用策略」 | Trigger only for discovery first. Return screened references and suggest `knowledge-extractor` or `strategy-case-report` for the strategy step. |
| 12 | 「有沒有 skill eval 的外部案例？只要可信來源，不要網路農場」 | Trigger. Route C. Prioritize L1/L2/L3; exclude thin SEO pages explicitly. |
| 13 | 「幫我找一個內部 skill 範本」 | Do not trigger immediately. Route to `skill-search` because external sources were not requested. |
| 14 | 「skill-brain 判斷這題沒有 precedent，請找外部做法」 | Trigger. Route B. Focus on broader workflow structures and note upstream fallback. |

## Pass criteria

The skill passes if it:

- Triggers on cases 1–4, 10, 12, and 14.
- Does not trigger on cases 5–9 and 13.
- On case 11, limits itself to discovery and routes synthesis to a downstream workflow.
- Starts from L1/L2 rather than general web.
- Produces a screened URL list, not an article synthesis.
- Produces a bundle without waiting for another confirmation.
