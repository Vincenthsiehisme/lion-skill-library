/**
 * Validate all skills under skills/
 *
 * 檢查項目：
 * 1. 每個資料夾必有 SKILL.md
 * 2. frontmatter 符合 schema
 * 3. frontmatter.name === 資料夾名
 * 4. related 引用的 skill 真的存在
 * 5. 沒有 _template 以外的「保留」名稱
 * 6. description 不可仍是 TODO 佔位
 * 7. references/ 底下若有檔案，必須是 .md
 *
 * Exit 1 if any error, 0 if all pass.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { SkillFrontmatterSchema } from './schema.js';

const SKILLS_DIR = join(process.cwd(), 'skills');
const RESERVED_NAMES = ['_template'];

interface ValidationResult {
  skill: string;
  errors: string[];
}

function listSkillFolders(): string[] {
  return readdirSync(SKILLS_DIR).filter((name) => {
    const fullPath = join(SKILLS_DIR, name);
    return statSync(fullPath).isDirectory();
  });
}


function validateReferencesAreMarkdown(folderName: string): string[] {
  const errors: string[] = [];
  const referencesPath = join(SKILLS_DIR, folderName, 'references');
  if (!existsSync(referencesPath)) return errors;
  if (!statSync(referencesPath).isDirectory()) return errors;

  const walk = (dir: string, relativeDir: string): void => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, relativePath);
        continue;
      }
      if (entry.isFile() && !entry.name.toLowerCase().endsWith('.md')) {
        errors.push(`references/${relativePath} must be a .md file`);
      }
    }
  };

  walk(referencesPath, '');
  return errors;
}

function validateSkill(folderName: string, allFolderNames: string[]): ValidationResult {
  const errors: string[] = [];
  const skillPath = join(SKILLS_DIR, folderName);
  const skillMdPath = join(skillPath, 'SKILL.md');

  // 1. SKILL.md exists
  try {
    statSync(skillMdPath);
  } catch {
    errors.push(`Missing SKILL.md in ${folderName}/`);
    return { skill: folderName, errors };
  }

  // 2. frontmatter parseable + valid
  const raw = readFileSync(skillMdPath, 'utf-8');
  const parsed = matter(raw);
  const result = SkillFrontmatterSchema.safeParse(parsed.data);

  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`frontmatter.${issue.path.join('.')}: ${issue.message}`);
    }
    return { skill: folderName, errors };
  }

  const fm = result.data;

  // 3. name matches folder
  if (fm.name !== folderName) {
    errors.push(`name mismatch: frontmatter.name="${fm.name}" vs folder="${folderName}"`);
  }

  // 4. related references exist
  for (const rel of fm.related) {
    if (!allFolderNames.includes(rel) && !RESERVED_NAMES.includes(rel)) {
      errors.push(`related: "${rel}" does not exist under skills/`);
    }
  }

  // 5. description should not remain TODO placeholder
  if (fm.description.includes('TODO:')) {
    errors.push('description still contains TODO placeholder');
  }

  // 6. references should only contain markdown files
  errors.push(...validateReferencesAreMarkdown(folderName));

  return { skill: folderName, errors };
}

function main(): void {
  const folders = listSkillFolders();

  if (folders.length === 0) {
    console.log('⚠️  No skills found under skills/');
    process.exit(0);
  }

  console.log(`🔍 Validating ${folders.length} skill(s)...\n`);

  const results = folders
    .filter((f) => !RESERVED_NAMES.includes(f))
    .map((f) => validateSkill(f, folders));

  const failed = results.filter((r) => r.errors.length > 0);

  for (const r of results) {
    if (r.errors.length === 0) {
      console.log(`  ✓ ${r.skill}`);
    } else {
      console.log(`  ✗ ${r.skill}`);
      for (const err of r.errors) {
        console.log(`      └─ ${err}`);
      }
    }
  }

  console.log();

  if (failed.length > 0) {
    console.error(`❌ ${failed.length} skill(s) failed validation\n`);
    process.exit(1);
  }

  console.log(`✅ All ${results.length} skill(s) valid\n`);
}

main();
