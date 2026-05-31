# MAINTAINER.md

> 上架代理人速查。每次有 skill 要上架，照這份走。

---

## 前置：確認你在正確的地方

跑任何 `git` / `npm` 指令前，先確認三件事。

```powershell
# 1. 切到 repo 根目錄
cd C:\Users\<你>\lion-skill-library

# 2. 確認你在對的地方
ls
# 應該看到 .git / package.json / skills / scripts

# 3. 確認 branch
 git branch
# 星號 * 那行應該是 main

# 4. 確認 remote
 git remote -v
# 預期 origin 指向 github.com/Vincenthsiehisme/lion-skill-library

# 5. 確保 origin refs 是最新的
 git fetch origin
```

---

## 現在的標準流程

新的流程不是「prepare 逐一問你 CHANGELOG」，而是：

```text
intake          收件與標準化
release:plan    掃描變更，匯出 AI 可讀 draft
AI              整理 release notes JSON
release:apply   自動套用 version + CHANGELOG
build           本地檢查與網站 build
push            GitHub Actions 部署
```

TL;DR：

```powershell
git checkout main
git pull origin main

# 新 skill 才需要 intake；既有 skill 修改可直接改 skills/<name>/
npm run intake -- .\incoming\some-skill --category review

npm run release:plan -- --only some-skill
# 把 .lion-stage/release-plan.md 貼給 AI
# 把 AI 回傳 JSON 存成 .lion-stage/release-notes.json

npm run release:apply
npm run build

git add -A
git commit -m "add: some-skill"
git push origin main
```

---

## 場景 A：上架全新 skill

### 1. 同步 main

```powershell
git checkout main
git pull origin main
git fetch origin
```

### 2. 把新 skill 放進 incoming/

```powershell
mkdir incoming
Copy-Item -Recurse <source-folder> incoming\some-skill
```

作者交付的最低格式：

```text
some-skill/
├── SKILL.md
└── references/
    └── optional.md
```

作者不需要提供 CHANGELOG，也不需要懂正式上架規則。

### 3. dry run

```powershell
npm run intake -- .\incoming\some-skill --category review --dry-run
```

確認：

```text
target
category
version
copied entries
warnings
```

### 4. 正式匯入

```powershell
npm run intake -- .\incoming\some-skill --category review
```

`intake` 會：

```text
補 name / version / category / license / tags / related
搬到 skills/<name>/
建立空 CHANGELOG.md shell
跑 validate
```

它不會寫正式 CHANGELOG 條目。

### 5. 產生 release plan

```powershell
npm run release:plan -- --only some-skill
```

產物：

```text
.lion-stage/release-plan.md
.lion-stage/release-notes.template.json
```

### 6. 交給 AI 整理

把 `.lion-stage/release-plan.md` 貼給 AI，要求它只輸出 JSON。

範例：

```json
{
  "entries": [
    {
      "skill": "some-skill",
      "releaseType": "patch",
      "version": "0.1.0",
      "summary": [
        "初次上架 some-skill，提供特定工作情境下的標準化操作流程。"
      ]
    }
  ]
}
```

存成：

```text
.lion-stage/release-notes.json
```

### 7. 套用 version + CHANGELOG

```powershell
npm run release:apply
```

對新 skill，通常會：

```text
version 維持 0.1.0
CHANGELOG.md 新增 0.1.0 段落
```

### 8. 本地完整檢查

```powershell
npm run build
```

這會跑：

```text
validate
check:changelogs
build:zips
build:catalog
build:site
```

### 9. Commit + push

```powershell
git diff
git add -A
git commit -m "add: some-skill"
git push origin main
```

---

## 場景 B：更新既有 skill

### 1. 同步 main

```powershell
git checkout main
git pull origin main
git fetch origin
```

### 2. 修改 skill

直接修改：

```text
skills/<name>/SKILL.md
skills/<name>/references/
skills/<name>/scripts/
skills/<name>/assets/
```

不要手動改 version，不要先手動寫 CHANGELOG。

### 3. 產生 release plan

```powershell
npm run release:plan -- --only skill-review
```

### 4. 交給 AI 整理 release-notes.json

把 `.lion-stage/release-plan.md` 貼給 AI，讓它判斷每個 entry 的：

```text
releaseType
version
summary
```

如果只是 README / CHANGELOG / 格式整理，請讓 AI 標：

```json
{
  "skill": "skill-review",
  "releaseType": "none",
  "version": null,
  "summary": []
}
```

### 5. 套用

```powershell
npm run release:apply
```

### 6. build + push

```powershell
npm run build

git diff
git add -A
git commit -m "release: skill-review"
git push origin main
```

