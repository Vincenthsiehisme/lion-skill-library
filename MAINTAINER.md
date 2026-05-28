# MAINTAINER.md

> 上架代理人速查。每次有 skill 要上架,照這份走。
> 設計細節在 patch 5 跟 `scripts/prepare-release.ts` 的 header comment。

---

## TL;DR

```powershell
# 每次上架,固定三步:
git checkout main && git pull origin main
# (動 skill 檔案 — 自己寫或解作者交來的 zip 進 skills/<name>/)
npm run prepare              # 互動補 version + CHANGELOG.md
git add -A && git commit -m "release: <skill> <version>" && git push origin main
```

剩下交給 GitHub Actions。

---

## 場景 A:上架全新 skill

1. **同步 main**

   ```powershell
   git checkout main
   git pull origin main
   ```

2. **把新 skill 資料夾放進 `skills/<name>/`**

   - 自己寫的:直接編
   - 作者交來的:解壓進去,確認結構是 `skills/<name>/SKILL.md` + 可選的 `references/` `assets/`
   - **不要自己寫 version 欄位、不要自己建 CHANGELOG.md**(prepare 會做)

3. **跑 prepare**

   ```powershell
   npm run prepare
   ```

   會偵測到「新發布」狀態,自動建議 `0.1.0`,問你變更摘要:寫「初版」。

4. **commit + push**

   ```powershell
   git add -A
   git commit -m "release: <skill> 0.1.0"
   git push origin main
   ```

5. **看 site**(等 GitHub Actions 跑完約 1-2 分鐘)

   `https://vincenthsiehisme.github.io/lion-skill-library/`

   新 skill 出現在「最近動態 → 新發布」軌(藍實心 NEW badge)。

---

## 場景 B:更新既有 skill

1. **同步 main**(同上)

2. **編 skill 檔案**——SKILL.md 改內容 / 加 reference / 改 description / 換 trigger 關鍵字。**不要動 version 字串**。

3. **跑 prepare**

   ```powershell
   npm run prepare
   ```

   會列出偵測到的改動,依規模建議版號:

   | diff 規模 | 建議 | 理由 |
   |---|---|---|
   | description 字串變了 | minor (+0.1.0) | 觸發行為改了,使用者該注意 |
   | body 變 >= 20 行 | minor (+0.1.0) | 中等改動 |
   | 其他 | patch (+0.0.1) | 小修 |

   按 Enter 接受,或自己輸入版號覆蓋。

   接著問變更摘要,**一句話**寫完。

4. **大 diff 補述**(僅當 diff >= 50 行)

   prepare 會額外吐 `.lion-stage/<name>-diff-summary.md`。流程:

   ```
   打開 .lion-stage/<name>-diff-summary.md
   → 複製整個內容
   → 貼到 Claude 對話
   → 請 Claude 整理成 1-3 句白話 CHANGELOG 條目
   → 把整理結果手動補進 skills/<name>/CHANGELOG.md 對應 version 段落
   (覆蓋掉 prepare 自動填的那句單行摘要)
   ```

5. **commit + push**

   ```powershell
   git add -A
   git commit -m "release: <skill> <new-version>"
   git push origin main
   ```

6. **看 site**

   新版本出現在「最近動態 → 最近更新」軌(藍邊框 v0.X.Y badge)。

---

## 場景 C:作者只給了一份 zip,沒附 CHANGELOG.md

正常——作者不需要懂 CHANGELOG。流程跟場景 B 一樣:

1. 解 zip,覆蓋進 `skills/<name>/`(注意保留既有 CHANGELOG.md 不要被覆蓋,或者解完之後手動把 CHANGELOG.md 從 git history 抓回來)
2. `npm run prepare`——它會偵測差異、補 version 跟 CHANGELOG
3. 看 prepare 建議,大 diff 就丟給 Claude 整理

**保留既有 CHANGELOG.md 的安全做法**:

