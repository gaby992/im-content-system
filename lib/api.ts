/**
 * Client-side data access — thin fetch wrappers over our own API routes.
 * Use this in 'use client' components instead of lib/db (which requires
 * Supabase env vars baked into the browser bundle at build time).
 */
import { Client, GenerationHistoryEntry, ReportFolder } from '@/types';

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed');
  return data as T;
}

// ── Clients ────────────────────────────────────────────────────────────────────

export function getClients(): Promise<Client[]> {
  return apiFetch('/api/clients');
}

export function createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  return apiFetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  });
}

export function updateClient(id: string, client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  return apiFetch(`/api/clients?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  });
}

export function deleteClient(id: string): Promise<void> {
  return apiFetch(`/api/clients?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ── Generation History ─────────────────────────────────────────────────────────

export function getHistory(): Promise<GenerationHistoryEntry[]> {
  return apiFetch('/api/history');
}

export function upsertHistoryEntry(entry: GenerationHistoryEntry): Promise<void> {
  return apiFetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
}

export function updateHistoryEntry(id: string, entry: GenerationHistoryEntry): Promise<void> {
  return apiFetch(`/api/history?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
}

export function deleteHistoryEntry(id: string): Promise<void> {
  return apiFetch(`/api/history?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function deleteHistoryByClientKeyword(clientName: string, keyword: string): Promise<void> {
  return apiFetch(
    `/api/history?clientName=${encodeURIComponent(clientName)}&keyword=${encodeURIComponent(keyword)}`,
    { method: 'DELETE' },
  );
}

// ── Report Folders ─────────────────────────────────────────────────────────────

export function getFolders(): Promise<ReportFolder[]> {
  return apiFetch('/api/folders');
}

export function createFolder(folder: Omit<ReportFolder, 'id' | 'createdAt'>): Promise<ReportFolder> {
  return apiFetch('/api/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(folder),
  });
}

export function deleteFolder(id: string): Promise<void> {
  return apiFetch(`/api/folders?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ── Settings ───────────────────────────────────────────────────────────────────

export function getApiKey(): Promise<string> {
  return apiFetch<{ value: string }>('/api/settings').then(d => d.value);
}

export function saveApiKey(value: string): Promise<void> {
  return apiFetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
}
