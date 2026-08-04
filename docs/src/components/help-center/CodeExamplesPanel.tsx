import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CodeExamplesPanelProps {
  content: string;
  isDark: boolean;
  primaryColor: string;
}

interface CodeExample {
  language: string;
  code: string;
  label: string;
}

interface ResponseExample {
  status: string;
  code: string;
  label: string;
}

/**
 * Extracts code examples from markdown content
 * Looks for RequestExample and ResponseExample blocks
 */
function extractCodeExamples(content: string): {
  requestExamples: CodeExample[];
  responseExamples: ResponseExample[];
} {
  const requestExamples: CodeExample[] = [];
  const responseExamples: ResponseExample[] = [];

  // Extract RequestExample blocks
  const requestMatch = content.match(/<RequestExample>([\s\S]*?)<\/RequestExample>/);
  if (requestMatch) {
    const requestContent = requestMatch[1];
    
    // Extract cURL example
    const curlMatch = requestContent.match(/```bash cURL\n([\s\S]*?)```/);
    if (curlMatch) {
      requestExamples.push({
        language: 'curl',
        code: curlMatch[1].trim(),
        label: 'cURL',
      });
    }

    // Extract JavaScript example
    const jsMatch = requestContent.match(/```javascript JavaScript\n([\s\S]*?)```/);
    if (jsMatch) {
      requestExamples.push({
        language: 'javascript',
        code: jsMatch[1].trim(),
        label: 'JavaScript',
      });
    }

    // Extract Python example
    const pythonMatch = requestContent.match(/```python Python\n([\s\S]*?)```/);
    if (pythonMatch) {
      requestExamples.push({
        language: 'python',
        code: pythonMatch[1].trim(),
        label: 'Python',
      });
    }
  }

  // Extract ResponseExample blocks
  const responseMatch = content.match(/<ResponseExample>([\s\S]*?)<\/ResponseExample>/);
  if (responseMatch) {
    const responseContent = responseMatch[1];
    
    // Extract all JSON code blocks with labels
    const jsonMatches = responseContent.matchAll(/```json ([^\n]+)\n([\s\S]*?)```/g);
    for (const match of jsonMatches) {
      responseExamples.push({
        status: match[1].includes('Success') ? '200' : match[1].includes('Error') ? '400' : '200',
        code: match[2].trim(),
        label: match[1],
      });
    }
  }

  return { requestExamples, responseExamples };
}

export function CodeExamplesPanel({ content, isDark, primaryColor }: CodeExamplesPanelProps) {
  const [activeRequestTab, setActiveRequestTab] = useState(0);
  const [activeResponseTab, setActiveResponseTab] = useState(0);

  const { requestExamples, responseExamples } = useMemo(
    () => extractCodeExamples(content),
    [content]
  );

  if (requestExamples.length === 0 && responseExamples.length === 0) {
    return null;
  }

  const monoFont = "'Geist Mono', Monaco, 'Courier New', monospace";

  return (
    <div className="space-y-4">
      {/* Request Examples */}
      {requestExamples.length > 0 && (
        <div className={cn('rounded-xl border overflow-hidden', isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white')}>
          {/* Tabs */}
          <div className={cn('flex items-center border-b', isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50')}>
            {requestExamples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setActiveRequestTab(idx)}
                className={cn(
                  'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                  activeRequestTab === idx
                    ? isDark 
                      ? 'border-orange-500 text-orange-400 bg-zinc-900' 
                      : 'border-orange-500 text-orange-600 bg-white'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
                style={{ fontFamily: monoFont }}
              >
                {example.label}
              </button>
            ))}
          </div>

          {/* Code */}
          <div className="relative">
            <pre className={cn(
              'p-4 text-xs overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto',
              isDark ? 'bg-zinc-950 text-zinc-300' : 'bg-zinc-50 text-zinc-700'
            )}
              style={{ fontFamily: monoFont }}
            >
              {requestExamples[activeRequestTab]?.code}
            </pre>
            <button
              onClick={() => navigator.clipboard?.writeText(requestExamples[activeRequestTab]?.code || '')}
              className={cn(
                'absolute top-2 right-2 p-1.5 rounded-md transition-colors',
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-600'
              )}
              title="Copy code"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Response Examples */}
      {responseExamples.length > 0 && (
        <div className={cn('rounded-xl border overflow-hidden', isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white')}>
          {/* Tabs */}
          <div className={cn('flex items-center border-b', isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50')}>
            {responseExamples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setActiveResponseTab(idx)}
                className={cn(
                  'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                  activeResponseTab === idx
                    ? isDark 
                      ? 'border-orange-500 text-orange-400 bg-zinc-900' 
                      : 'border-orange-500 text-orange-600 bg-white'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
                style={{ fontFamily: monoFont }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      color: example.status.startsWith('2') ? '#16a34a' : '#dc2626',
                      background: example.status.startsWith('2') ? '#22c55e1a' : '#ef44441a',
                    }}
                  >
                    {example.status}
                  </span>
                  {example.label}
                </span>
              </button>
            ))}
          </div>

          {/* Code */}
          <div className="relative">
            <pre className={cn(
              'p-4 text-xs overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto',
              isDark ? 'bg-zinc-950 text-zinc-300' : 'bg-zinc-50 text-zinc-700'
            )}
              style={{ fontFamily: monoFont }}
            >
              {responseExamples[activeResponseTab]?.code}
            </pre>
            <button
              onClick={() => navigator.clipboard?.writeText(responseExamples[activeResponseTab]?.code || '')}
              className={cn(
                'absolute top-2 right-2 p-1.5 rounded-md transition-colors',
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-600'
              )}
              title="Copy code"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
