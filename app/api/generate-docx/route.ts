import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const HTMLtoDOCX = require('html-to-docx');

export async function POST(request: Request) {
  try {
    const { html, filename } = await request.json() as { html: string; filename: string };

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer: any = await HTMLtoDOCX(html, null, {
      title: filename || 'document',
      margin: {
        top: 1440,
        right: 1440,
        bottom: 1440,
        left: 1440,
      },
      font: 'Calibri',
      fontSize: 24,
      table: { row: { cantSplit: true } },
    });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}.docx"`,
      },
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error?.message || 'Failed to generate document' },
      { status: 500 }
    );
  }
}
