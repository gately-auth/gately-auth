import { useEffect, useState, useMemo, useRef } from 'react';
import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { withMultiColumn } from '@blocknote/xl-multi-column';
import '@blocknote/react/style.css';
import '@blocknote/shadcn/style.css';
import { cn } from '@/lib/utils';
import { ArticleFeedback } from './ArticleFeedback';
import { TryItModal } from './TryItModal';
import {
  calloutBlockSpec, cardBlockSpec, accordionBlockSpec,
  stepsBlockSpec, tabsBlockSpec, iconBlockSpec,
  codeBlockSpec, codeGroupBlockSpec, cardGroupBlockSpec, imageBlockSpec, paramFieldBlockSpec, responseFieldBlockSpec,
  expandableBlockSpec,
} from './viewer-block-specs';

// Prism type declaration
declare global {
  interface Window {
    Prism?: {
      highlightAll: () => void;
      highlightElement: (element: Element) => void;
    };
  }
}

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

// Schema mirrors the editor exactly
const viewerSchema = withMultiColumn(BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    image: imageBlockSpec,
    callout: calloutBlockSpec, card: cardBlockSpec,
    accordion: accordionBlockSpec, step: stepsBlockSpec,
    tabs: tabsBlockSpec, iconBlock: iconBlockSpec,
    codeBlock: codeBlockSpec, codeGroup: codeGroupBlockSpec, cardGroup: cardGroupBlockSpec, paramField: paramFieldBlockSpec,
    responseField: responseFieldBlockSpec, expandable: expandableBlockSpec,
  },
}));

interface TocItem { id: string; text: string; level: number; }

function extractBNBlocks(raw: string) {
  const m = raw.match(/<script data-bn type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    const blocks = JSON.parse(m[1]);
    // Sanitize: strip inline content from blocks that use content:'none' in their spec
    // (step, card, cardGroup, accordion, tabs, codeGroup, iconBlock, cardGroup, expandable)
    // This prevents BlockNote from rendering stale inline content alongside the spec's own render
    const CONTENT_NONE_TYPES = new Set(['step', 'card', 'cardGroup', 'accordion', 'tabs', 'codeGroup', 'iconBlock', 'expandable', 'divider']);
    return blocks.map((b: any) =>
      CONTENT_NONE_TYPES.has(b.type) ? { ...b, content: [] } : b
    );
  } catch { return null; }
}

const generateId = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface ArticleContentViewerProps {
  content: string;
  initialBlocks?: any[] | null;
  isDark?: boolean;
  primaryColor?: string;
  className?: string;
  showToc?: boolean;
  onTocGenerated?: (items: TocItem[]) => void;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  headingFont?: string | null;
  bodyFont?: string | null;
  showFeedback?: boolean;
  articleId?: string;
  projectId?: string;
  updatedAt?: string;
  horizontalFeedback?: boolean;
  isApiReference?: boolean;
  apiBaseUrl?: string;
  article?: any;
}

