'use client';
import { useState, useEffect } from 'react';
import { Client, ContentType, GeneratedContent, ContentVersion } from '@/types';
import { slugify, formatDate } from '@/lib/utils';
import { generateDocxBlob } from '@/lib/docx-generator';

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

function getVersions(result: GeneratedContent): ContentVersion[] {
  if (result.type === 'blog-package') {
    const versions: ContentVersion[] = [];
    if (result.blog)    versions.push({ key: 'blog',    label: 'Blog Post',        content: result.blog,    fileSlug: 'BLOG' });
    if (result.web20_1) versions.push({ key: 'web20_1', label: 'WordPress',         content: result.web20_1, fileSlug: 'WORDPRESS' });
    if (result.web20_2) versions.push({ key: 'web20_2', label: 'Blogger',           content: result.web20_2, fileSlug: 'BLOGGER' });
    if (result.web20_3) versions.push({ key: 'web20_3', label: 'Tumblr',            content: result.web20_3, fileSlug: 'TUMBLR' });
    if (result.web20_4) versions.push({ key: 'web20_4', label: 'Medium',            content: result.web20_4, fileSlug: 'MEDIUM' });
    if (result.web20_5) versions.push({ key: 'web20_5', label: 'Weebly',            content: result.web20_5, fileSlug: 'WEEBLY' });
    if (result.web20_6) versions.push({ key: 'web20_6', label: 'Wix Blog',          content: result.web20_6, fileSlug: 'WIX' });
    if (result.drive)   versions.push({ key: 'drive',   label: 'Google Drive',      content: result.drive,   fileSlug: 'DRIVE' });
    if (result.gbp)     versions.push({ key: 'gbp',     label: 'GBP Website Post',  content: result.gbp,     fileSlug: 'GBP-WEBSITE' });
    return versions;
  }
  if (result.type === 'landing-page' && result.landingPage) {
    return [{ key: 'landing', label: 'Landing Page', content: result.landingPage, fileSlug: 'LANDING' }];
  }
  if (result.type === 'location-page' && result.locationPage) {
    return [{ key: 'location', label: 'Location Page', content: result.locationPage, fileSlug: 'LOCATION' }];
  }
  return [];
}

async function triggerDocxDownload(
  content: string,
  metadata: { clientName: string; keyword: string; version: string; date: string },
  fileSlug: string
) {
  const slug = slugify(metadata.keyword);
  const filename = `${slug}_${fileSlug}.docx`;
  const blob = await generateDocxBlob(content, metadata);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadAllAsZip(versions: ContentVersion[], keyword: string, clientName: string, date: string) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const slug = slugify(keyword);

  for (const v of versions) {
    const metadata = { clientName, keyword, version: v.label, date };
    const blob = await generateDocxBlob(v.content, metadata);
    const arrayBuffer = await blob.arrayBuffer();
    zip.file(`${slug}_${v.fileSlug}.docx`, arrayBuffer);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}_package.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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

  void user;

  useEffect(() => {
    const stored = localStorage.getItem('im-clients');
    if (stored) setClients(JSON.parse(stored));
  }, []);

  function addKeyword() { setKeywords(prev => [...prev, '']); }
  function updateKeyword(idx: number, value: string) { setKeywords(prev => prev.map((k, i) => i === idx ? value : k)); }
  function removeKeyword(idx: number) { if (keywords.length > 1) setKeywords(prev => prev.filter((_, i) => i !== idx)); }

  async function handleGenerate() {
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

    for (const keyword of validKeywords) {
      try {
        const result: GeneratedContent = {
          keyword,
          type: contentType,
          clientName: selectedClient.name,
          generatedAt: new Date().toISOString(),
        };

        if (contentType === 'blog-package') {
          // Split into two API calls to stay within the model's 8192 output token limit
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
          if (contentType === 'landing-page') result.landingPage = data.content;
          if (contentType === 'location-page') result.locationPage = data.content;
        }

        newResults.push(result);
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
              {keywords.map((kw, idx) => (
                <div key={idx} className="flex gap-2">
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
              ))}
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
              {/* Keyword tabs */}
              {results.length > 1 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveKeywordTab(i)}
                      className="px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                      style={activeKeywordTab === i ? { background: '#1B3A6B', color: 'white', borderColor: '#1B3A6B' } : { borderColor: '#e5e7eb', color: '#374151' }}
                    >
                      {r.keyword}
                    </button>
                  ))}
                </div>
              )}

              {/* Error messages */}
              {Object.entries(errors).map(([kw, err]) => (
                <div key={kw} className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <strong>{kw}:</strong> {err}
                </div>
              ))}

              {/* Result for active keyword */}
              {results[activeKeywordTab] && (() => {
                const result = results[activeKeywordTab];
                const versions = getVersions(result);
                const activeVersion = activeVersionTab[activeKeywordTab] ?? 0;
                const currentVersion = versions[activeVersion];
                const date = formatDate(result.generatedAt);
                const metadata = { clientName: result.clientName, keyword: result.keyword, version: currentVersion?.label ?? '', date };

                return (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-semibold text-gray-900">{result.keyword}</h3>
                        <p className="text-xs text-gray-400">{result.clientName} • {date} • {versions.length} files ready</p>
                      </div>
                      {versions.length > 0 && (
                        <button
                          onClick={async () => {
                            setZipping(true);
                            try {
                              await downloadAllAsZip(versions, result.keyword, result.clientName, date);
                            } catch (e) {
                              alert('ZIP download failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
                            } finally {
                              setZipping(false);
                            }
                          }}
                          disabled={zipping}
                          className="px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-60"
                          style={{ background: '#C9A84C' }}
                        >
                          {zipping ? 'Building ZIP...' : `⬇ Download All ${versions.length} .docx ZIP`}
                        </button>
                      )}
                    </div>

                    {/* Version tabs */}
                    {versions.length > 1 && (
                      <div className="flex gap-1 p-3 border-b border-gray-100 overflow-x-auto">
                        {versions.map((v, vi) => (
                          <button
                            key={v.key}
                            onClick={() => setActiveVersionTab(prev => ({ ...prev, [activeKeywordTab]: vi }))}
                            className="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all"
                            style={activeVersion === vi ? { background: '#1B3A6B', color: 'white' } : { background: '#f3f4f6', color: '#6b7280' }}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Content viewer + individual download */}
                    {currentVersion && (
                      <div>
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs text-gray-500 font-medium">{currentVersion.label}</span>
                          <button
                            onClick={async () => {
                              try {
                                await triggerDocxDownload(
                                  currentVersion.content,
                                  { ...metadata, version: currentVersion.label },
                                  currentVersion.fileSlug,
                                );
                              } catch (e) {
                                alert('Download failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
                              }
                            }}
                            className="text-xs px-3 py-1 rounded text-white"
                            style={{ background: '#1B3A6B' }}
                          >
                            ⬇ Download .docx
                          </button>
                        </div>
                        <div
                          className="p-6 prose max-w-none text-sm leading-relaxed overflow-y-auto"
                          style={{ maxHeight: '600px' }}
                          dangerouslySetInnerHTML={{ __html: currentVersion.content }}
                        />
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
