import { bn, h2, p, callout, bullet, codeBlock, cardGroup, codeGroup } from '../../blocks';

export const introducingHelioArticle = {
  id: 'introducing-helio',
  title: 'Introducing Helio',
  slug: 'introducing-helio',
  excerpt: 'Helio is a modern help center and documentation template built with Astro. Here\'s why we built it and what makes it different.',
  category_id: 'blog',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:announcement-01' as string | null,
  created_at: '2024-03-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
  content: bn([
    p('Today we\'re releasing Helio — a help center and documentation template built with Astro, React, and Tailwind CSS. It\'s designed for startups, SaaS products, and developer tools that want a fast, clean, professional support site without the complexity of a full CMS.'),

    callout('info', 'Helio is open source and free to use. Deploy it to Cloudflare Pages in under 5 minutes.'),

    h2('Why we built it'),
    p('Most documentation tools fall into one of two categories: hosted platforms that lock you in and charge per seat, or static site generators that require significant setup and maintenance. We wanted something in between — a template you own completely, that works out of the box, and that\'s fast enough to score 100 on Lighthouse.'),

    h2('What\'s included'),
    cardGroup(2, [
      { icon: 'hugeicons:rocket-01', title: 'Zero config content', body: 'Write articles as TypeScript files. No database, no CMS, no API calls. Just edit a file and save.' },
      { icon: 'hugeicons:search-01', title: 'Instant search', body: 'Full-text client-side search across all articles. Cmd+K opens it from anywhere.' },
      { icon: 'hugeicons:ai-brain-01', title: 'Local AI assistant', body: 'Ask AI panel with keyword search — no API key or external service required.' },
      { icon: 'hugeicons:layout-01', title: 'Rich content blocks', body: 'Callouts, tabs, code groups, steps, cards, accordions, param fields — all composable.' },
    ]),

    h2('Built on the right stack'),
    p('Helio is built on tools that are fast, well-maintained, and widely understood:'),
    bullet('Astro 5 — server-side rendering with zero client JS by default'),
    bullet('React 18 — interactive components only where needed'),
    bullet('Tailwind CSS 3 — utility-first styling with no runtime overhead'),
    bullet('BlockNote — rich content viewer with custom block specs'),
    bullet('Cloudflare Pages — edge rendering, global CDN, free tier'),

    h2('Get started'),
    codeBlock('git clone https://github.com/your-org/helio.git\ncd helio\nnpm install\nnpm run dev', 'bash'),
    callout('tips', 'The first thing to do after cloning is open src/data/config.ts and update portal_name, primary_color, and welcome_title to match your brand.'),
  ]),
};
