#!/usr/bin/env tsx
/**
 * intake-skill.ts — Skill 收件上架腳本
 *
 * 定位：處理「別人交來的 skill 如何標準化進入 skills/<name>/」。
 * 只做最小清整：name / category / version / tags / related 與 CHANGELOG 承接。
 * 不負責正式 release notes；version / CHANGELOG 正式條目仍交給 release:plan + release:apply。
 *
 * Usage:
 *   npm run intake -- ./incoming/my-skill --category review
 *   npm run intake -- ./incoming/my-skill/SKILL.md --name better-name --category writing --dry-run
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
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import matter from 'gray-matter';
import { CATEGORIES, CATEGORY_LABELS, SkillFrontmatterSchema } from './schema.js';

const SKILLS_DIR = join(process.cwd(), 'skills');
const DEFAULT_VERSION = '0.1.0';
const DEFAULT_CATEGORY: Category = 'utility';
const RESERVED_NAMES = new Set(['_template']);
const STANDARD_FRONTMATTER_KEYS = new Set([
  'name',
  'description',
  'version',
  'category',
  'license',
  'author',
  'tags',
  'related',
]);

type Category = (typeof CATEGORIES)[number];
type SourceKind = 'directory' | 'file';
type ChangelogAction = 'copy-source' | 'preserve-existing' | 'create-shell';

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

interface SourceInfo {
  sourcePath: string;
  sourceDir: string;
  sourceKind: SourceKind;
  sourceSkillMdPath: string;
  sourceNameBase: string;
}

interface ParsedSkillMarkdown {
  data: Record<string, unknown>;
  body: string;
  warning?: string;
}

interface ChangelogPlan {
  action: ChangelogAction;
  content: string;
  sourcePath?: string;
}

interface IntakePlan {
  sourcePath: string;
  sourceDir: string;
  sourceKind: SourceKind;
  sourceSkillMdPath: string;
  targetName: string;
  targetDir: string;
  category: Category;
  frontmatter: Record<string, unknown>;
  body: string;
  changelog: ChangelogPlan;
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
  npm run intake -- <source-dir-or-skill-md> [options]

Options:
  --name <kebab-name>       Override skill name / target folder
  --category <category>     One of: ${CATEGORIES.join(' / ')}
  --author <name>           Fill author when missing
  --license <license>       Fill license when missing, default MIT
  --dry-run                 Show plan without writing files
  --force                   Replace existing skills/<name>
  --yes, -y                 Non-interactive compatibility flag; intake no longer prompts
  --skip-validate           Do not run npm run validate after write

Examples:
  npm run intake -- ./incoming/prd-helper --category writing
  npm run intake -- ./incoming/review-skill/SKILL.md --name skill-review-lite --category review
  npm run intake -- ./incoming/data-audit --dry-run
`);
}

function toKebabCase(inputValue: string): string {
  return inputValue
    .trim()
    .replace(/\.zip$/i, '')
    .replace(/\.md$/i, '')
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

function generatedSkillName(): string {
  return `skill-${Date.now().toString(36)}`;
}

function assertExists(path: string, label: string): void {
  if (!existsSync(path)) {
    throw new Error(`${label} does not exist: ${path}`);
  }
}

function findCaseInsensitiveFile(dir: string, expectedName: string): string | null {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return null;
  const expected = expectedName.toLowerCase();
  const entry = readdirSync(dir, { withFileTypes: true }).find(
    (candidate) => candidate.isFile() && candidate.name.toLowerCase() === expected,
  );
  return entry ? join(dir, entry.name) : null;
}

function findSkillMd(sourceDir: string): string {
  const direct = findCaseInsensitiveFile(sourceDir, 'SKILL.md');
  if (direct) return direct;

  throw new Error(`Missing SKILL.md under ${sourceDir}`);
}

function resolveSource(source: string): SourceInfo {
  const sourcePath = isAbsolute(source) ? source : resolve(process.cwd(), source);
  assertExists(sourcePath, 'source');

  const stat = statSync(sourcePath);
  if (stat.isDirectory()) {
    return {
      sourcePath,
      sourceDir: sourcePath,
      sourceKind: 'directory',
      sourceSkillMdPath: findSkillMd(sourcePath),
      sourceNameBase: basename(sourcePath),
    };
  }

  if (stat.isFile()) {
    if (!sourcePath.toLowerCase().endsWith('.md')) {
      throw new Error(`source file must be a markdown file: ${sourcePath}`);
    }

    const fileBase = basename(sourcePath, extname(sourcePath));
    return {
      sourcePath,
      sourceDir: dirname(sourcePath),
      sourceKind: 'file',
      sourceSkillMdPath: sourcePath,
      sourceNameBase: fileBase.toLowerCase() === 'skill' ? basename(dirname(sourcePath)) : fileBase,
    };
  }

  throw new Error(`source must be a directory or .md file: ${sourcePath}`);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseSkillMarkdown(raw: string): ParsedSkillMarkdown {
  try {
    const parsed = matter(raw);
    return {
      data: asRecord(parsed.data),
      body: parsed.content.trim(),
    };
  } catch (err) {
    const strippedBody = raw.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '').trim();
    return {
      data: {},
      body: strippedBody || raw.trim(),
      warning: `SKILL.md frontmatter 無法解析，已改用空 frontmatter 並保留 markdown body。原因: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function getValue(data: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(data, key)) return data[key];
  }
  return undefined;
}

function getStringValue(data: Record<string, unknown>, keys: string[]): string | undefined {
  const value = getValue(data, keys);
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
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

function normalizeSemver(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  const exact = raw.match(/^v?(\d+\.\d+\.\d+)$/i);
  if (exact) return exact[1];

  const embedded = raw.match(/\b(?:v)?(\d+\.\d+\.\d+)\b/i);
  if (embedded) return embedded[1];

  const twoPart = raw.match(/^v?(\d+)\.(\d+)$/i);
  if (twoPart) return `${twoPart[1]}.${twoPart[2]}.0`;

  return null;
}

function splitListValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(splitListValue);
  if (value === undefined || value === null) return [];
  if (typeof value === 'object') {
    const record = asRecord(value);
    const candidate = record.name ?? record.id ?? record.slug ?? record.value ?? record.label;
    return candidate === undefined ? [] : splitListValue(candidate);
  }

  return String(value)
    .split(/[\n,;|、，；]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTagItem(value: string): string {
  const kebab = toKebabCase(value);
  return kebab || value.trim();
}

function normalizeTags(value: unknown): string[] {
  return [...new Set(splitListValue(value).map(normalizeTagItem).filter(Boolean))];
}

function normalizeRelated(value: unknown): string[] {
  return [...new Set(splitListValue(value).map(toKebabCase).filter(Boolean))];
}

const CATEGORY_ALIASES: Record<string, Category> = {
  plan: 'planning',
  planning: 'planning',
  roadmap: 'planning',
  規劃: 'planning',
  企劃: 'planning',
  計畫: 'planning',
  write: 'writing',
  writing: 'writing',
  doc: 'writing',
  documentation: 'writing',
  文案: 'writing',
  寫作: 'writing',
  文件: 'writing',
  review: 'review',
  audit: 'review',
  critique: 'review',
  審查: 'review',
  檢核: 'review',
  檢查: 'review',
  評估: 'review',
  summary: 'summary',
  summarize: 'summary',
  synthesis: 'summary',
  recap: 'summary',
  摘要: 'summary',
  總結: 'summary',
  沉澱: 'summary',
  data: 'data',
  analytics: 'data',
  analysis: 'data',
  sql: 'data',
  資料: 'data',
  數據: 'data',
  分析: 'data',
  utility: 'utility',
  util: 'utility',
  tool: 'utility',
  tooling: 'utility',
  工具: 'utility',
  domain: 'domain',
  knowledge: 'domain',
  subject: 'domain',
  領域: 'domain',
  知識: 'domain',
};

function normalizeCategory(value: unknown): Category | null {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const direct = toKebabCase(raw);
  if (isCategory(direct)) return direct;

  const lower = raw.toLowerCase();
  if (CATEGORY_ALIASES[lower]) return CATEGORY_ALIASES[lower];
  if (CATEGORY_ALIASES[raw]) return CATEGORY_ALIASES[raw];
  if (CATEGORY_ALIASES[direct]) return CATEGORY_ALIASES[direct];

  return null;
}

function resolveCategory(
  options: CliOptions,
  incoming: Record<string, unknown>,
  existing: Record<string, unknown>,
  warnings: string[],
): Category {
  const optionCategory = normalizeCategory(options.category);
  if (optionCategory) return optionCategory;

  if (options.category && !optionCategory) {
    warnings.push(`--category=${options.category} 無法辨識，已改用來源/既有/default category。`);
  }

  const incomingCategory = normalizeCategory(getValue(incoming, ['category', 'type', 'kind', 'taskType', 'task_type']));
  if (incomingCategory) return incomingCategory;

  const existingCategory = normalizeCategory(getValue(existing, ['category']));
  if (existingCategory) return existingCategory;

  warnings.push(`category 缺失或無法辨識，已預設為 ${DEFAULT_CATEGORY}。可用 --category 覆寫。`);
  return DEFAULT_CATEGORY;
}

function buildDescription(incoming: Record<string, unknown>, existing: Record<string, unknown>, body: string): string {
  const incomingDescription = getStringValue(incoming, ['description', 'summary', 'purpose']);
  if (incomingDescription && incomingDescription.length >= 20) return incomingDescription;

  const existingDescription = getStringValue(existing, ['description']);
  if (existingDescription && existingDescription.length >= 20) return existingDescription;

  const firstLine = extractFirstUsefulLine(body);
  if (firstLine.length >= 20) return firstLine;

  return '此 skill 已由 intake 腳本自動標準化，請依 SKILL.md 內容判斷用途、觸發情境與操作邊界。';
}

function listSupplementaryEntries(source: SourceInfo): string[] {
  if (source.sourceKind === 'file') return [];

  return readdirSync(source.sourceDir, { withFileTypes: true })
    .filter((entry) => entry.name.toLowerCase() !== 'skill.md')
    .filter((entry) => entry.name.toLowerCase() !== 'changelog.md')
    .map((entry) => entry.name)
    .sort();
}

function findSourceChangelogPath(source: SourceInfo): string | null {
  if (source.sourceKind === 'directory') return findCaseInsensitiveFile(source.sourceDir, 'CHANGELOG.md');

  const sourceFileIsSkill = basename(source.sourceSkillMdPath).toLowerCase() === 'skill.md';
  if (!sourceFileIsSkill) return null;
  return findCaseInsensitiveFile(source.sourceDir, 'CHANGELOG.md');
}

function normalizeChangelogContent(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '# Changelog\n\n';
  if (/^#\s+Changelog\b/im.test(trimmed)) return `${trimmed}\n`;
  return `# Changelog\n\n${trimmed}\n`;
}

function resolveChangelogPlan(source: SourceInfo, targetDir: string): ChangelogPlan {
  const sourceChangelogPath = findSourceChangelogPath(source);
  if (sourceChangelogPath) {
    return {
      action: 'copy-source',
      sourcePath: sourceChangelogPath,
      content: normalizeChangelogContent(readFileSync(sourceChangelogPath, 'utf-8')),
    };
  }

  const existingChangelogPath = join(targetDir, 'CHANGELOG.md');
  if (existsSync(existingChangelogPath)) {
    return {
      action: 'preserve-existing',
      sourcePath: existingChangelogPath,
      content: normalizeChangelogContent(readFileSync(existingChangelogPath, 'utf-8')),
    };
  }

  return {
    action: 'create-shell',
    content: '# Changelog\n\n',
  };
}

function readExistingFrontmatter(targetDir: string): Record<string, unknown> {
  const path = join(targetDir, 'SKILL.md');
  if (!existsSync(path)) return {};

  try {
    const parsed = matter(readFileSync(path, 'utf-8'));
    return asRecord(parsed.data);
  } catch {
    return {};
  }
}

async function createPlan(options: CliOptions): Promise<IntakePlan> {
  if (!options.source) throw new Error('Missing source directory or SKILL.md file');

  const source = resolveSource(options.source);
  const raw = readFileSync(source.sourceSkillMdPath, 'utf-8');
  const parsed = parseSkillMarkdown(raw);
  const warnings: string[] = [];
  if (parsed.warning) warnings.push(parsed.warning);

  const incomingName = getStringValue(parsed.data, ['name', 'skillName', 'skill_name', 'id', 'slug', 'title']);
  const rawTargetName = options.name || incomingName || source.sourceNameBase;
  let targetName = toKebabCase(rawTargetName);
  if (!isValidSkillName(targetName)) {
    const fallbackName = generatedSkillName();
    warnings.push(`name 無法由來源正規化成 kebab-case，已自動產生 ${fallbackName}。可用 --name 覆寫。`);
    targetName = fallbackName;
  }

  if (RESERVED_NAMES.has(targetName)) {
    throw new Error(`Reserved skill name: ${targetName}`);
  }

  const targetDir = join(SKILLS_DIR, targetName);
  const existingFrontmatter = readExistingFrontmatter(targetDir);
  const category = resolveCategory(options, parsed.data, existingFrontmatter, warnings);
  const body = parsed.body.trim();

  const unsupportedKeys = Object.keys(parsed.data).filter((key) => !STANDARD_FRONTMATTER_KEYS.has(key));
  if (unsupportedKeys.length > 0) {
    warnings.push(
      `來源 frontmatter 含非標準欄位，已在輸出 SKILL.md 移除: ${unsupportedKeys.sort().join(', ')}。`,
    );
  }

  const frontmatterCandidate: Record<string, unknown> = {
    name: targetName,
    description: buildDescription(parsed.data, existingFrontmatter, body),
    version:
      normalizeSemver(getValue(parsed.data, ['version', 'skillVersion', 'skill_version', 'v'])) ||
      normalizeSemver(getValue(existingFrontmatter, ['version'])) ||
      DEFAULT_VERSION,
    category,
    license:
      getStringValue(parsed.data, ['license']) ||
      getStringValue(existingFrontmatter, ['license']) ||
      options.license ||
      'MIT',
    tags: normalizeTags(getValue(parsed.data, ['tags', 'tag', 'keywords', 'labels']) ?? getValue(existingFrontmatter, ['tags'])),
    related: normalizeRelated(
      getValue(parsed.data, ['related', 'relatedSkills', 'related_skills', 'dependencies', 'dependsOn', 'depends_on', 'seeAlso', 'see_also']) ??
        getValue(existingFrontmatter, ['related']),
    ),
  };

  const incomingAuthor = getStringValue(parsed.data, ['author', 'owner', 'maintainer']);
  const existingAuthor = getStringValue(existingFrontmatter, ['author']);
  const author = options.author || incomingAuthor || existingAuthor;
  if (author) frontmatterCandidate.author = author;

  const validation = SkillFrontmatterSchema.safeParse(frontmatterCandidate);
  if (!validation.success) {
    const details = validation.error.issues
      .map((issue) => `frontmatter.${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Normalized frontmatter is still invalid:\n${details}`);
  }

  if (!body) {
    warnings.push('SKILL.md body 為空；已完成 frontmatter 標準化，但 skill 內容仍不可用。');
  }

  const changelog = resolveChangelogPlan(source, targetDir);
  const copiedEntries = listSupplementaryEntries(source);

  return {
    sourcePath: source.sourcePath,
    sourceDir: source.sourceDir,
    sourceKind: source.sourceKind,
    sourceSkillMdPath: source.sourceSkillMdPath,
    targetName,
    targetDir,
    category,
    frontmatter: validation.data,
    body,
    changelog,
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
  writeFileSync(join(plan.targetDir, 'CHANGELOG.md'), plan.changelog.content, 'utf-8');
}

function runValidate(): void {
  execSync('npm run validate', { stdio: 'inherit' });
}

function renderChangelogAction(action: ChangelogAction): string {
  if (action === 'copy-source') return 'copy source CHANGELOG.md';
  if (action === 'preserve-existing') return 'preserve existing skills/<name>/CHANGELOG.md';
  return 'create shell only';
}

function printPlan(plan: IntakePlan, options: CliOptions): void {
  console.log('\nIntake plan:');
  console.log(`  source        : ${plan.sourcePath}`);
  console.log(`  source type   : ${plan.sourceKind}`);
  console.log(`  source SKILL  : ${plan.sourceSkillMdPath}`);
  console.log(`  target        : skills/${plan.targetName}`);
  console.log(`  category      : ${plan.category}`);
  console.log(`  version       : ${String(plan.frontmatter.version)}`);
  console.log(`  changelog     : ${renderChangelogAction(plan.changelog.action)}`);
  if (plan.changelog.sourcePath) console.log(`  changelog src : ${plan.changelog.sourcePath}`);
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
