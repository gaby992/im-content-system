'use client';
import { useState, useEffect } from 'react';
import { ReportFolder, User, GenerationHistoryEntry } from '@/types';
import { formatDate, getVersionsFromContent } from '@/lib/utils';
import { triggerDocxDownload, downloadAllAsZip } from '@/lib/docx-generator';
import {
  getHistory, updateHistoryEntry, deleteHistoryEntry,
  getFolders, createFolder, deleteFolder,
  getClients,
} from '@/lib/db';

const ALL_BLOG_VERSIONS: { key: keyof GenerationHistoryEntry; label: string; part: 1 | 2 }[] = [
  { key: 'blog',    label: 'Blog Post',        part: 1 },
  { key: 'web20_1', label: 'WordPress',         part: 1 },
  { key: 'web20_2', label: 'Blogger',           part: 1 },
  { key: 'web20_3', label: 'Tumblr',            part: 1 },
  { key: 'web20_4', label: 'Medium',            part: 2 },
  { key: 'web20_5', label: 'Weebly',            part: 2 },
  { key: 'web20_6', label: 'Wix Blog',          part: 2 },
  { key: 'drive',   label: 'Google Drive',      part: 2 },
  { key: 'gbp',     label: 'GBP Website Post',  part: 2 },
];

const PART1_KEYS: (keyof GenerationHistoryEntry)[] = ['blog', 'web20_1', 'web20_2', 'web20_3'];
const PART2_KEYS: (keyof GenerationHistoryEntry)[] = ['web20_4', 'web20_5', 'web20_6', 'drive', 'gbp'];

async function callClaudeAPI(payload: {
  contentType: string;
  keyword: string;
  clientSystemPrompt: string;
  blogPart?: 1 | 2;
}) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Generation failed');
  return data;
}

