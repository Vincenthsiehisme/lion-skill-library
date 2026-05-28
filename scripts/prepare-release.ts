#!/usr/bin/env tsx
/**
 * prepare-release.ts — Layer 1 本地上架前置腳本
 *
 * 目的:在 git commit 之前,確保每個動過的 skill 都同步更新了
 * SKILL.md 的 version 與 CHANGELOG.md 的對應段落。
 *
 * 流程:
 *   1. 對比 origin/main,掃出有改動的 skill
 *   2. 逐個 skill 互動式詢問:
 *      - 建議版號(用啟發式規則算)
 *      - 變更摘要(一句話)
 *   3. 自動改 SKILL.md frontmatter 的 version
 *   4. 自動在 CHANGELOG.md 插入新段落
 *   5. 大 diff 時(>= 50 行)額外輸出 .lion-stage/<name>-diff-summary.md
 *      供使用者貼給 Claude 整理
 *
 * 不做的事:
 *   - 不 git add,不 commit,不 push(使用者自己決定何時 commit)
 *   - 不打包 zip(zip 由 GitHub Actions 在 deploy 時打)
 *   - 不解析 CHANGELOG.md 內容(自由格式)
 *
 * Idempotent:重跑會偵測 CHANGELOG.md 已有當前 version 段落,跳過該 skill。
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import matter from 'gray-matter';

const SKILLS_DIR = join(process.cwd(), 'skills');
const STAGE_DIR = join(process.cwd(), '.lion-stage');
const BASE_REF = process.env.LION_BASE_REF || 'origin/main';
const LARGE_DIFF_THRESHOLD = 50;
const RESERVED = ['_template'];

interface SkillDiff {
  name: string;
  status: 'new' | 'modified';
  filesChanged: string[];
  linesAdded: number;
  linesRemoved: number;
  currentVersion: string;
  /** 本地 SKILL.md 是否動過 body(非 frontmatter only) */
  bodyChanged: boolean;
  /** 本地 SKILL.md 是否動過 description 或 trigger 關鍵字 */
  descriptionChanged: boolean;
}

// ─── 1. 偵測改動 ────────────────────────────────────────────────

function safeExec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

/** 確認 BASE_REF 存在,不存在則 fallback 到首次 commit */
function resolveBaseRef(): string | null {
  const exists = safeExec(`git rev-parse --verify ${BASE_REF} 2>/dev/null`);
  if (exists) return BASE_REF;

  console.log(`⚠ ${BASE_REF} 不存在(首次 push?),改用首次 commit 作為比較基準`);
  const firstCommit = safeExec('git rev-list --max-parents=0 HEAD');
  if (!firstCommit) {
    console.error('✗ 無法定位任何 commit,中止');
    return null;
  }
  return firstCommit.split('\n')[0];
}

