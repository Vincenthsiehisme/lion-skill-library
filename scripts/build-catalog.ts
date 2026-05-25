/**
 * Build catalog metadata JSON for the Astro site.
 *
 * Reads:
 *   - skills/&#42;&#42;/SKILL.md (frontmatter + body)
 *   - site/public/downloads/&#42;.zip (size)
 *   - git log (last commit date per skill)
 *
 * Writes:
 *   - site/src/data/skills.generated.json
 *
 * The site imports this JSON at build time.
 */

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import matter from 'gray-matter';
import { SkillFrontmatterSchema, type SkillMeta } from './schema.js';

const SKILLS_DIR = join(process.cwd(), 'skills');
const DOWNLOADS_DIR = join(process.cwd(), 'site', 'public', 'downloads');
const OUTPUT_FILE = join(process.cwd(), 'site', 'src', 'data', 'skills.generated.json');
const RESERVED = ['_template'];

function listSkillFolders(): string[] {
  return readdirSync(SKILLS_DIR)
    .filter((name) => {
      const p = join(SKILLS_DIR, name);
      return statSync(p).isDirectory();
    })
    .filter((name) => !RESERVED.includes(name));
}

function getGitInfo(skillFolder: string): { lastModified: string; commitHash: string } {
  const path = join('skills', skillFolder);
  try {
    const date = execSync(`git log -1 --format=%cI -- "${path}"`, { encoding: 'utf-8' }).trim();
    const hash = execSync(`git log -1 --format=%h -- "${path}"`, { encoding: 'utf-8' }).trim();
    return {
      lastModified: date || new Date().toISOString(),
      commitHash: hash || 'unknown',
    };
  } catch {
    // Not in a git repo (e.g. local dev before first commit)
    return {
      lastModified: new Date().toISOString(),
      commitHash: 'local',
    };
  }
}

function buildSkillMeta(folder: string): SkillMeta {
  const skillMdPath = join(SKILLS_DIR, folder, 'SKILL.md');
  const raw = readFileSync(skillMdPath, 'utf-8');
  const parsed = matter(raw);
  const fm = SkillFrontmatterSchema.parse(parsed.data);

  const zipFilename = `${folder}-${fm.version}.zip`;
  const zipPath = join(DOWNLOADS_DIR, zipFilename);
  const zipSize = existsSync(zipPath) ? statSync(zipPath).size : 0;

  const { lastModified, commitHash } = getGitInfo(folder);

  return {
    ...fm,
    body: parsed.content.trim(),
    zipFilename,
    zipSize,
    lastModified,
    commitHash,
  };
}

function main(): void {
  const folders = listSkillFolders();

  console.log(`📚 Building catalog for ${folders.length} skill(s)...\n`);

  const skills: SkillMeta[] = folders.map(buildSkillMeta);

  // Sort: category then name
  skills.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
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
  console.log(`  ✓ Written to site/src/data/skills.generated.json\n`);
}

main();
