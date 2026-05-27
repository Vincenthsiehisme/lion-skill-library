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
                  │  1. npm run validate                    │
                  │  2. npm run build:zips → 打 zip          │
                  │  3. npm run build:catalog → catalog JSON │
                  │  4. npm run build:site → astro build     │
                  │  5. deploy → GitHub Pages               │
                  └────────────────┬────────────────────────┘
                                   ↓
                  ┌─────────────────────────────────────────┐
                  │  GitHub Pages (https://...github.io/)   │
                  │  ├── index.html (catalog)               │
                  │  ├── skill/{name}/index.html            │
                  │  ├── skill/{name}/ref/{slug}/index.html │
                  │  ├── manifest.json (給 installer)        │
                  │  └── downloads/{name}-{version}.zip     │
                  └────────────────┬────────────────────────┘
                                   │ 點下載按鈕 or curl install.sh
                                   ↓
                  ┌─────────────────────────────────────────┐
                  │  雄獅同事本機                             │
                  │  解壓到 ~/.claude/skills/{name}/        │
                  └─────────────────────────────────────────┘
```

## scripts/ 目錄

```
scripts/
├── schema.ts            ← 共用 Zod schema(category / group / pipeline 欄位定義)
├── validate.ts          ← 驗證所有 skill frontmatter 格式
├── package-skills.ts    ← 把每個 skill 打成 zip
└── build-catalog.ts     ← 產生 skills.generated.json + manifest.json
```

執行順序(已在 `package.json` 的 `build` 中串好):

```bash
npm run validate       # 先驗證,失敗即停
npm run build:zips     # 打包(產出 site/public/downloads/*.zip)
npm run build:catalog  # 讀 zip size + git info + 解析 body 產 catalog JSON
npm run build:site     # Astro 讀 catalog JSON,build 靜態站
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

`site/src/data/skills.generated.json`(內部使用,Astro 讀這份):

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
      "group": "pm-workflow",
      "license": "MIT",
      "author": "Vt",
      "tags": ["product", "documentation"],
      "related": ["skill-brain"],
      "feeds_into": ["critical-reviewer"],
      "consumes_from": ["skill-brain"],
      "body": "...(SKILL.md 全文 minus frontmatter)...",
      "zipFilename": "prd-writer-0.10.2.zip",
      "zipSize": 12345,
      "lastModified": "2026-05-24T08:00:00+00:00",
      "firstPublished": "2026-04-01T08:00:00+00:00",
      "versionBumpedAt": "2026-05-20T08:00:00+00:00",
      "commitHash": "a1b2c3d",
      "references": [
        {
          "slug": "templates",
          "filename": "templates.md",
          "firstLine": "PRD 結構模板...",
          "body": "..."
        }
      ],
      "atGlance": {
        "triggerKeywords": "寫 PRD、需求文件、...",
        "doNotTrigger": "已拍板的小功能(用 prd-spec)...",
        "doNotFirstHint": "已拍板的小功能(用 prd-spec)",
        "gotchaTitles": ["第一行太長", "..."]
      }
    }
  ]
}
```

Astro 在 build 時 import 這份 JSON,所有頁面都是 SSG(無 server runtime)。

### 對外公開的 manifest.json

`site/public/manifest.json` 是給 `install.sh` / `install.ps1` 讀的精簡版,
不含 `body` / `references.body` / `atGlance` 等大欄位,只保留:

```json
{
  "schemaVersion": 1,
  "generatedAt": "...",
  "totalCount": 3,
  "skills": [
    {
      "name": "prd-writer",
      "version": "0.10.2",
      "category": "planning",
      "group": "pm-workflow",
      "description": "...(只取第一行)...",
      "tags": ["product"],
      "zipFilename": "prd-writer-0.10.2.zip",
      "zipSize": 12345,
      "lastModified": "..."
    }
  ]
}
```

這個檔案是 Lion Skill Library 的「公開 API」 — installer 腳本固定吃它,
所以 `schemaVersion: 1` 保留向後相容性。

## category vs group:兩個分類軸

每個 skill 同時掛在兩個分類軸下:

- **category**(7 種):工作類型分類。planning / writing / review / summary / data / utility / domain。
  用於 index 頁頂端 filter bar。
- **group**(8 種):家族分類。skill-meta / pm-workflow / data-pipeline / lion-schema /
  lion-system / personal-style / marketing-seo / specialty。
  用於 index 頁的分組區塊。

GROUP_META(每個 group 的 label / blurb / order)定義在三處,**要同步修改**:

1. `scripts/schema.ts`(build 時用)
2. `site/src/types.ts`(TypeScript 型別)
3. `site/src/pages/index.astro`(渲染時用)

沒填 `group` 的 skill fallback 到 `specialty`,build-catalog 印 warning 但不 fail。

## Pipeline 關係與對稱性 lint

frontmatter 可以宣告:

```yaml
feeds_into:    [critical-reviewer]   # 我的輸出餵給誰
consumes_from: [skill-brain]         # 我的輸入來自誰
```

build-catalog 跑完讀檔後會 lint:

- `feeds_into` 指向不存在的 skill → warning(`unknown-skill`)
- A 寫了 `feeds_into: [B]` 但 B 沒寫 `consumes_from: [A]` → warning(`asymmetric`)
- `consumes_from` 同樣對稱性檢查

全部只印 warning 不 fail,所以新 skill 上架不會因為對方還沒同步就被擋掉。
但 lint output 在 CI log 上看得到,定期清理。

## At a glance 自動抽取

build-catalog 對每份 SKILL.md 跑兩段 regex:

1. 從 `description` 撈「觸發關鍵字 / 觸發詞 / trigger keywords」段落 → `triggerKeywords`
2. 從 `description` 撈「DO NOT trigger for / Do NOT / 不適用情境」段落 → `doNotTrigger`
   再從這段抽第一條建議當 `doNotFirstHint`(用於首頁卡片的消歧義提示)
3. 從 body 找 `## Gotchas` 區段,撈底下的 H3 或粗體列表項當 `gotchaTitles`

