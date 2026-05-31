#!/usr/bin/env tsx
/**
 * release-apply.ts — 讀 AI 整理後的 release-notes.json，套用 version + CHANGELOG。
 *
 * Usage:
 *   npm run release:apply
 *   npm run release:apply -- --input .lion-stage/release-notes.json --dry-run
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const SKILLS_DIR = join(process.cwd(), 'skills');
const DEFAULT_INPUT = join(process.cwd(), '.lion-stage', 'release-notes.json');

type ReleaseType = 'major' | 'minor' | 'patch' | 'none';

interface CliOptions {
  input: string;
  dryRun: boolean;
}

interface ReleaseEntry {
  skill: string;
  releaseType: ReleaseType;
  version: string | null;
  summary: string[];
}

interface ReleaseNotes {
  entries: ReleaseEntry[];
}

interface ApplyResult {
  skill: string;
  action: 'applied' | 'skipped';
  messages: string[];
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    input: DEFAULT_INPUT,
    dryRun: false,
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

    if (arg === '--input' || arg.startsWith('--input=')) {
      options.input = readValue('--input');
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function isReleaseType(value: unknown): value is ReleaseType {
  return value === 'major' || value === 'minor' || value === 'patch' || value === 'none';
}

function isSemver(value: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(value);
}

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

function normalizeSummary(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return raw.map((item) => String(item).trim()).filter(Boolean);
}

function readReleaseNotes(path: string): ReleaseNotes {
  if (!existsSync(path)) {
    throw new Error(`Input file not found: ${path}`);
  }

  const raw = readFileSync(path, 'utf-8').trim();
  if (!raw) throw new Error(`Input file is empty: ${path}`);

  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || !('entries' in parsed)) {
    throw new Error('release-notes.json must contain { "entries": [...] }');
  }

  const entriesRaw = (parsed as { entries: unknown }).entries;
  if (!Array.isArray(entriesRaw)) {
    throw new Error('release-notes.json entries must be an array');
  }

  const entries = entriesRaw.map((entryRaw, index): ReleaseEntry => {
    if (!entryRaw || typeof entryRaw !== 'object') {
      throw new Error(`entries[${index}] must be an object`);
    }

    const entry = entryRaw as Record<string, unknown>;
    const skill = typeof entry.skill === 'string' ? entry.skill.trim() : '';
    if (!/^[a-z][a-z0-9-]*$/.test(skill)) {
      throw new Error(`entries[${index}].skill must be lowercase kebab-case`);
    }

    if (!isReleaseType(entry.releaseType)) {
      throw new Error(`entries[${index}].releaseType must be major / minor / patch / none`);
    }

    const releaseType = entry.releaseType;
    const version = typeof entry.version === 'string' && entry.version.trim()
      ? entry.version.trim()
      : null;
    const summary = normalizeSummary(entry.summary);

    if (releaseType === 'none') {
      if (version) throw new Error(`entries[${index}] ${skill}: releaseType none must not provide version`);
      if (summary.length > 0) throw new Error(`entries[${index}] ${skill}: releaseType none must not provide summary`);
    } else {
      if (!version || !isSemver(version)) {
        throw new Error(`entries[${index}] ${skill}: version must be semver`);
      }
      if (summary.length === 0) {
        throw new Error(`entries[${index}] ${skill}: summary must not be empty`);
      }
    }

    return { skill, releaseType, version, summary };
  });

  return { entries };
}

function skillPath(skill: string, filename: string): string {
  return join(SKILLS_DIR, skill, filename);
}

function readCurrentVersion(skill: string): string {
  const path = skillPath(skill, 'SKILL.md');
  if (!existsSync(path)) throw new Error(`${skill}: SKILL.md not found`);

  const parsed = matter(readFileSync(path, 'utf-8'));
  const version = (parsed.data as { version?: unknown }).version;
  if (typeof version !== 'string' || !isSemver(version)) {
    throw new Error(`${skill}: SKILL.md frontmatter version is missing or invalid`);
  }
  return version;
}

function hasChangelogEntry(skill: string, version: string): boolean {
  const path = skillPath(skill, 'CHANGELOG.md');
  if (!existsSync(path)) return false;
  const raw = readFileSync(path, 'utf-8');
  const re = new RegExp(`^##\\s+${version.replace(/\./g, '\\.')}\\s+-`, 'm');
  return re.test(raw);
}

function writeNewVersion(skill: string, newVersion: string): void {
  const path = skillPath(skill, 'SKILL.md');
  const raw = readFileSync(path, 'utf-8');
  const updated = raw.replace(/^version:\s*['"]?[^'"\n]+['"]?\s*$/m, `version: ${newVersion}`);
  if (updated === raw) {
    throw new Error(`${skill}: cannot find version line in SKILL.md`);
  }
  writeFileSync(path, updated, 'utf-8');
}

function ensureChangelog(skill: string): void {
  const path = skillPath(skill, 'CHANGELOG.md');
  if (!existsSync(path)) {
    writeFileSync(path, '# Changelog\n\n', 'utf-8');
  }
}

function prependChangelogEntry(skill: string, version: string, summary: string[]): void {
  ensureChangelog(skill);
  const path = skillPath(skill, 'CHANGELOG.md');
  const raw = readFileSync(path, 'utf-8');
  const today = new Date().toISOString().slice(0, 10);
  const bullets = summary.map((line) => `- ${line}`).join('\n');
  const entry = `## ${version} - ${today}\n\n${bullets}\n\n`;

  let updated: string;
  if (/^#\s+Changelog/m.test(raw)) {
    updated = raw.replace(/^(#\s+Changelog\s*\n+)/, `$1${entry}`);
  } else {
    updated = `# Changelog\n\n${entry}${raw}`;
  }
  writeFileSync(path, updated, 'utf-8');
}

function applyEntry(entry: ReleaseEntry, dryRun: boolean): ApplyResult {
  const messages: string[] = [];

  const skillDir = join(SKILLS_DIR, entry.skill);
  if (!existsSync(skillDir)) throw new Error(`${entry.skill}: skill folder not found`);

  if (entry.releaseType === 'none') {
    messages.push('releaseType=none，略過 version 與 CHANGELOG');
    return { skill: entry.skill, action: 'skipped', messages };
  }

  if (!entry.version) throw new Error(`${entry.skill}: version is required`);

  const currentVersion = readCurrentVersion(entry.skill);
  const comparison = compareSemver(entry.version, currentVersion);

  if (comparison < 0) {
    throw new Error(`${entry.skill}: target version ${entry.version} is lower than current ${currentVersion}`);
  }

  if (hasChangelogEntry(entry.skill, entry.version)) {
    throw new Error(`${entry.skill}: CHANGELOG.md already contains version ${entry.version}`);
  }

  if (comparison === 0) {
    messages.push(`version 維持 ${currentVersion}；只補 CHANGELOG 段落（通常是新 skill 0.1.0 初版）`);
  } else {
    messages.push(`version ${currentVersion} → ${entry.version}`);
    if (!dryRun) writeNewVersion(entry.skill, entry.version);
  }

  messages.push(`CHANGELOG.md 新增 ${entry.version} 段落，共 ${entry.summary.length} 條 summary`);
  if (!dryRun) prependChangelogEntry(entry.skill, entry.version, entry.summary);

  return { skill: entry.skill, action: 'applied', messages };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const notes = readReleaseNotes(options.input);

  if (notes.entries.length === 0) {
    console.log('✓ release-notes.json 沒有 entries，無事可做。');
    return;
  }

  const seen = new Set<string>();
  const results: ApplyResult[] = [];

  for (const entry of notes.entries) {
    if (seen.has(entry.skill)) throw new Error(`Duplicate entry for skill: ${entry.skill}`);
    seen.add(entry.skill);
    results.push(applyEntry(entry, options.dryRun));
  }

  for (const result of results) {
    const mark = result.action === 'applied' ? '✓' : '-';
    console.log(`${mark} ${result.skill}`);
    for (const message of result.messages) {
      console.log(`    ${message}`);
    }
  }

  if (options.dryRun) {
    console.log('\nDry run only. No files written.');
  } else {
    console.log('\nNext steps:');
    console.log('  npm run build');
    console.log('  git diff');
    console.log('  git add -A && git commit && git push');
  }
}

main();
