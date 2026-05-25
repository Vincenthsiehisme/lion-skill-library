/**
 * Package each skill into a zip file under site/public/downloads/
 *
 * zip 內部結構（重要！）：
 *   {skill-name}-{version}.zip
 *     └── {skill-name}/         ← 必須有外層資料夾
 *         ├── SKILL.md
 *         ├── references/
 *         └── ...
 *
 * 使用者解壓後可直接拖到 ~/.claude/skills/
 */

import { createReadStream, createWriteStream, mkdirSync, readdirSync, readFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import archiver from 'archiver';
import matter from 'gray-matter';
import { SkillFrontmatterSchema } from './schema.js';

const SKILLS_DIR = join(process.cwd(), 'skills');
const OUTPUT_DIR = join(process.cwd(), 'site', 'public', 'downloads');
const RESERVED = ['_template'];

function listSkillFolders(): string[] {
  return readdirSync(SKILLS_DIR)
    .filter((name) => {
      const p = join(SKILLS_DIR, name);
      return statSync(p).isDirectory();
    })
    .filter((name) => !RESERVED.includes(name));
}

function readVersion(folder: string): string {
  const raw = readFileSync(join(SKILLS_DIR, folder, 'SKILL.md'), 'utf-8');
  const fm = SkillFrontmatterSchema.parse(matter(raw).data);
  return fm.version;
}

async function packSkill(folder: string): Promise<{ filename: string; size: number }> {
  const version = readVersion(folder);
  const filename = `${folder}-${version}.zip`;
  const outPath = join(OUTPUT_DIR, filename);

  const skillPath = join(SKILLS_DIR, folder);

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve({ filename, size: archive.pointer() });
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') console.warn(err);
      else reject(err);
    });

    archive.on('error', reject);
    archive.pipe(output);

    // 關鍵:zip 內部要有外層資料夾,所以 archive.directory(srcDir, prefix)
    // prefix 是 zip 內的根目錄名,這裡用 folder name
    archive.directory(skillPath, folder);

    archive.finalize();
  });
}

async function main(): Promise<void> {
  // 清空 / 重建 output dir
  if (existsSync(OUTPUT_DIR)) {
    rmSync(OUTPUT_DIR, { recursive: true });
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const folders = listSkillFolders();

  if (folders.length === 0) {
    console.log('⚠️  No skills found, nothing to package');
    return;
  }

  console.log(`📦 Packaging ${folders.length} skill(s)...\n`);

  for (const folder of folders) {
    const { filename, size } = await packSkill(folder);
    const sizeKb = (size / 1024).toFixed(1);
    console.log(`  ✓ ${filename}  (${sizeKb} KB)`);
  }

  console.log(`\n✅ All packages written to ${relative(process.cwd(), OUTPUT_DIR)}/\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
