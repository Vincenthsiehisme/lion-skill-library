#!/usr/bin/env tsx
/**
 * release-plan.ts — 產生 AI 可讀的 release draft，不改檔。
 *
 * 目的：把「哪些 skill 有變、變在哪、建議怎麼 bump」整理成一份 Markdown，
 * 交給 AI 產出 .lion-stage/release-notes.json，再由 release-apply.ts 套用。
 *
 * Usage:
 *   npm run release:plan
 *   npm run release:plan -- --only skill-review
 *   npm run release:plan -- --base origin/main --out .lion-stage/release-plan.md
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const SKILLS_DIR = join(process.cwd(), 'skills');
const STAGE_DIR = join(process.cwd(), '.lion-stage');
const RESERVED = new Set(['_template']);
const DEFAULT_BASE_REF = process.env.LION_BASE_REF || 'origin/main';
const DEFAULT_MD_OUT = join(STAGE_DIR, 'release-plan.md');
const DEFAULT_TEMPLATE_OUT = join(STAGE_DIR, 'release-notes.template.json');

type ReleaseType = 'major' | 'minor' | 'patch' | 'none';
type SkillStatus = 'new' | 'modified';

interface CliOptions {
  baseRef: string;
  only: Set<string> | null;
  mdOut: string;
  templateOut: string;
  includeFullDiff: boolean;
}

interface ParsedSkillMd {
  version: string;
  description: string;
  body: string;
}

interface ChangedSkill {
  name: string;
  status: SkillStatus;
  currentVersion: string;
  baseVersion: string | null;
  suggestedReleaseType: ReleaseType;
  suggestedVersion: string | null;
  suggestedReason: string;
  filesChanged: string[];
  linesAdded: number;
  linesRemoved: number;
  bodyChanged: boolean;
  descriptionChanged: boolean;
  versionChanged: boolean;
  changelogChanged: boolean;
  diffText: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    baseRef: DEFAULT_BASE_REF,
    only: null,
    mdOut: DEFAULT_MD_OUT,
    templateOut: DEFAULT_TEMPLATE_OUT,
    includeFullDiff: true,
  };

  const addOnly = (value: string): void => {
    const names = value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (!options.only) options.only = new Set<string>();
    for (const name of names) options.only.add(name);
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    const readValue = (flag: string): string => {
      const inline = arg.match(new RegExp(`^${flag}=(.+)$`));
      if (inline) return inline[1];

      const next = argv[i + 1];
      if (!next || next.startsWith('--')) throw new Error(`${flag} requires a value`);
      i++;
      return next;
    };

    if (arg === '--base' || arg.startsWith('--base=')) {
      options.baseRef = readValue('--base');
      continue;
    }

    if (arg === '--only' || arg.startsWith('--only=')) {
      addOnly(readValue('--only'));
      continue;
    }

    if (arg === '--out' || arg.startsWith('--out=')) {
      options.mdOut = readValue('--out');
      continue;
    }

    if (arg === '--template-out' || arg.startsWith('--template-out=')) {
      options.templateOut = readValue('--template-out');
      continue;
    }

    if (arg === '--summary-only') {
      options.includeFullDiff = false;
      continue;
    }

    if (!arg.startsWith('--')) {
      addOnly(arg);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function safeExec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trimEnd();
  } catch {
    return '';
  }
}

function ensureStageDir(): void {
  if (!existsSync(STAGE_DIR)) mkdirSync(STAGE_DIR, { recursive: true });
}

function isGitRepository(): boolean {
  return Boolean(safeExec('git rev-parse --show-toplevel'));
}

function resolveBaseRef(requested: string): string | null {
  if (!isGitRepository()) return null;
  const exists = safeExec(`git rev-parse --verify ${shellQuote(requested)}`);
  if (exists) return requested;

  const firstCommit = safeExec('git rev-list --max-parents=0 HEAD').split('\n')[0] || '';
  return firstCommit || null;
}

function parseSkillMd(raw: string): ParsedSkillMd {
  const parsed = matter(raw);
  const data = parsed.data as { version?: unknown; description?: unknown };
  return {
    version: typeof data.version === 'string' ? data.version : '0.0.0',
    description: typeof data.description === 'string' ? data.description : '',
    body: parsed.content.trim(),
  };
}

function readCurrentSkill(name: string): ParsedSkillMd {
  const path = join(SKILLS_DIR, name, 'SKILL.md');
  return parseSkillMd(readFileSync(path, 'utf-8'));
}

function gitShow(ref: string, path: string): string {
  return safeExec(`git show ${shellQuote(`${ref}:${path}`)}`);
}

function semverParts(version: string): [number, number, number] {
  const parts = version.split('.').map((n) => Number.parseInt(n, 10));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function bumpVersion(version: string, kind: Exclude<ReleaseType, 'none'>): string {
  const [major, minor, patch] = semverParts(version);
  if (kind === 'major') return `${major + 1}.0.0`;
  if (kind === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function classifyRelease(diff: Omit<ChangedSkill, 'suggestedReleaseType' | 'suggestedVersion' | 'suggestedReason' | 'diffText'>): {
  type: ReleaseType;
  version: string | null;
  reason: string;
} {
  if (diff.status === 'new') {
    return { type: 'patch', version: '0.1.0', reason: '新 skill 初次上架，預設 0.1.0' };
  }

  const behaviorFiles = diff.filesChanged.filter((path) => {
    if (path.endsWith('/CHANGELOG.md')) return false;
    if (path.endsWith('/README.md')) return false;
    return true;
  });

  if (behaviorFiles.length === 0) {
    return { type: 'none', version: null, reason: '只改 CHANGELOG / README，通常不需要 skill release' };
  }

  if (diff.descriptionChanged) {
    return {
      type: 'minor',
      version: bumpVersion(diff.currentVersion, 'minor'),
      reason: 'description / trigger 變動，代表觸發行為改變',
    };
  }

  const total = diff.linesAdded + diff.linesRemoved;
  if (diff.bodyChanged && total >= 20) {
    return {
      type: 'minor',
      version: bumpVersion(diff.currentVersion, 'minor'),
      reason: `SKILL.md body 有中等以上變動（${total} 行）`,
    };
  }

  return {
    type: 'patch',
    version: bumpVersion(diff.currentVersion, 'patch'),
    reason: '補 reference、修正文案或小幅調整',
  };
}

function detectChangedSkills(baseRef: string, only: Set<string> | null): ChangedSkill[] {
  const diffOutput = safeExec(`git diff --numstat ${shellQuote(baseRef)} -- skills/`);
  const untrackedOutput = safeExec('git ls-files --others --exclude-standard skills/');
  const untrackedFiles = untrackedOutput ? untrackedOutput.split('\n').filter(Boolean) : [];

  const data = new Map<string, { files: Set<string>; added: number; removed: number; hasUntracked: boolean }>();

  if (diffOutput) {
    for (const line of diffOutput.split('\n')) {
      if (!line.trim()) continue;
      const [addedStr, removedStr, path] = line.split('\t');
      if (!path) continue;
      const match = path.match(/^skills\/([^/]+)\//);
      if (!match) continue;
      const name = match[1];
      if (RESERVED.has(name)) continue;
      if (only && !only.has(name)) continue;

      const entry = data.get(name) ?? { files: new Set<string>(), added: 0, removed: 0, hasUntracked: false };
      entry.files.add(path);
      entry.added += addedStr === '-' ? 0 : Number.parseInt(addedStr, 10) || 0;
      entry.removed += removedStr === '-' ? 0 : Number.parseInt(removedStr, 10) || 0;
      data.set(name, entry);
    }
  }

  for (const path of untrackedFiles) {
    const match = path.match(/^skills\/([^/]+)\//);
    if (!match) continue;
    const name = match[1];
    if (RESERVED.has(name)) continue;
    if (only && !only.has(name)) continue;

    let added = 0;
    try {
      added = readFileSync(path, 'utf-8').split('\n').length;
    } catch {
      added = 0;
    }

    const entry = data.get(name) ?? { files: new Set<string>(), added: 0, removed: 0, hasUntracked: false };
    entry.files.add(path);
    entry.added += added;
    entry.hasUntracked = true;
    data.set(name, entry);
  }

  const changed: ChangedSkill[] = [];

  for (const [name, entry] of data) {
    const skillMdPath = join(SKILLS_DIR, name, 'SKILL.md');
    if (!existsSync(skillMdPath) || !statSync(skillMdPath).isFile()) continue;

    const current = readCurrentSkill(name);
    const baseRaw = gitShow(baseRef, `skills/${name}/SKILL.md`);
    const status: SkillStatus = baseRaw ? 'modified' : 'new';
    const base = baseRaw ? parseSkillMd(baseRaw) : null;
    const filesChanged = [...entry.files].sort();

    const bodyChanged = status === 'modified' && Boolean(base && base.body !== current.body);
    const descriptionChanged = status === 'modified' && Boolean(base && base.description !== current.description);
    const versionChanged = status === 'modified' && Boolean(base && base.version !== current.version);
    const changelogChanged = filesChanged.some((path) => path.endsWith('/CHANGELOG.md'));

    const baseRecord: Omit<ChangedSkill, 'suggestedReleaseType' | 'suggestedVersion' | 'suggestedReason' | 'diffText'> = {
      name,
      status,
      currentVersion: current.version,
      baseVersion: base?.version ?? null,
      filesChanged,
      linesAdded: entry.added,
      linesRemoved: entry.removed,
      bodyChanged,
      descriptionChanged,
      versionChanged,
      changelogChanged,
    };

    const suggestion = classifyRelease(baseRecord);
    changed.push({
      ...baseRecord,
      suggestedReleaseType: suggestion.type,
      suggestedVersion: suggestion.version,
      suggestedReason: suggestion.reason,
      diffText: '',
    });
  }

  return changed.sort((a, b) => a.name.localeCompare(b.name));
}

function renderUntrackedFileDiff(path: string): string {
  let raw = '';
  try {
    raw = readFileSync(path, 'utf-8');
  } catch {
    return `diff --git a/${path} b/${path}\nBinary or unreadable new file omitted.\n`;
  }

  const added = raw
    .split('\n')
    .map((line) => `+${line}`)
    .join('\n');
  return `diff --git a/${path} b/${path}\nnew file mode 100644\n--- /dev/null\n+++ b/${path}\n@@ -0,0 +1,${raw.split('\n').length} @@\n${added}`;
}

function buildSkillDiff(baseRef: string, skill: ChangedSkill): string {
  const trackedDiff = safeExec(`git diff ${shellQuote(baseRef)} -- ${shellQuote(`skills/${skill.name}/`)}`);
  const trackedFiles = new Set(
    safeExec(`git ls-files ${shellQuote(`skills/${skill.name}/`)}`)
      .split('\n')
      .filter(Boolean),
  );

  const untrackedPieces = skill.filesChanged
    .filter((path) => !trackedFiles.has(path))
    .map(renderUntrackedFileDiff);

  return [trackedDiff, ...untrackedPieces].filter(Boolean).join('\n\n');
}

function renderJsonTemplate(skills: ChangedSkill[]): string {
  const template = {
    entries: skills.map((skill) => ({
      skill: skill.name,
      releaseType: skill.suggestedReleaseType,
      version: skill.suggestedVersion,
      summary:
        skill.suggestedReleaseType === 'none'
          ? []
          : [`請根據 ${skill.name} 的 diff 改寫成 1-3 句使用者看得懂的 release note。`],
    })),
  };
  return `${JSON.stringify(template, null, 2)}\n`;
}

function renderMarkdown(baseRef: string, generatedAt: string, skills: ChangedSkill[], includeFullDiff: boolean): string {
  const sections = skills.map((skill, index) => {
    const diffBlock = includeFullDiff
      ? `\n## Diff\n\n\`\`\`diff\n${skill.diffText || '(no textual diff)'}\n\`\`\`\n`
      : '';

    return `## ${index + 1}. ${skill.name}\n\n` +
      `status: ${skill.status}\n` +
      `currentVersion: ${skill.currentVersion}\n` +
      `baseVersion: ${skill.baseVersion ?? '(new skill)'}\n` +
      `suggestedReleaseType: ${skill.suggestedReleaseType}\n` +
      `suggestedVersion: ${skill.suggestedVersion ?? 'null'}\n` +
      `suggestedReason: ${skill.suggestedReason}\n` +
      `lines: +${skill.linesAdded} / -${skill.linesRemoved}\n` +
      `descriptionChanged: ${skill.descriptionChanged}\n` +
      `bodyChanged: ${skill.bodyChanged}\n` +
      `versionChanged: ${skill.versionChanged}\n` +
      `changelogChanged: ${skill.changelogChanged}\n\n` +
      `changedFiles:\n${skill.filesChanged.map((file) => `- ${file}`).join('\n')}\n` +
      diffBlock;
  });

  return `# Release Plan\n\n` +
    `baseRef: ${baseRef}\n` +
    `generatedAt: ${generatedAt}\n` +
    `changedSkills: ${skills.length}\n\n` +
    `## 給 AI 的任務\n\n` +
    `請根據下方每個 skill 的 diff，產生可由 \`npm run release:apply\` 套用的 JSON。\n\n` +
    `規則：\n\n` +
    `- 只輸出 JSON，不要包 Markdown code fence。\n` +
    `- \`releaseType\` 只能是 \`major\` / \`minor\` / \`patch\` / \`none\`。\n` +
    `- \`none\` 表示不需要改 version，也不需要寫 CHANGELOG。\n` +
    `- 新 skill 通常使用 \`patch\` + \`0.1.0\`，summary 寫「初次上架，提供 XXX 能力」。\n` +
    `- summary 用繁體中文，1-3 條，每條只說「改了什麼」，不要寫太多原因。\n` +
    `- 不要把檔名、內部實作細節、diff 行號直接塞進 summary，除非使用者真的需要知道。\n\n` +
    `輸出格式：\n\n` +
    `\`\`\`json\n` +
    `{"entries":[{"skill":"skill-name","releaseType":"minor","version":"0.2.0","summary":["..."]}]}\n` +
    `\`\`\`\n\n` +
    sections.join('\n---\n\n');
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const baseRef = resolveBaseRef(options.baseRef);

  if (!baseRef) {
    console.error('✗ release:plan 必須在 git repository 內執行，且需要至少一個 commit 作為比較基準。');
    process.exit(1);
  }

  ensureStageDir();

  const changed = detectChangedSkills(baseRef, options.only);
  if (changed.length === 0) {
    console.log('✓ 沒有偵測到 skill 變更。');
    return;
  }

  const withDiff = changed.map((skill) => ({
    ...skill,
    diffText: buildSkillDiff(baseRef, skill),
  }));

  const generatedAt = new Date().toISOString();
  const markdown = renderMarkdown(baseRef, generatedAt, withDiff, options.includeFullDiff);
  const jsonTemplate = renderJsonTemplate(withDiff);

  writeFileSync(options.mdOut, markdown, 'utf-8');
  writeFileSync(options.templateOut, jsonTemplate, 'utf-8');

  console.log(`✓ Release plan written: ${options.mdOut}`);
  console.log(`✓ JSON template written: ${options.templateOut}`);
  console.log('\nNext steps:');
  console.log(`  1. 將 ${options.mdOut} 貼給 AI`);
  console.log('  2. 將 AI 回傳存成 .lion-stage/release-notes.json');
  console.log('  3. npm run release:apply');
}

main();
