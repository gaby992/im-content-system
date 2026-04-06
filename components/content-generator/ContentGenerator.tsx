'use client';
import { useState, useEffect } from 'react';
import { Client, ContentType, GeneratedContent, GenerationHistoryEntry } from '@/types';
import { slugify, formatDate, generateId, getVersionsFromContent } from '@/lib/utils';
import { triggerDocxDownload, downloadAllAsZip } from '@/lib/docx-generator';

interface ContentGeneratorProps {
  user: { username: string; role: string };
}

const CONTENT_TYPES = [
  {
    id: 'blog-package' as ContentType,
    label: 'Blog Post Package',
    description: 'Blog (1500-2000w) + WordPress, Blogger, Tumblr, Medium, Weebly, Wix Blog (each 1000w) + Google Drive (750w) + GBP Website Post (300w) — all as .docx',
    icon: '📝',
  },
  {
    id: 'landing-page' as ContentType,
    label: 'Landing Page',
    description: 'Full landing page with proper conversion structure',
    icon: '🏠',
  },
  {
    id: 'location-page' as ContentType,
    label: 'Location Page',
    description: 'Geo-targeted location service page',
    icon: '📍',
  },
];

async function callClaudeAPI(payload: {
  apiKey: string;
  contentType: ContentType;
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

export default function ContentGenerator({ user }: ContentGeneratorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [contentType, setContentType] = useState<ContentType>('blog-package');
  const [keywords, setKeywords] = useState<string[]>(['']);
  const [results, setResults] = useState<GeneratedContent[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeKeywordTab, setActiveKeywordTab] = useState(0);
  const [activeVersionTab, setActiveVersionTab] = useState<Record<number, number>>({});
  const [step, setStep] = useState(1);
  const [zipping, setZipping] = useState(false);
  const [history, setHistory] = useState<GenerationHistoryEntry[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<{ keyword: string; date: string }[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  void user;

  useEffect(() => {
    const stored = localStorage.getItem('im-clients');
    if (stored) setClients(JSON.parse(stored));
    const hist = localStorage.getItem('im-generation-history');
    if (hist) setHistory(JSON.parse(hist));
  }, []);

  function findHistoryEntry(keyword: string, clientName: string): GenerationHistoryEntry | undefined {
    return history.find(
      h => h.clientName === clientName && h.keyword.toLowerCase().trim() === keyword.toLowerCase().trim()
    );
  }

  function addKeyword() { setKeywords(prev => [...prev, '']); }
  function updateKeyword(idx: number, value: string) { setKeywords(prev => prev.map((k, i) => i === idx ? value : k)); }
  function removeKeyword(idx: number) { if (keywords.length > 1) setKeywords(prev => prev.filter((_, i) => i !== idx)); }

  async function handleGenerate() {
    if (!selectedClient) return;
    const validKeywords = keywords.filter(k => k.trim());
    if (validKeywords.length === 0) return;

    // Check for duplicates
    const dups = validKeywords
      .map(kw => ({ keyword: kw, entry: findHistoryEntry(kw, selectedClient.name) }))
      .filter((d): d is { keyword: string; entry: GenerationHistoryEntry } => !!d.entry)
      .map(d => ({ keyword: d.keyword, date: formatDate(d.entry.generatedAt) }));

    if (dups.length > 0) {
      setDuplicateWarning(dups);
      setShowDuplicateModal(true);
      return;
    }

    await doGenerate();
  }

  async function doGenerate() {
    setShowDuplicateModal(false);
    setDuplicateWarning([]);

    if (!selectedClient) return;
    const apiKey = localStorage.getItem('im-api-key') || '';
    if (!apiKey) { alert('Please add your Claude API key in Settings first.'); return; }

    const validKeywords = keywords.filter(k => k.trim());
    if (validKeywords.length === 0) return;

    setGenerating(true);
    setResults([]);
    setErrors({});
    setStep(4);

    const newResults: GeneratedContent[] = [];
    const newErrors: Record<string, string> = {};
    const clientSystemPrompt = selectedClient.systemPrompt || `You are creating content for ${selectedClient.name}, a ${selectedClient.niche} business.`;

    let updatedHistory = [...history];

    for (const keyword of validKeywords) {
      try {
        const result: GeneratedContent = {
          keyword,
          type: contentType,
          clientName: selectedClient.name,
          generatedAt: new Date().toISOString(),
        };

        if (contentType === 'blog-package') {
          setGeneratingStatus(`Generating "${keyword}" — Part 1 of 2 (Blog + WordPress + Blogger + Tumblr)...`);
          const part1 = await callClaudeAPI({ apiKey, contentType, keyword, clientSystemPrompt, blogPart: 1 });
          result.blog    = part1.blog;
          result.web20_1 = part1.web20_1;
          result.web20_2 = part1.web20_2;
          result.web20_3 = part1.web20_3;

          setGeneratingStatus(`Generating "${keyword}" — Part 2 of 2 (Medium + Weebly + Wix + Drive + GBP)...`);
          const part2 = await callClaudeAPI({ apiKey, contentType, keyword, clientSystemPrompt, blogPart: 2 });
          result.web20_4 = part2.web20_4;
          result.web20_5 = part2.web20_5;
          result.web20_6 = part2.web20_6;
          result.drive   = part2.drive;
          result.gbp     = part2.gbp;
        } else {
          setGeneratingStatus(`Generating "${keyword}"...`);
          const data = await callClaudeAPI({ apiKey, contentType, keyword, clientSystemPrompt });
          if (contentType === 'landing-page')  result.landingPage  = data.content;
          if (contentType === 'location-page') result.locationPage = data.content;
        }

        newResults.push(result);

        // Save / overwrite in history
        const entry: GenerationHistoryEntry = { id: generateId(), ...result };
        updatedHistory = [
          entry,
          ...updatedHistory.filter(
            h => !(h.clientName === result.clientName && h.keyword.toLowerCase() === result.keyword.toLowerCase())
          ),
        ];
        setHistory(updatedHistory);
        localStorage.setItem('im-generation-history', JSON.stringify(updatedHistory));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error. Please try again.';
        newErrors[keyword] = msg;
      }
    }

    setResults(newResults);
    setErrors(newErrors);
    setGenerating(false);
    setGeneratingStatus('');
    setActiveKeywordTab(0);
  }

  function resetForm() {
    setStep(1); setResults([]); setErrors({}); setKeywords(['']);
    setSelectedClient(null); setContentType('blog-package');
  }

  const steps = [
    { n: 1, label: 'Client' },
    { n: 2, label: 'Content Type' },
    { n: 3, label: 'Keywords' },
    { n: 4, label: 'Results' },
  ];

  return (
    <div className="p-8">
      {/* Duplicate keyword confirmation modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-gray-900 mb-3">⚠️ Already Generated</h2>
            <p className="text-sm text-gray-600 mb-3">
              The following {duplicateWarning.length === 1 ? 'keyword was' : 'keywords were'} already generated for <strong>{selectedClient?.name}</strong>:
            </p>
            <ul className="mb-4 space-y-1">
              {duplicateWarning.map(d => (
                <li key={d.keyword} className="text-sm bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                  <span className="font-medium">"{d.keyword}"</span>
                  <span className="text-gray-500"> — generated on {d.date}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-500 mb-4">Generate again? This will overwrite the existing history entries.</p>
            <div className="flex gap-3">
              <button
                onClick={doGenerate}
                className="px-5 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: '#1B3A6B' }}
              >
                Generate Anyway
              </button>
              <button
                onClick={() => { setShowDuplicateModal(false); setDuplicateWarning([]); }}
                className="px-5 py-2 rounded-lg text-gray-600 text-sm border border-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Generator</h1>
          <p className="text-gray-500 text-sm mt-1">Generate SEO content powered by Claude AI</p>
        </div>
        {step === 4 && !generating && (
          <button onClick={resetForm} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            ← New Generation
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              step === s.n ? 'text-white' : step > s.n ? 'text-green-700 bg-green-50' : 'text-gray-400'
            }`} style={step === s.n ? { background: '#1B3A6B' } : {}}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step > s.n ? 'bg-green-500 text-white' : step === s.n ? 'bg-white' : 'bg-gray-200 text-gray-500'
              }`} style={step === s.n ? { color: '#1B3A6B' } : {}}>
                {step > s.n ? '✓' : s.n}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && <div className="w-6 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Client */}
      {step === 1 && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Step 1: Select a Client</h2>
            {clients.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-2">No clients found.</p>
                <a href="/clients" className="underline text-sm" style={{ color: '#1B3A6B' }}>Add a client first →</a>
              </div>
            ) : (
              <div className="space-y-2">
                {clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => { setSelectedClient(client); setStep(2); }}
                    className="w-full text-left px-4 py-3 rounded-lg border-2 transition-all"
                    style={selectedClient?.id === client.id ? { borderColor: '#1B3A6B', background: '#f0f4ff' } : { borderColor: '#e5e7eb' }}
                  >
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.niche}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Content Type */}
      {step === 2 && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Step 2: Select Content Type</h2>
            <div className="space-y-3">
              {CONTENT_TYPES.map(ct => (
                <button
                  key={ct.id}
                  onClick={() => setContentType(ct.id)}
                  className="w-full text-left px-4 py-4 rounded-lg border-2 transition-all"
                  style={contentType === ct.id ? { borderColor: '#1B3A6B', background: '#f0f4ff' } : { borderColor: '#e5e7eb' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{ct.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{ct.label}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{ct.description}</div>
                    </div>
                    {contentType === ct.id && (
                      <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: '#1B3A6B' }}>✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">← Back</button>
              <button onClick={() => setStep(3)} className="px-5 py-2 text-sm text-white rounded-lg" style={{ background: '#1B3A6B' }}>Continue →</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Keywords */}
      {step === 3 && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Step 3: Add Keywords</h2>
            <p className="text-sm text-gray-500 mb-4">Each keyword generates a full {CONTENT_TYPES.find(ct => ct.id === contentType)?.label}.</p>
            <div className="space-y-2 mb-4">
              {keywords.map((kw, idx) => {
                const existing = selectedClient ? findHistoryEntry(kw.trim(), selectedClient.name) : undefined;
                return (
                  <div key={idx}>
                    <div className="flex gap-2">
                      <input
                        value={kw}
                        onChange={e => updateKeyword(idx, e.target.value)}
                        placeholder={`Keyword ${idx + 1}, e.g. "acne treatment Miami"`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {keywords.length > 1 && (
                        <button onClick={() => removeKeyword(idx)} className="px-2 py-2 text-red-400 hover:text-red-600">×</button>
                      )}
                    </div>
                    {existing && kw.trim() && (
                      <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mt-1">
                        ⚠️ Already generated on {formatDate(existing.generatedAt)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={addKeyword} className="text-sm mb-4 flex items-center gap-1 hover:underline" style={{ color: '#1B3A6B' }}>
              + Add another keyword
            </button>
            <div className="bg-gray-50 rounded-lg p-3 mb-5 text-xs text-gray-500">
              <strong>Client:</strong> {selectedClient?.name} &nbsp;•&nbsp; <strong>Type:</strong> {CONTENT_TYPES.find(ct => ct.id === contentType)?.label}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">← Back</button>
              <button
                onClick={handleGenerate}
                disabled={!keywords.some(k => k.trim())}
                className="px-6 py-2.5 text-sm text-white rounded-lg font-medium disabled:opacity-50"
                style={{ background: '#1B3A6B' }}
              >
                Generate Content ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && (
        <div>
          {generating && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-200 rounded-full mx-auto mb-4" style={{ borderTopColor: '#1B3A6B' }} />
              <p className="text-gray-700 font-medium text-sm">{generatingStatus}</p>
              <p className="text-gray-400 text-xs mt-2">Blog packages use 2 API calls to generate all 9 files.</p>
            </div>
          )}

          {!generating && (results.length > 0 || Object.keys(errors).length > 0) && (
            <div>
              {results.length > 1 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {results.map((r, i) => (
                    <button key={i} onClick={() => setActiveKeywordTab(i)}
                      className="px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                      style={activeKeywordTab === i ? { background: '#1B3A6B', color: 'white', borderColor: '#1B3A6B' } : { borderColor: '#e5e7eb', color: '#374151' }}>
                      {r.keyword}
                    </button>
                  ))}
                </div>
              )}

              {Object.entries(errors).map(([kw, err]) => (
                <div key={kw} className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <strong>{kw}:</strong> {err}
                </div>
              ))}

              {results[activeKeywordTab] && (() => {
                const result = results[activeKeywordTab];
                const versions = getVersionsFromContent(result);
                const activeVersion = activeVersionTab[activeKeywordTab] ?? 0;
                const currentVersion = versions[activeVersion];
                const date = formatDate(result.generatedAt);

                return (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-semibold text-gray-900">{result.keyword}</h3>
                        <p className="text-xs text-gray-400">{result.clientName} • {date} • {versions.length} files ready</p>
                      </div>
                      {versions.length > 0 && (
                        <button
                          onClick={async () => {
                            setZipping(true);
                            try { await downloadAllAsZip(versions, result.keyword, result.clientName, date); }
                            catch (e) { alert('ZIP download failed: ' + (e instanceof Error ? e.message : 'Unknown error')); }
                            finally { setZipping(false); }
                          }}
                          disabled={zipping}
                          className="px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-60"
                          style={{ background: '#C9A84C' }}
                        >
                          {zipping ? 'Building ZIP...' : `⬇ Download All ${versions.length} .docx ZIP`}
                        </button>
                      )}
                    </div>

                    {versions.length > 1 && (
                      <div className="flex gap-1 p-3 border-b border-gray-100 overflow-x-auto">
                        {versions.map((v, vi) => (
                          <button key={v.key}
                            onClick={() => setActiveVersionTab(prev => ({ ...prev, [activeKeywordTab]: vi }))}
                            className="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all"
                            style={activeVersion === vi ? { background: '#1B3A6B', color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}>
                            {v.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {currentVersion && (
                      <div>
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs text-gray-500 font-medium">{currentVersion.label}</span>
                          <button
                            onClick={async () => {
                              try {
                                await triggerDocxDownload(
                                  currentVersion.content,
                                  { clientName: result.clientName, keyword: result.keyword, version: currentVersion.label, date },
                                  currentVersion.fileSlug,
                                );
                              } catch (e) { alert('Download failed: ' + (e instanceof Error ? e.message : 'Unknown error')); }
                            }}
                            className="text-xs px-3 py-1 rounded text-white"
                            style={{ background: '#1B3A6B' }}>
                            ⬇ Download .docx
                          </button>
                        </div>
                        <div className="p-6 prose max-w-none text-sm leading-relaxed overflow-y-auto"
                          style={{ maxHeight: '600px' }}
                          dangerouslySetInnerHTML={{ __html: currentVersion.content }} />
                      </div>
                    )}

                    {versions.length === 0 && (
                      <div className="p-8 text-center text-gray-400">
                        <p>No content was parsed. The response may have had formatting issues.</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
