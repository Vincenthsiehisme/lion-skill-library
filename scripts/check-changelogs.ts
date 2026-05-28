#!/usr/bin/env tsx
/**
 * check-changelogs.ts — Layer 2 CI 守門檢查
 *
 * 在 GitHub Actions 跑,不信任 Layer 1 真的跑過。對每個 skill 檢查:
 *   1. CHANGELOG.md 必須存在
 *   2. CHANGELOG.md 必須含當前 SKILL.md version 對應段落
 *      (`## <version> -` 標題,自由格式不檢查內容)
 *   3. 若 GITHUB_EVENT_BEFORE / GITHUB_SHA 都在,額外檢查:
 *      該 commit range 內動過 SKILL.md 的 skill,version 字串也必須動過。
 *
 * 任一失敗 → exit 1,擋住 deploy。
 *
 * 設計選擇:
 *   - 不依賴 Layer 1 留下的任何 marker file(Layer 1 可被繞過)
 *   - 對「新 skill」放寬:沒線上版本可比,只要 CHANGELOG.md 結構對就過
 *   - 第 3 條對 push event 才有意義;workflow_dispatch / 首次 commit 跳過
 */

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const SKILLS_DIR = join(process.cwd(), 'skills');
const RESERVED = ['_template'];

interface CheckResult {
  skill: string;
  errors: string[];
}

function safeExec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function listSkillFolders(): string[] {
  return readdirSync(SKILLS_DIR)
    .filter((name) => {
      const p = join(SKILLS_DIR, name);
      return statSync(p).isDirectory();
    })
    .filter((name) => !RESERVED.includes(name));
}

function readSkillVersion(folder: string): string {
  const path = join(SKILLS_DIR, folder, 'SKILL.md');
  const raw = readFileSync(path, 'utf-8');
  const fm = matter(raw).data as { version?: string };
  return fm.version || '';
}

function hasChangelogEntry(folder: string, version: string): boolean {
  const path = join(SKILLS_DIR, folder, 'CHANGELOG.md');
  if (!existsSync(path)) return false;
  const raw = readFileSync(path, 'utf-8');
  const re = new RegExp(`^##\\s+${version.replace(/\./g, '\\.')}\\s+-`, 'm');
  return re.test(raw);
}

/**
 * 第 3 條檢查:在 push event 的 commit range 內,
 * 若 SKILL.md 動過但 version 字串沒動 → 失敗。
 */
function checkVersionBumpInPushRange(folder: string): string | null {
  const before = process.env.GITHUB_EVENT_BEFORE;
  const sha = process.env.GITHUB_SHA;
  if (!before || !sha) return null; // 不是 push event,跳過
  // 全 0 的 before 表示首次 push,跳過
  if (/^0+$/.test(before)) return null;

  const skillMdPath = `skills/${folder}/SKILL.md`;
  // 該檔在 range 內動過嗎?
  const changedFiles = safeExec(`git diff --name-only ${before} ${sha} -- "${skillMdPath}"`);
  if (!changedFiles.includes(skillMdPath)) return null; // 沒動,免檢

  // 動過 → 檢查 version 字串是否也動過
  const versionDiff = safeExec(
    `git diff ${before} ${sha} -- "${skillMdPath}" | grep -E '^[+-]version:' || true`,
  );
  if (!versionDiff) {
    return `SKILL.md 在 push range 內動過,但 version 字串沒變(${before.slice(0, 7)}..${sha.slice(0, 7)})`;
  }
  return null;
}

function checkSkill(folder: string): CheckResult {
  const errors: string[] = [];
  const skillMdPath = join(SKILLS_DIR, folder, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    errors.push('SKILL.md 不存在');
    return { skill: folder, errors };
  }

  const version = readSkillVersion(folder);
  if (!version) {
    errors.push('SKILL.md frontmatter 缺 version');
    return { skill: folder, errors };
  }

  const changelogPath = join(SKILLS_DIR, folder, 'CHANGELOG.md');
  if (!existsSync(changelogPath)) {
    errors.push(`CHANGELOG.md 不存在(請跑 npm run prepare 補上)`);
    return { skill: folder, errors };
  }

  if (!hasChangelogEntry(folder, version)) {
    errors.push(
      `CHANGELOG.md 缺 v${version} 段落(預期 \`## ${version} - YYYY-MM-DD\` 標題)`,
    );
  }

  const bumpError = checkVersionBumpInPushRange(folder);
  if (bumpError) errors.push(bumpError);

  return { skill: folder, errors };
}

function main(): void {
  const folders = listSkillFolders();

  if (folders.length === 0) {
    console.log('⚠️  No skills found, nothing to check\n');
    process.exit(0);
  }

  console.log(`🔍 Checking changelogs for ${folders.length} skill(s)...\n`);

  const results = folders.map(checkSkill);
  const failed = results.filter((r) => r.errors.length > 0);

  for (const r of results) {
    if (r.errors.length === 0) {
      console.log(`  ✓ ${r.skill}`);
    } else {
      console.log(`  ✗ ${r.skill}`);
      for (const err of r.errors) console.log(`      └─ ${err}`);
    }
  }

  console.log();

  if (failed.length > 0) {
    console.error(`❌ ${failed.length} skill(s) failed changelog checks\n`);
    console.error('在本地跑 `npm run prepare` 補齊版號與 CHANGELOG,再 push。\n');
    process.exit(1);
  }

  console.log(`✅ All ${results.length} skill(s) have valid changelogs\n`);
}

main();
