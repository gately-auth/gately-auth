// ─────────────────────────────────────────────────────────────────────────────
// Gately Auth — MCP docs layer
//
// Fetches live content from auth.usegately.com/articles.txt instead of
// duplicating docs here. The MCP Worker caches the response in KV for
// performance, falling back to a fetch on cache miss.
// ─────────────────────────────────────────────────────────────────────────────

export interface DocEntry {
  id: string;
  title: string;
  category: string;
  slug: string;
  url: string;
  content: string;
  tags: string[];
}

const DOCS_URL = 'https://auth.usegately.com/articles.txt';
const BASE_URL = 'https://auth.usegately.com';
const CACHE_TTL_SECONDS = 300; // 5 minutes

// In-memory cache so we only fetch once per Worker isolate lifetime
let cachedDocs: DocEntry[] | null = null;
let cacheTime = 0;

/**
 * Fetch and parse the live articles.txt into DocEntry objects.
 * Returns cached result if fresh enough.
 */
export async function getDocs(): Promise<DocEntry[]> {
  const now = Date.now();
  if (cachedDocs && now - cacheTime < CACHE_TTL_SECONDS * 1000) {
    return cachedDocs;
  }

  try {
    const res = await fetch(DOCS_URL, {
      headers: { 'User-Agent': 'gately-auth-mcp/1.0' },
      // CF edge cache — reuse for up to 5 min
      cf: { cacheTtl: CACHE_TTL_SECONDS, cacheEverything: true } as any,
    });

    if (!res.ok) throw new Error(`articles.txt returned ${res.status}`);

    const text = await res.text();
    cachedDocs = parseArticlesTxt(text);
    cacheTime = now;
    return cachedDocs;
  } catch (err) {
    // If live fetch fails, return cached stale data or empty
    if (cachedDocs) return cachedDocs;
    console.error('Failed to fetch docs:', err);
    return [];
  }
}

/**
 * Parse the articles.txt format:
 *
 * ---
 * Title: Quick Start
 * Category: Getting Started
 * ---
 *
 * <content>
 *
 * ---
 *
 * Title: ...
 */
function parseArticlesTxt(text: string): DocEntry[] {
  const entries: DocEntry[] = [];

  // Split on the separator between articles
  const blocks = text.split(/\n---\n\n(?=Title:|---\nTitle:)/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Extract front-matter lines
    const titleMatch = trimmed.match(/^(?:---\n)?Title:\s*(.+)/m);
    const categoryMatch = trimmed.match(/^Category:\s*(.+)/m);

    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const category = categoryMatch ? categoryMatch[1].trim() : 'General';

    // Content is everything after the front-matter block
    const contentStart = trimmed.indexOf('\n\n');
    const rawContent = contentStart >= 0 ? trimmed.slice(contentStart).trim() : trimmed;

    // Convert to plain readable text
    const content = extractReadableText(rawContent);

    // Derive slug and id from title
    const slug = slugify(title);
    const id = slug;

    // Build tags from title + category words
    const tags = [
      ...slug.split('-'),
      ...category.toLowerCase().split(/\s+/),
    ].filter(Boolean);

    entries.push({
      id,
      title,
      category,
      slug,
      url: `${BASE_URL}/article/${slug}`,
      content,
      tags,
    });
  }

  return entries;
}

/**
 * Extract readable plain text from content that may be:
 * - BlockNote JSON (array of block objects)
 * - HTML string
 * - Already plain text
 */
function extractReadableText(raw: string): string {
  const trimmed = raw.trim();

  // Detect BlockNote JSON — starts with [{
  if (trimmed.startsWith('[{') || trimmed.startsWith('[{\n')) {
    try {
      const blocks = JSON.parse(trimmed);
      return blocksToText(blocks);
    } catch {
      // fall through to HTML stripping
    }
  }

  // Strip HTML tags
  return trimmed
    .replace(/<\/p>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/g, (_, l, t) => `\n${'#'.repeat(Number(l))} ${t}\n`)
    .replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n')
    .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
    .replace(/<[^>]*>/gm, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Recursively extract text from BlockNote block array */
function blocksToText(blocks: any[]): string {
  if (!Array.isArray(blocks)) return '';
  return blocks.map(block => blockToText(block)).filter(Boolean).join('\n\n').trim();
}

function blockToText(block: any): string {
  if (!block || typeof block !== 'object') return '';

  const type: string = block.type ?? '';
  const content: any[] = Array.isArray(block.content) ? block.content : [];
  const children: any[] = Array.isArray(block.children) ? block.children : [];

  // Extract inline text from content array
  const inlineText = content
    .map((c: any) => {
      if (c.type === 'text') return c.text ?? '';
      if (c.type === 'link') {
        const linkText = (c.content ?? []).map((lc: any) => lc.text ?? '').join('');
        return `${linkText} (${c.href ?? ''})`;
      }
      return '';
    })
    .join('');

  let result = '';

  switch (type) {
    case 'heading': {
      const level = block.props?.level ?? 2;
      result = `${'#'.repeat(level)} ${inlineText}`;
      break;
    }
    case 'bulletListItem':
      result = `- ${inlineText}`;
      break;
    case 'numberedListItem':
      result = `1. ${inlineText}`;
      break;
    case 'codeBlock':
      result = `\`\`\`${block.props?.language ?? ''}\n${inlineText}\n\`\`\``;
      break;
    case 'table': {
      // Tables are nested differently — just extract all text
      result = inlineText || blocksToText(content as any[]);
      break;
    }
    default:
      result = inlineText;
  }

  // Append children
  if (children.length > 0) {
    const childText = blocksToText(children);
    if (childText) result += '\n' + childText;
  }

  return result;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Search / lookup helpers ───────────────────────────────────────────────────

export async function searchDocs(query: string, limit = 5): Promise<DocEntry[]> {
  const all = await getDocs();
  const q = query.toLowerCase();

  const scored = all.map(doc => {
    let score = 0;
    if (doc.title.toLowerCase().includes(q)) score += 10;
    if (doc.category.toLowerCase().includes(q)) score += 5;
    if (doc.tags.some(t => t.includes(q))) score += 8;
    if (doc.content.toLowerCase().includes(q)) score += 3;
    for (const word of q.split(/\s+/)) {
      if (word.length < 2) continue;
      if (doc.title.toLowerCase().includes(word)) score += 4;
      if (doc.content.toLowerCase().includes(word)) score += 1;
    }
    return { doc, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.doc);
}

export async function getDoc(id: string): Promise<DocEntry | null> {
  const all = await getDocs();
  return all.find(d => d.id === id || d.slug === id) ?? null;
}

export async function getDocsByCategory(category: string): Promise<DocEntry[]> {
  const all = await getDocs();
  return all.filter(d => d.category.toLowerCase() === category.toLowerCase());
}

export async function listCategories(): Promise<string[]> {
  const all = await getDocs();
  return [...new Set(all.map(d => d.category))];
}
