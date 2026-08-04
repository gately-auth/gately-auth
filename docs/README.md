# Helio

**Help Center & Documentation Template built with Astro**

Helio is a modern, fast, and fully customisable help center template for startups, SaaS products, and developer tools. It gives you a professional support site — like Stripe, Vercel, or Notion docs — without the complexity of a CMS or a third-party platform.

Built with Astro, React, Tailwind CSS, and deployed to Cloudflare Pages.

---

## Features

- Local file-based content — no database or API required out of the box
- Full-text client-side search (Cmd+K / Ctrl+K)
- Ask AI panel — local keyword search, no API key needed
- Dark mode — system-aware with manual toggle, flash-free
- Folder navigation — group categories into top-level sections (Docs, API Reference, Blog)
- 9 sidebar styles — default, minimal, compact, cards, modern, floating, bordered, gradient, accordion
- Rich content blocks — callout, tabs, code group, steps, cards, accordion, expandable, param/response fields
- Responsive — mobile drawer navigation, consistent padding across breakpoints
- SEO — canonical URLs, Open Graph, Twitter cards, JSON-LD structured data, sitemap.xml, robots.txt
- Fonts — Onest (body) + Geist Mono (headings + code), loaded locally and from Google Fonts
- Copy as Markdown — one-click copy of any article
- Deploy to Cloudflare Pages in one command

---

## Quick Start

```bash
git clone https://github.com/your-org/helio.git
cd helio
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

---

## Project Structure

```
src/
  data/
    index.ts          # central registry — import all content here
    config.ts         # branding, fonts, colors, SEO
    faqs.ts           # home page FAQ accordion
    blocks.ts         # block builder helpers (callout, tabs, steps, etc.)
    folders.ts        # top-level nav sections (Docs, API Reference, Blog)
    categories/       # one .ts file per category
    articles/         # one folder per category, one .ts file per article
  components/         # React UI components
  pages/              # Astro SSR pages
  lib/
    localData.ts      # data layer — swap this to use a CMS or database
  hooks/
    useFolderSync.ts  # cross-component folder state sync
  styles/
    globals.css       # Tailwind base + font declarations
```

---

## Managing Content

### Configuration

All branding and portal settings live in `src/data/config.ts`:

```ts
export const helpCenterConfig = {
  portal_name: 'Helio',
  primary_color: '#ea4e1e',
  welcome_title: 'How can we help you?',
  welcome_subtitle: 'Search our docs or browse categories below.',
  theme_mode: 'auto',          // 'light' | 'dark' | 'auto'
  heading_font: 'Geist Mono',
  body_font: 'Onest',
  sidebar_style: 'default',    // see Sidebar Styles below
  logo_url: '/Helio_logo.png',
  show_search: true,
  show_primary_button: true,
  primary_button_label: 'Get Started',
  primary_button_url: 'https://your-app.com',
  header_links: [
    { label: 'Home', url: '/' },
    { label: 'GitHub', url: 'https://github.com' },
    { label: 'Website', url: 'https://usegately.com' },
  ],
  meta_title: 'Helio — Help Center',
  meta_description: 'Fast, clean documentation template built with Astro.',
};
```

### Adding a folder

Folders appear in the secondary nav bar under the header. Edit `src/data/folders.ts`:

```ts
export const folders = [
  { id: 'docs', name: 'Docs', slug: 'docs', icon: 'hugeicons:book-open-01', is_default: true, display_order: 1 },
  { id: 'api',  name: 'API Reference', slug: 'api-reference', icon: 'hugeicons:code', is_default: false, display_order: 2 },
  { id: 'blog', name: 'Blog', slug: 'blog', icon: 'hugeicons:quill-write-01', is_default: false, display_order: 3 },
];
```

### Adding a category

Create `src/data/categories/my-category.ts`:

```ts
export const myCategoryCategory = {
  id: 'my-category',
  name: 'My Category',
  description: 'What this category covers.',
  icon: 'hugeicons:star',
  display_order: 5,
  folder_id: 'docs',   // must match a folder id
  parent_category_id: null,
};
```

Register it in `src/data/index.ts`:

```ts
import { myCategoryCategory } from './categories/my-category';
export const categories = [...existingCategories, myCategoryCategory];
```

### Adding an article

Create `src/data/articles/my-category/my-article.ts`:

```ts
import { bn, h2, p, callout, codeGroup, step } from '../../blocks';

