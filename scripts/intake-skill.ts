#!/usr/bin/env tsx
/**
 * intake-skill.ts — Skill 收件上架腳本
 *
 * 定位：只處理「別人交來的 skill 如何安全進入 skills/<name>/」。
 * 不負責正式 release notes；version / CHANGELOG 交給 release:plan + release:apply。
 *
 * Usage:
 *   npm run intake -- ./incoming/my-skill --category review
 *   npm run intake -- ./incoming/my-skill --name better-name --category writing --dry-run
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, isAbsolute, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { execSync } from 'node:child_process';
import matter from 'gray-matter';
import { CATEGORIES, CATEGORY_LABELS, SkillFrontmatterSchema } from './schema.js';

const SKILLS_DIR = join(process.cwd(), 'skills');
const DEFAULT_VERSION = '0.1.0';
const RESERVED_NAMES = new Set(['_template']);

type Category = (typeof CATEGORIES)[number];

interface CliOptions {
  source?: string;
  name?: string;
  category?: string;
  author?: string;
  license?: string;
  dryRun: boolean;
  force: boolean;
  yes: boolean;
  skipValidate: boolean;
}

interface IntakePlan {
  sourceDir: string;
  sourceSkillMdPath: string;
  targetName: string;
  targetDir: string;
  category: Category;
  frontmatter: Record<string, unknown>;
  body: string;
  shouldCreateChangelogShell: boolean;
  copiedEntries: string[];
  warnings: string[];
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    force: false,
    yes: false,
    skipValidate: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (!arg.startsWith('--') && !options.source) {
      options.source = arg;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--yes' || arg === '-y') {
      options.yes = true;
      continue;
    }

    if (arg === '--skip-validate') {
      options.skipValidate = true;
      continue;
    }

    const readValue = (flag: string): string => {
      const inline = arg.match(new RegExp(`^${flag}=(.+)$`));
      if (inline) return inline[1];

      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        throw new Error(`${flag} requires a value`);
      }

      i++;
      return next;
    };

    if (arg === '--name' || arg.startsWith('--name=')) {
      options.name = readValue('--name');
      continue;
    }

    if (arg === '--category' || arg.startsWith('--category=')) {
      options.category = readValue('--category');
      continue;
    }

    if (arg === '--author' || arg.startsWith('--author=')) {
      options.author = readValue('--author');
      continue;
    }

    if (arg === '--license' || arg.startsWith('--license=')) {
      options.license = readValue('--license');
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printUsage(): void {
  console.log(`Usage:
  npm run intake -- <source-dir> [options]

Options:
  --name <kebab-name>       Override skill name / target folder
  --category <category>     One of: ${CATEGORIES.join(' / ')}
  --author <name>           Fill author when missing
  --license <license>       Fill license when missing, default MIT
  --dry-run                 Show plan without writing files
  --force                   Replace existing skills/<name>
  --yes, -y                 Non-interactive mode; fail instead of prompting
  --skip-validate           Do not run npm run validate after write

Examples:
  npm run intake -- ./incoming/prd-helper --category writing
  npm run intake -- ./incoming/review-skill --name skill-review-lite --category review
  npm run intake -- ./incoming/data-audit --dry-run
`);
}

function toKebabCase(inputValue: string): string {
  return inputValue
    .trim()
    .replace(/\.zip$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();
}

function isValidSkillName(value: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(value);
}

function isCategory(value: string | undefined): value is Category {
  return Boolean(value && (CATEGORIES as readonly string[]).includes(value));
}

function ensureDirectory(path: string, label: string): void {
  if (!existsSync(path)) {
    throw new Error(`${label} does not exist: ${path}`);
  }

  if (!statSync(path).isDirectory()) {
    throw new Error(`${label} must be a directory: ${path}`);
  }
}

function findSkillMd(sourceDir: string): string {
  const direct = join(sourceDir, 'SKILL.md');
  if (existsSync(direct) && statSync(direct).isFile()) return direct;

  const lower = join(sourceDir, 'skill.md');
  if (existsSync(lower) && statSync(lower).isFile()) return lower;

  throw new Error(`Missing SKILL.md under ${sourceDir}`);
}

function extractFirstUsefulLine(body: string): string {
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) continue;
    if (line.startsWith('---')) continue;
    if (line.startsWith('>')) return line.replace(/^>+\s*/, '').slice(0, 160);
    return line.slice(0, 160);
  }

  return '';
}

