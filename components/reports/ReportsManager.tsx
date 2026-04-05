'use client';
import { useState, useEffect } from 'react';
import { ReportFolder, User } from '@/types';
import { generateId, formatDate } from '@/lib/utils';

interface ReportsManagerProps {
  user: User;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ReportsManager({ user }: ReportsManagerProps) {
  const [folders, setFolders] = useState<ReportFolder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ month: '', clientName: '', topic: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    const storedFolders = localStorage.getItem('im-report-folders');
    if (storedFolders) setFolders(JSON.parse(storedFolders));
    const storedClients = localStorage.getItem('im-clients');
    if (storedClients) setClients(JSON.parse(storedClients));
  }, []);

  function saveFolders(updated: ReportFolder[]) {
    setFolders(updated);
    localStorage.setItem('im-report-folders', JSON.stringify(updated));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const newFolder: ReportFolder = {
      id: generateId(),
      month: form.month,
      clientName: form.clientName,
      topic: form.topic,
      createdAt: new Date().toISOString(),
    };
    saveFolders([...folders, newFolder]);
    setShowForm(false);
    setForm({ month: '', clientName: '', topic: '' });
  }

  function handleDelete(id: string) {
    saveFolders(folders.filter(f => f.id !== id));
    setDeleteConfirm(null);
  }

  const canEdit = user.role === 'admin' || user.role === 'editor';

  const filtered = folders.filter(f => {
    if (filterClient && !f.clientName.toLowerCase().includes(filterClient.toLowerCase())) return false;
    if (filterMonth && f.month !== filterMonth) return false;
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">{folders.length} folder{folders.length !== 1 ? 's' : ''}</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-lg text-white font-medium text-sm"
            style={{ background: '#1B3A6B' }}
          >
            + New Folder
          </button>
        )}
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-gray-900 mb-4">Create Report Folder</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={form.month}
                  onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                >
                  <option value="">Select month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input
                  value={form.clientName}
                  onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  list="clients-datalist"
                  required
                  placeholder="Client name"
                />
                <datalist id="clients-datalist">
                  {clients.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Service</label>
                <input
                  value={form.topic}
                  onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                  placeholder="e.g. Acne Treatment Blog Posts"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="px-5 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#1B3A6B' }}>Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg text-gray-600 text-sm border border-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      {folders.length > 0 && (
        <div className="flex gap-3 mb-4">
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All months</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            placeholder="Filter by client..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      )}

      {/* Folders grid */}
      {filtered.length === 0 ? (
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
                      <button onClick={() => handleDelete(folder.id)} className="text-xs px-2 py-1 rounded bg-red-500 text-white">Delete</button>
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
