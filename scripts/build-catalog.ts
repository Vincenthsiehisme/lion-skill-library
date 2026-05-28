/**
 * Build catalog metadata JSON for the Astro site.
 *
 * Reads:
 *   - skills/**\/SKILL.md (frontmatter + body)
 *   - skills/**\/references/*.md (subpages,平展讀取)
 *   - site/public/downloads/*.zip (size)
 *   - git log (first + last commit date, version bump date per skill)
 *
 * Writes:
 *   - site/src/data/skills.generated.json
 *   - site/public/manifest.json(對外公開精簡版,給 install.sh / install.ps1 讀)
 */

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import matter from 'gray-matter';
import {
  SkillFrontmatterSchema,
  type SkillMeta,
  type SkillReference,
  type AtGlance,
} from './schema.js';

const SKILLS_DIR = join(process.cwd(), 'skills');
const DOWNLOADS_DIR = join(process.cwd(), 'site', 'public', 'downloads');
const OUTPUT_FILE = join(process.cwd(), 'site', 'src', 'data', 'skills.generated.json');
const PUBLIC_MANIFEST_FILE = join(process.cwd(), 'site', 'public', 'manifest.json');
const RESERVED = ['_template'];

function listSkillFolders(): string[] {
  return readdirSync(SKILLS_DIR)
    .filter((name) => {
      const p = join(SKILLS_DIR, name);
      return statSync(p).isDirectory();
    })
    .filter((name) => !RESERVED.includes(name));
}

/**
 * 撈一個 skill 資料夾的 git 歷史。回傳:
 *   - lastModified  : 最後一次 commit ISO 日期 (任何改動)
 *   - firstPublished: 資料夾首次 commit ISO 日期 (新發布判定基準)
 *   - commitHash    : lastModified 那次 commit 的 short hash
 *
 * 不在 git repo / 還沒 commit:三者都 fallback 到 now / 'local'。
 * firstPublished 撈不到但 lastModified 有(理論上不應發生):回傳等於 lastModified。
 *
 * 跨平台注意:不使用 `head` 之類的 Unix-only 工具,純 JS 處理輸出。
 */
function getGitInfo(skillFolder: string): {
  lastModified: string;
  firstPublished: string;
  commitHash: string;
} {
  const path = join('skills', skillFolder);
  try {
    const lastDate = execSync(`git log -1 --format=%cI -- "${path}"`, {
      encoding: 'utf-8',
    }).trim();
    const hash = execSync(`git log -1 --format=%h -- "${path}"`, {
      encoding: 'utf-8',
    }).trim();
    // 撈所有 commit 日期再取第一筆,跨平台(避免依賴 head)。
    const allDates = execSync(
      `git log --format=%cI --reverse -- "${path}"`,
      { encoding: 'utf-8' },
    ).trim();
    const firstDate = allDates.split('\n')[0] || '';
    return {
      lastModified: lastDate || new Date().toISOString(),
      firstPublished: firstDate || lastDate || new Date().toISOString(),
      commitHash: hash || 'unknown',
    };
  } catch {
    const now = new Date().toISOString();
    return {
      lastModified: now,
      firstPublished: now,
      commitHash: 'local',
    };
  }
}

/**
 * 撈 SKILL.md 的 `version:` 字串最後一次「實際變動」的 commit 日期。
 *
 * 為什麼不用 `git log -L`:該指令在 -s + --format=%cI 組合下的輸出格式
 * 不穩定,初始 commit 也會被當成一筆變動,導致從沒 bump 過的 skill 被
 * 誤判為「最近 bump 過」。改用最直接的方法 — 逐個 commit 抓 frontmatter
 * 的 version 值,從新到舊比對,找到第一個「跟前一個 commit 不一樣」
 * 的點,那就是最近一次 bump。
 *
 * 演算法:
 *   1. 撈所有改過該檔的 commit (新→舊)
 *   2. 依序對每個 commit 跑 `git show <hash>:<file>` 抓內容,parse 出 version
 *   3. 從新到舊比對,當 commit[i].version !== commit[i+1].version,
 *      commit[i].date 就是 bump 點(該值「變成現在這樣」的時間)
 *   4. 從頭到尾沒變化 = 從沒 bump 過 = return null
 *
 * 邊界:
 *   - 只有 1 個 commit:不可能 bump,return null
 *   - 中間某個 commit 抓不到檔(rename / 暫刪):跳過,繼續比下一個
 *   - version 行 parse 不出:該 commit 視為 version = ''(會跟下個比)
 *   - git 完全失敗(不在 repo 內):catch 住,return null
 */
