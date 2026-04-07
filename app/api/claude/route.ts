import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildPrompt, parseBlogPackage } from '@/lib/claude';
import { getApiKey } from '@/lib/db';
import { ContentType } from '@/types';

export async function POST(request: Request) {
  try {
    const { contentType, keyword, clientSystemPrompt, blogPart } = await request.json() as {
      contentType: ContentType;
      keyword: string;
      clientSystemPrompt: string;
      blogPart?: 1 | 2;
    };

    const apiKey = await getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured. Please add it in Settings.' }, { status: 400 });
    }

    if (!keyword || !contentType || !clientSystemPrompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    const effectiveType = contentType === 'blog-package' && blogPart
      ? (`blog-package-part${blogPart}` as const)
      : contentType;

    const { systemPrompt, userPrompt, maxTokens } = buildPrompt(effectiveType, keyword, clientSystemPrompt);

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    if (contentType === 'blog-package') {
      const parsed = parseBlogPackage(responseText);
      return NextResponse.json({ type: 'blog-package', ...parsed });
    }

    return NextResponse.json({ type: contentType, content: responseText });
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    if (error?.status === 401) {
      return NextResponse.json({ error: 'Invalid API key. Please check your settings.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
