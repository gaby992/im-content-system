import { NextResponse } from 'next/server';
import { getApiKey, saveApiKey } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ value: await getApiKey() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { value } = await request.json();
    await saveApiKey(value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