interface ReportsManagerProps {
  user: User;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CONTENT_TYPE_LABELS: Record<string, string> = {
  'blog-package': 'Blog Package',
  'landing-page': 'Landing Page',
  'location-page': 'Location Page',
};

// ─── History Tab ─────────────────────────────────────────────────────────────

function HistoryTab({ user }: { user: User }) {
  const [history, setHistory] = useState<GenerationHistoryEntry[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string; niche: string; systemPrompt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClient, setFilterClient] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [zippingId, setZippingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regenStatus, setRegenStatus] = useState('');
  const [addVersionModal, setAddVersionModal] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getHistory(), getClients()])
      .then(([hist, cls]) => {
        setHistory(hist);
        setClients(cls);
      })
      .catch(err => console.error('Failed to load history/clients:', err))
      .finally(() => setLoading(false));
  }, []);

  async function handleDeleteEntry(id: string) {
    try {
      await deleteHistoryEntry(id);
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    setDeleteConfirm(null);
    if (expandedId === id) setExpandedId(null);
  }

  function getClientPrompt(clientName: string): string {
    const client = clients.find(c => c.name === clientName);
    if (!client) throw new Error(`Client "${clientName}" not found. Please ensure the client still exists in Clients.`);
    return client.systemPrompt || `You are creating content for ${client.name}, a ${client.niche} business.`;
  }

  async function handleRegenerate(entry: GenerationHistoryEntry, mode: 'missing' | 'all') {
    let clientSystemPrompt: string;
    try { clientSystemPrompt = getClientPrompt(entry.clientName); }
    catch (err) { alert(err instanceof Error ? err.message : 'Client not found'); return; }

    setRegeneratingId(entry.id);
    const updatedEntry = { ...entry };

    const needPart1 = mode === 'all' || PART1_KEYS.some(k => !entry[k]);
    const needPart2 = mode === 'all' || PART2_KEYS.some(k => !entry[k]);

    try {
      if (needPart1) {
        setRegenStatus('Regenerating Part 1 of 2... (Blog, WordPress, Blogger, Tumblr)');
        const part1 = await callClaudeAPI({ contentType: entry.type, keyword: entry.keyword, clientSystemPrompt, blogPart: 1 });
        if (mode === 'all' || !updatedEntry.blog)    updatedEntry.blog    = part1.blog    ?? updatedEntry.blog;
        if (mode === 'all' || !updatedEntry.web20_1) updatedEntry.web20_1 = part1.web20_1 ?? updatedEntry.web20_1;
        if (mode === 'all' || !updatedEntry.web20_2) updatedEntry.web20_2 = part1.web20_2 ?? updatedEntry.web20_2;
        if (mode === 'all' || !updatedEntry.web20_3) updatedEntry.web20_3 = part1.web20_3 ?? updatedEntry.web20_3;
      }
      if (needPart2) {
        setRegenStatus('Regenerating Part 2 of 2... (Medium, Weebly, Wix, Drive, GBP)');
        const part2 = await callClaudeAPI({ contentType: entry.type, keyword: entry.keyword, clientSystemPrompt, blogPart: 2 });
        if (mode === 'all' || !updatedEntry.web20_4) updatedEntry.web20_4 = part2.web20_4 ?? updatedEntry.web20_4;
        if (mode === 'all' || !updatedEntry.web20_5) updatedEntry.web20_5 = part2.web20_5 ?? updatedEntry.web20_5;
        if (mode === 'all' || !updatedEntry.web20_6) updatedEntry.web20_6 = part2.web20_6 ?? updatedEntry.web20_6;
        if (mode === 'all' || !updatedEntry.drive)   updatedEntry.drive   = part2.drive   ?? updatedEntry.drive;
        if (mode === 'all' || !updatedEntry.gbp)     updatedEntry.gbp     = part2.gbp     ?? updatedEntry.gbp;
      }
      updatedEntry.generatedAt = new Date().toISOString();
      await updateHistoryEntry(entry.id, updatedEntry);
      setHistory(prev => prev.map(h => h.id === entry.id ? updatedEntry : h));
    } catch (err) {
      alert(`Regeneration failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRegeneratingId(null);
      setRegenStatus('');
    }
  }

  async function handleAddVersion(entry: GenerationHistoryEntry, versionKey: keyof GenerationHistoryEntry) {
    let clientSystemPrompt: string;
    try { clientSystemPrompt = getClientPrompt(entry.clientName); }
    catch (err) { alert(err instanceof Error ? err.message : 'Client not found'); return; }

    const versionInfo = ALL_BLOG_VERSIONS.find(v => v.key === versionKey);
    if (!versionInfo) return;

    setRegeneratingId(entry.id);
    setRegenStatus(`Generating ${versionInfo.label}...`);

    try {
      const data = await callClaudeAPI({ contentType: entry.type, keyword: entry.keyword, clientSystemPrompt, blogPart: versionInfo.part });
      const updatedEntry = { ...entry };
      if (versionKey === 'blog'    && data.blog)    updatedEntry.blog    = data.blog;
      if (versionKey === 'web20_1' && data.web20_1) updatedEntry.web20_1 = data.web20_1;
      if (versionKey === 'web20_2' && data.web20_2) updatedEntry.web20_2 = data.web20_2;
      if (versionKey === 'web20_3' && data.web20_3) updatedEntry.web20_3 = data.web20_3;
      if (versionKey === 'web20_4' && data.web20_4) updatedEntry.web20_4 = data.web20_4;
      if (versionKey === 'web20_5' && data.web20_5) updatedEntry.web20_5 = data.web20_5;
      if (versionKey === 'web20_6' && data.web20_6) updatedEntry.web20_6 = data.web20_6;
      if (versionKey === 'drive'   && data.drive)   updatedEntry.drive   = data.drive;
      if (versionKey === 'gbp'     && data.gbp)     updatedEntry.gbp     = data.gbp;
      await updateHistoryEntry(entry.id, updatedEntry);
      setHistory(prev => prev.map(h => h.id === entry.id ? updatedEntry : h));
    } catch (err) {
      alert(`Failed to generate ${versionInfo.label}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRegeneratingId(null);
      setRegenStatus('');
    }
  }

  const canEdit = user.role === 'admin' || user.role === 'editor';
  const uniqueClients = Array.from(new Set(history.map(h => h.clientName))).sort();
  const filtered = history.filter(h => !filterClient || h.clientName === filterClient);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No generation history yet</h3>
        <p className="text-sm text-gray-400">Every time you generate content it will appear here with re-download options.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All clients</option>
          {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="flex items-center text-xs text-gray-400">{filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}</span>
      </div>

      {/* Add Version modal */}
      {addVersionModal && (() => {
        const entry = history.find(h => h.id === addVersionModal);
        if (!entry) return null;
        return (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h2 className="font-semibold text-gray-900 mb-1">Add / Regenerate a Version</h2>
              <p className="text-sm text-gray-500 mb-4">
                Keyword: <strong>{entry.keyword}</strong>
                <br /><span className="text-xs">Click a version to generate it. Existing versions (✓) will be regenerated fresh.</span>
              </p>
              {regeneratingId === entry.id ? (
                <div className="text-center py-6">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-200 rounded-full mx-auto mb-3" style={{ borderTopColor: '#1B3A6B' }} />
                  <p className="text-sm text-gray-600">{regenStatus}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {ALL_BLOG_VERSIONS.map(v => {
                    const exists = !!entry[v.key];
                    return (
                      <button
                        key={v.key as string}
                        onClick={() => handleAddVersion(entry, v.key)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all text-left ${
                          exists
                            ? 'border-green-200 bg-green-50 text-green-700 hover:border-green-400'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {exists ? '✓ ' : '+ '}{v.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                onClick={() => setAddVersionModal(null)}
                disabled={regeneratingId === entry.id}
                className="mt-4 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}

      <div className="space-y-3">
        {filtered.map(entry => {
          const versions = getVersionsFromContent(entry);
          const date = formatDate(entry.generatedAt);
          const isExpanded = expandedId === entry.id;
          const totalExpected = entry.type === 'blog-package' ? 9 : 1;
          const hasMissingVersions = entry.type === 'blog-package' && versions.length < 9;
          const isRegenerating = regeneratingId === entry.id;

          return (
            <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <span className="text-gray-400 text-xs">{isExpanded ? '▼' : '▶'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm truncate">{entry.keyword}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ background: '#1B3A6B' }}>
                        {CONTENT_TYPE_LABELS[entry.type] ?? entry.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        hasMissingVersions ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {versions.length}{entry.type === 'blog-package' ? `/${totalExpected}` : ''} files{hasMissingVersions ? ' ⚠️' : ''}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{entry.clientName} · {date}</div>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      setZippingId(entry.id);
                      try { await downloadAllAsZip(versions, entry.keyword, entry.clientName, date); }
                      catch (e) { alert('ZIP failed: ' + (e instanceof Error ? e.message : 'error')); }
                      finally { setZippingId(null); }
                    }}
                    disabled={zippingId === entry.id || versions.length === 0}
                    className="text-xs px-3 py-1.5 rounded-lg text-white font-medium disabled:opacity-50"
                    style={{ background: '#C9A84C' }}
                  >
                    {zippingId === entry.id ? '...' : '⬇ ZIP'}
                  </button>

                  {canEdit && (
                    deleteConfirm === entry.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDeleteEntry(entry.id)} className="text-xs px-2 py-1 rounded bg-red-500 text-white">Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(entry.id)} className="text-xs text-red-400 hover:text-red-600 px-1">×</button>
                    )
                  )}
                </div>
              </div>

              {isExpanded && (
                <>
                  {versions.length > 0 && (
                    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                      <p className="text-xs text-gray-500 font-medium mb-2">Download individual files:</p>
                      <div className="flex flex-wrap gap-2">
                        {versions.map(v => (
                          <button
                            key={v.key}
                            onClick={async () => {
                              try {
                                await triggerDocxDownload(
                                  v.content,
                                  { clientName: entry.clientName, keyword: entry.keyword, version: v.label, date },
                                  v.fileSlug,
                                );
                              } catch (e) { alert('Download failed: ' + (e instanceof Error ? e.message : 'error')); }
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                          >
                            ⬇ {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.type === 'blog-package' && canEdit && (
                    <div className="border-t border-yellow-100 px-4 py-3 bg-yellow-50">
                      {isRegenerating ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-200 rounded-full shrink-0" style={{ borderTopColor: '#1B3A6B' }} />
                          {regenStatus}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium mr-1">Recovery:</span>
                          {hasMissingVersions && (
                            <button
                              onClick={() => handleRegenerate(entry, 'missing')}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                              style={{ background: '#1B3A6B' }}
                            >
                              ↻ Regenerate Missing ({9 - versions.length})
                            </button>
                          )}
                          <button
                            onClick={() => handleRegenerate(entry, 'all')}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                          >
                            ↺ Regenerate All 9
                          </button>
                          <button
                            onClick={() => setAddVersionModal(entry.id)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                          >
                            + Add Version
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Folders Tab ──────────────────────────────────────────────────────────────

function FoldersTab({ user }: { user: User }) {
  const [folders, setFolders] = useState<ReportFolder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ month: '', clientName: '', topic: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getFolders(), getClients()])
      .then(([flds, cls]) => {
        setFolders(flds);
        setClients(cls);
      })
      .catch(err => console.error('Failed to load folders/clients:', err))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const newFolder = await createFolder({
        month: form.month,
        clientName: form.clientName,
        topic: form.topic,
      });
      setFolders(prev => [newFolder, ...prev]);
      setShowForm(false);
      setForm({ month: '', clientName: '', topic: '' });
    } catch (err) {
      alert('Failed to create folder: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteFolder(id: string) {
    try {
      await deleteFolder(id);
      setFolders(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      alert('Failed to delete folder: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    setDeleteConfirm(null);
  }

  const canEdit = user.role === 'admin' || user.role === 'editor';

  const filtered = folders.filter(f => {
    if (filterClient && !f.clientName.toLowerCase().includes(filterClient.toLowerCase())) return false;
    if (filterMonth && f.month !== filterMonth) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{loading ? '...' : `${folders.length} folder${folders.length !== 1 ? 's' : ''}`}</span>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg text-white font-medium text-sm" style={{ background: '#1B3A6B' }}>
            + New Folder
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-gray-900 mb-4">Create Report Folder</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                  <option value="">Select month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  list="clients-datalist" required placeholder="Client name" />
                <datalist id="clients-datalist">
                  {clients.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Service</label>
                <input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required placeholder="e.g. Acne Treatment Blog Posts" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60" style={{ background: '#1B3A6B' }}>
                  {saving ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg text-gray-600 text-sm border border-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {folders.length > 0 && (
        <div className="flex gap-3 mb-4">
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All months</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input value={filterClient} onChange={e => setFilterClient(e.target.value)}
            placeholder="Filter by client..." className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading folders...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {folders.length === 0 ? 'No report folders yet' : 'No folders match filters'}
          </h3>
          {folders.length === 0 && canEdit && (
            <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-lg text-white font-medium text-sm mt-2" style={{ background: '#1B3A6B' }}>
              + Create First Folder
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(folder => (
            <div key={folder.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">📁</div>
                {canEdit && (
                  deleteConfirm === folder.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDeleteFolder(folder.id)} className="text-xs px-2 py-1 rounded bg-red-500 text-white">Delete</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(folder.id)} className="text-xs text-red-400 hover:text-red-600">×</button>
                  )
                )}
              </div>
              <div className="font-medium text-gray-900 text-sm truncate">{folder.topic}</div>
              <div className="text-xs text-gray-500 mt-1">{folder.clientName}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: '#C9A84C' }}>{folder.month}</span>
              </div>
              <div className="text-xs text-gray-400 mt-2">{formatDate(folder.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Reports Page ────────────────────────────────────────────────────────

export default function ReportsManager({ user }: ReportsManagerProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'folders'>('history');

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Generation history and report folders</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {([
          { id: 'history', label: '📋 History' },
          { id: 'folders', label: '📁 Folders' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-current'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === tab.id ? { color: '#1B3A6B', borderColor: '#1B3A6B' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'history' && <HistoryTab user={user} />}
      {activeTab === 'folders' && <FoldersTab user={user} />}
    </div>
  );
}