function getVersionBumpedAt(skillFolder: string): string | null {
  const filePath = join('skills', skillFolder, 'SKILL.md');
  try {
    // 撈所有改過該檔的 commit。--follow 處理 rename。
    // 格式:<hash>\t<iso-date>,一行一筆,新→舊。
    const log = execSync(
      `git log --format=%H%x09%cI --follow -- "${filePath}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] },
    ).trim();
    if (!log) return null;

    const commits = log
      .split('\n')
      .map((line) => {
        const [hash, date] = line.split('\t');
        return { hash, date };
      })
      .filter((c) => c.hash && c.date);

    if (commits.length <= 1) return null;

    // 對每個 commit 抓當下的 version 字串。抓不到就回 null(視為「不可比」)。
    const versionAt = (hash: string): string | null => {
      try {
        const content = execSync(`git show ${hash}:"${filePath}"`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        const m = content.match(/^version:\s*['"]?([^'"\n]+?)['"]?\s*$/m);
        return m?.[1].trim() ?? '';
      } catch {
        return null;
      }
    };

    // 從新到舊掃,找到第一個「跟更舊那筆 version 不同」的 commit。
    // 抓不到值(null)的 commit 視為斷點,跳過用下一個非 null 來比。
    let i = 0;
    while (i < commits.length) {
      const current = versionAt(commits[i].hash);
      if (current === null) {
        i++;
        continue;
      }
      // 找下一個能抓到 version 的更舊 commit
      let j = i + 1;
      while (j < commits.length && versionAt(commits[j].hash) === null) j++;
      if (j >= commits.length) {
        // 沒有更舊的可比 = current 是最早的可比 commit = 沒 bump 過
        return null;
      }
      const older = versionAt(commits[j].hash);
      if (current !== older) {
        // commits[i].date 是「version 變成 current 那次的 commit」= bump 點
        return commits[i].date;
      }
      // 一樣,往下找
      i = j;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 從一份 markdown 內文撈出第一行有意義的文字(略過標題、空行、frontmatter 殘留),
 * 用來當清單上的摘要。
 */
function extractFirstLine(body: string): string {
  const lines = body.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) continue; // 略過標題
    if (line.startsWith('---')) continue; // 略過分隔線
    if (line.startsWith('>')) {
      // 引用區塊也可以當摘要,但去掉 > 前綴
      return line.replace(/^>+\s*/, '').slice(0, 120);
    }
    return line.slice(0, 120);
  }
  return '';
}

/**
 * 把 references/xxx.md 的 filename 轉成 URL-safe slug(去掉 .md 副檔名)。
 * 例:`prd-template.md` → `prd-template`
 */
function refSlug(filename: string): string {
  return filename.replace(/\.md$/i, '');
}

/**
 * 讀一個 skill 底下的 references/ 子資料夾,回傳平展清單。
 * 不存在或非目錄一律回空陣列。
 */
function readReferences(skillFolder: string): SkillReference[] {
  const refsDir = join(SKILLS_DIR, skillFolder, 'references');
  if (!existsSync(refsDir)) return [];
  const stat = statSync(refsDir);
  if (!stat.isDirectory()) return [];

  const entries = readdirSync(refsDir, { withFileTypes: true });
  const refs: SkillReference[] = [];

  for (const entry of entries) {
    // 目前只處理單層 .md 檔案,子資料夾跳過
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith('.md')) continue;

    const filePath = join(refsDir, entry.name);
    const body = readFileSync(filePath, 'utf-8');
    refs.push({
      slug: refSlug(entry.name),
      filename: entry.name,
      firstLine: extractFirstLine(body),
      body,
    });
  }

  // 依檔名排序,輸出穩定
  refs.sort((a, b) => a.filename.localeCompare(b.filename));
  return refs;
}

/**
 * 從 description 規則切出 At a glance 用的兩段:
 *   - 觸發關鍵字
 *   - DO NOT trigger for
 * 切不到就回 null,前端就不顯示對應區塊。
 *
 * 同時從 SKILL.md body 撈 ## Gotchas 區段下的 ### 子標題,作為「常見踩雷」摘要。
 */
function extractAtGlance(description: string, body: string): AtGlance {
  // --- 觸發關鍵字段 ---
  const triggerMatch = description.match(
    /(?:觸發關鍵字|觸發詞|trigger keywords?|trigger on)[::]\s*([\s\S]*?)(?=\n\s*\n|DO NOT|不適用|不要觸發|\n[*-]\s|$)/i,
  );
  const triggerKeywords = triggerMatch ? triggerMatch[1].trim().replace(/\s+/g, ' ') : null;

  // --- DO NOT trigger 段 ---
  const doNotMatch = description.match(
    /(?:DO NOT trigger(?: for)?|Do NOT|DO NOT|不適用情境|不要觸發的情境|不觸發情境)[::]\s*([\s\S]*?)(?=\n\s*\n|$)/i,
  );
  const doNotTrigger = doNotMatch ? doNotMatch[1].trim().replace(/\s+/g, ' ') : null;

  // --- DO NOT trigger 首句 hint ---
  let doNotFirstHint: string | null = null;
  if (doNotTrigger) {
    const firstChunk = doNotTrigger.split(/[、;;,.。]/)[0]?.trim() ?? '';
    if (firstChunk && firstChunk.length <= 80) {
      doNotFirstHint = firstChunk;
    } else if (firstChunk) {
      doNotFirstHint = firstChunk.slice(0, 60) + '…';
    }
  }

  // --- Gotchas 標題清單 ---
  const gotchaTitles: string[] = [];
  const gotchaSectionMatch = body.match(
    /^##\s+(?:Gotchas?|常見踩雷|踩坑|錯誤模式)[^\n]*\n([\s\S]+?)(?=\n##\s|$(?![\r\n]))/im,
  );
  if (gotchaSectionMatch) {
    const section = gotchaSectionMatch[1];

    // 策略 1:H3
    const h3Regex = /^###\s+(.+?)$/gm;
    let m: RegExpExecArray | null;
    while ((m = h3Regex.exec(section)) !== null) {
      const title = m[1].trim().replace(/^\*\*|\*\*$/g, '');
      if (title) gotchaTitles.push(title);
    }

    // 策略 2:H3 撈不到才 fallback 列表項粗體
    if (gotchaTitles.length === 0) {
      const listRegex = /^[-*]\s+\*\*([^*\n]+?)\*\*[::]/gm;
      while ((m = listRegex.exec(section)) !== null) {
        const title = m[1].trim();
        if (title) gotchaTitles.push(title);
      }
    }
  }

  return {
    triggerKeywords,
    doNotTrigger,
    doNotFirstHint,
    gotchaTitles,
  };
}

/**
 * 讀一個 skill 的 CHANGELOG.md,回傳「不含開頭 `# Changelog` 標題」的整段 markdown。
 * 沒有 CHANGELOG.md 回空字串(過渡期允許,CI 在 check-changelogs.ts 守門)。
 *
 * 為什麼剝掉第一行標題:前端在 skill 詳情頁本身就有 section 標題,
 * 留 `# Changelog` 會出現雙標題。
 */
function readChangelog(skillFolder: string): string {
  const path = join(SKILLS_DIR, skillFolder, 'CHANGELOG.md');
  if (!existsSync(path)) return '';
  const raw = readFileSync(path, 'utf-8');
  // 剝掉第一個 H1(若存在),其餘原樣保留
  return raw.replace(/^#\s+[^\n]*\n+/, '').trim();
}

function buildSkillMeta(folder: string): SkillMeta {
  const skillMdPath = join(SKILLS_DIR, folder, 'SKILL.md');
  const raw = readFileSync(skillMdPath, 'utf-8');
  const parsed = matter(raw);
  const fm = SkillFrontmatterSchema.parse(parsed.data);

  const zipFilename = `${folder}-${fm.version}.zip`;
  const zipPath = join(DOWNLOADS_DIR, zipFilename);
  const zipSize = existsSync(zipPath) ? statSync(zipPath).size : 0;

  const { lastModified, firstPublished, commitHash } = getGitInfo(folder);
  const bumpedAt = getVersionBumpedAt(folder);
  const hasBeenVersionBumped = bumpedAt !== null;
  // 沒 bump 過時保持 null。讓下游必須先檢查 flag,避免靜默用錯日期。
  const versionBumpedAt = bumpedAt;

  const body = parsed.content.trim();
  const references = readReferences(folder);
  const atGlance = extractAtGlance(fm.description, body);
  const changelog = readChangelog(folder);

  return {
    ...fm,
    body,
    zipFilename,
    zipSize,
    lastModified,
    firstPublished,
    versionBumpedAt,
    hasBeenVersionBumped,
    commitHash,
    references,
    atGlance,
    changelog,
  };
}

function main(): void {
  const folders = listSkillFolders();

  console.log(`📚 Building catalog for ${folders.length} skill(s)...\n`);

  const skills: SkillMeta[] = folders.map(buildSkillMeta);

  // 排序:依 name 升冪。
  skills.sort((a, b) => a.name.localeCompare(b.name));

  const outputDir = dirname(OUTPUT_FILE);
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalCount: skills.length,
        skills,
      },
      null,
      2,
    ),
  );

  console.log(`  ✓ ${skills.length} skill(s) catalogued`);
  const totalRefs = skills.reduce((sum, s) => sum + s.references.length, 0);
  console.log(`  ✓ ${totalRefs} reference file(s) included`);
  console.log(`  ✓ Written to site/src/data/skills.generated.json`);

  // 對外公開的精簡 manifest(不含 body / references body,只保留必要欄位)
  const publicManifest = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    totalCount: skills.length,
    skills: skills.map((s) => ({
      name: s.name,
      version: s.version,
      category: s.category,
      description: s.description.split('\n')[0].trim(),
      tags: s.tags,
      zipFilename: s.zipFilename,
      zipSize: s.zipSize,
      lastModified: s.lastModified,
    })),
  };

  const publicManifestDir = dirname(PUBLIC_MANIFEST_FILE);
  if (!existsSync(publicManifestDir)) mkdirSync(publicManifestDir, { recursive: true });
  writeFileSync(PUBLIC_MANIFEST_FILE, JSON.stringify(publicManifest, null, 2));
  console.log(`  ✓ Written to site/public/manifest.json (public API)\n`);
}

main();