抽出來的結構塞進 catalog 的 `atGlance` 欄位,Astro 渲染詳情頁的 At a glance 卡片用。
寫得越清楚,UX 越好 — 規格細節見 `scripts/build-catalog.ts` 的 `extractAtGlance` 函數。

## Markdown 渲染:`site/src/lib/markdown.ts`

SKILL.md 與 reference 子檔的 markdown render 都走這個 lib(不引入 unified/remark)。
特色:

- H1/H2/H3 自動加 slug id,給 sticky TOC 用
- 純文字提及 `references/xxx.md` 自動轉成同 skill 的內部連結
  - 在 SKILL 詳情頁 → `./ref/{slug}`
  - 在 ref 子頁 → `../{slug}`
- 全站零斜體:`**xxx**` 與 `*xxx*` 都渲染為 `<strong>`
- 提供 `extractToc()` 從已渲染 HTML 撈 H2/H3 標題給 sticky TOC

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

## Wishlist:唯一的伺服器邏輯

`/wishlist` 頁需要存提案與投票狀態,純靜態做不到,所以接 **Google Apps Script** 當後端。
GAS Web App URL hardcode 在 `site/src/pages/wishlist.astro` 內,可讀寫 Google Sheets。

職責切割:

- **靜態前端**(本 repo):提案表單、投票 UI、結果顯示
- **GAS 後端**(獨立 GAS project):去重、每週結算、cookie + fingerprint 防作弊

兩邊靠 `_t` cache busting 與 voter token (localStorage) 保持 state 同步。

## 加新 skill 的完整流程

```bash
# 1. 把 skill 複製進 repo
cp -r ~/.claude/skills/critical-reviewer ./skills/

# 2. 過機密檢核(自己看)
$EDITOR skills/critical-reviewer/SKILL.md

# 3. 本機驗證
npm run validate

# 4. 本機跑完整 build 看 site 長相
npm run build
npm run preview  # 開 http://localhost:4321

# 5. 滿意就 push
git add skills/critical-reviewer
git commit -m "add: critical-reviewer v2.x.x"
git push

# 6. GitHub Actions 自動 build + deploy
# 7. 幾分鐘後網站上線
```

## 限制與未來

**目前不支援**:

- 客戶端搜尋(skill 量少時沒必要 — 但首頁已有基於 dataset 的即時 filter)
- 多語系
- 使用者帳號 / 評分 / 留言(wishlist 有匿名投票算半個)
- 內部 skill 上架(走另一條 private 流程)
- MCP server 讓 AI agent 自動安裝

**將來可能加**:

- 全文搜尋(用 Fuse.js,客戶端)
- skill 之間的相依拓撲視覺化(用 `feeds_into / consumes_from` 資料畫圖)
- 安裝統計(需要分析 GitHub Pages access log 或加 endpoint)
