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
 * 撈 SKILL.md 的 `version:` 那行最後一次「實際變動」的 commit 日期。
 *
 * 用 `git log -L /^version:/,+1:<file>` 追蹤該行歷史,git 會自動把
 * 「沒動到 version 行的 commit」濾掉(像是改 description / 補 reference)。
 * -s 抑制 diff 輸出,只剩日期。第一筆 = 最新一次該行變動。
 *
 * 回傳 null 表示:從沒 bump 過 / 還沒 commit / 撈不到歷史。
 * 呼叫端用 firstPublished 當 fallback,並另外記 hasBeenVersionBumped flag。
 */
function getVersionBumpedAt(skillFolder: string): string | null {
  const filePath = join('skills', skillFolder, 'SKILL.md');
  try {
    const out = execSync(
      `git log -L '/^version:/,+1:${filePath}' -s --format=%cI`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] },
    ).trim();
    const lines = out.split('\n').filter((l) => /^\d{4}-/.test(l));
    // git -L 的輸出:從新到舊。如果只有一筆 = 初始 commit,沒 bump 過。
    // 兩筆以上才算「真的有 bump」過。
    if (lines.length <= 1) return null;
    return lines[0];
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
  // 匹配「觸發關鍵字」或「觸發詞」開頭、到下一個段落為止
  const triggerMatch = description.match(
    /(?:觸發關鍵字|觸發詞|trigger keywords?|trigger on)[::]\s*([\s\S]*?)(?=\n\s*\n|DO NOT|不適用|不要觸發|\n[*-]\s|$)/i,
  );
  const triggerKeywords = triggerMatch ? triggerMatch[1].trim().replace(/\s+/g, ' ') : null;

  // --- DO NOT trigger 段 ---
  // 容忍兩種寫法:
  //   v1: "DO NOT trigger for: 場景 1、場景 2..."
  //   v2: "Do NOT: 場景 1 → skill-a;場景 2 → skill-b..."
  // 中文 alternate 必須是段落起首結構(後面跟冒號或破折號),否則容易誤觸 description 內文中的「不觸發」「不適用」單字。
  const doNotMatch = description.match(
    /(?:DO NOT trigger(?: for)?|Do NOT|DO NOT|不適用情境|不要觸發的情境|不觸發情境)[::]\s*([\s\S]*?)(?=\n\s*\n|$)/i,
  );
  const doNotTrigger = doNotMatch ? doNotMatch[1].trim().replace(/\s+/g, ' ') : null;

  // --- DO NOT trigger 首句 hint ---
  // 從 doNotTrigger 段抽「第一條替代建議」,用於卡片消歧義 hint。
  // 寫作慣例觀察:多半長這樣 →
  //   「審 skill 結構(用 skill-review)、規劃新 skill(用 skill-brain)、...」
  //   「寫產品 PRD(用 prd-writer);批判性概念設計審查(用 critical-reviewer);...」
  // 抽第一個「、」「;」「,」「.」之前的片段,長度截到 60 字內。
  let doNotFirstHint: string | null = null;
  if (doNotTrigger) {
    // 切到第一個列舉分隔符
    const firstChunk = doNotTrigger.split(/[、;;,.。]/)[0]?.trim() ?? '';
    if (firstChunk && firstChunk.length <= 80) {
      doNotFirstHint = firstChunk;
    } else if (firstChunk) {
      // 太長就硬截到 60 字 + 省略號
      doNotFirstHint = firstChunk.slice(0, 60) + '…';
    }
  }

  // --- Gotchas 標題清單 ---
  // 找 ## Gotchas 區段(中英都接受),用雙策略撈標題:
  //   策略 1:H3 標題(### G1:xxx)— coding-planner 風格
  //   策略 2 fallback:列表項粗體(- **xxx**:)— prd-writer 風格
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
  const versionBumpedAt = bumpedAt ?? firstPublished;

  const body = parsed.content.trim();
  const references = readReferences(folder);
  const atGlance = extractAtGlance(fm.description, body);

  // group fallback:沒寫 frontmatter 的 skill 暫歸 'specialty',main() 會印 warning
  const group = fm.group ?? 'specialty';

  return {
    ...fm,
    group,
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
  };
}

function main(): void {
  const folders = listSkillFolders();

  console.log(`📚 Building catalog for ${folders.length} skill(s)...\n`);

  const skills: SkillMeta[] = folders.map(buildSkillMeta);

  // ─────────────────────────────────────────────────────────
  // Lint pass(不 fail,只 warning)
  //   1. group 未宣告 → 提醒 maintainer
  //   2. feeds_into / consumes_from 對稱性檢查
  //   3. 關係指向不存在的 skill
  // ─────────────────────────────────────────────────────────
  const warnings: string[] = [];
  const nameSet = new Set(skills.map((s) => s.name));
  const skillByName = new Map(skills.map((s) => [s.name, s]));

  for (const s of skills) {
    // (1) group missing
    const fm = matter(readFileSync(join(SKILLS_DIR, s.name, 'SKILL.md'), 'utf-8')).data;
    if (!fm.group) {
      warnings.push(`[group-missing] ${s.name}: 未宣告 group,目前 fallback 到 'specialty'`);
    }

    // (2a) feeds_into 對稱性:A feeds_into B → B 應 consumes_from A
    for (const target of s.feeds_into) {
      if (!nameSet.has(target)) {
        warnings.push(`[unknown-skill] ${s.name}.feeds_into 指向不存在的 skill: ${target}`);
        continue;
      }
      const targetSkill = skillByName.get(target);
      if (targetSkill && !targetSkill.consumes_from.includes(s.name)) {
        warnings.push(
          `[asymmetric] ${s.name} feeds_into ${target},但 ${target}.consumes_from 沒含 ${s.name}`,
        );
      }
    }

    // (2b) consumes_from 對稱性:A consumes_from B → B 應 feeds_into A
    for (const source of s.consumes_from) {
      if (!nameSet.has(source)) {
        warnings.push(`[unknown-skill] ${s.name}.consumes_from 指向不存在的 skill: ${source}`);
        continue;
      }
      const sourceSkill = skillByName.get(source);
      if (sourceSkill && !sourceSkill.feeds_into.includes(s.name)) {
        warnings.push(
          `[asymmetric] ${s.name} consumes_from ${source},但 ${source}.feeds_into 沒含 ${s.name}`,
        );
      }
    }
  }

  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} lint warning(s):`);
    for (const w of warnings) console.log(`   ${w}`);
    console.log('');
  }

  // Sort: group order then name
  // 注意:Astro 端會自己再依 GROUP_META.order 分組渲染,這裡的排序只是讓 JSON 穩定。
  skills.sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return a.name.localeCompare(b.name);
  });

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
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    totalCount: skills.length,
    skills: skills.map((s) => ({
      name: s.name,
      version: s.version,
      category: s.category,
      group: s.group,
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