function normalizeStringList(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return [
    ...new Set(
      raw
        .map((v) => toKebabCase(String(v)))
        .filter(Boolean),
    ),
  ];
}

function buildDescription(existing: unknown, body: string): string {
  if (typeof existing === 'string' && existing.trim().length >= 20) {
    return existing.trim();
  }

  const firstLine = extractFirstUsefulLine(body);
  if (firstLine.length >= 20) return firstLine;

  return 'TODO: 請補上此 skill 的用途、觸發情境與不適用情境。';
}

async function chooseCategory(options: CliOptions, existing: unknown): Promise<Category> {
  if (isCategory(options.category)) return options.category;

  if (options.category && !isCategory(options.category)) {
    throw new Error(`Invalid category "${options.category}". Allowed: ${CATEGORIES.join(' / ')}`);
  }

  if (typeof existing === 'string') {
    const normalized = toKebabCase(existing);
    if (isCategory(normalized)) return normalized;
  }

  if (options.yes) {
    throw new Error(`category is missing or invalid. Pass --category <${CATEGORIES.join('|')}>`);
  }

  const rl = createInterface({ input, output });
  const ask = (prompt: string) => new Promise<string>((resolveAsk) => rl.question(prompt, resolveAsk));

  console.log('請選擇 category：');
  CATEGORIES.forEach((category, index) => {
    const label = CATEGORY_LABELS[category];
    console.log(`  ${index + 1}. ${category} (${label.zh} / ${label.en})`);
  });

  while (true) {
    const answer = (await ask('category number or value: ')).trim();
    const byIndex = Number(answer);

    if (Number.isInteger(byIndex) && byIndex >= 1 && byIndex <= CATEGORIES.length) {
      rl.close();
      return CATEGORIES[byIndex - 1];
    }

    const normalized = toKebabCase(answer);
    if (isCategory(normalized)) {
      rl.close();
      return normalized;
    }

    console.log(`無效 category，合法值: ${CATEGORIES.join(' / ')}`);
  }
}

function listSupplementaryEntries(sourceDir: string): string[] {
  return readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.name.toLowerCase() !== 'skill.md')
    .filter((entry) => entry.name !== 'SKILL.md')
    .filter((entry) => entry.name !== 'CHANGELOG.md')
    .map((entry) => entry.name)
    .sort();
}

function shouldCreateChangelogShell(sourceDir: string): boolean {
  return !existsSync(join(sourceDir, 'CHANGELOG.md'));
}

async function createPlan(options: CliOptions): Promise<IntakePlan> {
  if (!options.source) throw new Error('Missing source directory');

  const sourceDir = isAbsolute(options.source)
    ? options.source
    : resolve(process.cwd(), options.source);

  ensureDirectory(sourceDir, 'source directory');

  const sourceSkillMdPath = findSkillMd(sourceDir);
  const raw = readFileSync(sourceSkillMdPath, 'utf-8');
  const parsed = matter(raw);

  const sourceFolderName = toKebabCase(basename(sourceDir));
  const existingName = typeof parsed.data.name === 'string' ? toKebabCase(parsed.data.name) : '';
  const targetName = toKebabCase(options.name || existingName || sourceFolderName);

  if (!isValidSkillName(targetName)) {
    throw new Error(`Invalid skill name "${targetName}". Must be lowercase kebab-case and start with a letter.`);
  }

  if (RESERVED_NAMES.has(targetName)) {
    throw new Error(`Reserved skill name: ${targetName}`);
  }

  const category = await chooseCategory(options, parsed.data.category);
  const body = parsed.content.trim();

  const frontmatter: Record<string, unknown> = {
    ...parsed.data,
    name: targetName,
    description: buildDescription(parsed.data.description, body),
    version:
      typeof parsed.data.version === 'string' && /^\d+\.\d+\.\d+$/.test(parsed.data.version)
        ? parsed.data.version
        : DEFAULT_VERSION,
    category,
    license:
      typeof parsed.data.license === 'string' && parsed.data.license.trim()
        ? parsed.data.license.trim()
        : options.license || 'MIT',
    tags: normalizeStringList(parsed.data.tags),
    related: normalizeStringList(parsed.data.related),
  };

  if (options.author && !frontmatter.author) {
    frontmatter.author = options.author;
  }

  const validation = SkillFrontmatterSchema.safeParse(frontmatter);
  if (!validation.success) {
    const details = validation.error.issues
      .map((issue) => `frontmatter.${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Normalized frontmatter is still invalid:\n${details}`);
  }

  const warnings: string[] = [];

  if (frontmatter.description === 'TODO: 請補上此 skill 的用途、觸發情境與不適用情境。') {
    warnings.push('description 使用 TODO 佔位；請先補成正式說明，否則 validate 會擋。');
  }

  if (!body) {
    warnings.push('SKILL.md body 為空；請補上實際使用規則。');
  }

  const copiedEntries = listSupplementaryEntries(sourceDir);

  return {
    sourceDir,
    sourceSkillMdPath,
    targetName,
    targetDir: join(SKILLS_DIR, targetName),
    category,
    frontmatter,
    body,
    shouldCreateChangelogShell: shouldCreateChangelogShell(sourceDir),
    copiedEntries,
    warnings,
  };
}

