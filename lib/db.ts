import { getSupabase } from './supabase';
import { Client, ReportFolder, GenerationHistoryEntry } from '@/types';

// ─── Clients ──────────────────────────────────────────────────────────────────

function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    website: (row.website as string) || '',
    niche: (row.niche as string) || '',
    locations: (row.locations as string) || '',
    services: (row.services as string) || '',
    targetAudience: (row.target_audience as string) || '',
    toneNotes: (row.tone_notes as string) || '',
    specialRules: (row.special_rules as string) || '',
    systemPrompt: (row.system_prompt as string) || '',
    createdAt: row.created_at as string,
  };
}

function clientToRow(client: Omit<Client, 'id' | 'createdAt'>) {
  return {
    name: client.name,
    website: client.website,
    niche: client.niche,
    locations: client.locations,
    services: client.services,
    target_audience: client.targetAudience,
    tone_notes: client.toneNotes,
    special_rules: client.specialRules,
    system_prompt: client.systemPrompt,
  };
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await getSupabase()
    .from('clients')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToClient);
}

export async function createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  const { data, error } = await getSupabase()
    .from('clients')
    .insert(clientToRow(client))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToClient(data);
}

export async function updateClient(id: string, client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  const { data, error } = await getSupabase()
    .from('clients')
    .update(clientToRow(client))
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToClient(data);
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await getSupabase().from('clients').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Generation History ───────────────────────────────────────────────────────

type ContentVersions = {
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
};

function rowToHistoryEntry(row: Record<string, unknown>): GenerationHistoryEntry {
  const cv = (row.content_versions ?? {}) as ContentVersions;
  return {
    id: row.id as string,
    keyword: row.keyword as string,
    type: row.content_type as GenerationHistoryEntry['type'],
    clientName: row.client_name as string,
    generatedAt: row.created_at as string,
    blog: cv.blog,
    web20_1: cv.web20_1,
    web20_2: cv.web20_2,
    web20_3: cv.web20_3,
    web20_4: cv.web20_4,
    web20_5: cv.web20_5,
    web20_6: cv.web20_6,
    drive: cv.drive,
    gbp: cv.gbp,
    landingPage: cv.landingPage,
    locationPage: cv.locationPage,
  };
}

function historyEntryToRow(entry: GenerationHistoryEntry, clientId?: string) {
  const cv: ContentVersions = {};
  if (entry.blog)         cv.blog         = entry.blog;
  if (entry.web20_1)      cv.web20_1      = entry.web20_1;
  if (entry.web20_2)      cv.web20_2      = entry.web20_2;
  if (entry.web20_3)      cv.web20_3      = entry.web20_3;
  if (entry.web20_4)      cv.web20_4      = entry.web20_4;
  if (entry.web20_5)      cv.web20_5      = entry.web20_5;
  if (entry.web20_6)      cv.web20_6      = entry.web20_6;
  if (entry.drive)        cv.drive        = entry.drive;
  if (entry.gbp)          cv.gbp          = entry.gbp;
  if (entry.landingPage)  cv.landingPage  = entry.landingPage;
  if (entry.locationPage) cv.locationPage = entry.locationPage;

  const filesCount = Object.values(cv).filter(Boolean).length;

  return {
    id: entry.id,
    keyword: entry.keyword,
    content_type: entry.type,
    client_name: entry.clientName,
    client_id: clientId ?? null,
    content_versions: cv,
    files_count: filesCount,
    created_at: entry.generatedAt,
  };
}

export async function getHistory(): Promise<GenerationHistoryEntry[]> {
  const { data, error } = await getSupabase()
    .from('generation_history')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToHistoryEntry);
}

export async function upsertHistoryEntry(entry: GenerationHistoryEntry): Promise<void> {
  const sb = getSupabase();
  const { data: clientRows } = await sb
    .from('clients')
    .select('id')
    .eq('name', entry.clientName)
    .single();

  const row = historyEntryToRow(entry, clientRows?.id);
  const { error } = await sb
    .from('generation_history')
    .upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function deleteHistoryByClientKeyword(clientName: string, keyword: string): Promise<void> {
  await getSupabase()
    .from('generation_history')
    .delete()
    .eq('client_name', clientName)
    .ilike('keyword', keyword);
}

export async function updateHistoryEntry(id: string, entry: GenerationHistoryEntry): Promise<void> {
  const row = historyEntryToRow(entry);
  const { error } = await getSupabase()
    .from('generation_history')
    .update({
      content_versions: row.content_versions,
      files_count: row.files_count,
      created_at: row.created_at,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const { error } = await getSupabase().from('generation_history').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Report Folders ───────────────────────────────────────────────────────────

function rowToFolder(row: Record<string, unknown>): ReportFolder {
  return {
    id: row.id as string,
    month: row.month as string,
    clientName: row.client_name as string,
    topic: row.topic as string,
    createdAt: row.created_at as string,
  };
}

export async function getFolders(): Promise<ReportFolder[]> {
  const { data, error } = await getSupabase()
    .from('report_folders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToFolder);
}

export async function createFolder(folder: Omit<ReportFolder, 'id' | 'createdAt'>): Promise<ReportFolder> {
  const { data, error } = await getSupabase()
    .from('report_folders')
    .insert({
      month: folder.month,
      client_name: folder.clientName,
      topic: folder.topic,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToFolder(data);
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await getSupabase().from('report_folders').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── App Settings (API Key) ───────────────────────────────────────────────────

export async function getApiKey(): Promise<string> {
  const { data } = await getSupabase()
    .from('app_settings')
    .select('value')
    .eq('key', 'claude_api_key')
    .single();
  return (data?.value as string) ?? '';
}

export async function saveApiKey(value: string): Promise<void> {
  const { error } = await getSupabase()
    .from('app_settings')
    .upsert({ key: 'claude_api_key', value }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}
