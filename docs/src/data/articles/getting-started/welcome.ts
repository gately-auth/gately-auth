export const welcomeArticle = {
  id: 'welcome',
  title: 'Welcome to Helio',
  slug: 'welcome',
  excerpt: 'Helio is a modern help center and documentation template built with Astro. Learn what it is, what it includes, and how to make it yours.',
  category_id: 'getting-started',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:star' as string | null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  content: `
<h2>What is Helio?</h2>
<p>Helio is a help center and documentation template built with <strong>Astro</strong>, <strong>React</strong>, and <strong>Tailwind CSS</strong>. It gives startups, SaaS products, and developer tools a fast, clean, and professional support site — without the complexity of a full CMS or a third-party platform.</p>

<p>If you've ever looked at the docs for <strong>Stripe</strong>, <strong>Vercel</strong>, or <strong>Notion</strong> and thought "I want something like that" — Helio is your starting point.</p>

<blockquote>
  <p><strong>No database. No API. No CMS.</strong> All content lives in TypeScript files in <code>src/data/</code>. Edit a file, save, done.</p>
</blockquote>

<h2>What's included</h2>
<table>
  <thead>
    <tr><th>Feature</th><th>Details</th></tr>
  </thead>
  <tbody>
    <tr><td>Article pages</td><td>Full-width article layout with TOC, prev/next navigation, and feedback widget</td></tr>
    <tr><td>Category pages</td><td>Grid of articles grouped by category with icons and descriptions</td></tr>
    <tr><td>Home page</td><td>Hero section, category grid, and FAQ accordion</td></tr>
    <tr><td>Search</td><td>Full-text client-side search across all articles — Cmd+K / Ctrl+K</td></tr>
    <tr><td>Ask AI</td><td>Local keyword-search AI panel in the sidebar — no API key needed</td></tr>
    <tr><td>Dark mode</td><td>System-aware with manual toggle, persisted in localStorage</td></tr>
    <tr><td>SEO</td><td>Canonical URLs, Open Graph, Twitter cards, JSON-LD structured data, sitemap.xml, robots.txt</td></tr>
    <tr><td>Fonts</td><td>Onest (headings + body) + Geist Mono (code) — loaded locally and from Google Fonts</td></tr>
    <tr><td>Sidebar styles</td><td>9 visual variants: default, minimal, compact, cards, modern, floating, bordered, gradient, accordion</td></tr>
    <tr><td>Deploy</td><td>One command deploy to Cloudflare Pages</td></tr>
  </tbody>
</table>

<h2>How content works</h2>
<p>Content is stored as plain TypeScript objects in <code>src/data/</code>. There's no database, no API call, and no build-time data fetching from an external service. Everything is local.</p>

<pre><code class="language-ts">// src/data/articles/getting-started/my-article.ts
export const myArticle = {
  id: 'my-article',
  title: 'My First Article',
  slug: 'my-article',
  excerpt: 'A short description shown in search results.',
  category_id: 'getting-started',
  is_published: true,
  display_order: 1,
  content: \`
&lt;h2&gt;Introduction&lt;/h2&gt;
&lt;p&gt;Write your content here as HTML.&lt;/p&gt;
  \`.trim(),
};</code></pre>

<p>Once you've created the file, register it in <code>src/data/index.ts</code> and it appears in the sidebar, search, and sitemap automatically.</p>

<h2>Project structure</h2>
<pre><code class="language-bash">src/
  data/
    index.ts          # central registry — import everything here
    config.ts         # branding, fonts, SEO settings
    faqs.ts           # home page FAQ accordion
    categories/       # one file per category
    articles/         # one folder per category, one file per article
  components/         # React UI components
  pages/              # Astro pages (SSR)
  lib/
    localData.ts      # data layer — replaces any external API
  styles/
    globals.css       # Tailwind base + font imports</code></pre>

<h2>Navigating this help center</h2>
<ul>
  <li>Use the <strong>sidebar</strong> on the left to browse categories and articles</li>
  <li>Press <strong>Cmd+K</strong> (Mac) or <strong>Ctrl+K</strong> (Windows/Linux) to open search</li>
  <li>Click <strong>Ask AI</strong> in the top nav to open the AI assistant panel</li>
  <li>Use the <strong>Table of Contents</strong> on the right to jump to sections within a long article</li>
  <li>Use the <strong>← →</strong> navigation at the bottom of each article to move between articles</li>
</ul>

<h2>Next steps</h2>
<ol>
  <li>Read the <a href="/article/installation">Installation</a> guide to get the project running locally</li>
  <li>Follow the <a href="/article/quick-start">Quick Start</a> to make your first content change</li>
  <li>Open <code>src/data/config.ts</code> and update <code>portal_name</code>, <code>primary_color</code>, and <code>welcome_title</code> to match your brand</li>
  <li>Replace the template articles in <code>src/data/articles/</code> with your own documentation</li>
  <li>Run <code>npm run deploy</code> to publish to Cloudflare Pages</li>
</ol>

<blockquote>
  <p><strong>Tip:</strong> The fastest way to get started is to edit <code>src/data/config.ts</code> first — change the name, color, and welcome text. You'll see the whole site update instantly in the dev server.</p>
</blockquote>
  `.trim(),
};
