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

KEYWORD RULE (NON-NEGOTIABLE):
- The target keyword MUST appear in the very first sentence of the introduction — not paragraph 2, not the heading, THE FIRST SENTENCE of the body text, always, without exception.

STRUCTURE RULES:
- H1: one clear promise or question, not keyword stuffing
- H2s: conversational not corporate. Example: instead of "Benefits of Acne Treatment" use "Why Acne Treatment Actually Works"
- First paragraph: speak to the pain point immediately, no preamble
- Last paragraph: warm human CTA, not "Contact us today for a consultation"
- Use proper HTML tags: h1, h2, h3, p, ul, li only
- Include 2 to 3 internal link placeholders formatted as: [INTERNAL LINK: anchor text | /suggested-page]
- Include FAQ section where appropriate

IMAGE IDEAS RULE:
- Every single piece of content MUST begin with an Image Ideas section BEFORE the H1 or any other content
- Format it exactly like this:
<div class="image-ideas"><h2>📸 IMAGE IDEAS</h2><ul>
<li>[specific, visual, actionable image suggestion relevant to the topic]</li>
<li>[specific, visual, actionable image suggestion relevant to the topic]</li>
<li>[specific, visual, actionable image suggestion relevant to the topic]</li>
<li>[specific, visual, actionable image suggestion relevant to the topic]</li>
</ul></div>
- Image suggestions must be specific (not generic). Bad: "photo of a doctor". Good: "close-up of a dermatologist examining a patient's skin with a dermoscope under bright clinical lighting"

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

CRITICAL: Every single section below MUST:
1. Start with the 📸 IMAGE IDEAS section (4 specific image suggestions) BEFORE any heading
2. Include the keyword "${keyword}" in the very FIRST sentence of the intro paragraph

Generate ALL of the following pieces in order, using EXACTLY these separators:

===BLOG_START===
[Image Ideas section first, then:]
Write the main blog post (1500-2000 words). Full HTML with h1, h2, h3, p, ul, li. Include FAQ and internal link placeholders. Angle: authoritative, in-depth guide that covers the topic thoroughly.
===BLOG_END===

===WORDPRESS_START===
[Image Ideas section first, then:]
Write a WordPress post (approximately 1000 words). Full HTML. Angle: personal story or case study framing — open with a relatable patient scenario that leads into the topic. Intro must mention "${keyword}" in first sentence. Different structure and angle from the main blog.
===WORDPRESS_END===

===BLOGGER_START===
[Image Ideas section first, then:]
Write a Blogger post (approximately 1000 words). Full HTML. Angle: myth-busting or misconceptions — open by addressing a common wrong belief about the topic. Intro must mention "${keyword}" in first sentence. Different angle and structure from all previous posts.
===BLOGGER_END===

===TUMBLR_START===
[Image Ideas section first, then:]
Write a Tumblr post (approximately 1000 words). Full HTML. Angle: conversational Q&A style — "people ask us all the time about [keyword]" framing, address real questions patients have. Intro must mention "${keyword}" in first sentence. Younger, more casual tone. Different angle from all previous.
===TUMBLR_END===

===MEDIUM_START===
[Image Ideas section first, then:]
Write a Medium post (approximately 1000 words). Full HTML. Angle: thought-leadership or "what we've learned" — position as insider knowledge, lessons from clinical experience. Intro must mention "${keyword}" in first sentence. Thoughtful, slightly more professional tone. Different angle from all previous.
===MEDIUM_END===

===WEEBLY_START===
[Image Ideas section first, then:]
Write a Weebly post (approximately 1000 words). Full HTML. Angle: step-by-step guide or "what to expect" — walk the reader through the process, timeline, what happens at each stage. Intro must mention "${keyword}" in first sentence. Reassuring, informative tone. Different angle from all previous.
===WEEBLY_END===

===WIX_START===
[Image Ideas section first, then:]
Write a Wix Blog post (approximately 1000 words). Full HTML. Angle: comparison or "how is this different from" — compare this approach/treatment to alternatives or what patients tried before. Intro must mention "${keyword}" in first sentence. Helpful, educational tone. Different angle from all previous.
===WIX_END===

===DRIVE_START===
[Image Ideas section first, then:]
Write a Google Drive version (approximately 750 words). Condensed, informative summary of the topic. Full HTML. Intro must mention "${keyword}" in first sentence.
===DRIVE_END===

===GBP_START===
[Image Ideas section first, then:]
Write a GBP Website Post (approximately 300 words). Conversational, direct, warm. No complex HTML — just p tags. Speaks to the reader about "${keyword}" starting in the very first sentence. Ends with a soft, human call to action.
===GBP_END===

IMPORTANT: Include ALL nine sections with the exact separators shown above. Every section must be unique — never duplicate structure, intro style, or content between sections.`;

    return { systemPrompt, userPrompt, maxTokens: 16000 };
  }

  if (contentType === 'landing-page') {
    const userPrompt = `Create a complete, high-converting landing page for the keyword: "${keyword}"

Start with the Image Ideas section (📸 IMAGE IDEAS with 4 specific suggestions) BEFORE the H1.

The keyword "${keyword}" MUST appear in the very first sentence of the opening paragraph.

Write full HTML content with proper landing page structure:
- H1: compelling headline with the keyword
- Hero section with problem statement
- Why Choose Us section
- Services/Benefits section (use paragraphs not bullet lists)
- Social proof / trust section
- FAQ section
- Strong CTA section

Include 2-3 internal link placeholders: [INTERNAL LINK: anchor text | /suggested-page]

Output ONLY the HTML body content (h1, h2, h3, p, ul, li, div tags). No html/body wrapper.`;

    return { systemPrompt, userPrompt, maxTokens: 3000 };
  }

  // location-page
  const userPrompt = `Create a complete location page for: "${keyword}"

Start with the Image Ideas section (📸 IMAGE IDEAS with 4 specific suggestions) BEFORE the H1.

The keyword "${keyword}" MUST appear in the very first sentence of the opening paragraph.

This should be a geo-targeted page that:
- Addresses the specific location naturally throughout
- Uses local references where appropriate
- Explains services available in that location
- Has a clear service area description
- Includes FAQ relevant to that location

Structure: H1 with location + service, then H2 sections covering: why local matters, what we offer there, what to expect, FAQ, CTA.

Include 2-3 internal link placeholders: [INTERNAL LINK: anchor text | /suggested-page]

Output ONLY the HTML body content (h1, h2, h3, p, ul, li, div tags).`;

  return { systemPrompt, userPrompt, maxTokens: 3000 };
}

export function parseBlogPackage(response: string): {
  blog?: string;
  web20_1?: string;
  web20_2?: string;
  web20_3?: string;
  web20_4?: string;
  web20_5?: string;
  web20_6?: string;
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
    web20_1: extract('===WORDPRESS_START===', '===WORDPRESS_END==='),
    web20_2: extract('===BLOGGER_START===', '===BLOGGER_END==='),
    web20_3: extract('===TUMBLR_START===', '===TUMBLR_END==='),
    web20_4: extract('===MEDIUM_START===', '===MEDIUM_END==='),
    web20_5: extract('===WEEBLY_START===', '===WEEBLY_END==='),
    web20_6: extract('===WIX_START===', '===WIX_END==='),
    drive: extract('===DRIVE_START===', '===DRIVE_END==='),
    gbp: extract('===GBP_START===', '===GBP_END==='),
  };
}
