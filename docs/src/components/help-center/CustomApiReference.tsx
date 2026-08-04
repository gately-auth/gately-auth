import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TryItModal } from './TryItModal';

interface CustomApiReferenceProps {
  specUrl: string;
  primaryColor?: string;
  isDark?: boolean;
  headingFont?: string | null;
  bodyFont?: string | null;
  baseUrl?: string;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  servers?: Array<{ url: string; description?: string }>;
}

interface Endpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: Record<string, any>;
  tags?: string[];
  operationId?: string;
}

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET:    { bg: '#22c55e1a', text: '#16a34a' },
  POST:   { bg: '#3b82f61a', text: '#2563eb' },
  PUT:    { bg: '#f59e0b1a', text: '#d97706' },
  PATCH:  { bg: '#f973161a', text: '#ea580c' },
  DELETE: { bg: '#ef44441a', text: '#dc2626' },
};

function MethodBadge({ method }: { method: string }) {
  const colors = METHOD_COLORS[method] || { bg: '#6b72801a', text: '#4b5563' };
  return (
    <span
      className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide font-mono shrink-0"
      style={{ background: colors.bg, color: colors.text }}
    >
      {method}
    </span>
  );
}

export function CustomApiReference({ 
  specUrl, 
  primaryColor = '#f04438', 
  isDark = false,
  headingFont,
  bodyFont,
  baseUrl = 'https://api.usegately.com/api/v1'
}: CustomApiReferenceProps) {
  console.log('[CustomApiReference] Component rendering with specUrl:', specUrl);
  
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [tryItModal, setTryItModal] = useState<{ endpoint: Endpoint; baseUrl: string } | null>(null);

  useEffect(() => {
    fetch(specUrl)
      .then(res => res.json())
      .then((data: OpenAPISpec) => {
        console.log('[CustomApiReference] Loaded OpenAPI spec:', {
          pathCount: Object.keys(data.paths || {}).length,
          samplePath: Object.keys(data.paths || {})[0],
          sampleMethods: data.paths ? Object.keys(data.paths[Object.keys(data.paths)[0]] || {}) : []
        });
        
        setSpec(data);
        
        // Use server URL from spec if available
        const serverUrl = data.servers?.[0]?.url || baseUrl;
        
        // Parse endpoints
        const parsedEndpoints: Endpoint[] = [];
        Object.entries(data.paths).forEach(([path, methods]) => {
          // Skip non-object entries
          if (!methods || typeof methods !== 'object') return;
          
          Object.entries(methods).forEach(([method, details]: [string, any]) => {
            // Only process valid HTTP methods
            if (!['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) return;
            if (!details || typeof details !== 'object') return;
            
            // Debug log for /members POST
            if (path === '/members' && method.toLowerCase() === 'post') {
              console.log('[CustomApiReference] DEBUG /members POST:', {
                hasRequestBody: !!details.requestBody,
                requestBodyKeys: details.requestBody ? Object.keys(details.requestBody) : [],
                hasContent: !!details.requestBody?.content,
                contentKeys: details.requestBody?.content ? Object.keys(details.requestBody.content) : [],
                hasJsonSchema: !!details.requestBody?.content?.['application/json']?.schema,
                schema: details.requestBody?.content?.['application/json']?.schema
              });
            }
              // Parse parameters from OpenAPI spec
              const params = details.parameters?.map((p: any) => ({
                name: p.name,
                type: p.schema?.type || 'string',
                required: p.required || false,
                description: p.description || '',
                location: p.in as 'header' | 'body' | 'query' | 'path',
              })) || [];

              // Parse request body parameters
              if (details.requestBody?.content?.['application/json']?.schema) {
                const schema = details.requestBody.content['application/json'].schema;
                
                console.log(`[CustomApiReference] Processing requestBody for ${method.toUpperCase()} ${path}:`, {
                  hasSchema: !!schema,
                  schemaKeys: Object.keys(schema),
                  properties: schema.properties,
                  hasRef: !!schema.$ref
                });
                
                // Handle both direct properties and $ref schemas
                let properties = schema.properties || {};
                const required = schema.required || [];
                
                // If schema has a $ref, we'd need to resolve it from components
                // For now, handle direct properties
                if (Object.keys(properties).length === 0 && schema.$ref) {
                  console.log('[CustomApiReference] Schema has $ref, may need resolution:', schema.$ref);
                }
                
                console.log(`[CustomApiReference] Found ${Object.keys(properties).length} properties:`, Object.keys(properties));
                
                Object.entries(properties).forEach(([name, prop]: [string, any]) => {
                  // Handle nested object properties
                  let propType = prop.type || 'string';
                  
                  // If it's an object with properties, mark it as object
                  if (prop.properties || prop.type === 'object') {
                    propType = 'object';
                  }
                  
                  params.push({
                    name,
                    type: propType,
                    required: required.includes(name),
                    description: prop.description || '',
                    location: 'body',
                  });
                  
                  console.log(`[CustomApiReference] Added body param: ${name} (${propType}, required: ${required.includes(name)})`);
                });
              }

              console.log(`[CustomApiReference] Parsed ${method.toUpperCase()} ${path}:`, {
                totalParams: params.length,
                bodyParams: params.filter((p: any) => p.location === 'body').length,
                hasRequestBody: !!details.requestBody,
                allParams: params
              });

              parsedEndpoints.push({
                path,
                method: method.toUpperCase(),
                summary: details.summary,
                description: details.description,
                parameters: params,
                requestBody: details.requestBody,
                responses: details.responses,
                tags: details.tags || [],
                operationId: details.operationId,
              });
          });
        });
        
        setEndpoints(parsedEndpoints);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [specUrl, baseUrl]);

  const toggleEndpoint = (key: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedEndpoints(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }} />
          <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Loading API Reference...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  // Group endpoints by tag
  const groupedEndpoints: Record<string, Endpoint[]> = {};
  endpoints.forEach(endpoint => {
    const tag = endpoint.tags?.[0] || 'General';
    if (!groupedEndpoints[tag]) {
      groupedEndpoints[tag] = [];
    }
    groupedEndpoints[tag].push(endpoint);
  });

  return (
    <>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: headingFont || undefined }}>
            {spec?.info.title}
          </h1>
          {spec?.info.description && (
            <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
              {spec.info.description}
            </p>
          )}
          <p className={`text-sm mt-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Version {spec?.info.version}
          </p>
        </div>

        {/* Endpoints grouped by tag */}
        {Object.entries(groupedEndpoints).map(([tag, tagEndpoints]) => (
          <div key={tag} className="mb-8">
            <h2 
              className="text-xl font-semibold mb-4 pb-2 border-b"
              style={{ 
                fontFamily: headingFont || undefined,
                borderColor: isDark ? '#27272a' : '#e4e4e7'
              }}
            >
              {tag}
            </h2>

            <div className="space-y-2">
              {tagEndpoints.map((endpoint) => {
                const key = `${endpoint.method}-${endpoint.path}`;
                const isExpanded = expandedEndpoints.has(key);
                
                return (
                  <div
                    key={key}
                    className={`border rounded-xl overflow-hidden transition-all ${isDark ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-200 hover:border-zinc-300'}`}
                  >
                    {/* Endpoint header */}
                    <div className={`flex items-center gap-3 p-3.5 ${isDark ? 'bg-zinc-900/30' : 'bg-zinc-50/50'}`}>
                      <button
                        onClick={() => toggleEndpoint(key)}
                        className="flex items-center gap-3 flex-1 text-left min-w-0"
                      >
                        {isExpanded ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />}
                        <MethodBadge method={endpoint.method} />
                        <span className="font-mono text-sm flex-1 truncate">
                          {endpoint.path}
                        </span>
                      </button>
                      {endpoint.summary && (
                        <span className={`text-sm hidden md:block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {endpoint.summary}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          console.log('[CustomApiReference] Opening TryIt modal for:', {
                            method: endpoint.method,
                            path: endpoint.path,
                            parametersCount: endpoint.parameters?.length || 0,
                            parameters: endpoint.parameters,
                            bodyParams: endpoint.parameters?.filter(p => p.location === 'body') || []
                          });
                          setTryItModal({ endpoint, baseUrl: spec?.servers?.[0]?.url || baseUrl });
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Try It
                      </button>
                    </div>

                    {/* Endpoint details */}
                    {isExpanded && (
                      <div className={`p-4 border-t ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'}`}>
                        {endpoint.description && (
                          <p className={`mb-4 text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            {endpoint.description}
                          </p>
                        )}

                        {/* Parameters */}
                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-sm mb-3">Parameters</h4>
                            <div className="space-y-2">
                              {endpoint.parameters.map((param: any, i: number) => (
                                <div
                                  key={i}
                                  className={`p-3 rounded-lg text-sm border ${isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-zinc-50 border-zinc-200'}`}
                                >
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <code className="text-sm font-mono font-medium">{param.name}</code>
                                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-200 text-zinc-700'}`}>
                                      {param.location}
                                    </span>
                                    <span className={`text-xs font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                      {param.type}
                                    </span>
                                    {param.required && (
                                      <span className="text-xs text-red-500 font-medium">required</span>
                                    )}
                                  </div>
                                  {param.description && (
                                    <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                      {param.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Responses */}
                        {endpoint.responses && (
                          <div>
                            <h4 className="font-semibold text-sm mb-3">Responses</h4>
                            <div className="space-y-2">
                              {Object.entries(endpoint.responses).map(([code, response]: [string, any]) => (
                                <div
                                  key={code}
                                  className={`p-3 rounded-lg border ${isDark ? 'bg-zinc-800/50 border-zinc-700/50' : 'bg-zinc-50 border-zinc-200'}`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className="font-mono font-bold text-sm px-2 py-0.5 rounded-md"
                                      style={{
                                        color: code.startsWith('2') ? '#22c55e' : code.startsWith('4') ? '#f59e0b' : '#ef4444',
                                        background: code.startsWith('2') ? '#22c55e1a' : code.startsWith('4') ? '#f59e0b1a' : '#ef44441a'
                                      }}
                                    >
                                      {code}
                                    </span>
                                    <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                      {response.description}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Try It Modal */}
      {tryItModal && (
        <TryItModal
          isOpen={true}
          onClose={() => setTryItModal(null)}
          method={tryItModal.endpoint.method}
          path={tryItModal.endpoint.path}
          baseUrl={tryItModal.baseUrl}
          primaryColor={primaryColor}
          isDark={isDark}
          description={tryItModal.endpoint.description}
          headingFont={headingFont}
          bodyFont={bodyFont}
          parameters={tryItModal.endpoint.parameters}
        />
      )}
    </>
  );
}
