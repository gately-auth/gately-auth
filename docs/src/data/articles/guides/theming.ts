export const themingArticle = {
  id: 'theming',
  title: 'Theming & Branding',
  slug: 'theming',
  excerpt: 'Customise colors, fonts, and dark mode for your help center.',
  category_id: 'guides',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:paint-brush-01' as string | null,
  created_at: '2024-01-21T00:00:00Z',
  updated_at: '2024-01-21T00:00:00Z',
  content: `
<h2>Theming &amp; Branding</h2>
<p>The help center supports full branding customisation — colors, fonts, logo, and dark mode — all from <code>src/data/config.ts</code>.</p>

<h2>Colors</h2>
<p>Set your brand color with <code>primary_color</code>. This drives button backgrounds, active sidebar states, and link hover colors.</p>

<pre><code class="language-ts">primary_color: '#6366f1',   // indigo
// or
primary_color: '#10b981',   // emerald
// or
primary_color: '#f59e0b',   // amber</code></pre>

<h2>Dark mode</h2>
<p>Control the default theme with <code>theme_mode</code>:</p>
<ul>
  <li><code>'light'</code> — always light</li>
  <li><code>'dark'</code> — always dark</li>
  <li><code>'auto'</code> — follows the user's OS preference, with a toggle button in the header</li>
</ul>

<h2>Fonts</h2>
<p>Set Google Font names for headings and body text:</p>

<pre><code class="language-ts">heading_font: 'Inter',
body_font: 'Inter',</code></pre>

<p>Fonts are loaded via the <code>useGoogleFonts</code> hook in <code>src/hooks/useGoogleFonts.ts</code>. Any font available on <a href="https://fonts.google.com">Google Fonts</a> works.</p>

<h2>Logo</h2>
<p>Place your logo in <code>public/</code> and reference it:</p>

<pre><code class="language-ts">logo_url: '/my-logo.png',</code></pre>

<p>Recommended size: 120×32px or similar horizontal lockup. SVG works too.</p>

<h2>Tailwind customisation</h2>
<p>For deeper style changes, edit <code>tailwind.config.mjs</code> and <code>src/styles/globals.css</code>. The template uses standard Tailwind utility classes throughout.</p>
  `.trim(),
};
