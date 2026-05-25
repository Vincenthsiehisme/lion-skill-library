# Lion Skill Library

雄獅內部 Claude Skill 分發平台。

公司同事在這裡找到並下載適合自己工作的 Claude AI Skill，安裝到自己的 Claude Code 或 Claude Desktop 使用。

## 這是什麼？

每個 Skill 是一組指令 + 參考檔案，安裝後讓你的 Claude 在特定情境下自動觸發對應能力。
例如：寫 PRD 時自動引用 PRD 模板、審查方案時自動套用顧問框架。

## 給使用者：怎麼下載 Skill？

1. 打開網站：[網站連結待補]
2. 瀏覽分類，找到需要的 Skill
3. 點「下載 ZIP」
4. 解壓縮，把整個 skill 資料夾放到：
   - macOS / Linux: `~/.claude/skills/`
   - Windows: `%USERPROFILE%\.claude\skills\`
5. 重啟 Claude，完成

詳細教學見 [docs/INSTALL.md](docs/INSTALL.md)。

## 給 Maintainer（目前只有 Vt）：怎麼新增 Skill？

1. 在 `skills/` 下新增一個資料夾，名稱與 SKILL.md 內 `name` 欄位一致
2. 放入完整的 SKILL.md（含 frontmatter：`name`、`description`、`version`、`category`）
3. references / scripts 等附加檔放在同一資料夾下
4. `git push` 後 GitHub Actions 自動：
   - 為每個 skill 打包 zip
   - 重建 catalog metadata
   - 部署網站到 GitHub Pages

詳細規範見 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 架構文件

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 整體架構
- [docs/INSTALL.md](docs/INSTALL.md) — 給使用者的安裝教學
- [CONTRIBUTING.md](CONTRIBUTING.md) — 新增 / 修改 skill 的規範

## 技術棧

- **Astro 5** — 靜態網站生成
- **TypeScript** — catalog build script
- **GitHub Actions** — 自動打包與部署
- **GitHub Pages** — 網站 hosting

純靜態，零後端，零資料庫，零維運。
