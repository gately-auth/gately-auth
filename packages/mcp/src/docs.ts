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
    const content = contentStart >= 0 ? trimmed.slice(contentStart).trim() : trimmed;

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