export function ArticleContentViewer({
  content, initialBlocks: initialBlocksProp, isDark = false, primaryColor = '#3b82f6', className,
  showToc = false, onTocGenerated, scrollContainerRef,
  headingFont, bodyFont, showFeedback = false,
  articleId, projectId, horizontalFeedback = false,
  isApiReference = false, apiBaseUrl = 'https://api.usegately.com/api/v1', article,
}: ArticleContentViewerProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [openApiParams, setOpenApiParams] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const editorRef = useRef<any>(null);

  // Extract HTTP method + path from article title for API reference articles
  const { method, path, hasEndpoint } = useMemo(() => {
    if (!isApiReference || !article) return { method: '', path: '', hasEndpoint: false };
    
    const sources = [article.sidebar_title, article.title, article.excerpt];
    for (const s of sources) {
      const m = s?.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD)\s+(\/\S*)/i);
      if (m) {
        let extractedPath = m[2];
        try {
          const baseUrlObj = new URL(apiBaseUrl);
          const basePath = baseUrlObj.pathname.replace(/\/$/, '');
          if (basePath && extractedPath.startsWith(basePath)) {
            extractedPath = extractedPath.slice(basePath.length) || '/';
          }
        } catch {
          // If baseUrl is invalid, use path as-is
        }
        return { method: m[1].toUpperCase(), path: extractedPath, hasEndpoint: true };
      }
    }
    return { method: '', path: '', hasEndpoint: false };
  }, [isApiReference, article, apiBaseUrl]);

  // Use article excerpt as description for API modal, cleaned of markdown tables
  const cleanDescription = useMemo(() => {
    if (!isApiReference || !article?.excerpt) return undefined;
    
    let cleaned = article.excerpt;
    
    // Remove markdown tables (lines starting with | or containing table separators)
    cleaned = cleaned
      .split('\n')
      .filter((line: any) => {
        const trimmed = line.trim();
        // Skip lines that are part of markdown tables
        return !trimmed.startsWith('|') && !trimmed.match(/^\|?[\s\-:|]+\|?$/);
      })
      .join('\n')
      .trim();
    
    // Remove any remaining markdown formatting
    cleaned = cleaned
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/`(.+?)`/g, '$1') // Remove inline code
      .trim();
    
    return cleaned || undefined;
  }, [isApiReference, article]);

  // Fetch OpenAPI spec and extract parameters for API reference articles
  useEffect(() => {
    if (!isApiReference || !hasEndpoint || !projectId) return;
    
    const specUrl = `https://api.usegately.com/api/public/projects/${projectId}/openapi`;
    
    fetch(specUrl)
      .then(res => res.json())
      .then((spec: any) => {
        const pathData = spec.paths?.[path];
        if (!pathData) return;
        
        const methodData = pathData[method.toLowerCase()];
        if (!methodData) return;
        
        const params: any[] = [];
        
        if (methodData.parameters) {
          methodData.parameters.forEach((p: any) => {
            params.push({
              name: p.name,
              type: p.schema?.type || 'string',
              required: p.required || false,
              description: p.description || '',
              location: p.in as 'header' | 'body' | 'query' | 'path',
            });
          });
        }
        
        if (methodData.requestBody?.content?.['application/json']?.schema) {
          const schema = methodData.requestBody.content['application/json'].schema;
          const properties = schema.properties || {};
          const required = schema.required || [];
          
          Object.entries(properties).forEach(([name, prop]: [string, any]) => {
            params.push({
              name,
              type: prop.type || 'string',
              required: required.includes(name),
              description: prop.description || '',
              location: 'body',
            });
          });
        }
        
        setOpenApiParams(params);
      })
      .catch(err => {
        console.error('[ArticleContentViewer] Failed to load OpenAPI spec:', err);
      });
  }, [isApiReference, hasEndpoint, projectId, method, path]);

  // Parse parameters from content or OpenAPI
  const parameters = useMemo(() => {
    if (!isApiReference) return [];
    
    if (openApiParams.length > 0) return openApiParams;
    if (article?.api_parameters && Array.isArray(article.api_parameters)) {
      return article.api_parameters;
    }
    
    // Fallback: parse from content
    const params: any[] = [];
    const paramFieldRegex = /<ParamField\s+(body|query|path|header)="([^"]+)"\s+type="([^"]+)"([^>]*)>([\s\S]*?)<\/ParamField>/gi;
    let match;
    
    while ((match = paramFieldRegex.exec(content)) !== null) {
      const location = match[1] as 'header' | 'body' | 'query' | 'path';
      const name = match[2];
      const type = match[3];
      const attributes = match[4];
      const description = match[5].trim();
      
      const required = attributes.includes('required');
      const defaultMatch = attributes.match(/default="([^"]+)"/);
      const defaultValue = defaultMatch ? defaultMatch[1] : undefined;
      
      params.push({
        name,
        type,
        required,
        description,
        location,
        ...(defaultValue && { default: defaultValue }),
      });
    }
    
    return params;
  }, [isApiReference, content, article, openApiParams]);

  // Process content for API reference: remove code example blocks (they go to sidebar)
  const processedContent = useMemo(() => {
    if (!isApiReference) return content;
    
    // Remove RequestExample and ResponseExample blocks - these will be shown in CodeExamplesPanel
    let cleanedContent = content;
    cleanedContent = cleanedContent.replace(/<RequestExample>[\s\S]*?<\/RequestExample>/gi, '');
    cleanedContent = cleanedContent.replace(/<ResponseExample>[\s\S]*?<\/ResponseExample>/gi, '');
    
    // Keep ParamField and ResponseField tags - they'll be rendered inline by our parameter sections
    return cleanedContent;
  }, [isApiReference, content]);

  // Use server-extracted blocks if provided, otherwise extract from content string
  // Sanitize: filter unknown types and fix malformed content so BlockNote doesn't crash
  const initialBlocks = useMemo(() => {
    const raw = initialBlocksProp ?? extractBNBlocks(processedContent);
    if (!raw) return null;

    const KNOWN_TYPES = new Set([
      'paragraph', 'heading', 'bulletListItem', 'numberedListItem', 'checkListItem',
      'quote', 'codeBlock', 'image', 'table', 'divider', 'file', 'audio', 'video',
      'toggleListItem',
      'callout', 'card', 'accordion', 'step', 'tabs', 'iconBlock',
      'codeGroup', 'cardGroup', 'paramField',
      'columnList', 'column',
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitize = (blocks: any[]): any[] =>
      blocks
        .filter(b => KNOWN_TYPES.has(b?.type))
        .map(b => {
          let c = b.content;
          if (c === 'none' || c === '' || c === null || c === undefined) c = [];
          if (typeof c === 'string') c = [{ type: 'text', text: c, styles: {} }];
          return {
            ...b,
            content: c,
            children: Array.isArray(b.children) && b.children.length ? sanitize(b.children) : [],
          };
        });

    try { return sanitize(raw); } catch { return null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedContent]);

  // Force editor recreation when article changes by including article ID in dependencies
  const editor = useCreateBlockNote({
    schema: viewerSchema,
    initialContent: initialBlocks ?? undefined,
  }, [articleId]); // Only depend on articleId to avoid unnecessary recreations

  // Store editor ref
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // For legacy HTML (no BlockNote JSON), parse and load after mount
  const legacyLoadedRef = useRef(false);
  useEffect(() => {
    if (!editor || initialBlocks || legacyLoadedRef.current) return;
    if (!processedContent || !processedContent.trim() || processedContent === '<p></p>') return;
    legacyLoadedRef.current = true;
    const cleanHtml = processedContent.replace(/<script[\s\S]*?<\/script>/gi, '');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = editor.tryParseHTMLToBlocks(cleanHtml) as any;
      if (parsed?.length) editor.replaceBlocks(editor.document, parsed);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Reload when content changes — handles both BlockNote JSON and legacy TipTap HTML
  useEffect(() => {
    if (!editor) return;
    const blocks = extractBNBlocks(processedContent);
    if (blocks) {
      try { editor.replaceBlocks(editor.document, blocks); } catch { /* ignore */ }
      return;
    }
    // Legacy TipTap HTML — parse it into BlockNote blocks
    if (processedContent && processedContent.trim() && processedContent !== '<p></p>') {
      const cleanHtml = processedContent.replace(/<script[\s\S]*?<\/script>/gi, '');
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsed = editor.tryParseHTMLToBlocks(cleanHtml) as any;
        if (parsed?.length) editor.replaceBlocks(editor.document, parsed);
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedContent]);

  // TOC from headings — prefer BlockNote blocks, fall back to raw HTML regex
  const tocHeadings = useMemo(() => {
    // If we have blocks, extract headings from them directly
    if (initialBlocks?.length) {
      const headings: TocItem[] = [];
      for (const block of initialBlocks) {
        if (block.type === 'heading') {
          const text = (block.content || [])
            .filter((n: any) => n.type === 'text')
            .map((n: any) => n.text)
            .join('');
          if (text) headings.push({ id: generateId(text), text, level: block.props?.level ?? 2 });
        }
      }
      return headings;
    }
    // Legacy HTML fallback
    const headings: TocItem[] = [];
    const regex = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
      const text = m[2].replace(/<[^>]*>/g, '').trim();
      if (text) headings.push({ id: generateId(text), text, level: parseInt(m[1]) });
    }
    return headings;
  }, [initialBlocks, content]);

  useEffect(() => {
    const t = setTimeout(() => {
      setTocItems(tocHeadings);
      onTocGenerated?.(tocHeadings);
      if (typeof window !== 'undefined')
        window.dispatchEvent(new CustomEvent('toc-updated', { detail: tocHeadings }));
    }, 0);
    return () => clearTimeout(t);
  }, [tocHeadings, onTocGenerated]);

  // Scroll spy
  useEffect(() => {
    if (!showToc || tocItems.length === 0) return;
    const getRoot = () => {
      if (scrollContainerRef?.current) return scrollContainerRef.current;
      const first = tocItems[0] ? document.getElementById(tocItems[0].id) : null;
      if (first) {
        let p = first.parentElement;
        while (p) {
          const s = window.getComputedStyle(p);
          if (['auto','scroll'].includes(s.overflow) || ['auto','scroll'].includes(s.overflowY)) return p;
          p = p.parentElement;
        }
      }
      return null;
    };
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { /* active heading tracking */ void e.target.id; } }),
      { root: getRoot(), rootMargin: '-80px 0px -80% 0px', threshold: 0 }
    );
    tocItems.forEach((item) => { const el = document.getElementById(item.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [tocItems, showToc, scrollContainerRef]);

  // Add heading IDs + load Iconify + Prism after render
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.querySelectorAll('h1,h2,h3').forEach((h) => {
        if (!h.id) h.id = generateId(h.textContent || '');
      });
      if (!document.querySelector('script[src*="iconify"]')) {
        const s = document.createElement('script');
        s.src = 'https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js';
        s.async = true;
        document.head.appendChild(s);
      }
      // Load Prism.js for syntax highlighting
      if (!document.querySelector('script[src*="prism"]')) {
        // Load Prism CSS
        const prismCss = document.createElement('link');
        prismCss.rel = 'stylesheet';
        prismCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
        document.head.appendChild(prismCss);
        
        // Add custom Prism overrides to fix line wrapping and fonts
        const prismOverrides = document.createElement('style');
        prismOverrides.textContent = `
          code[class*="language-"],
          pre[class*="language-"] {
            font-family: 'Geist Mono', ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            word-break: normal !important;
            line-height: 1.75 !important;
          }
          pre[class*="language-"] {
            overflow-x: auto !important;
          }
          /* Remove all token backgrounds to use code block background */
          .token.operator,
          .token.entity,
          .token.url,
          .token.variable,
          .token.string,
          .token.number,
          .token.boolean,
          .token.constant,
          .token.symbol,
          .token.deleted,
          .token.inserted,
          .token.attr-name,
          .token.attr-value,
          .token.keyword,
          .token.function,
          .token.class-name,
          .token.regex,
          .token.important,
          .language-css .token.string,
          .style .token.string {
            background: transparent !important;
          }
        `;
        document.head.appendChild(prismOverrides);
        
        // Load Prism JS
        const prismJs = document.createElement('script');
        prismJs.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
        prismJs.async = true;
        document.head.appendChild(prismJs);
        
        // Load common language components
        const languages = ['javascript', 'typescript', 'jsx', 'tsx', 'python', 'bash', 'json', 'css', 'html', 'sql', 'yaml', 'markdown'];
        prismJs.onload = () => {
          languages.forEach(lang => {
            const langScript = document.createElement('script');
            langScript.src = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${lang}.min.js`;
            langScript.async = true;
            document.head.appendChild(langScript);
          });
          // Highlight after languages load
          setTimeout(() => {
            if (window.Prism) {
              window.Prism.highlightAll();
            }
          }, 500);
        };
      } else if (window.Prism) {
        // Prism already loaded, just highlight
        window.Prism.highlightAll();
      }
    }, 100);
    return () => clearTimeout(t);
  }, [content, articleId]);

  // Equal-height cards in column grids — JS sync after render
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const syncHeights = () => {
      el.querySelectorAll('.bn-block-column-list').forEach((list) => {
        const columns = Array.from(list.querySelectorAll(':scope > .bn-block-column'));
        if (columns.length < 2) return;
        // Reset first
        columns.forEach((col) => {
          (col as HTMLElement).style.height = '';
          col.querySelectorAll('[data-card]').forEach((c) => { (c as HTMLElement).style.height = ''; });
        });
        // Measure and equalize
        const maxH = Math.max(...columns.map((c) => (c as HTMLElement).offsetHeight));
        if (maxH > 0) {
          columns.forEach((col) => {
            (col as HTMLElement).style.height = `${maxH}px`;
            col.querySelectorAll('[data-card]').forEach((c) => { (c as HTMLElement).style.height = '100%'; });
          });
        }
      });
    };

    const t = setTimeout(syncHeights, 200);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncHeights) : null;
    if (ro) ro.observe(el);
    return () => { clearTimeout(t); ro?.disconnect(); };
  }, [content]);

  const mono = "'Geist Mono','JetBrains Mono','Fira Code',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

  // Style first row of tables as headers (BlockNote doesn't use thead/th)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const applyTableStyles = () => {
      const tables = el.querySelectorAll('table');
      const mutedBg = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
      const bgColor = mutedBg ? `hsl(${mutedBg})` : (isDark ? '#27272a' : '#f4f4f5');
      
      tables.forEach((table) => {
        // Style first row as header
        const firstRow = table.querySelector('tbody tr:first-child');
        if (firstRow) {
          const cells = firstRow.querySelectorAll('td');
          cells.forEach((cell) => {
            const htmlCell = cell as HTMLElement;
            htmlCell.style.backgroundColor = bgColor;
            htmlCell.style.color = isDark ? '#fafafa' : '#18181b';
            htmlCell.style.fontWeight = '500';
          });
        }
        
        // Also handle actual th elements if they exist
        const headers = table.querySelectorAll('th');
        headers.forEach((th) => {
          const htmlTh = th as HTMLElement;
          htmlTh.style.backgroundColor = bgColor;
          htmlTh.style.color = isDark ? '#fafafa' : '#18181b';
          htmlTh.style.fontWeight = '500';
        });
      });
    };

    applyTableStyles();
    const timer = setTimeout(applyTableStyles, 100);
    
    const observer = new MutationObserver(applyTableStyles);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [content, isDark, articleId]);

  // Add copy buttons to code blocks
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const addCopyButtons = () => {
      const codeBlocks = el.querySelectorAll('pre:not(.copy-button-added)');

      codeBlocks.forEach((pre) => {
        // Skip pre elements inside code groups — they have their own copy button
        if (pre.closest('[data-code-group]')) return;

        // Skip if this is inside a BlockNote custom codeblock wrapper
        if (pre.closest('[data-blocknote-codeblock="true"]')) return;

        // Skip if this pre is inside a custom code block wrapper (already wrapped)
        if (pre.closest('.code-block-wrapper')) return;

        pre.classList.add('copy-button-added');

        // Skip if already wrapped
        if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

        // Detect language from <code class="language-*">
        const codeEl = pre.querySelector('code');
        const langClass = codeEl?.className?.match(/language-(\w+)/)?.[1] || '';

        // Build wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        wrapper.setAttribute('data-blocknote-codeblock', 'true');

        // Build header bar
        const header = document.createElement('div');
        header.className = 'code-block-header';

        const langLabel = document.createElement('span');
        langLabel.className = 'code-block-lang';
        langLabel.textContent = langClass || '';

        const button = document.createElement('button');
        button.className = 'code-copy-button';
        button.innerHTML = `
          <svg class="copy-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg class="check-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span class="copy-label">Copy</span>
        `;

        button.addEventListener('click', async () => {
          const code = codeEl?.textContent || pre.textContent || '';
          try {
            await navigator.clipboard.writeText(code);
            const copyIcon = button.querySelector('.copy-icon') as HTMLElement;
            const checkIcon = button.querySelector('.check-icon') as HTMLElement;
            const label = button.querySelector('.copy-label') as HTMLElement;
            copyIcon.style.display = 'none';
            checkIcon.style.display = 'block';
            if (label) label.textContent = 'Copied!';
            setTimeout(() => {
              copyIcon.style.display = 'block';
              checkIcon.style.display = 'none';
              if (label) label.textContent = 'Copy';
            }, 2000);
          } catch (err) {
            console.error('Failed to copy code:', err);
          }
        });

        header.appendChild(langLabel);
        header.appendChild(button);

        // Insert wrapper around pre
        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
      });
    };

    addCopyButtons();
    const timer = setTimeout(addCopyButtons, 100);
    
    const observer = new MutationObserver(addCopyButtons);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [content, articleId]);

  return (
    <>
      <div
        ref={containerRef}
        className={cn('article-viewer', className)}
        style={{ fontFamily: bodyFont || 'system-ui,sans-serif', ['--viewer-primary' as string]: primaryColor }}
      >

        <BlockNoteView 
          key={articleId || 'default'} 
          editor={editor} 
          editable={false} 
          theme={isDark ? 'dark' : 'light'} 
          className="bn-viewer" 
        />

        {showFeedback && articleId && projectId && (
          <ArticleFeedback articleId={articleId} projectId={projectId} horizontal={horizontalFeedback} />
        )}

        <style>{`
        @font-face {
          font-family: 'Geist Mono';
          src: url('/Geist_Mono/GeistMono-VariableFont_wght.ttf') format('truetype-variations');
          font-weight: 100 900;
          font-style: normal;
          font-display: swap;
        }

        .bn-viewer .bn-editor,
        .bn-viewer .bn-container,
        .bn-viewer [data-theming-css-variables-demo] { background: transparent !important; padding: 0 !important; }
        .bn-viewer .bn-editor { font-family: ${bodyFont || 'system-ui,sans-serif'} !important; }
        .bn-viewer .bn-editor > .bn-block-group { padding-left: 0 !important; }
        .bn-viewer .bn-side-menu { display: none !important; }
        .bn-viewer .bn-block-content { font-size: 1rem; line-height: 1.75; color: var(--muted-foreground); }
        .bn-viewer .bn-block-outer { margin-bottom: 2px; }
        .bn-viewer .bn-block-outer:has([data-content-type="heading"]) { margin-top: 16px; }
        .bn-viewer .bn-block-outer:first-child:has([data-content-type="heading"]) { margin-top: 0; }

        /* ── Nuke every outline / ring BlockNote or ProseMirror adds ── */
        .bn-viewer * {
          outline: none !important;
          box-shadow: none !important;
        }
        /* Kill ProseMirror selected-node state entirely — preserve border-radius on custom blocks */
        .bn-viewer .ProseMirror-selectednode,
        .bn-viewer .ProseMirror-selectednode > *,
        .bn-viewer .bn-block-content.ProseMirror-selectednode,
        .bn-viewer .bn-block-content.ProseMirror-selectednode > * {
          outline: none !important;
          box-shadow: none !important;
          border-radius: inherit !important;
        }
        /* Explicitly preserve rounded corners on custom blocks when their container gets selected */
        .bn-viewer .ProseMirror-selectednode [data-card],
        .bn-viewer .ProseMirror-selectednode [data-callout-type],
        .bn-viewer .ProseMirror-selectednode .callout-block,
        .bn-viewer .ProseMirror-selectednode details,
        .bn-viewer .ProseMirror-selectednode [data-tabs],
        .bn-viewer .ProseMirror-selectednode [data-accordion] {
          border-radius: 1rem !important;
        }

        .bn-viewer [data-content-type="heading"] {
          color: var(--foreground) !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          ${headingFont ? `font-family: ${headingFont} !important;` : "font-family: 'Geist Mono', ui-monospace, monospace !important;"}
        }
        .bn-viewer [data-content-type="heading"][data-level="1"] { font-size: 1.875rem; font-weight: 700; margin: 2rem 0 1rem; line-height: 1.2; }
        .bn-viewer [data-content-type="heading"][data-level="2"] { font-size: 1.5rem;   font-weight: 600; margin: 1.75rem 0 0.75rem; line-height: 1.3; }
        .bn-viewer [data-content-type="heading"][data-level="3"] { font-size: 1.25rem;  font-weight: 600; margin: 1.5rem 0 0.5rem; line-height: 1.4; }
        .bn-viewer [data-content-type="paragraph"] { margin: 0.75rem 0; line-height: 1.7; }
        .bn-viewer a { color: ${primaryColor} !important; text-decoration: underline; }
        .bn-viewer a:hover { opacity: 0.8; }
        .bn-viewer .bn-inline-content a,
        .bn-viewer [data-content-type] a { color: ${primaryColor} !important; }

        /* ── Quote ── */
        .bn-viewer .bn-block-outer:has([data-content-type="quote"]) {
          margin: 1rem 0 !important;
        }
        .bn-viewer .bn-block-outer:has([data-content-type="quote"]) .bn-block-content {
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .bn-viewer [data-content-type="quote"] {
          border: none !important;
          border-left: 3px solid ${primaryColor} !important;
          padding: 0.5rem 1.25rem !important;
          margin: 0 !important;
          background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} !important;
          border-radius: 0 0.75rem 0.75rem 0 !important;
          color: var(--muted-foreground) !important;
          font-style: italic !important;
          display: block !important;
        }

        /* ── Checklist ── */
        .bn-viewer [data-content-type="checkListItem"] {
          display: flex !important;
          align-items: flex-start !important;
          gap: 0.625rem !important;
          padding: 0.125rem 0 !important;
          line-height: 1.6 !important;
        }
        .bn-viewer [data-content-type="checkListItem"] input[type="checkbox"] {
          appearance: none !important;
          -webkit-appearance: none !important;
          width: 1rem !important;
          height: 1rem !important;
          min-width: 1rem !important;
          border: 1.5px solid hsl(var(--border)) !important;
          border-radius: 0.25rem !important;
          margin-top: 0.2rem !important;
          cursor: default !important;
          background: transparent !important;
          position: relative !important;
          flex-shrink: 0 !important;
        }
        .bn-viewer [data-content-type="checkListItem"] input[type="checkbox"]:checked {
          background: ${primaryColor} !important;
          border-color: ${primaryColor} !important;
        }
        .bn-viewer [data-content-type="checkListItem"] input[type="checkbox"]:checked::after {
          content: '' !important;
          position: absolute !important;
          left: 0.2rem !important;
          top: 0.05rem !important;
          width: 0.35rem !important;
          height: 0.6rem !important;
          border: 2px solid #fff !important;
          border-top: none !important;
          border-left: none !important;
          transform: rotate(45deg) !important;
        }
        .bn-viewer [data-content-type="checkListItem"][data-checked="true"] .bn-inline-content {
          text-decoration: line-through !important;
          color: var(--muted-foreground) !important;
          opacity: 0.7 !important;
        }
        
        /* ── Code Block ── */
        .bn-viewer [data-content-type="codeBlock"] { padding: 0 !important; background: transparent !important; border: none !important; border-radius: 0 !important; }

        .bn-viewer .code-block-wrapper {
          position: relative;
          margin: 1.25rem 0 !important;
          width: 100%;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid var(--code-block-border, hsl(var(--border)));
        }

        /* Header bar — language label + copy button */
        .bn-viewer .code-block-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1rem;
          background: var(--code-block-header-bg, hsl(var(--muted)));
          border-bottom: 1px solid var(--code-block-border, hsl(var(--border)));
          min-height: 2.25rem;
        }

        .bn-viewer .code-block-lang {
          font-family: ${mono};
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: hsl(var(--muted-foreground));
        }

        .bn-viewer .code-copy-button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.625rem;
          background: transparent;
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.6875rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          transition: background 0.15s, color 0.15s;
          font-family: ${mono};
        }

        .bn-viewer .code-copy-button:hover {
          background: hsl(var(--accent));
          color: hsl(var(--foreground));
        }

        .bn-viewer .code-copy-button svg {
          width: 13px;
          height: 13px;
          flex-shrink: 0;
        }

        .bn-viewer .code-block-wrapper pre {
          margin: 0 !important;
          width: 100%;
          border: none !important;
          border-radius: 0 !important;
        }

        .bn-viewer pre {
          background: var(--code-block-bg, hsl(var(--muted) / 0.5)) !important;
          padding: 1rem 1.25rem !important;
          font-family: ${mono} !important;
          font-size: 0.8125rem !important;
          line-height: 1.75 !important;
          overflow-x: auto;
          color: var(--foreground) !important;
          width: 100%;
          box-sizing: border-box;
        }

        .bn-viewer code { font-family: ${mono} !important; background: hsl(var(--muted)); border: 1px solid hsl(var(--border)); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75em; }
        .bn-viewer pre code { background: none !important; border: none !important; padding: 0 !important; font-size: inherit !important; }
        
        /* Table styles - BlockNote renders tables with tbody only, no thead/th */
        .bn-viewer table,
        .bn-viewer [data-content-type="table"] table,
        .bn-viewer .ProseMirror table,
        .bn-viewer .tableWrapper table { 
          border-collapse: separate !important; 
          border-spacing: 0 !important; 
          width: 100% !important; 
          font-size: 0.8125rem !important; 
          margin: 1.5rem 0 !important; 
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
          border-radius: 0.5rem !important;
          overflow: hidden !important;
        }
        
        /* Style first row as header since BlockNote doesn't use thead/th - use same muted color as code blocks */
        .bn-viewer table tbody tr:first-child,
        .bn-viewer [data-content-type="table"] table tbody tr:first-child,
        .bn-viewer .ProseMirror table tbody tr:first-child { 
          background: hsl(var(--muted)) !important; 
        }
        
        .bn-viewer table tbody tr:first-child td,
        .bn-viewer [data-content-type="table"] table tbody tr:first-child td,
        .bn-viewer .ProseMirror table tbody tr:first-child td { 
          padding: 8px 12px !important; 
          font-weight: 500 !important; 
          text-align: left !important; 
          color: ${isDark ? '#fafafa' : '#18181b'} !important; 
          border: none !important; 
          background: hsl(var(--muted)) !important;
          background-color: hsl(var(--muted)) !important;
          text-transform: none !important;
          letter-spacing: normal !important;
        }
        
        .bn-viewer table tbody tr:first-child td:first-child { border-top-left-radius: 0.5rem !important; }
        .bn-viewer table tbody tr:first-child td:last-child { border-top-right-radius: 0.5rem !important; }
        
        /* Regular table cells (not first row) */
        .bn-viewer td,
        .bn-viewer table td,
        .bn-viewer [data-content-type="table"] td,
        .bn-viewer [data-content-type="table"] table td,
        .bn-viewer .ProseMirror table td { 
          padding: 8px 12px !important; 
          color: ${isDark ? '#a1a1aa' : '#71717a'} !important; 
          border: none !important; 
          border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important; 
        }
        
        .bn-viewer table tr:last-child td:first-child { border-bottom-left-radius: 0.5rem !important; }
        .bn-viewer table tr:last-child td:last-child { border-bottom-right-radius: 0.5rem !important; }
        .bn-viewer table tr:last-child td { border-bottom: none !important; }
        
        /* Also handle actual th elements if they exist - use same muted color as code blocks */
        .bn-viewer th,
        .bn-viewer table th,
        .bn-viewer thead th,
        .bn-viewer table thead th { 
          padding: 8px 12px !important; 
          font-weight: 500 !important; 
          text-align: left !important; 
          color: ${isDark ? '#fafafa' : '#18181b'} !important; 
          border: none !important; 
          background: hsl(var(--muted)) !important;
          background-color: hsl(var(--muted)) !important;
        }
        /* Subtle divider */
        .bn-viewer [data-content-type="horizontalRule"] hr,
        .bn-viewer hr { border: none !important; border-top: 1px solid hsl(var(--border) / 0.3) !important; margin: 1.5rem 0 !important; }
        .bn-viewer ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 1rem 0 !important; }
        .bn-viewer ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 1rem 0 !important; }
        .bn-viewer img { border-radius: 0.75rem; border: 1px solid hsl(var(--border)); max-width: 100%; }
        
        /* Hide image download button and toolbar in viewer - AGGRESSIVE */
        .bn-viewer [data-content-type="image"] button,
        .bn-viewer [data-content-type="image"] .bn-file-download-button,
        .bn-viewer [data-content-type="image"] .bn-file-toolbar,
        .bn-viewer [data-content-type="image"] .bn-image-toolbar,
        .bn-viewer [data-content-type="image"] a[download],
        .bn-viewer [data-image-block] button,
        .bn-viewer [data-image-block] a[download],
        .bn-viewer .bn-file-download-button,
        .bn-viewer .bn-file-toolbar,
        .bn-viewer .bn-image-toolbar,
        .bn-viewer button[aria-label*="download" i],
        .bn-viewer button[aria-label*="Download" i],
        .bn-viewer a[download] { 
          display: none !important; 
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* Hide any hover toolbars on images */
        .bn-viewer img:hover + *,
        .bn-viewer [data-content-type="image"]:hover button,
        .bn-viewer [data-content-type="image"]:hover a,
        .bn-viewer [data-content-type="image"]:hover .bn-file-download-button,
        .bn-viewer [data-image-block]:hover button,
        .bn-viewer [data-image-block]:hover a { 
          display: none !important; 
          visibility: hidden !important;
        }
        
        /* Force image border radius from props */
        .bn-viewer [data-image-block] img {
          border-radius: inherit !important;
        }
        
        /* Global: Hide all download buttons and file toolbars */
        button[aria-label*="download" i],
        button[aria-label*="Download" i],
        a[download],
        .bn-file-download-button,
        .bn-file-toolbar,
        .bn-image-toolbar,
        [class*="download" i] button,
        [class*="Download" i] button {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* ── Multi-column / card grid ── */
        .bn-viewer .bn-block-column-list {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(0, 1fr)) !important;
          gap: 8px !important;
          margin: 0.5rem 0 !important;
          align-items: stretch !important;
        }
        /* Add spacing between consecutive column lists */
        .bn-viewer .bn-block-outer:has(.bn-block-column-list) { margin-bottom: 0 !important; }
        .bn-viewer .bn-block-column { padding: 0 !important; margin: 0 !important; min-width: 0; display: grid !important; grid-template-rows: 1fr; }
        .bn-viewer .bn-block-column .bn-block-outer { padding: 0 !important; margin: 0 !important; display: grid !important; grid-template-rows: 1fr; }
        .bn-viewer .bn-block-column .bn-block-content { padding: 0 !important; margin: 0 !important; display: grid !important; grid-template-rows: 1fr; width: 100% !important; }
        .bn-viewer .bn-block-column .bn-react-node-view-renderer { padding: 0 !important; margin: 0 !important; display: grid !important; grid-template-rows: 1fr; width: 100% !important; }
        .bn-viewer .bn-block-column [data-card] { margin: 0 !important; height: 100% !important; }
        @media (max-width: 640px) { .bn-viewer .bn-block-column-list { grid-template-columns: 1fr !important; } }
        
        /* CardGroup grid support */
        .bn-viewer [data-card-group] .grid-cols-2 { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
        .bn-viewer [data-card-group] .grid-cols-3 { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 1rem !important; }
        @media (max-width: 768px) { 
          .bn-viewer [data-card-group] .grid-cols-2,
          .bn-viewer [data-card-group] .grid-cols-3 { grid-template-columns: 1fr !important; } 
        }

        .bn-viewer .bn-react-node-view-renderer { width: 100% !important; }
        .bn-viewer .bn-block-content { width: 100% !important; }
        .bn-viewer details > summary { cursor: pointer; }
      `}</style>
      </div>

      {/* Try It Modal for API reference articles */}
      {isApiReference && hasEndpoint && (
        <TryItModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          method={method}
          path={path}
          baseUrl={apiBaseUrl}
          primaryColor={primaryColor}
          isDark={isDark}
          description={cleanDescription}
          headingFont={headingFont}
          bodyFont={bodyFont}
          parameters={parameters}
        />
      )}
    </>
  );
}


// Export MethodBadge and METHOD_COLORS for use in ArticlePageWrapper
export { MethodBadge, METHOD_COLORS };
