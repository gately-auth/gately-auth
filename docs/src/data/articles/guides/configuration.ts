import { bn, h2, h3, p, bullet, numbered, codeBlock, callout, tabs, accordion, expandable, codeGroup } from '../../blocks';

export const configurationArticle = {
  id: 'configuration-guide',
  title: 'Configuration Guide',
  slug: 'configuration-guide',
  excerpt: 'Every configuration option in src/data/config.ts — branding, fonts, SEO, sidebar, header, and more.',
  category_id: 'guides',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:settings-01' as string | null,
  created_at: '2024-01-20T00:00:00Z',
  updated_at: '2024-01-20T00:00:00Z',
  content: bn([
    p('All Helio settings live in a single file: src/data/config.ts. Edit this file to customise your portal name, brand color, fonts, SEO metadata, sidebar style, and header links. Changes take effect immediately in the dev server.'),

    callout('tips', 'Start here before writing any content. Getting the branding right first means every article you write will look correct from the start.'),

    h2('Branding'),
    codeBlock(
      `export const helpCenterConfig = {\n  portal_name: 'Helio',           // shown in header, browser tab, and SEO\n  primary_color: '#ea4e1e',       // brand color — buttons, links, active states\n  secondary_color: '#c43d10',     // used for hover states and gradients\n  welcome_title: 'How can we help you?',\n  welcome_subtitle: 'Search our documentation or browse categories below.',\n  logo_url: null,                 // set to '/logo.svg' or a URL\n  favicon_url: null,              // set to '/favicon.ico' or a URL\n};`,
      'typescript'
    ),

    h2('Theme'),
    codeBlock(
      `  theme_mode: 'auto',  // 'light' | 'dark' | 'auto'\n  // auto = follows OS preference, with a toggle button in the header`,
      'typescript'
    ),
    tabs([
      { label: 'light', body: 'Always renders in light mode. The theme toggle button is hidden.' },
      { label: 'dark', body: 'Always renders in dark mode. The theme toggle button is hidden.' },
      { label: 'auto', body: 'Follows the user\'s OS preference on first visit. Shows a sun/moon toggle in the header. Preference is saved to localStorage.' },
    ]),

    h2('Fonts'),
    codeBlock(
      `  heading_font: 'Onest',   // Google Font name for h1-h6\n  body_font: 'Onest',      // Google Font name for body text and UI\n  // Geist Mono is always used for code blocks — loaded from public/Geist_Mono/`,
      'typescript'
    ),
    callout('info', 'Any font available on Google Fonts works. The font is loaded via a @import in globals.css and applied via CSS custom properties. Geist Mono is always used for code regardless of body_font.'),

    h2('Sidebar style'),
    codeBlock(
      `  sidebar_style: 'default',\n  // Options: default | minimal | compact | cards | modern | floating | bordered | gradient | accordion`,
      'typescript'
    ),
    accordion('default', 'Standard list with category icons and article titles. Active item has a subtle background fill.'),
    accordion('minimal', 'No icons, compact spacing, clean typography. Best for text-heavy documentation.'),
    accordion('bordered', 'Left border accent on the active item using primary_color. Clean and professional.'),
    accordion('modern', 'Pill-shaped active state with a background fill. Feels like a native app sidebar.'),
    accordion('accordion', 'Categories collapse and expand. Best when you have many categories and want to reduce visual noise.'),

    h2('Header'),
    codeBlock(
      `  header_links: [\n    { label: 'Home', url: '/' },\n    { label: 'Blog', url: 'https://your-site.com/blog' },\n  ],\n  show_primary_button: true,\n  primary_button_label: 'Get Started',\n  primary_button_url: 'https://app.your-site.com/signup',`,
      'typescript'
    ),
    callout('note', 'The header shows a maximum of 2 navigation links. Additional links are ignored. The primary button always renders to the right of the links.'),

    h2('SEO'),
    codeBlock(
      `  meta_title: 'Helio — Help Center & Documentation Template',\n  meta_description: 'Fast, clean, professional help center built with Astro.',\n  og_image_url: '/og-image.png',   // 1200×630px recommended`,
      'typescript'
    ),
    p('These values are used as fallbacks. Individual article pages use the article title and excerpt for their own meta tags.'),

    expandable('Show all SEO tags generated per page', 'title, meta description, canonical URL, og:type, og:title, og:description, og:image, og:site_name, twitter:card, twitter:title, twitter:description, twitter:image, article:published_time, article:modified_time, article:section, JSON-LD WebSite/Article schema, JSON-LD BreadcrumbList, JSON-LD Organization'),

    h2('Search'),
    codeBlock(
      `  show_search: true,       // show/hide the search bar in the hero and header\n  show_categories: true,   // show/hide the categories grid on the home page`,
      'typescript'
    ),

    h2('AI panel'),
    codeBlock(
      `  ai_answer_enabled: false,  // set to true to show the Ask AI button in the header`,
      'typescript'
    ),
    callout('info', 'The AI panel uses local keyword search — no API key or external service required. It searches article titles, excerpts, and content and returns the top 5 matches with a generated summary.'),
  ]),
};