export const myArticle = {
  id: 'my-article',
  title: 'My Article',
  slug: 'my-article',
  excerpt: 'Short description shown in search and SEO.',
  category_id: 'my-category',
  is_published: true,
  display_order: 1,
  sidebar_title: null,
  icon: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  content: bn([
    h2('Overview'),
    p('Your content here.'),
    callout('info', 'This feature requires Node.js 18+.'),
    step(1, 'Install', 'npm install my-package'),
    step(2, 'Configure', 'Add your API key to .env'),
    codeGroup([
      { label: 'TypeScript', language: 'typescript', code: 'const client = new Client({ apiKey });' },
      { label: 'Python',     language: 'python',     code: 'client = Client(api_key=api_key)' },
    ]),
  ]),
};
```

Register it in `src/data/index.ts`:

```ts
import { myArticle } from './articles/my-category/my-article';
export const articles = [...existingArticles, myArticle];
```

### Content blocks

All blocks are composed using helpers from `src/data/blocks.ts`:

| Helper | Block |
|---|---|
| `h2(text)`, `h3(text)` | Headings (appear in Table of Contents) |
| `p(text)` | Paragraph |
| `bullet(text)`, `numbered(text)` | List items |
| `callout(type, text)` | Callout — `info`, `tips`, `warning`, `error`, `success`, `check`, `note` |
| `codeBlock(code, language)` | Syntax-highlighted code with copy button |
| `codeGroup([{label, language, code}])` | Multi-tab code block |
| `step(number, title, body)` | Numbered step with connecting line |
| `tabs([{label, body}])` | Tabbed panels (up to 4) |
| `accordion(title, body)` | Collapsible section |
| `expandable(title, body)` | Inline expandable for nested detail |
| `card({icon, title, body, href})` | Linked or static card |
| `cardGroup(columns, cards[])` | 2 or 3 column card grid |
| `paramField(name, type, required, desc)` | API parameter field |
| `responseField(name, type, required, desc)` | API response field |
| `checkItem(text, checked?)` | Checklist item |
| `quote(text)` | Blockquote with primary color border |
| `divider()` | Horizontal rule |

### Sidebar styles

Set `sidebar_style` in `config.ts` to one of:
`default` · `minimal` · `compact` · `cards` · `modern` · `floating` · `bordered` · `gradient` · `accordion`

---

## Switching to a CMS or Database

The entire data layer is in `src/lib/localData.ts`. It exports these functions:

```ts
getArticles()
getCategories()
getHelpCenterConfig()
getFaqs()
getFolders()
getArticleBySlug(projectId, slug)
getOpenApiSpec()
```

To switch to any data source, replace the implementations in `localData.ts`. The pages and components don't change — they only call these functions.

### Option 1 — Supabase

Install the client:

```bash
npm install @supabase/supabase-js
```

Create a `.env` file:

```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Replace `localData.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export async function getArticles() {
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .order('display_order');
  return data ?? [];
}

export async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('display_order');
  return data ?? [];
}

export async function getHelpCenterConfig() {
  const { data } = await supabase
    .from('config')
    .select('*')
    .single();
  return data;
}

export async function getFaqs() {
  const { data } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_published', true);
  return data ?? [];
}

export async function getFolders() {
  const { data } = await supabase
    .from('folders')
    .select('*')
    .order('display_order');
  return data ?? [];
}

export async function getArticleBySlug(_projectId: string, slug: string) {
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  return data ?? null;
}

export async function getOpenApiSpec() {
  return null;
}
```

