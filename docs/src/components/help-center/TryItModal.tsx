import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// HTTP method badge component
const METHOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GET:    { bg: '#22c55e1a', text: '#16a34a', border: '#22c55e40' },
  POST:   { bg: '#3b82f61a', text: '#2563eb', border: '#3b82f640' },
  PUT:    { bg: '#f59e0b1a', text: '#d97706', border: '#f59e0b40' },
  PATCH:  { bg: '#f973161a', text: '#ea580c', border: '#f9731640' },
  DELETE: { bg: '#ef44441a', text: '#dc2626', border: '#ef444440' },
};

function MethodBadge({ method, className }: { method: string; className?: string }) {
  const colors = METHOD_COLORS[method.toUpperCase()] || { bg: '#6b72801a', text: '#4b5563', border: '#6b728040' };
  return (
    <span
      className={cn('inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide font-mono shrink-0', className)}
      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
    >
      {method.toUpperCase()}
    </span>
  );
}

interface TryItModalProps {
  isOpen: boolean;
  onClose: () => void;
  method: string;
  path: string;
  baseUrl: string;
  primaryColor: string;
  isDark: boolean;
  description?: string;
  headingFont?: string | null;
  bodyFont?: string | null;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    location: 'header' | 'body' | 'query' | 'path';
  }>;
}

type Tab = 'auth';
type CodeTab = 'curl' | 'javascript';

