import { useState } from 'react';
import { Button } from './button';
import { Icon } from './icon';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  children: string;
  className?: string;
  language?: string;
  showCopy?: boolean;
  primaryColor?: string;
}

// Create a style tag for Geist Mono font
const monoFontStyle = `
  @font-face {
    font-family: 'Geist Mono';
    src: url('/Geist_Mono/GeistMono-VariableFont_wght.ttf') format('truetype-variations');
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
  }

  .code-block-mono, .code-block-mono * {
    font-family: 'Geist Mono', ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
    font-feature-settings: "liga" 0 !important;
    font-variant-ligatures: none !important;
  }
`;

export function CodeBlock({ 
  children, 
  className, 
  language, 
  showCopy = true,
  primaryColor = '#3b82f6'
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Failed to copy code:', error);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: monoFontStyle }} />
      <div className={cn("relative group my-4 max-w-full overflow-hidden", className)}>
        <div 
          className="border overflow-hidden dark:border-zinc-800"
          style={{ 
            borderRadius: '12px',
            backgroundColor: 'var(--code-block-bg)',
            borderColor: 'var(--code-block-border)'
          }}
        >
          {/* Header with language and copy button */}
          <div 
            className="flex items-center justify-between px-4 py-2.5 border-b dark:border-zinc-800"
            style={{ 
              backgroundColor: 'var(--code-block-header-bg)',
              borderColor: 'var(--code-block-border)'
            }}
          >
            {language && (
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {language}
              </span>
            )}
            {!language && <div />}
            
            {showCopy && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-muted/50"
                style={{ 
                  color: copied ? '#22c55e' : 'hsl(var(--muted-foreground))'
                }}
              >
                {copied ? (
                  <>
                    <Icon icon="hugeicons:checkmark-01" className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Icon icon="hugeicons:copy-01" className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Code content */}
          <div className="px-4 py-4 overflow-x-auto">
            <pre className="code-block-mono text-[13px] whitespace-pre-wrap break-words leading-relaxed m-0" style={{ color: 'hsl(var(--foreground))' }}>
              <code className="code-block-mono">
                {children}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}

interface InlineCodeProps {
  children: string;
  className?: string;
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: monoFontStyle }} />
      <code 
        className={cn(
          "code-block-mono px-1.5 py-0.5 rounded text-[0.75em] bg-muted border border-border",
          className
        )}
      >
        {children}
      </code>
    </>
  );
}