# Changelog

## 0.2.0 - 2026-05-31

\- 重新定位為「品質驗收顧問」:審查改用 Hard Gate / Quality Gate / Style Heuristic 三層分級,純格式問題不再擋 ship。

\- 新增 Step 0 情境分流(A 全面 / B 特定診斷 / C 衝突檢查 / D 改檔),以及「改給我」的 patch brief 流程。

\- validate-skill.sh、check-skill-conflicts.sh 改為薄入口,核心邏輯下放到 scripts/lib/ 的 Python(validate\_skill.py、check\_skill\_conflicts.py);新增 references/common-failure-patterns.md;README 改寫並補 7 條 Gotchas。

## 0.1.0 - 2026-05-28

初版

