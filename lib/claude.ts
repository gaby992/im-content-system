import { ContentType } from '@/types';

export const MASTER_SYSTEM_PROMPT = `You are a warm, knowledgeable healthcare provider speaking directly to a patient — not a content writer, not a robot.

VOICE RULES:
- Write like you are having a real conversation, not publishing an article
- Vary sentence length: mix short punchy sentences with longer flowing ones
- Use "you" and "we" naturally throughout
- Start some sentences with And, But, Because — like real humans do
- Ask rhetorical questions occasionally like: Sound familiar? Does that sound like you?
- Use contractions: you're, we're, it's, don't, won't
- Never use: "In conclusion", "In summary", "It is worth noting", "It is important to", "Delve into", "Comprehensive", "Leverage", "Utilize", "Furthermore", "Moreover", "In today's world"
- No lists of 5 or more bullets — break into paragraphs instead
- Read every paragraph out loud mentally — if it sounds stiff, rewrite it

STRUCTURE RULES:
- H1: one clear promise or question, not keyword stuffing
- H2s: conversational not corporate. Example: instead of "Benefits of Acne Treatment" use "Why Acne Treatment Actually Works"
- First paragraph: speak to the pain point immediately, no preamble
- Last paragraph: warm human CTA, not "Contact us today for a consultation"
- Use proper HTML tags: h1, h2, h3, p, ul, li only
- Include 2 to 3 internal link placeholders formatted as: [INTERNAL LINK: anchor text | /suggested-page]
- Include FAQ section where appropriate

FORBIDDEN WORDS (never use these):
game-changer, cutting-edge, state-of-the-art, holistic approach, tailored solutions, seamlessly, robust, dive into, unlock, empower, journey, landscape, paradigm, revolutionize, groundbreaking, transformative, elevate, harness, streamline`;

export function buildPrompt(
  contentType: ContentType,
  keyword: string,
  clientSystemPrompt: string
): { systemPrompt: string; userPrompt: string; maxTokens: number } {
  const systemPrompt = `${MASTER_SYSTEM_PROMPT}\n\n---\n\n${clientSystemPrompt}`;

  if (contentType === 'blog-package') {
    const userPrompt = `Create a complete Blog Post Package for the keyword: "${keyword}"

Generate ALL of the following pieces in order, using EXACTLY these separators:

===BLOG_START===
Write the main blog post (1500-2000 words). Full HTML content with h1, h2, h3, p, ul, li tags. Include FAQ section and internal link placeholders.
===BLOG_END===

===WEB20_1_START===
Write Web 2.0 Post #1 (approximately 1000 words). Unique angle on the same topic. Full HTML.
===WEB20_1_END===

===WEB20_2_START===
Write Web 2.0 Post #2 (approximately 1000 words). Different angle. Full HTML.
===WEB20_2_END===

===WEB20_3_START===
Write Web 2.0 Post #3 (approximately 1000 words). Another unique perspective. Full HTML.
===WEB20_3_END===

===WEB20_4_START===
Write Web 2.0 Post #4 (approximately 1000 words). Final unique angle. Full HTML.
===WEB20_4_END===

===DRIVE_START===
Write a Google Drive version (approximately 750 words). Condensed, informative version of the main blog. Full HTML.
===DRIVE_END===

===GBP_START===
Write a Google Business Profile post (approximately 300 words). Conversational, direct. No complex HTML — just p tags. End with a soft call to action.
===GBP_END===

IMPORTANT: Include ALL seven sections with the exact separators shown above.`;

    return { systemPrompt, userPrompt, maxTokens: 8000 };
  }

  if (contentType === 'landing-page') {
    const userPrompt = `Create a complete, high-converting landing page for the keyword: "${keyword}"

Write full HTML content with proper landing page structure:
- H1: compelling headline with the keyword
- Hero section with problem statement
- Why Choose Us section
- Services/Benefits section (use paragraphs not bullet lists)
- Social proof / trust section
- FAQ section
- Strong CTA section

Include 2-3 internal link placeholders: [INTERNAL LINK: anchor text | /suggested-page]

Output ONLY the HTML body content (h1, h2, h3, p, ul, li tags). No html/body wrapper.`;

    return { systemPrompt, userPrompt, maxTokens: 3000 };
  }

  if (contentType === 'location-page') {
    const userPrompt = `Create a complete location page for: "${keyword}"

This should be a geo-targeted page that:
- Addresses the specific location naturally throughout
- Uses local references where appropriate
- Explains services available in that location
- Has a clear service area description
- Includes FAQ relevant to that location

Structure: H1 with location + service, then H2 sections covering: why local matters, what we offer there, what to expect, FAQ, CTA.

Include 2-3 internal link placeholders: [INTERNAL LINK: anchor text | /suggested-page]

Output ONLY the HTML body content (h1, h2, h3, p, ul, li tags).`;

    return { systemPrompt, userPrompt, maxTokens: 3000 };
  }

  // gbp-post
  const userPrompt = `Write a Google Business Profile post for: "${keyword}"

Requirements:
- Approximately 300 words
- Conversational, warm tone
- Speaks directly to the reader
- Addresses a pain point or question related to the keyword
- Ends with a soft, human call to action
- Use only p tags for formatting

Output ONLY the HTML content using p tags.`;

  return { systemPrompt, userPrompt, maxTokens: 3000 };
}

export function parseBlogPackage(response: string): {
  blog?: string;
  web20_1?: string;
  web20_2?: string;
  web20_3?: string;
  web20_4?: string;
  drive?: string;
  gbp?: string;
} {
  const extract = (start: string, end: string): string | undefined => {
    const startIdx = response.indexOf(start);
    const endIdx = response.indexOf(end);
    if (startIdx === -1 || endIdx === -1) return undefined;
    return response.slice(startIdx + start.length, endIdx).trim();
  };

  return {
    blog: extract('===BLOG_START===', '===BLOG_END==='),
    web20_1: extract('===WEB20_1_START===', '===WEB20_1_END==='),
    web20_2: extract('===WEB20_2_START===', '===WEB20_2_END==='),
    web20_3: extract('===WEB20_3_START===', '===WEB20_3_END==='),
    web20_4: extract('===WEB20_4_START===', '===WEB20_4_END==='),
    drive: extract('===DRIVE_START===', '===DRIVE_END==='),
    gbp: extract('===GBP_START===', '===GBP_END==='),
  };
}
