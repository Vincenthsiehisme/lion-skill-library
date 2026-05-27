export interface SkillReference {
  slug: string;
  filename: string;
  firstLine: string;
  body: string;
}

export interface AtGlance {
  triggerKeywords: string | null;
  doNotTrigger: string | null;
  doNotFirstHint: string | null;
  gotchaTitles: string[];
}

export type SkillGroup =
  | 'skill-meta'
  | 'pm-workflow'
  | 'data-pipeline'
  | 'lion-schema'
  | 'lion-system'
  | 'personal-style'
  | 'marketing-seo'
  | 'specialty';

export interface SkillMeta {
  name: string;
  description: string;
  version: string;
  category: 'planning' | 'writing' | 'review' | 'summary' | 'data' | 'utility' | 'domain';
  license: string;
  author?: string;
  tags: string[];
  related: string[];
  group: SkillGroup;
  feeds_into: string[];
  consumes_from: string[];
  body: string;
  zipFilename: string;
  zipSize: number;
  /** 最後 commit 日期 ISO 8601 — 任何改動都會更新 */
  lastModified: string;
  /** 首次 commit 日期 ISO 8601 — 用於「新發布」判定 */
  firstPublished: string;
  /** version: 字串實際變動的最後一次 commit 日期 ISO 8601 — 用於「新版本」判定 */
  versionBumpedAt: string;
  /** Git commit hash（short），對應 lastModified 那次 commit */
  commitHash: string;
  references: SkillReference[];
  atGlance: AtGlance;
}

export interface Catalog {
  generatedAt: string;
  totalCount: number;
  skills: SkillMeta[];
}
