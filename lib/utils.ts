import { GeneratedContent, ContentVersion } from '@/types';

export function getVersionsFromContent(result: GeneratedContent): ContentVersion[] {
  if (result.type === 'blog-package') {
    const versions: ContentVersion[] = [];
    if (result.blog)    versions.push({ key: 'blog',    label: 'Blog Post',        content: result.blog,    fileSlug: 'BLOG' });
    if (result.web20_1) versions.push({ key: 'web20_1', label: 'WordPress',         content: result.web20_1, fileSlug: 'WORDPRESS' });
    if (result.web20_2) versions.push({ key: 'web20_2', label: 'Blogger',           content: result.web20_2, fileSlug: 'BLOGGER' });
    if (result.web20_3) versions.push({ key: 'web20_3', label: 'Tumblr',            content: result.web20_3, fileSlug: 'TUMBLR' });
    if (result.web20_4) versions.push({ key: 'web20_4', label: 'Medium',            content: result.web20_4, fileSlug: 'MEDIUM' });
    if (result.web20_5) versions.push({ key: 'web20_5', label: 'Weebly',            content: result.web20_5, fileSlug: 'WEEBLY' });
    if (result.web20_6) versions.push({ key: 'web20_6', label: 'Wix Blog',          content: result.web20_6, fileSlug: 'WIX' });
    if (result.drive)   versions.push({ key: 'drive',   label: 'Google Drive',      content: result.drive,   fileSlug: 'DRIVE' });
    if (result.gbp)     versions.push({ key: 'gbp',     label: 'GBP Website Post',  content: result.gbp,     fileSlug: 'GBP-WEBSITE' });
    return versions;
  }
  if (result.type === 'landing-page' && result.landingPage) {
    return [{ key: 'landing', label: 'Landing Page', content: result.landingPage, fileSlug: 'LANDING' }];
  }
  if (result.type === 'location-page' && result.locationPage) {
    return [{ key: 'location', label: 'Location Page', content: result.locationPage, fileSlug: 'LOCATION' }];
  }
  return [];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function generateSystemPromptFromClient(client: {
  name: string;
  website: string;
  niche: string;
  locations: string;
  services: string;
  targetAudience: string;
  toneNotes: string;
  specialRules: string;
}): string {
  return `You are creating content for ${client.name}, a ${client.niche} business.

Website: ${client.website}
Locations served: ${client.locations}
Core services: ${client.services}
Target audience: ${client.targetAudience}

Tone & voice notes: ${client.toneNotes}

Special rules: ${client.specialRules}

Always write as if you are this practice speaking directly to their patients/clients. Reference the specific locations, services, and audience described above.`.trim();
}

export function createDocxHtml(params: {
  content: string;
  clientName: string;
  keyword: string;
  version: string;
  date: string;
}): string {
  const { content, clientName, keyword, version, date } = params;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Calibri, Arial, sans-serif; }
  h1 { font-size: 24pt; }
  h2 { font-size: 18pt; }
  h3 { font-size: 14pt; }
  p { font-size: 11pt; line-height: 1.6; }
  ul, ol { font-size: 11pt; }
  .image-ideas { background: #f9f5e7; padding: 12px; margin-bottom: 16px; }
  .image-ideas h2 { font-size: 14pt; color: #7a5c00; }
</style>
</head>
<body>
<p><strong>Client:</strong> ${clientName} &nbsp;&nbsp; <strong>Keyword:</strong> ${keyword} &nbsp;&nbsp; <strong>Version:</strong> ${version} &nbsp;&nbsp; <strong>Generated:</strong> ${date}</p>
<hr>
${content}
</body>
</html>`;
}
