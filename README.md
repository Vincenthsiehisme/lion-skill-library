# Lion Skill Library

雄獅內部 Claude Skill 分發平台。

公司同事在這裡找到並下載適合自己工作的 Claude AI Skill，安裝到自己的 Claude Code 或 Claude Desktop 使用。

## 這是什麼？

每個 Skill 是一組指令與參考檔案，安裝後讓 Claude 在特定情境下自動觸發對應能力。

這個 repo 的定位不是單純收藏 prompt，而是把可重複使用的 AI 工作流封裝成可安裝、可下載、可維護的 Skill Library。

## 給使用者：怎麼下載 Skill？

最快路徑：用一行指令安裝。

```bash
# macOS / Linux
curl -fsSL https://vincenthsiehisme.github.io/lion-skill-library/install.sh | bash -s -- install <skill-name>
```

Windows PowerShell 或想手動下載 zip，請看 [docs/INSTALL.md](docs/INSTALL.md) 或網站上的安裝頁。

## 給 Maintainer：新增與修改 Skill 的標準流程

目前不是開放多人直接上架，而是由 maintainer 收到別人交付的 skill 後，用 intake 與 release scripts 標準化上架。

完整流程分四層：

```text
intake          收件、正規化 frontmatter、承接/建立 CHANGELOG、搬入 skills/
release:plan    掃描變更，產生 AI 可讀的 release draft
release:apply   讀 AI 整理後的 JSON，自動更新 version + CHANGELOG
build / CI       validate、check changelogs、打包 zip、重建 catalog、部署網站
```

### 情境 A：新增別人交來的 skill

```bash
# 1. 把別人交來的 skill 放到 incoming/
mkdir -p incoming
cp -r /path/to/submitted-skill incoming/
# 也可以直接使用單一 SKILL.md 檔案

# 2. 先 dry run，確認會被整理成什麼
npm run intake -- ./incoming/submitted-skill --category review --dry-run

# 3. 正式匯入到 skills/<name>/
npm run intake -- ./incoming/submitted-skill --category review

# 4. 產生 AI 可讀 release plan
npm run release:plan -- --only submitted-skill

# 5. 將 .lion-stage/release-plan.md 交給 AI
#    將 AI 回傳 JSON 存成 .lion-stage/release-notes.json

# 6. 套用 version + CHANGELOG
npm run release:apply

# 7. 本地完整 build 檢查
npm run build

# 8. commit / push
git add -A
git commit -m "add: submitted-skill"
git push
```

### 情境 B：修改既有 skill

```bash
# 修改 skills/<name>/ 底下的 SKILL.md / references / scripts / assets

npm run release:plan -- --only skill-review
# 將 .lion-stage/release-plan.md 交給 AI
# 將 AI 回傳 JSON 存成 .lion-stage/release-notes.json

npm run release:apply
npm run build

git add -A
git commit -m "release: skill-review"
git push
```

### 情境 C：一次修改很多 skill

```bash
npm run release:plan
# AI 整理所有 changed skills
# 不需要 changelog 的項目標成 releaseType: none

npm run release:apply
npm run build

git diff
git add -A
git commit -m "release: batch skill updates"
git push
```

### 小改 quick mode

`npm run release:quick` 仍保留給小改快速路徑。

適用情境：

```text
只改 1 個 skill
diff 很小
你已經知道 changelog 要寫什麼
```

批次變更、大 diff、別人交來的 skill，請優先使用：

```bash
npm run release:plan
npm run release:apply
```

詳細規範見 [CONTRIBUTING.md](CONTRIBUTING.md) 與 [MAINTAINER.md](MAINTAINER.md)。

## 上架後會發生什麼？

`git push` 後 GitHub Actions 會自動：

- 跑 validate，檢查 frontmatter 格式與必填欄位
- 跑 check:changelogs，確認每個 skill 的目前 version 都有 CHANGELOG 段落
- 為每個 skill 打包 zip
- 重建 catalog metadata
- 重建 public manifest
- 部署網站到 GitHub Pages

網站資料不手動維護，會由 `scripts/build-catalog.ts` 根據 `skills/` 自動產生。

## Wishlist

網站有 `/wishlist` 頁，同事可以提案新 skill、投票決定下週做什麼。每週日 23:59 結算，Top 3 進入排程。後端跑在 Google Apps Script。

## 架構文件

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 整體架構
- [docs/INSTALL.md](docs/INSTALL.md) — 給使用者的安裝教學
- [CONTRIBUTING.md](CONTRIBUTING.md) — 新增 / 修改 skill 的規範
- [MAINTAINER.md](MAINTAINER.md) — Maintainer 上架與 release 流程

## 技術棧

- Astro 5 — 靜態網站生成
- TypeScript + Zod — catalog build script 與 frontmatter schema
- archiver — 把每個 skill 打 zip
- gray-matter — 解析 SKILL.md frontmatter
- GitHub Actions — 自動打包與部署
- GitHub Pages — 網站 hosting
- Google Apps Script — wishlist 投票後端

主站純靜態，零後端，零資料庫，零維運。
