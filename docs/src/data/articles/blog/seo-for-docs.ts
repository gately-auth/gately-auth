import { bn, h2, h3, p, callout, bullet, numbered, codeBlock, codeGroup, tabs, accordion, step, cardGroup } from '../../blocks';

export const seoForDocsArticle = {
  id: 'seo-for-docs',
  title: 'SEO for Documentation Sites',
  slug: 'seo-for-docs',
  excerpt: 'How Helio handles SEO out of the box — canonical URLs, Open Graph, JSON-LD structured data, sitemaps, and what you should configure yourself.',
  category_id: 'blog',
  is_published: true,
  display_order: 3,
  sidebar_title: null as string | null,
  icon: 'hugeicons:seo' as string | null,
  created_at: '2024-04-01T00:00:00Z',
  updated_at: '2024-04-01T00:00:00Z',
  content: bn([
    p('Documentation sites have a unique SEO challenge. They contain hundreds of articles, many covering similar topics, and they need to rank for long-tail developer queries like "how to authenticate with X API" or "X SDK rate limit error". Getting this right from day one saves months of cleanup later.'),
    p('Here\'s exactly what Helio does for SEO automatically, and what you need to configure yourself.'),

    callout('success', 'Helio generates a sitemap.xml, robots.txt, canonical URLs, Open Graph tags, Twitter cards, and JSON-LD structured data for every page — automatically, with no plugins or configuration required.'),

    h2('What Helio handles automatically'),
    cardGroup(2, [
      { icon: 'hugeicons:link-square-02', title: 'Canonical URLs', body: 'Every page gets a canonical URL tag pointing to itself. Prevents duplicate content issues when the same article is accessible via multiple paths.' },
      { icon: 'hugeicons:share-01', title: 'Open Graph & Twitter', body: 'og:title, og:description, og:image, og:type, twitter:card — generated from article title, excerpt, and og_image_url in config.' },
      { icon: 'hugeicons:code', title: 'JSON-LD Structured Data', body: 'WebSite schema on the home page. Article schema on article pages with datePublished, dateModified, author, and articleSection.' },
      { icon: 'hugeicons:sitemap-01', title: 'Sitemap & Robots', body: 'sitemap.xml lists every published article and category page with lastmod dates. robots.txt allows all crawlers and points to the sitemap.' },
    ]),

    h2('Per-page meta tags'),
    p('Each page type generates different meta tags:'),
    tabs([
      {
        label: 'Home page',
        body: 'title: portal_name + meta_title\ndescription: meta_description or welcome_subtitle\nog:type: website\nJSON-LD: WebSite + Organization schema',
      },
      {
        label: 'Article page',
        body: 'title: article.title\ndescription: article.excerpt\nog:type: article\narticle:published_time, article:modified_time, article:section\nJSON-LD: Article schema + BreadcrumbList',
      },
      {
        label: 'Category page',
        body: 'title: category.name + portal_name\ndescription: category.description\nog:type: website\nJSON-LD: WebSite schema',
      },
    ]),

    h2('What you need to configure'),
    p('Open src/data/config.ts and set these fields:'),
    codeBlock(
      `export const helpCenterConfig = {\n  portal_name: 'Acme Docs',\n  meta_title: 'Acme Docs — Developer Documentation',\n  meta_description: 'Everything you need to integrate with the Acme API. Guides, references, and examples.',\n  og_image_url: '/og-image.png',   // 1200×630px — used for social sharing previews\n  favicon_url: '/favicon.ico',\n};`,
      'typescript'
    ),
    callout('tips', 'The og_image_url is the single most impactful SEO asset you can add. A well-designed 1200×630px image dramatically increases click-through rates from social shares and Slack/Discord link previews.'),

    h2('Article-level SEO'),
    p('Every article has an excerpt field that becomes the meta description for that page. Write excerpts as complete sentences that describe what the reader will learn — not just a title restatement:'),
    codeBlock(
      `// Bad — just restates the title\nexcerpt: 'Authentication guide.',\n\n// Good — describes what the reader learns\nexcerpt: 'How to authenticate API requests using Bearer tokens, manage key scopes, rotate keys without downtime, and handle 401/403 errors.',`,
      'typescript'
    ),

    h2('Sitemap'),
    p('The sitemap is generated dynamically at /sitemap.xml. It includes:'),
    bullet('The home page with changefreq: daily, priority: 1.0'),
    bullet('Every category page with changefreq: weekly, priority: 0.8'),
    bullet('Every published article with changefreq: weekly, priority: 0.9, and the article\'s updated_at as lastmod'),
    p('Submit your sitemap to Google Search Console after deploying:'),
    codeBlock('https://your-domain.com/sitemap.xml', 'bash'),

    h2('Robots.txt'),
    p('The robots.txt at /robots.txt allows all major crawlers and blocks known scrapers (AhrefsBot, SemrushBot, MJ12bot, DotBot). It points crawlers to the sitemap.'),
    callout('note', 'If you want to block all crawlers — for example on a staging environment — you can modify src/pages/robots.txt.ts to return Disallow: / for all user agents.'),

    h2('Structured data'),
    p('Helio injects three JSON-LD scripts on article pages:'),
    accordion('Article schema', 'Includes headline, datePublished, dateModified, author (Organization), publisher (Organization with logo), image (ImageObject), mainEntityOfPage, inLanguage, and articleSection. This helps Google display rich results for your articles.'),
    accordion('BreadcrumbList schema', 'Home → Category → Article. Helps Google display breadcrumb navigation in search results, which increases click-through rates.'),
    accordion('Organization schema', 'Name, URL, logo, description, and contactPoint. Appears on every page. Helps Google associate your help center with your brand.'),

    h2('Core Web Vitals'),
    p('Helio is built for performance. A few things that help:'),
    bullet('Astro renders pages server-side — no client-side data fetching on load'),
    bullet('Fonts are preloaded with rel="preload" and use font-display: swap'),
    bullet('Geist Mono is served from public/ — no external font CDN request for code'),
    bullet('Images use standard img tags — add loading="lazy" for below-the-fold images'),
    bullet('Cloudflare Pages serves assets from the edge — sub-50ms TTFB globally'),
    callout('tips', 'Run Lighthouse on your deployed site after adding your content. The biggest wins are usually image optimization and removing any unused third-party scripts.'),
  ]),
};
