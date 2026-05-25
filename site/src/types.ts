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
}

export interface Catalog {
  generatedAt: string;
  totalCount: number;
  skills: SkillMeta[];
}
