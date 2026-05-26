/**
 * SKILL.md frontmatter schema (Zod)
 * 三個 script 共用，避免重複定義。
 */

import { z } from 'zod';

/**
 * 允許的 category 列舉值。
 * 修改時請同步更新 CONTRIBUTING.md 與 site 的篩選器。
 */
export const CATEGORIES = [
  'planning',
  'writing',
  'review',
  'summary',
  'data',
  'utility',
  'domain',
] as const;

export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], { zh: string; en: string }> = {
  planning: { zh: '規劃', en: 'Planning' },
  writing: { zh: '寫作', en: 'Writing' },
  review: { zh: '審查', en: 'Review' },
  summary: { zh: '沉澱', en: 'Summary' },
  data: { zh: '資料', en: 'Data' },
  utility: { zh: '工具', en: 'Utility' },
  domain: { zh: '領域', en: 'Domain' },
};

export const SkillFrontmatterSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/, 'name must be lowercase kebab-case'),
  description: z.string().min(20, 'description must be at least 20 chars'),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'version must be semver (e.g. 0.1.0)'),
  category: z.enum(CATEGORIES),
  license: z.string().optional().default('MIT'),
  author: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  related: z.array(z.string()).optional().default([]),
});

export type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>;

/**
 * 一份 reference 子檔的中繼資料
 */
export interface SkillReference {
  /** 不含副檔名的 slug,用於 URL 與檔名對照 */
  slug: string;
  /** 原始檔名(含 .md) */
  filename: string;
  /** 第一行非空非標題的文字,當作摘要 */
  firstLine: string;
  /** 整份 markdown 內容 */
  body: string;
}

/**
 * 從 description 規則切出來的「At a glance」結構化片段
 */
export interface AtGlance {
  /** 觸發關鍵字段落(若有) */
  triggerKeywords: string | null;
  /** DO NOT trigger for 段落(若有) */
  doNotTrigger: string | null;
  /** Gotchas H2 下的 H3 標題清單(常見踩雷摘要) */
  gotchaTitles: string[];
}

/**
 * 完整 skill metadata（frontmatter + build-time 補充欄位）
 */
export interface SkillMeta extends SkillFrontmatter {
  /** 從 SKILL.md 抓的完整 body（不含 frontmatter） */
  body: string;
  /** zip 檔名（相對於 site/public/downloads/） */
  zipFilename: string;
  /** zip 大小，bytes */
  zipSize: number;
  /** 最後 commit 日期 ISO 8601 — 用於「新版本」判定 */
  lastModified: string;
  /** 首次 commit 日期 ISO 8601 — 用於「新發布」判定 */
  firstPublished: string;
  /** Git commit hash（short），對應 lastModified 那次 commit */
  commitHash: string;
  /** references/ 子檔清單,平展(目前不處理子資料夾) */
  references: SkillReference[];
  /** 從 description 與 body 規則萃取的 At a glance 結構 */
  atGlance: AtGlance;
}