/** 拿 base ref 跟 working tree 之間,動過的 skill 資料夾清單 */
function detectChangedSkills(baseRef: string): SkillDiff[] {
  // git diff 包含已 staged + working tree 跟 base 的差
  const diffOutput = safeExec(`git diff --numstat ${baseRef} -- skills/`);
  if (!diffOutput) return [];

  const skillData = new Map<string, { files: Set<string>; added: number; removed: number }>();

  for (const line of diffOutput.split('\n')) {
    const [addedStr, removedStr, path] = line.split('\t');
    // 二進位檔會回 "-" "-",當 0 處理
    const added = addedStr === '-' ? 0 : parseInt(addedStr, 10) || 0;
    const removed = removedStr === '-' ? 0 : parseInt(removedStr, 10) || 0;
    const match = path.match(/^skills\/([^/]+)\//);
    if (!match) continue;
    const skillName = match[1];
    if (RESERVED.includes(skillName)) continue;

    const entry = skillData.get(skillName) ?? { files: new Set(), added: 0, removed: 0 };
    entry.files.add(path);
    entry.added += added;
    entry.removed += removed;
    skillData.set(skillName, entry);
  }

  const results: SkillDiff[] = [];
  for (const [name, data] of skillData) {
    const skillMdPath = join(SKILLS_DIR, name, 'SKILL.md');
    if (!existsSync(skillMdPath)) continue;

    const currentVersion = readFrontmatterVersion(skillMdPath);
    const baseVersion = safeExec(
      `git show ${baseRef}:skills/${name}/SKILL.md 2>/dev/null`,
    );
    const status: 'new' | 'modified' = baseVersion ? 'modified' : 'new';

    // 判斷 body / description 是否動過
    let bodyChanged = false;
    let descriptionChanged = false;
    if (status === 'modified' && data.files.has(`skills/${name}/SKILL.md`)) {
      const baseFm = parseFrontmatter(baseVersion);
      const currentFm = parseFrontmatter(readFileSync(skillMdPath, 'utf-8'));
      bodyChanged = baseFm.body !== currentFm.body;
      descriptionChanged = baseFm.description !== currentFm.description;
    }

    results.push({
      name,
      status,
      filesChanged: [...data.files].sort(),
      linesAdded: data.added,
      linesRemoved: data.removed,
      currentVersion,
      bodyChanged,
      descriptionChanged,
    });
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

// ─── 2. frontmatter / version 操作 ──────────────────────────────

function readFrontmatterVersion(path: string): string {
  const raw = readFileSync(path, 'utf-8');
  const parsed = matter(raw);
  return (parsed.data as { version?: string }).version || '0.0.0';
}

function parseFrontmatter(raw: string): { version: string; body: string; description: string } {
  if (!raw) return { version: '', body: '', description: '' };
  const parsed = matter(raw);
  const data = parsed.data as { version?: string; description?: string };
  return {
    version: data.version || '',
    body: parsed.content.trim(),
    description: data.description || '',
  };
}

function bumpVersion(version: string, kind: 'major' | 'minor' | 'patch'): string {
  const parts = version.split('.').map((n) => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  const [major, minor, patch] = parts;
  if (kind === 'major') return `${major + 1}.0.0`;
  if (kind === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/** 啟發式建議版號;邏輯詳見 prepare-release Trade-off doc */
function suggestVersion(diff: SkillDiff): { suggested: string; reason: string } {
  if (diff.status === 'new') {
    return { suggested: '0.1.0', reason: '新 skill,初版' };
  }
  const total = diff.linesAdded + diff.linesRemoved;
  // description 或 trigger 關鍵字變了 → minor(觸發行為變了,使用者該注意)
  if (diff.descriptionChanged) {
    return {
      suggested: bumpVersion(diff.currentVersion, 'minor'),
      reason: 'description 變動(觸發行為改變)',
    };
  }
  if (diff.bodyChanged && total >= 20) {
    return {
      suggested: bumpVersion(diff.currentVersion, 'minor'),
      reason: `SKILL.md body 動了 ${total} 行`,
    };
  }
  return {
    suggested: bumpVersion(diff.currentVersion, 'patch'),
    reason: '小幅變動',
  };
}

/** 改 SKILL.md frontmatter 的 version 字串,保留檔案其他部分原樣 */
function writeNewVersion(skillName: string, newVersion: string): void {
  const path = join(SKILLS_DIR, skillName, 'SKILL.md');
  const raw = readFileSync(path, 'utf-8');
  const updated = raw.replace(/^version:\s*['"]?[^'"\n]+['"]?\s*$/m, `version: ${newVersion}`);
  if (updated === raw) {
    throw new Error(`找不到 version: 行可替換 in ${path}`);
  }
  writeFileSync(path, updated, 'utf-8');
}

// ─── 3. CHANGELOG.md 操作 ──────────────────────────────────────

function hasChangelogEntry(skillName: string, version: string): boolean {
  const path = join(SKILLS_DIR, skillName, 'CHANGELOG.md');
  if (!existsSync(path)) return false;
  const raw = readFileSync(path, 'utf-8');
  const re = new RegExp(`^##\\s+${version.replace(/\./g, '\\.')}\\s+-`, 'm');
  return re.test(raw);
}

function ensureChangelog(skillName: string): void {
  const path = join(SKILLS_DIR, skillName, 'CHANGELOG.md');
  if (existsSync(path)) return;
  writeFileSync(path, '# Changelog\n\n', 'utf-8');
}

function prependChangelogEntry(skillName: string, version: string, summary: string): void {
  const path = join(SKILLS_DIR, skillName, 'CHANGELOG.md');
  ensureChangelog(skillName);
  const raw = readFileSync(path, 'utf-8');
  const today = new Date().toISOString().slice(0, 10);
  const entry = `## ${version} - ${today}\n${summary}\n\n`;

  // 在 `# Changelog` 標題後插入(若沒有標題就放最前面)
  let updated: string;
  if (/^#\s+Changelog/m.test(raw)) {
    updated = raw.replace(/^(#\s+Changelog\s*\n+)/, `$1${entry}`);
  } else {
    updated = `# Changelog\n\n${entry}${raw}`;
  }
  writeFileSync(path, updated, 'utf-8');
}

// ─── 4. 大 diff 摘要輸出 ────────────────────────────────────────

function writeDiffSummary(diff: SkillDiff, baseRef: string): string {
  if (!existsSync(STAGE_DIR)) mkdirSync(STAGE_DIR, { recursive: true });
  const outPath = join(STAGE_DIR, `${diff.name}-diff-summary.md`);

  const fullDiff = safeExec(`git diff ${baseRef} -- skills/${diff.name}/`);
  const md = `# Diff summary for \`${diff.name}\`

- 變動檔案數:${diff.filesChanged.length}
- 加減行數:+${diff.linesAdded} / -${diff.linesRemoved}
- 動到的檔案:
${diff.filesChanged.map((f) => `  - ${f}`).join('\n')}

## 完整 diff(貼給 Claude 整理 CHANGELOG 用)

\`\`\`diff
${fullDiff}
\`\`\`

---

請對 Claude 說:「幫我把上面的 diff 整理成 CHANGELOG.md 條目,1-3 句白話,只講『改了什麼』不講『為什麼』」。
整理完的內容請手動補進 \`skills/${diff.name}/CHANGELOG.md\` 對應 version 段落。
`;
  writeFileSync(outPath, md, 'utf-8');
  return outPath;
}

// ─── 5. 互動主流程 ──────────────────────────────────────────────

async function main(): Promise<void> {
  const baseRef = resolveBaseRef();
  if (!baseRef) process.exit(1);

  console.log(`🔍 對比 ${baseRef},掃描本地改動...\n`);

  const changed = detectChangedSkills(baseRef);
  if (changed.length === 0) {
    console.log('✓ 沒有 skill 改動,無事可做。\n');
    return;
  }

  console.log(`偵測到 ${changed.length} 個 skill 有改動:\n`);

  const rl = createInterface({ input, output });
  // 自製 prompt:對 piped stdin 比 readline/promises.question 穩
  const ask = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));
  let processed = 0;
  let skipped = 0;

  for (let i = 0; i < changed.length; i++) {
    const diff = changed[i];
    console.log(`[${i + 1}/${changed.length}] ${diff.name}`);
    console.log(`  狀態:${diff.status === 'new' ? '新發布' : '既有(當前 v' + diff.currentVersion + ')'}`);
    console.log(`  改動:+${diff.linesAdded} -${diff.linesRemoved} 行,${diff.filesChanged.length} 個檔案`);
    for (const f of diff.filesChanged) console.log(`    - ${f}`);

    // 若 CHANGELOG.md 已有當前 version 段落,代表使用者之前手動補過,跳過
    if (hasChangelogEntry(diff.name, diff.currentVersion) && diff.status === 'modified') {
      // 還要檢查 version 是否真的有 bump 過(否則段落是初版的)
      const baseVersion = parseFrontmatter(
        safeExec(`git show ${baseRef}:skills/${diff.name}/SKILL.md`),
      ).version;
      if (baseVersion !== diff.currentVersion) {
        console.log(`  ✓ 已偵測到 CHANGELOG.md 已含 v${diff.currentVersion} 段落,跳過\n`);
        skipped++;
        continue;
      }
    }

    const { suggested, reason } = suggestVersion(diff);
    console.log(`  建議版號:${suggested}(理由:${reason})`);

    const answer = (await ask(`  ? 確認版號 [${suggested}]: `)).trim();
    const finalVersion = answer || suggested;

    if (!/^\d+\.\d+\.\d+$/.test(finalVersion)) {
      console.log(`  ✗ "${finalVersion}" 不是合法 semver,跳過此 skill\n`);
      skipped++;
      continue;
    }

    const summary = (await ask('  ? 變更摘要(一句話,空字串放棄此 skill):')).trim();
    if (!summary) {
      console.log('  ⚠ 變更摘要為空,跳過此 skill\n');
      skipped++;
      continue;
    }

    // 寫入
    if (finalVersion !== diff.currentVersion) {
      writeNewVersion(diff.name, finalVersion);
      console.log(`  ✓ SKILL.md version: ${diff.currentVersion} → ${finalVersion}`);
    }
    prependChangelogEntry(diff.name, finalVersion, summary);
    console.log(`  ✓ CHANGELOG.md 已插入 v${finalVersion} 段落`);

    // 大 diff → 額外摘要
    const totalLines = diff.linesAdded + diff.linesRemoved;
    if (totalLines >= LARGE_DIFF_THRESHOLD) {
      const outPath = writeDiffSummary(diff, baseRef);
      console.log(`  ⚠ diff 共 ${totalLines} 行 >= ${LARGE_DIFF_THRESHOLD},已輸出摘要:`);
      console.log(`    ${outPath}`);
      console.log(`    → 貼給 Claude 整理,回來補進 CHANGELOG.md`);
    }

    processed++;
    console.log();
  }

  rl.close();
  console.log(`完成:處理 ${processed} 個,跳過 ${skipped} 個。`);
  if (processed > 0) {
    console.log('下一步:git add -A && git commit && git push\n');
  }
}

main().catch((err) => {
  console.error('✗ prepare-release 失敗:', err);
  process.exit(1);
});