---

## 場景 C：一次修改很多 skill

```powershell
npm run release:plan
```

把 `.lion-stage/release-plan.md` 整份交給 AI。

AI 要做的是：

```text
逐一看 diff
決定 releaseType
整理 summary
不需要 release 的項目標 none
```

存成 `.lion-stage/release-notes.json` 後：

```powershell
npm run release:apply
npm run build

git diff
git add -A
git commit -m "release: batch skill updates"
git push origin main
```

---

## 小改 quick mode：release:quick

`npm run release:quick` 還保留，但只建議用在小改。

適用：

```text
只改 1 個 skill
diff 很小
你自己知道 CHANGELOG 要寫什麼
```

不適用：

```text
一次很多 skill
作者交來的大包 skill
CHANGELOG 需要 AI 幫你整理
你不想在 terminal 逐一填摘要
```

遇到不適用情境，請用：

```powershell
npm run release:plan
npm run release:apply
```

---

## release-notes.json 規格

```json
{
  "entries": [
    {
      "skill": "skill-review",
      "releaseType": "minor",
      "version": "0.4.0",
      "summary": [
        "重整 skill-review 的審查流程，讓輸出更聚焦於合理性、缺口與可執行修正。",
        "補強 references 的判斷準則，降低審查結果過度發散的問題。"
      ]
    }
  ]
}
```

## releaseType 判斷表

| releaseType | 用於 | 是否改 version | 是否寫 CHANGELOG |
|---|---|---:|---:|
| `major` | 使用方式大改、破壞性變更 | 是 | 是 |
| `minor` | description、trigger、主流程、判斷框架改 | 是 | 是 |
| `patch` | 補 reference、修 typo、補範例、修小錯 | 是 | 是 |
| `none` | README、CHANGELOG、格式化、非行為性整理 | 否 | 否 |

原則：只有對使用者使用 skill 有影響，才需要 skill CHANGELOG。

---

## CI fail 速查表

push 後去 Actions 看紅色 step。

| Step | 訊息 | 修法 |
|---|---|---|
| Check changelogs | `CHANGELOG.md 缺 vX.Y.Z 段落` | 補 `.lion-stage/release-notes.json` 後跑 `npm run release:apply`，或手動補 `## X.Y.Z - YYYY-MM-DD` 段落 |
| Check changelogs | `SKILL.md 在 push range 內動過，但 version 字串沒變` | 該 skill 有行為變更但沒 bump version；重跑 `release:plan` / `release:apply` |
| Check changelogs | `CHANGELOG.md 不存在` | 新 skill 沒完成 release:apply |
| Validate skills | `frontmatter.category` | SKILL.md frontmatter 補合法 category |
| Validate skills | `frontmatter.version` | version 必須是 `X.Y.Z` 三段純數字 |
| Validate skills | `related: "X" does not exist` | 修正或移除 related |
| Validate skills | `description still contains TODO placeholder` | intake 只補了 TODO，需要回頭寫正式 description |
| Validate skills | `references/... must be a .md file` | references 底下只放 markdown；其他資源放 assets |

---

## 三條鐵律

1. 新 skill 先進 `incoming/`，再由 `intake` 進 `skills/`
2. 批次或大 diff 不用 `release:quick`，先 `release:plan`，再讓 AI 產 JSON
3. 不要讓 AI 直接改 repo 檔案；AI 只產 `release-notes.json`，實際改檔由 `release:apply` 做

---

## PowerShell 寫含中文檔案的安全方式

PowerShell 預設 console code page 不是 UTF-8。直接用 here-string + `Out-File -Encoding utf8` 寫含中文檔案，可能造成亂碼。

安全做法：

1. 讓 AI 產出檔案，下載後覆蓋
2. 用 VSCode 編輯，確認 UTF-8
3. 若一定要用 PowerShell，用 `[System.IO.File]::WriteAllText` + `UTF8Encoding($false)`

```powershell
$path = ".lion-stage\release-notes.json"
$content = @"
{
  ""entries"": []
}
"@
[System.IO.File]::WriteAllText((Join-Path $PWD $path), $content, [System.Text.UTF8Encoding]::new($false))
```

---

## 一張流程圖

```text
作者交 skill / 你修改 skill
  ↓
新 skill：incoming/ → npm run intake
既有 skill：直接改 skills/<name>/
  ↓
npm run release:plan
  ↓
AI 讀 release-plan.md，產 release-notes.json
  ↓
npm run release:apply
  ↓
npm run build
  ↓
git add -A && git commit && git push
  ↓
GitHub Actions deploy
```
