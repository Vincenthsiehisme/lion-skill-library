export interface SkillReference {
  slug: string;
  filename: string;
  firstLine: string;
  body: string;
}

export interface AtGlance {
  triggerKeywords: string | null;
  doNotTrigger: string | null;
  gotchaTitles: string[];
}

export interface SkillMeta {
  name: string;
  description: string;
  version: string;
  category: 'planning' | 'writing' | 'review' | 'summary' | 'data' | 'utility' | 'domain';
  license: string;
  author?: string;
  tags: string[];
  related: string[];
  body: string;
  zipFilename: string;
  zipSize: number;
  lastModified: string;
  commitHash: string;
  references: SkillReference[];
  atGlance: AtGlance;
}

export interface Catalog {
  generatedAt: string;
  totalCount: number;
  skills: SkillMeta[];
}
