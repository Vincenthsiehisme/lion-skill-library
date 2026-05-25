# Architecture

完整資料流與技術決策說明。

## 整體資料流

```
                  ┌─────────────────────────────────────────┐
                  │  本機開發環境 (Maintainer: Vt)            │
                  │  ~/.claude/skills/{skill-name}/         │
                  └────────────────┬────────────────────────┘
                                   │ cp -r + git push
                                   ↓
                  ┌─────────────────────────────────────────┐
                  │  GitHub repo (public)                    │
                  │  ├── skills/                            │
                  │  │   ├── prd-writer/                    │
                  │  │   ├── critical-reviewer/             │
                  │  │   └── ...                            │
                  │  ├── scripts/                            │
                  │  ├── site/                               │
                  │  └── .github/workflows/                  │
                  └────────────────┬────────────────────────┘
                                   │ on: push
                                   ↓
                  ┌─────────────────────────────────────────┐
                  │  GitHub Actions (build-and-deploy.yml)  │
                  │  1. pnpm validate                       │
                  │  2. pnpm build:zips → 每個 skill 打 zip  │
                  │  3. pnpm build:catalog → skills.json    │
                  │  4. pnpm build:site → astro build       │
                  │  5. deploy → GitHub Pages               │
                  └────────────────┬────────────────────────┘
                                   ↓
                  ┌─────────────────────────────────────────┐
                  │  GitHub Pages (https://...github.io/)   │
                  │  ├── index.html (catalog)               │
                  │  ├── skill/{name}/index.html            │
                  │  └── downloads/{name}-{version}.zip     │
                  └────────────────┬────────────────────────┘
                                   │ 點下載按鈕
                                   ↓
                  ┌─────────────────────────────────────────┐
                  │  雄獅同事本機                             │
                  │  解壓到 ~/.claude/skills/{name}/        │
                  └─────────────────────────────────────────┘
```

## 三個 build script

```
scripts/
├── schema.ts            ← 共用 Zod schema
├── validate.ts          ← 驗證所有 skill frontmatter 格式
├── package-skills.ts    ← 把每個 skill 打成 zip
└── build-catalog.ts     ← 產生 skills.generated.json
```

執行順序(已在 `package.json` 的 `build` 中串好):

```bash
pnpm validate       # 先驗證,失敗即停
pnpm build:zips     # 打包(產出 site/public/downloads/*.zip)
pnpm build:catalog  # 讀 zip size + git info 產 catalog JSON
pnpm build:site     # Astro 讀 catalog JSON,build 靜態站
```

## 為什麼 catalog 要等 zip 打完才 build

因為 catalog 裡有 `zipSize` 欄位,要實際打完 zip 才知道大小。
順序錯掉的話 catalog 會記錄 size=0。

## Zip 內部結構(重要)

```
prd-writer-0.10.2.zip
└── prd-writer/                ← 必須有外層資料夾
    ├── SKILL.md
    └── references/
        └── ...
```

`package-skills.ts` 用 `archiver.directory(srcDir, folderName)` 達成此結構。

使用者解壓後得到 `prd-writer/` 整個資料夾,
直接 `mv prd-writer ~/.claude/skills/` 即完成安裝。

## Catalog JSON 結構

`site/src/data/skills.generated.json`:

```json
{
  "generatedAt": "2026-05-26T12:00:00Z",
  "totalCount": 3,
  "skills": [
    {
      "name": "prd-writer",
      "description": "...",
      "version": "0.10.2",
      "category": "planning",
      "license": "MIT",
      "author": "Vt",
      "tags": ["product", "documentation"],
      "related": ["skill-brain"],
      "body": "...(SKILL.md 全文 minus frontmatter)...",
      "zipFilename": "prd-writer-0.10.2.zip",
      "zipSize": 12345,
      "lastModified": "2026-05-24T08:00:00+00:00",
      "commitHash": "a1b2c3d"
    }
  ]
}
```

Astro 在 build 時 import 這份 JSON,
所有頁面都是 SSG(無 server runtime)。

## 為什麼不用資料庫 / 後端

- **量小**:50-100 個 skill,catalog JSON 不會超過 1MB
- **更新慢**:每天最多 push 幾次,不需要 realtime
- **使用者少**:雄獅內部受眾,流量不高
- **維運成本敏感**:這是 side project,不能有任何月費

純靜態完全夠用,GitHub Pages 免費。

## 為什麼不寫 markdown render 套件

`site/src/pages/skill/[name].astro` 內有手寫的 `renderMarkdown` 函數。
這違反了「不要造輪子」原則,但理由是:

- SKILL.md 格式很受控(都是我寫的),不會遇到複雜邊角
- 避免引入 unified / remark / marked 等 50KB+ 套件
- 渲染邏輯極簡,30 行就夠

如果未來 skill 內容變複雜(複雜表格、mermaid 圖、math 公式),
再換成 `@astrojs/mdx` 或類似套件。

## 部署到 GitHub Pages

`site/astro.config.mjs` 需要設置:

```js
export default defineConfig({
  site: 'https://YOUR-ORG.github.io',
  base: '/lion-skill-library',  // 對應 repo 名
  output: 'static',
});
```

repo 設定:Settings → Pages → Source 選 "GitHub Actions"。

第一次 push 後 GitHub Actions 會自動建立 Pages 環境並 deploy,
網址在 Actions 跑完後出現在 `Settings → Pages`。

## 加新 skill 的完整流程

```bash
# 1. 把 skill 複製進 repo
cp -r ~/.claude/skills/critical-reviewer ./skills/

# 2. 過機密檢核(自己看)
$EDITOR skills/critical-reviewer/SKILL.md

# 3. 本機驗證
pnpm validate

# 4. 本機跑完整 build 看 site 長相
pnpm build
pnpm preview  # 開 http://localhost:4321

# 5. 滿意就 push
git add skills/critical-reviewer
git commit -m "add: critical-reviewer v2.x.x"
git push

# 6. GitHub Actions 自動 build + deploy
# 7. 幾分鐘後網站上線
```

## 限制與未來

**目前不支援**:

- 客戶端搜尋(skill 量少時沒必要)
- 多語系
- 使用者帳號 / 評分 / 留言
- 內部 skill 上架(走另一條 private 流程)
- MCP server 讓 AI agent 自動安裝

**將來可能加**:

- 全文搜尋(用 Fuse.js,客戶端)
- 「最近更新」section
- skill 之間的相依拓撲視覺化
- 安裝統計(需要分析 GitHub Pages access log)