export function TryItModal({
  isOpen, onClose, method, path, baseUrl, primaryColor, isDark, description, 
  headingFont, bodyFont, parameters = [],
}: TryItModalProps) {
  const [token, setToken] = useState('');
  const [bodyFields, setBodyFields] = useState<Record<string, any>>({});
  const [response, setResponse] = useState<{ status: number; data: any; time: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('auth');
  const [codeTab, setCodeTab] = useState<CodeTab>('curl');

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
  const bodyParams = parameters.filter(p => p.location === 'body');

  console.log('[TryItModal] Opened with:', {
    method,
    path,
    hasBody,
    totalParams: parameters.length,
    bodyParams: bodyParams.length,
    bodyParamNames: bodyParams.map(p => p.name)
  });

  // Update URL when modal opens/closes
  useEffect(() => {
    if (!isOpen) return;

    const url = new URL(window.location.href);
    url.searchParams.set('tryit', 'true');
    url.searchParams.set('method', method);
    url.searchParams.set('path', path);
    window.history.pushState({}, '', url.toString());

    return () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('tryit');
      url.searchParams.delete('method');
      url.searchParams.delete('path');
      window.history.pushState({}, '', url.toString());
    };
  }, [isOpen, method, path]);

  // Initialize body fields from parameters
  useEffect(() => {
    if (bodyParams.length > 0 && Object.keys(bodyFields).length === 0) {
      const initialFields: Record<string, any> = {};
      bodyParams.forEach(param => {
        initialFields[param.name] = '';
      });
      setBodyFields(initialFields);
    }
  }, [bodyParams, bodyFields]);

  // Update body field
  const updateBodyField = (name: string, value: any) => {
    setBodyFields(prev => ({ ...prev, [name]: value }));
  };

  // Convert body fields to JSON
  const getBodyJSON = () => {
    const cleanedBody: Record<string, any> = {};
    Object.entries(bodyFields).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        cleanedBody[key] = value;
      }
    });
    return Object.keys(cleanedBody).length > 0 ? JSON.stringify(cleanedBody, null, 2) : '';
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    const start = Date.now();
    try {
      // Construct URL: if baseUrl has a path, append our path; otherwise use baseUrl + path
      let url: string;
      try {
        const baseUrlObj = new URL(baseUrl);
        // If baseUrl already has a pathname (like /api/v1), append path to it
        const fullPath = baseUrlObj.pathname.replace(/\/$/, '') + path;
        url = `${baseUrlObj.origin}${fullPath}`;
      } catch {
        // Fallback if baseUrl is malformed
        url = `${baseUrl}${path}`;
      }
      
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (hasBody) headers['Content-Type'] = 'application/json';

      let bodyPayload: string | undefined;
      if (hasBody) {
        const bodyJSON = getBodyJSON();
        if (bodyJSON) {
          try { 
            JSON.parse(bodyJSON); 
            bodyPayload = bodyJSON; 
          } catch { 
            setError('Invalid JSON in request body'); 
            setLoading(false); 
            return; 
          }
        }
      }

      const res = await fetch(url, { method: method.toUpperCase(), headers, body: bodyPayload });
      const time = Date.now() - start;
      const ct = res.headers.get('content-type') || '';
      let data: any;
      try { data = ct.includes('json') ? await res.json() : await res.text(); }
      catch { data = await res.text(); }
      setResponse({ status: res.status, data, time });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, path, method, token, hasBody, getBodyJSON]);

  if (!isOpen) return null;

  // Construct full URL for display
  const fullUrl = (() => {
    try {
      const baseUrlObj = new URL(baseUrl);
      const fullPath = baseUrlObj.pathname.replace(/\/$/, '') + path;
      return `${baseUrlObj.origin}${fullPath}`;
    } catch {
      return `${baseUrl}${path}`;
    }
  })();

  const statusColor = response
    ? response.status < 300 ? '#22c55e' : response.status < 400 ? '#f59e0b' : '#ef4444'
    : null;

  const bodyJSON = getBodyJSON();
  const exampleBody = bodyJSON || (hasBody ? '{\n  "email": "user@example.com",\n  "password": "securepassword123"\n}' : '');

  const curlLines = [
    `curl -X ${method.toUpperCase()} "${fullUrl}" \\`,
    token ? `-H "Authorization: Bearer ${token}" \\` : `-H "Authorization: Bearer YOUR_API_KEY" \\`,
    hasBody ? `-H "Content-Type: application/json" \\` : null,
    hasBody ? `-d '${exampleBody}'` : null,
  ].filter(Boolean).join('\n');

  const jsCode = `const response = await fetch("${fullUrl}", {
  method: "${method.toUpperCase()}",
  headers: {
    "Authorization": "Bearer ${token || 'YOUR_API_KEY'}",${hasBody ? '\n    "Content-Type": "application/json",' : ''}
  },${hasBody ? `\n  body: JSON.stringify(${exampleBody})` : ''}
});

const data = await response.json();
console.log(data);`;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'auth', label: 'Request' },
  ];

  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const border = isDark ? 'border-zinc-800' : 'border-zinc-200';
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const monoFont = "'Geist Mono', Monaco, 'Courier New', monospace";
  
  // Input styles with primary color focus
  const inputCls = (focused?: boolean) => cn(
    'w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all',
    isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600'
      : 'bg-zinc-50 border-zinc-200 text-zinc-800 placeholder-zinc-400',
    'focus:ring-2 focus:ring-offset-0'
  );

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        fontFamily: bodyFont || undefined,
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative z-10 w-full sm:max-w-6xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden',
        'max-h-[92vh] sm:max-h-[90vh] min-h-[600px]',
        bg, `border ${border}`
      )}
        style={{ fontFamily: bodyFont || undefined }}
      >        {/* Header */}
        <div 
          className={cn('flex items-center gap-3 px-5 py-4 border-b shrink-0', border)}
          style={{ fontFamily: headingFont || undefined }}
        >
          <MethodBadge method={method} />
          <code className={cn('flex-1 text-sm truncate', isDark ? 'text-zinc-200' : 'text-zinc-700')} style={{ fontFamily: monoFont }}>
            {fullUrl}
          </code>
          <button
            onClick={handleSend}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-60 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M1.5 1.5l9 4.5-9 4.5V1.5z"/>
                </svg>
                Send
              </>
            )}
          </button>
        </div>

        {/* Content - Grid Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Form Inputs */}
          <div className="flex-1 overflow-auto p-5 space-y-4 border-r scrollbar-hide" style={{ borderColor: isDark ? '#27272a' : '#e4e4e7' }}>
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Endpoint description */}
            {description && (
              <div className={cn('p-3 rounded-xl border', border, isDark ? 'bg-zinc-900/50' : 'bg-zinc-50')}>
                <p className={cn('text-sm', isDark ? 'text-zinc-300' : 'text-zinc-600')}>{description}</p>
              </div>
            )}

            {/* Authorization section - Collapsible */}
            <details open className={cn('group rounded-xl border', border)}>
              <summary className={cn(
                'flex items-center justify-between px-4 py-3 cursor-pointer list-none',
                isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-zinc-50'
              )}>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-semibold', isDark ? 'text-zinc-200' : 'text-zinc-700')}>
                        Authorization
                      </span>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded', isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600')}>
                        required
                      </span>
                    </div>
                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className={cn('px-4 pb-4 pt-2 border-t', border)}>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className={cn('text-sm', isDark ? 'text-zinc-300' : 'text-zinc-700')} style={{ fontFamily: monoFont }}>
                              Authorization
                            </code>
                            <span className={cn('text-xs', muted)}>string-bearer</span>
                          </div>
                          <p className={cn('text-xs mb-2', muted)}>
                            Bearer authentication header of the form <code style={{ fontFamily: monoFont }}>Bearer &lt;token&gt;</code>, where <code style={{ fontFamily: monoFont }}>&lt;token&gt;</code> is your auth token.
                          </p>
                          <input
                            type="text"
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            placeholder="enter bearer token"
                            className={inputCls()}
                            autoComplete="off"
                            style={{ 
                              fontFamily: monoFont,
                              '--tw-ring-color': primaryColor,
                            } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </details>

            {/* Body section - Collapsible (show if hasBody, even if no params parsed) */}
            {hasBody && (
              <details open className={cn('group rounded-xl border', border)}>
                    <summary className={cn(
                      'flex items-center justify-between px-4 py-3 cursor-pointer list-none',
                      isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-zinc-50'
                    )}>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-semibold', isDark ? 'text-zinc-200' : 'text-zinc-700')}>
                          Body
                        </span>
                        <span className={cn('text-xs', muted)}>application/json</span>
                      </div>
                      <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className={cn('px-4 pb-4 pt-2 border-t', border)}>
                      {bodyParams.length > 0 ? (
                        <div className="space-y-4">
                          {bodyParams.map((param) => (
                            <div key={param.name}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <label className={cn('text-sm font-medium', isDark ? 'text-zinc-200' : 'text-zinc-700')}>
                                  {param.name}
                                </label>
                                <span className={cn('text-xs', muted)}>{param.type}</span>
                                {param.required && (
                                  <span className={cn('text-xs px-1.5 py-0.5 rounded', isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600')}>
                                    required
                                  </span>
                                )}
                              </div>
                              {param.description && (
                                <p className={cn('text-xs mb-2', muted)}>{param.description}</p>
                              )}
                              {param.type === 'object' ? (
                                <textarea
                                  value={typeof bodyFields[param.name] === 'object' ? JSON.stringify(bodyFields[param.name], null, 2) : bodyFields[param.name] || ''}
                                  onChange={(e) => {
                                    try {
                                      const parsed = JSON.parse(e.target.value);
                                      updateBodyField(param.name, parsed);
                                    } catch {
                                      updateBodyField(param.name, e.target.value);
                                    }
                                  }}
                                  placeholder={`Enter ${param.name} (JSON object)`}
                                  rows={4}
                                  spellCheck={false}
                                  className={cn(inputCls(), 'resize-none leading-relaxed')}
                                  style={{ 
                                    fontFamily: monoFont,
                                    '--tw-ring-color': primaryColor,
                                  } as React.CSSProperties}
                                />
                              ) : param.type === 'boolean' ? (
                                <select
                                  value={bodyFields[param.name] || ''}
                                  onChange={(e) => updateBodyField(param.name, e.target.value === 'true')}
                                  className={inputCls()}
                                  style={{ 
                                    fontFamily: bodyFont || undefined,
                                    '--tw-ring-color': primaryColor,
                                  } as React.CSSProperties}
                                >
                                  <option value="">Select...</option>
                                  <option value="true">true</option>
                                  <option value="false">false</option>
                                </select>
                              ) : param.type === 'number' || param.type === 'integer' ? (
                                <input
                                  type="number"
                                  value={bodyFields[param.name] || ''}
                                  onChange={(e) => updateBodyField(param.name, e.target.value ? Number(e.target.value) : '')}
                                  placeholder={`Enter ${param.name}`}
                                  className={inputCls()}
                                  autoComplete="off"
                                  style={{ 
                                    fontFamily: bodyFont || undefined,
                                    '--tw-ring-color': primaryColor,
                                  } as React.CSSProperties}
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={bodyFields[param.name] || ''}
                                  onChange={(e) => updateBodyField(param.name, e.target.value)}
                                  placeholder={`Enter ${param.name}`}
                                  className={inputCls()}
                                  autoComplete="off"
                                  style={{ 
                                    fontFamily: bodyFont || undefined,
                                    '--tw-ring-color': primaryColor,
                                  } as React.CSSProperties}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={cn('py-4', muted)}>
                          <p className="text-sm">No body parameters defined in OpenAPI spec</p>
                          <p className="text-xs mt-1">You can still send a raw JSON body in the code example</p>
                        </div>
                      )}
                    </div>
                  </details>
                )}
          </div>

          {/* Right Panel - Code Examples */}
          <div className="w-[480px] flex-shrink-0 overflow-auto p-5 space-y-4 scrollbar-hide" style={{ backgroundColor: isDark ? '#09090b' : '#fafafa' }}>
            {/* Code Group */}
            <div className={cn('rounded-xl border overflow-hidden', isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white')}>
              {/* Tabs */}
              <div className={cn('flex items-center border-b', isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50')}>
                <button
                  onClick={() => setCodeTab('curl')}
                  className={cn(
                    'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                    codeTab === 'curl'
                      ? isDark 
                        ? 'border-orange-500 text-orange-400 bg-zinc-900' 
                        : 'border-orange-500 text-orange-600 bg-white'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                  style={{ fontFamily: monoFont }}
                >
                  cURL
                </button>
                <button
                  onClick={() => setCodeTab('javascript')}
                  className={cn(
                    'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                    codeTab === 'javascript'
                      ? isDark 
                        ? 'border-orange-500 text-orange-400 bg-zinc-900' 
                        : 'border-orange-500 text-orange-600 bg-white'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                  style={{ fontFamily: monoFont }}
                >
                  JavaScript
                </button>
              </div>

              {/* Code */}
              <div className="relative">
                <pre className={cn(
                  'p-4 text-xs overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto',
                  isDark ? 'bg-zinc-950 text-zinc-300' : 'bg-zinc-50 text-zinc-700'
                )}
                  style={{ fontFamily: monoFont }}
                >
                  {codeTab === 'curl' ? curlLines : jsCode}
                </pre>
                <button
                  onClick={() => navigator.clipboard?.writeText(codeTab === 'curl' ? curlLines : jsCode)}
                  className={cn(
                    'absolute top-2 right-2 p-1.5 rounded-md transition-colors',
                    isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-600'
                  )}
                  title="Copy code"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Response Example (if available) */}
            {response && (
              <div className={cn('rounded-xl border overflow-hidden', isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white')}>
                {/* Response Header */}
                <div className={cn('flex items-center justify-between px-4 py-2.5 border-b', isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50')}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground" style={{ fontFamily: monoFont }}>
                      Success Response
                    </span>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{ color: statusColor!, background: `${statusColor}20` }}
                  >
                    {response.status} • {response.time}ms
                  </span>
                </div>

                {/* Response Body */}
                <div className="relative">
                  <pre className={cn(
                    'p-4 text-xs overflow-auto max-h-[400px] leading-relaxed',
                    isDark ? 'bg-zinc-950 text-zinc-300' : 'bg-zinc-50 text-zinc-700'
                  )}
                    style={{ fontFamily: monoFont }}
                  >
                    {typeof response.data === 'string'
                      ? response.data
                      : JSON.stringify(response.data, null, 2)}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard?.writeText(
                      typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
                    )}
                    className={cn(
                      'absolute top-2 right-2 p-1.5 rounded-md transition-colors',
                      isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-600'
                    )}
                    title="Copy"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
