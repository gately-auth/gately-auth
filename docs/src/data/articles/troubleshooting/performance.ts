export const performanceArticle = {
  id: 'performance',
  title: 'Performance Tips',
  slug: 'performance',
  excerpt: 'How to keep your integration fast and avoid common performance pitfalls.',
  category_id: 'troubleshooting',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:dashboard-speed-02' as string | null,
  created_at: '2024-02-02T00:00:00Z',
  updated_at: '2024-02-02T00:00:00Z',
  content: `
<h2>Performance Tips</h2>

<h3>Cache API responses</h3>
<p>Most data doesn't change frequently. Cache responses in memory or a key-value store to avoid redundant requests:</p>

<pre><code class="language-ts">const cache = new Map<string, { data: any; expiresAt: number }>();

async function getCached(key: string, fetcher: () => Promise<any>, ttlMs = 60_000) {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.data;
  const data = await fetcher();
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}</code></pre>

<h3>Use pagination</h3>
<p>Don't fetch all records at once. Use <code>limit</code> and <code>offset</code> parameters:</p>

<pre><code class="language-bash">GET /v1/articles?limit=20&offset=0</code></pre>

<h3>Parallel requests</h3>
<p>Use <code>Promise.all</code> to fetch independent resources in parallel:</p>

<pre><code class="language-ts">const [articles, categories] = await Promise.all([
  getArticles(),
  getCategories(),
]);</code></pre>

<h3>Avoid waterfalls</h3>
<p>Don't chain requests that don't depend on each other. Fetch everything you need upfront at the page level, then pass data down to components as props.</p>

<h3>Lazy load heavy components</h3>
<p>Components like the search modal and AI chat panel are only loaded when the user opens them. Keep this pattern when adding new heavy components.</p>
  `.trim(),
};