Suggested Supabase table schemas:

```sql
create table articles (
  id text primary key,
  title text not null,
  slug text unique not null,
  content text,
  excerpt text,
  category_id text,
  is_published boolean default true,
  display_order int default 0,
  sidebar_title text,
  icon text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table categories (
  id text primary key,
  name text not null,
  description text,
  icon text,
  display_order int default 0,
  folder_id text,
  parent_category_id text
);

create table folders (
  id text primary key,
  name text not null,
  slug text unique not null,
  icon text,
  description text,
  is_default boolean default false,
  display_order int default 0
);

create table faqs (
  id text primary key,
  question text not null,
  answer text not null,
  is_published boolean default true
);
```

### Option 2 — Cloudflare D1

D1 is Cloudflare's serverless SQLite database. It runs at the edge alongside your Pages deployment.

Create a D1 database:

```bash
npx wrangler d1 create helio-db
```

Add it to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "helio-db"
database_id = "your-database-id"
```

Update `astro.config.mjs` to expose the D1 binding:

```js
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare({ mode: 'directory' }),
});
```

Access D1 in your Astro pages via `Astro.locals.runtime.env.DB`, then pass it into your data functions. Replace `localData.ts`:

```ts
// localData.ts — D1 version
// Call these with the D1 binding from Astro.locals.runtime.env.DB

export async function getArticles(db: D1Database) {
  const { results } = await db
    .prepare('SELECT * FROM articles WHERE is_published = 1 ORDER BY display_order')
    .all();
  return results;
}

export async function getCategories(db: D1Database) {
  const { results } = await db
    .prepare('SELECT * FROM categories ORDER BY display_order')
    .all();
  return results;
}

export async function getFolders(db: D1Database) {
  const { results } = await db
    .prepare('SELECT * FROM folders ORDER BY display_order')
    .all();
  return results;
}

export async function getHelpCenterConfig(db: D1Database) {
  return db.prepare('SELECT * FROM config LIMIT 1').first();
}

export async function getFaqs(db: D1Database) {
  const { results } = await db
    .prepare('SELECT * FROM faqs WHERE is_published = 1')
    .all();
  return results;
}

export async function getArticleBySlug(db: D1Database, slug: string) {
  return db
    .prepare('SELECT * FROM articles WHERE slug = ? AND is_published = 1')
    .bind(slug)
    .first();
}

export async function getOpenApiSpec() {
  return null;
}
```

In your Astro pages, pass the binding:

```ts
// src/pages/index.astro
const db = Astro.locals.runtime.env.DB;
const [articles, categories, config, faqs, folders] = await Promise.all([
  getArticles(db),
  getCategories(db),
  getHelpCenterConfig(db),
  getFaqs(db),
  getFolders(db),
]);
```

Create the D1 schema:

```bash
npx wrangler d1 execute helio-db --file=./SCHEMA.sql
```

```sql
-- SCHEMA.sql
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  category_id TEXT,
  is_published INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  sidebar_title TEXT,
  icon TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  folder_id TEXT,
  parent_category_id TEXT
);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  is_default INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_published INTEGER DEFAULT 1
);
```

---

## Deploy

```bash
npm run build
npm run deploy
```

Or connect your GitHub repo to Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: `18`

No environment variables are required for local data mode.

---

## Tech Stack

- [Astro 5](https://astro.build) — SSR framework, edge-ready
- [React 18](https://react.dev) — interactive components
- [Tailwind CSS 3](https://tailwindcss.com) — utility-first styling
- [BlockNote](https://www.blocknotejs.org) — rich content viewer with custom block specs
- [Radix UI](https://www.radix-ui.com) — accessible primitives
- [Cloudflare Pages](https://pages.cloudflare.com) — hosting and edge rendering


