# skill-review

一個用來審查 Claude Code skill 的品質驗收 skill。它的重點不是檢查某一套固定寫法，而是判斷 skill 是否能穩定觸發、清楚分工、低成本載入，並產出可驗收結果。

## What It Does

- 檢查 `SKILL.md`、frontmatter、description byte、references、入口 scripts 權限、helper/lib 可讀性與 Gotchas
- 以 8 個維度評估 skill 品質
- 把問題分成 Hard Gate、Quality Gate、Style / Heuristic，避免把格式偏好誤判為不可上線
- 初篩跨 skill 觸發詞重疊，並提醒需人工判讀語意衝突
- 產出結構化報告、ship 判定與可執行改動建議

## Usage

```bash
./scripts/validate-skill.sh <skill-dir>
./scripts/check-skill-conflicts.sh <skill-dir> [skills-base]
```

`check-skill-conflicts.sh` 的掃描範圍優先序為：第二參數 `[skills-base]` → `SKILLS_BASE` 環境變數 → 常見技能庫路徑候選。若技能庫不在預設位置，建議明確傳入第二參數。

也可以直接在 Claude 中詢問：

```text
review my skill
為什麼這個 skill 不觸發？
檢查這個 skill 是否合理、是否能 ship
這個 skill 會不會跟其他 skill 撞？
```

## Review Philosophy

```text
Review 不是格式稽核器，而是品質驗收器。
格式可以作為 heuristic，但不能取代對觸發有效性、職責邊界、可執行性與維護成本的判斷。
```

### Gate Levels

| Level | 用途 | 是否擋 ship |
|---|---|---|
| Hard Gate | 平台限制、不可執行、引用缺失、安全風險、高度衝突 | 是 |
| Quality Gate | 觸發模糊、Gotchas 空泛、結構不穩、成本過高 | 視嚴重度 |
| Style / Heuristic | 行數、觸發詞數量、句型、標點、命名一致性 | 否 |

## Review Dimensions

| # | Dimension | What It Catches |
|---|---|---|
| 1 | Description / Trigger | 觸發不清、誤觸發、邊界不明 |
| 2 | Gotchas | 缺少真實或高可信防錯規則 |
| 3 | Progressive Disclosure | SKILL.md 過胖、reference 結構不足 |
| 4 | Railroading | 把推理寫死，或必要 runbook 缺步驟 |
| 5 | Setup & Config | 首次設定與缺值處理不足 |
| 6 | Scripts & Code | script 不可執行、重造輪子、缺 guardrail |
| 7 | Memory / State | 狀態需求與持久化策略不清 |
| 8 | Context Efficiency | token 成本與 skill 存在價值不成比例 |

## File Structure

```text
skill-review/
├── SKILL.md
├── README.md
├── assets/
│   └── review-template.md
├── references/
│   ├── categories.md
│   ├── common-failure-patterns.md
│   └── dims/
│       ├── dim-1-description.md
│       ├── dim-2-gotchas.md
│       ├── dim-3-progressive-disclosure.md
│       ├── dim-4-railroading.md
│       ├── dim-5-setup-config.md
│       ├── dim-6-scripts.md
│       ├── dim-7-memory.md
│       └── dim-8-context-efficiency.md
└── scripts/
    ├── validate-skill.sh
    ├── check-skill-conflicts.sh
    └── lib/
        ├── validate_skill.py
        └── check_skill_conflicts.py
```

## Notes

- `check-skill-conflicts.sh` 是薄入口；核心邏輯在 `scripts/lib/check_skill_conflicts.py`。它是字面重疊初篩，不是最終語意判決。
- N/A 維度要排除 Overall 分母。
- 使用者明確說「改給我」時，可以依 review 結論做小修、patch、驗證修正；從零撰寫或大幅重構仍應交給 `skill-create`。
- 只有入口 script 或 SKILL.md 明確要求執行的 script 需要 executable；helper/lib/fixtures 只需可讀。