function renderSkillMd(plan: IntakePlan): string {
  return matter.stringify(`${plan.body}\n`, plan.frontmatter).replace(/\n{3,}/g, '\n\n');
}

function assertSafeToWrite(plan: IntakePlan, force: boolean): void {
  if (!existsSync(SKILLS_DIR)) mkdirSync(SKILLS_DIR, { recursive: true });

  if (existsSync(plan.targetDir) && !force) {
    throw new Error(
      `Target already exists: ${plan.targetDir}. Use --force only if you intentionally want to replace it.`,
    );
  }
}

function copySupplementaryFiles(plan: IntakePlan): void {
  for (const entryName of plan.copiedEntries) {
    const src = join(plan.sourceDir, entryName);
    const dest = join(plan.targetDir, entryName);

    cpSync(src, dest, {
      recursive: true,
      force: false,
      errorOnExist: false,
    });
  }
}

function writePlan(plan: IntakePlan, force: boolean): void {
  assertSafeToWrite(plan, force);

  if (existsSync(plan.targetDir) && force) {
    rmSync(plan.targetDir, { recursive: true, force: true });
  }

  mkdirSync(plan.targetDir, { recursive: true });

  copySupplementaryFiles(plan);
  writeFileSync(join(plan.targetDir, 'SKILL.md'), renderSkillMd(plan), 'utf-8');

  if (plan.shouldCreateChangelogShell) {
    writeFileSync(join(plan.targetDir, 'CHANGELOG.md'), '# Changelog\n\n', 'utf-8');
  }
}

function runValidate(): void {
  execSync('npm run validate', { stdio: 'inherit' });
}

function printPlan(plan: IntakePlan, options: CliOptions): void {
  console.log('\nIntake plan:');
  console.log(`  source        : ${plan.sourceDir}`);
  console.log(`  source SKILL  : ${plan.sourceSkillMdPath}`);
  console.log(`  target        : skills/${plan.targetName}`);
  console.log(`  category      : ${plan.category}`);
  console.log(`  version       : ${String(plan.frontmatter.version)}`);
  console.log(`  changelog     : ${plan.shouldCreateChangelogShell ? 'create shell only' : 'source has one; keep source out of intake copy'}`);
  console.log(`  dry-run       : ${options.dryRun ? 'yes' : 'no'}`);
  console.log(`  force         : ${options.force ? 'yes' : 'no'}`);

  if (plan.copiedEntries.length > 0) {
    console.log('  copied entries:');
    for (const entry of plan.copiedEntries) {
      console.log(`    - ${entry}`);
    }
  }

  for (const warning of plan.warnings) {
    console.log(`  ⚠ ${warning}`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!options.source) {
    printUsage();
    process.exit(1);
  }

  const plan = await createPlan(options);
  printPlan(plan, options);

  if (options.dryRun) {
    console.log('\nDry run only. No files written.');
    return;
  }

  writePlan(plan, options.force);
  console.log(`\n✓ Imported to skills/${plan.targetName}`);

  if (!options.skipValidate) {
    runValidate();
  }

  console.log('Next steps:');
  console.log(`  npm run release:plan -- --only ${plan.targetName}`);
  console.log('  # 將 .lion-stage/release-plan.md 交給 AI 產 release-notes.json');
  console.log('  npm run release:apply');
  console.log('  npm run build');
  console.log('  git add -A && git commit && git push');
}

main().catch((err) => {
  console.error('✗ intake failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