```powershell
# 先備份既有 CHANGELOG
copy skills\<name>\CHANGELOG.md skills\<name>\CHANGELOG.md.bak
# (覆蓋 skill 資料夾)
# 還原 CHANGELOG
move /Y skills\<name>\CHANGELOG.md.bak skills\<name>\CHANGELOG.md
```

或更乾淨的方式:

```powershell
# 解 zip 進臨時資料夾,只 copy SKILL.md 跟 references/ 跟 assets/
# 不要 copy 作者那份(如果有)的 CHANGELOG.md
```

---

## CI fail 速查表

push 之後去 `https://github.com/Vincenthsiehisme/lion-skill-library/actions` 看。紅色點進去看哪個 step 失敗。

| Step | 訊息 | 修法 |
|---|---|---|
| **Check changelogs** | `CHANGELOG.md 缺 vX.Y.Z 段落` | 編 `skills/<name>/CHANGELOG.md` 補一段:<br>```## X.Y.Z - YYYY-MM-DD```<br>```<描述>```<br>commit push |
| **Check changelogs** | `SKILL.md 在 push range 內動過,但 version 字串沒變` | 編 SKILL.md frontmatter 的 version、補對應 CHANGELOG 段落,commit push |
| **Check changelogs** | `CHANGELOG.md 不存在` | 通常是新 skill 直接 push 沒跑 prepare,本地跑一次 prepare 補上 |
| **Validate skills** | `frontmatter.X: ...` | 看訊息修對應 skill 的 SKILL.md frontmatter |
| **Validate skills** | `related: "X" does not exist` | frontmatter 的 `related:` 引用了不存在的 skill,改正名稱或移除 |
| **Package skill zips** | 通常不會炸 | log 截給維護者 |

修完直接 push,CI 自動再跑。

---

## 三條鐵律

1. **不要手動改 SKILL.md 的 version 字串**——讓 prepare 改
2. **不要手動建 CHANGELOG.md**——讓 prepare 建
3. **不要走 GitHub 網頁拖檔上傳**——繞過 prepare,version/CHANGELOG 一定對不上,CI 一定擋

例外:CI 紅了要在 PR/main 上手動補 CHANGELOG 段落時(場景 fail 表第一條)允許手動編輯。

---

## 本地 dev 偶爾踩到、不影響 production 的事

1. **`build:catalog` 看 git HEAD 歷史**——本地測試「改檔 → 還沒 commit → build」時,catalog 看不到 bump,badge 顯示會錯。解法:commit 再 build。
2. **本地單跑 `build:catalog` 沒先跑 `build:zips`** 會得到 `zipSize: 0`。一條龍跑 `npm run build` 不會踩到。
3. **PowerShell 顯示 commit message 中文亂碼**——git 內部存的是正確 UTF-8,GitHub 網頁上看是正常的。
4. **prepare 偵測到一堆「新發布」的 skill**——表示你的 base ref(`origin/main`)還沒包含這些 skill。先確認你在 main 分支且 pulled latest,再跑。

---

## 一張流程圖

```
┌─────────────────────────────────────────────┐
│ 動 skill 檔案(自己寫 / 解作者 zip 進去)         │
└────────────────────┬────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│ npm run prepare                              │
│ ├─ 對比 origin/main 找改動                     │
│ ├─ 問你版號 + 摘要                             │
│ ├─ 自動寫 SKILL.md (version) + CHANGELOG.md   │
│ └─ 大 diff 吐 .lion-stage/*.md 給 Claude 整理 │
└────────────────────┬────────────────────────┘
                     ↓
            (大 diff 時:貼 Claude 整理回填)
                     ↓
┌─────────────────────────────────────────────┐
│ git add -A && git commit && git push         │
└────────────────────┬────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│ GitHub Actions(自動):                       │
│ ├─ validate skills                          │
│ ├─ check:changelogs ← Layer 2 守門           │
│ ├─ build:zips                               │
│ ├─ build:catalog                            │
│ ├─ build:site (Astro)                       │
│ └─ deploy to GitHub Pages                   │
└────────────────────┬────────────────────────┘
                     ↓
   https://vincenthsiehisme.github.io/lion-skill-library/
```
