# 安裝教學

給雄獅同事的 Claude Skill 安裝指南。

## 先確認你有什麼

- **Claude Desktop**:macOS / Windows 桌面版,從 [claude.ai/download](https://claude.ai/download) 下載
- **或 Claude Code**:命令列工具,從 [docs.claude.com](https://docs.claude.com/en/docs/claude-code) 安裝
- **或 Claude.ai 網頁版**:[claude.ai](https://claude.ai),Pro 用戶可上傳 skill

不同版本安裝位置不同,以下分開說明。

---

## Claude Desktop / Claude Code(本機)

### macOS / Linux

1. 從 Lion Skill Library 網站點 **Download** 拿到 zip
2. 解壓縮,你會得到一個資料夾,例如 `prd-writer/`
3. 打開「Finder」(macOS)或檔案管理員(Linux)
4. 按 `Cmd + Shift + G`(macOS)或在路徑列輸入,進入:
   ```
   ~/.claude/skills/
   ```
   如果這個資料夾不存在,先建一個
5. 把整個 `prd-writer/` 資料夾拖進去
6. 重啟 Claude Desktop / 重開新的 Claude Code session

完成。下次符合觸發條件時,Claude 會自動載入。

### Windows

1. 下載 zip,解壓縮得到 skill 資料夾
2. 打開「檔案總管」,在路徑列輸入:
   ```
   %USERPROFILE%\.claude\skills\
   ```
   不存在就建一個
3. 把整個 skill 資料夾拖進去
4. 重啟 Claude

---

## Claude.ai 網頁版

網頁版要透過設定上傳:

1. 下載 zip 後解壓縮
2. 打開 [claude.ai/settings/capabilities](https://claude.ai/settings/capabilities)
3. 找到 Skills 區,點「Upload」
4. 選擇解壓出來的 skill 資料夾(注意是資料夾,不是 zip)
5. Claude 會自動驗證並啟用

---

## 確認安裝成功

開 Claude,問:

> 列出我目前安裝了哪些 skill

Claude 應該會列出剛裝的那個。

也可以直接測觸發詞。例如安裝了 `prd-writer`,試試:

> 幫我寫一份 PRD,題目是「自動產生會議摘要的功能」

Claude 應該會自動套用 PRD 模板。

---

## 更新 skill

skill 改版了想更新:

1. 從網站重新下載最新版 zip
2. 刪掉舊的 skill 資料夾(`~/.claude/skills/{skill-name}/`)
3. 把新版資料夾放進去
4. 重啟 Claude

之後可能會做「自動更新」機制,目前是手動。

---

## 解除安裝

直接刪掉 `~/.claude/skills/{skill-name}/` 整個資料夾。重啟 Claude。

---

## 常見問題

**Q: Claude 沒有觸發我裝的 skill**

A: 三個可能原因:

1. **沒重啟 Claude**:skill 是啟動時載入的,重啟才生效
2. **資料夾位置錯**:確認在 `~/.claude/skills/{name}/SKILL.md`(注意有外層資料夾)
3. **觸發條件沒對上**:每個 skill 的 description 寫了它何時觸發,沒命中關鍵字就不會跑

**Q: 我裝了多個 skill,會不會互相干擾?**

A: 不會。Claude 會根據對話語意判斷該觸發哪個。但相關的 skill 建議一起裝
(網站會在卡片上提示「相依」)。

**Q: 我想改 skill 的內容**

A: 直接編輯 `~/.claude/skills/{name}/SKILL.md`。但這是本機改動,不會同步回 Lion Skill Library。
如果改得不錯想回饋給作者,Slack 私訊 Vt。

**Q: 為什麼解壓後是 `prd-writer/prd-writer/...` 兩層?**

A: 不應該。zip 內部結構是「外層 prd-writer/」,你解壓出來應該只有一層。
如果出現雙層,把內層整個拿出來就好。

**Q: 公司 MIS 擋下載 zip 怎麼辦?**

A: 跟 IT 部反映 lion-skill-library.github.io 是內部工具(自己人 maintain)需要解禁。
或者私訊 Vt 改用 USB 傳。
