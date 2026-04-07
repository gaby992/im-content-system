'use client';
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { TEAM_CREDENTIALS } from '@/lib/constants';
import { getApiKey, saveApiKey } from '@/lib/api';

interface SettingsClientProps {
  user: User;
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  void user;

  useEffect(() => {
    getApiKey()
      .then(key => setApiKey(key || ''))
      .catch(err => console.error('Failed to load API key:', err))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await saveApiKey(apiKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save API key: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Admin configuration</p>
      </div>

      {/* API Key */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">Claude API Key</h2>
        <p className="text-sm text-gray-500 mb-4">Required for content generation. Stored securely in the database.</p>

        {loading ? (
          <div className="text-sm text-gray-400">Loading...</div>
        ) : (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                  placeholder="sk-ant-api..."
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-60"
                style={{ background: saved ? '#16a34a' : '#1B3A6B' }}
              >
                {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save'}
              </button>
            </div>

            {apiKey && (
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-600">API key configured</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Team credentials */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Team Access</h2>
        <p className="text-sm text-gray-500 mb-4">Read-only. Edit in code to change credentials.</p>

        <div className="divide-y divide-gray-100">
          {TEAM_CREDENTIALS.map(cred => (
            <div key={cred.username} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#1B3A6B' }}>
                  {cred.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{cred.username}</div>
                  <div className="text-xs text-gray-400">Password: {cred.hint}</div>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                cred.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                cred.role === 'Editor' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {cred.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
