'use client';
import { useState, useEffect } from 'react';
import { Client, User } from '@/types';
import { generateId, generateSystemPromptFromClient } from '@/lib/utils';

interface ClientsManagerProps {
  user: User;
}

const emptyClient = {
  name: '',
  website: '',
  niche: '',
  locations: '',
  services: '',
  targetAudience: '',
  toneNotes: '',
  specialRules: '',
  systemPrompt: '',
};

export default function ClientsManager({ user }: ClientsManagerProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('im-clients');
    if (stored) setClients(JSON.parse(stored));
  }, []);

  function saveClients(updated: Client[]) {
    setClients(updated);
    localStorage.setItem('im-clients', JSON.stringify(updated));
  }

  function handleNew() {
    setForm(emptyClient);
    setEditingClient(null);
    setShowForm(true);
  }

  function handleEdit(client: Client) {
    setForm({
      name: client.name,
      website: client.website,
      niche: client.niche,
      locations: client.locations,
      services: client.services,
      targetAudience: client.targetAudience,
      toneNotes: client.toneNotes,
      specialRules: client.specialRules,
      systemPrompt: client.systemPrompt,
    });
    setEditingClient(client);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    const updated = clients.filter(c => c.id !== id);
    saveClients(updated);
    setDeleteConfirm(null);
  }

  function handleAutoGenerate() {
    const prompt = generateSystemPromptFromClient(form);
    setForm(prev => ({ ...prev, systemPrompt: prompt }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingClient) {
      const updated = clients.map(c =>
        c.id === editingClient.id ? { ...editingClient, ...form } : c
      );
      saveClients(updated);
    } else {
      const newClient: Client = {
        id: generateId(),
        ...form,
        createdAt: new Date().toISOString(),
      };
      saveClients([...clients, newClient]);
    }
    setShowForm(false);
    setEditingClient(null);
    setForm(emptyClient);
  }

  const canEdit = user.role === 'admin' || user.role === 'editor';

  if (showForm) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => { setShowForm(false); setEditingClient(null); }}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {editingClient ? 'Edit Client' : 'New Client'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                value={form.website}
                onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niche / Industry *</label>
              <input
                value={form.niche}
                onChange={e => setForm(p => ({ ...p, niche: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Locations <span className="text-gray-400 font-normal">(comma separated)</span></label>
              <input
                value={form.locations}
                onChange={e => setForm(p => ({ ...p, locations: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Miami, FL; Fort Lauderdale, FL"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
            <input
              value={form.services}
              onChange={e => setForm(p => ({ ...p, services: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acne treatment, Botox, Chemical peels..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <input
              value={form.targetAudience}
              onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adults 25-55 dealing with skin concerns..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tone Notes</label>
            <textarea
              value={form.toneNotes}
              onChange={e => setForm(p => ({ ...p, toneNotes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Warm, empathetic, direct. Not overly clinical."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Rules</label>
            <textarea
              value={form.specialRules}
              onChange={e => setForm(p => ({ ...p, specialRules: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Never mention competitor names. Always mention free consultations..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">System Prompt</label>
              <button
                type="button"
                onClick={handleAutoGenerate}
                className="text-xs px-3 py-1 rounded-lg text-white font-medium"
                style={{ background: '#C9A84C' }}
              >
                Auto-Generate
              </button>
            </div>
            <textarea
              value={form.systemPrompt}
              onChange={e => setForm(p => ({ ...p, systemPrompt: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              rows={6}
              placeholder="Click Auto-Generate to build from the fields above, or write manually..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg text-white font-medium text-sm"
              style={{ background: '#1B3A6B' }}
            >
              {editingClient ? 'Save Changes' : 'Create Client'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingClient(null); }}
              className="px-6 py-2.5 rounded-lg text-gray-600 font-medium text-sm border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        {canEdit && (
          <button
            onClick={handleNew}
            className="px-5 py-2.5 rounded-lg text-white font-medium text-sm"
            style={{ background: '#1B3A6B' }}
          >
            + Add Client
          </button>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
          <p className="text-gray-500 mb-4">Add your first client to get started</p>
          {canEdit && (
            <button
              onClick={handleNew}
              className="px-5 py-2.5 rounded-lg text-white font-medium text-sm"
              style={{ background: '#1B3A6B' }}
            >
              + Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.niche}</p>
                </div>
                <div className="flex gap-2">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-xs px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      {deleteConfirm === client.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="text-xs px-2 py-1 rounded bg-red-500 text-white"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(client.id)}
                          className="text-xs px-2.5 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {client.website && (
                <p className="text-xs text-blue-600 mb-2 truncate">{client.website}</p>
              )}
              {client.locations && (
                <p className="text-xs text-gray-400">📍 {client.locations}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
