import { NextResponse } from 'next/server';
import {
  getHistory, upsertHistoryEntry, updateHistoryEntry,
  deleteHistoryEntry, deleteHistoryByClientKeyword,
} from '@/lib/db';

export async function GET() {
  try {
    return NextResponse.json(await getHistory());
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await upsertHistoryEntry(await request.json());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await updateHistoryEntry(id, await request.json());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const id = params.get('id');
    const clientName = params.get('clientName');
    const keyword = params.get('keyword');
    if (id) {
      await deleteHistoryEntry(id);
    } else if (clientName && keyword) {
      await deleteHistoryByClientKeyword(clientName, keyword);
    } else {
      return NextResponse.json({ error: 'Missing id or clientName+keyword' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
