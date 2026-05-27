/**
 * SKILL.md frontmatter schema (Zod)
 * 三個 script 共用,避免重複定義。
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

/**
 * 「群組」── 比 category 更貼近使用者腦中的分類軸。
 *
 * 一個 skill 屬於一個 group,最多 8 個 group。
 * - category 描述「這個 skill 在做什麼類型的事」(planning/writing/...)
 * - group   描述「這個 skill 跟哪些 skill 是一夥的」(skill-meta/pm-workflow/...)
 *
 * 同 group 內常見 pipeline 關係,可透過 feeds_into / consumes_from 進一步宣告。
 */
export const GROUPS = [
  'skill-meta',
  'pm-workflow',
  'data-pipeline',
  'lion-schema',
  'lion-system',
  'personal-style',
  'marketing-seo',
  'specialty',
] as const;

export const GROUP_META: Record<
  (typeof GROUPS)[number],
  { label: string; blurb: string; order: number }
> = {
  'skill-meta': {
    label: 'Skill 元工具',
    blurb: '規劃、寫、審、沉澱 skill 本身的工具家族。彼此互相串成一條 lifecycle。',
    order: 1,
  },
  'pm-workflow': {
    label: 'PM 工作流',
    blurb: 'PRD、審查、派工、故事拆解。產品經理日常產出的主要工具。',
    order: 2,
  },
  'data-pipeline': {
    label: '資料 pipeline',
    blurb: '清整、整形、檢定、解讀、視覺化。從髒 CSV 到可講的洞察。',
    order: 3,
  },
  'lion-schema': {
    label: '雄獅資料知識',
    blurb: 'ERP / PCM / CMS / 行銷 / 行程組合器等資料庫 schema 與 API 對照。',
    order: 4,
  },
  'lion-system': {
    label: '雄獅系統架構',
    blurb: '團體、訂單、搜尋系統的架構顧問與故障診斷。',
    order: 5,
  },
  'personal-style': {
    label: '個人風格資產',
    blurb: '個人偏好、視覺風格、輸出風格的 DNA。',
    order: 6,
  },
  'marketing-seo': {
    label: '行銷與 SEO',
    blurb: '雄獅行銷 context、SEO 體檢、價格帶洞察。',
    order: 7,
  },
  specialty: {
    label: '專項工具',
    blurb: '不屬於既有 pipeline 但有特定情境用途的單兵 skill。',
    order: 8,
  },
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
  /**
   * 群組歸屬。
   * - optional:舊 skill 沒填會 fallback 到 'specialty',但會被 validate 印 warning
   * - 一個 skill 只能屬於一個 group
   */
  group: z.enum(GROUPS).optional(),
  /**
   * pipeline 關係 — 我的輸出餵給哪些 skill。
   * - 陣列元素是 skill 的 `name` 欄位(kebab-case)
   * - 對稱性由 build-catalog 檢查:若 A feeds_into B 但 B 沒寫 consumes_from A → warning
   */
  feeds_into: z.array(z.string()).optional().default([]),
  /**
   * pipeline 關係 — 我的輸入來自哪些 skill。同上規則。
   */
  consumes_from: z.array(z.string()).optional().default([]),
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
  /**
   * DO NOT trigger 段的「首條替代建議」短摘要。
   * 例:description 寫「DO NOT trigger for: 審 skill 結構(用 skill-review)」→ 抽出「審 skill 結構 → skill-review」。
   * 用於卡片第二行的消歧義 hint。
   * null 表示無法可靠抽取(段不存在/格式異常)。
   */
  doNotFirstHint: string | null;
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
  /** zip 大小,bytes */
  zipSize: number;
  /** 最後 commit 日期 ISO 8601 — 任何改動都會更新 */
  lastModified: string;
  /** 首次 commit 日期 ISO 8601 — 用於「新發布」判定 */
  firstPublished: string;
  /**
   * SKILL.md 的 version: 字串實際變動的最後一次 commit 日期 ISO 8601。
   * - 用於「新版本」判定。
   * - 與 lastModified 的差別:typo / reference 補丁不算 version bump。
   * - fallback:若無歷史(skill 剛建立或 git 撈不到) → 等於 firstPublished。
   *   此時 hasBeenVersionBumped 為 false,前端用該 flag 判斷而非比對日期。
   */
  versionBumpedAt: string;
  /**
   * 該 skill 是否曾經 bump 過 version(初始 commit 之後又改過 version 行)。
   * 用於前端區分「新發布」vs「新版本」清單,避免間接靠
   * `versionBumpedAt !== firstPublished` 判定。
   */
  hasBeenVersionBumped: boolean;
  /** Git commit hash（short）,對應 lastModified 那次 commit */
  commitHash: string;
  /** references/ 子檔清單,平展(目前不處理子資料夾) */
  references: SkillReference[];
  /** 從 description 與 body 規則萃取的 At a glance 結構 */
  atGlance: AtGlance;
}
