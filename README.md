# Lion Skill Library

雄獅內部 Claude Skill 分發平台。

公司同事在這裡找到並下載適合自己工作的 Claude AI Skill,安裝到自己的 Claude Code 或 Claude Desktop 使用。

## 這是什麼?

每個 Skill 是一組指令 + 參考檔案,安裝後讓你的 Claude 在特定情境下自動觸發對應能力。
例如:寫 PRD 時自動引用 PRD 模板、審查方案時自動套用顧問框架。

## 給使用者:怎麼下載 Skill?

最快路徑:用一行指令裝。

```bash
# macOS / Linux
curl -fsSL https://vincenthsiehisme.github.io/lion-skill-library/install.sh | bash -s -- install <skill-name>
```

Windows PowerShell 或想手動下載 zip,看 [docs/INSTALL.md](docs/INSTALL.md) 或網站上的安裝頁。

## 給 Maintainer(目前只有 Vt):怎麼新增 Skill?

1. 在 `skills/` 下新增一個資料夾,名稱與 SKILL.md 內 `name` 欄位一致
2. 放入完整的 SKILL.md(含 frontmatter:`name`、`description`、`version`、`category`,
   建議補 `group` 與 `feeds_into / consumes_from`)
3. references / scripts 等附加檔放在同一資料夾下
4. `git push` 後 GitHub Actions 自動:
   - 為每個 skill 打包 zip
   - 重建 catalog metadata(含 At a glance 結構化抽取、pipeline 對稱性 lint)
   - 部署網站到 GitHub Pages

詳細規範見 [CONTRIBUTING.md](CONTRIBUTING.md)。

## Wishlist

網站有個 `/wishlist` 頁,同事可以提案新 skill、投票決定下週做什麼。每週日 23:59
結算,Top 3 進入排程。後端跑在 Google Apps Script。

## 架構文件

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 整體架構
- [docs/INSTALL.md](docs/INSTALL.md) — 給使用者的安裝教學
- [CONTRIBUTING.md](CONTRIBUTING.md) — 新增 / 修改 skill 的規範

## 技術棧

- **Astro 5** — 靜態網站生成
- **TypeScript + Zod** — catalog build script 與 frontmatter schema
- **archiver** — 把每個 skill 打 zip
- **gray-matter** — 解析 SKILL.md frontmatter
- **GitHub Actions** — 自動打包與部署
- **GitHub Pages** — 網站 hosting
- **Google Apps Script** — wishlist 投票後端(唯一的伺服器邏輯)

主站純靜態,零後端,零資料庫,零維運。
