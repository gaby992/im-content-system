export interface User {
  username: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface Client {
  id: string;
  name: string;
  website: string;
  niche: string;
  locations: string;
  services: string;
  targetAudience: string;
  toneNotes: string;
  specialRules: string;
  systemPrompt: string;
  createdAt: string;
}

export interface ReportFolder {
  id: string;
  month: string;
  clientName: string;
  topic: string;
  createdAt: string;
}

export type ContentType = 'blog-package' | 'landing-page' | 'location-page';

export interface GeneratedContent {
  keyword: string;
  type: ContentType;
  clientName: string;
  blog?: string;
  web20_1?: string;
  web20_2?: string;
  web20_3?: string;
  web20_4?: string;
  web20_5?: string;
  web20_6?: string;
  drive?: string;
  gbp?: string;
  landingPage?: string;
  locationPage?: string;
  generatedAt: string;
}

export interface ContentVersion {
  key: string;
  label: string;
  content: string;
  fileSlug: string;
}

export interface GenerationHistoryEntry extends GeneratedContent {
  id: string;
}
