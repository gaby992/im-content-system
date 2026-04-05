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

export function createWordHtml(params: {
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
  body {
    font-family: Georgia, serif;
    max-width: 860px;
    margin: 0 auto;
    padding: 40px;
    color: #333;
    line-height: 1.7;
  }
  .meta-box {
    background: #f5f5f5;
    border-left: 4px solid #C9A84C;
    padding: 12px 16px;
    margin-bottom: 32px;
    font-family: Arial, sans-serif;
    font-size: 13px;
    color: #555;
  }
  .meta-box span { margin-right: 24px; }
  h1 { color: #1B3A6B; border-bottom: 2px solid #C9A84C; padding-bottom: 8px; }
  h2 { color: #1B3A6B; }
  h3 { color: #2a5298; }
  p { margin: 0 0 16px; }
  ul, ol { margin: 0 0 16px; padding-left: 24px; }
  li { margin-bottom: 6px; }
</style>
</head>
<body>
<div class="meta-box">
  <span><strong>Client:</strong> ${clientName}</span>
  <span><strong>Keyword:</strong> ${keyword}</span>
  <span><strong>Version:</strong> ${version}</span>
  <span><strong>Generated:</strong> ${date}</span>
</div>
${content}
</body>
</html>`;
}
