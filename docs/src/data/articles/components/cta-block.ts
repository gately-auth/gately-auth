import { bn, h2, h3, p, bullet, codeBlock, callout, tabs, accordion, cardGroup, expandable } from '../../blocks';

export const ctaBlockArticle = {
  id: 'cta-block',
  title: 'Card & Card Group Block',
  slug: 'cta-block',
  excerpt: 'Linked or static cards with icon, title, body, and optional image. Renders in 2 or 3 column grids.',
  category_id: 'components',
  is_published: true,
  display_order: 5,
  sidebar_title: null as string | null,
  icon: 'hugeicons:cursor-pointer-01' as string | null,
  created_at: '2024-01-14T00:00:00Z',
  updated_at: '2024-01-14T00:00:00Z',
  content: bn([
    p('Cards are great for navigation, feature overviews, and linking to related articles. The Card Group block renders a responsive grid of cards — 2 or 3 columns — each with an icon, title, body text, and an optional link.'),

    h2('Live example — 2 column grid'),
    cardGroup(2, [
      { icon: 'hugeicons:rocket-01', title: 'Getting Started', body: 'Install Helio and make your first content change in under 5 minutes.', href: '/article/quick-start' },
      { icon: 'hugeicons:book-open-01', title: 'Configuration Guide', body: 'All available config options — branding, fonts, SEO, sidebar styles.', href: '/article/configuration-guide' },
      { icon: 'hugeicons:code', title: 'API Reference', body: 'Full API documentation with request/response examples and parameter tables.', href: '/article/api-introduction' },
      { icon: 'hugeicons:wrench-01', title: 'Troubleshooting', body: 'Common errors and how to fix them — 401, 429, network errors, and more.', href: '/article/common-errors' },
    ]),

    h2('Live example — 3 column grid'),
    cardGroup(3, [
      { icon: 'hugeicons:information-circle', title: 'Callout', body: '7 variants: info, tips, warning, error, success, check, note.' },
      { icon: 'hugeicons:code', title: 'Code Group', body: 'Multi-tab code blocks with syntax highlighting and copy button.' },
      { icon: 'hugeicons:list-view', title: 'Steps', body: 'Numbered steps with connecting line for sequential guides.' },
      { icon: 'hugeicons:layers-01', title: 'Tabs', body: 'Up to 4 tabbed panels for showing content in multiple contexts.' },
      { icon: 'hugeicons:arrow-down-01', title: 'Accordion', body: 'Collapsible sections for FAQs and optional detail.' },
      { icon: 'hugeicons:arrow-right-01', title: 'Expandable', body: 'Inline expandable for nested properties and extra detail.' },
    ]),

    h2('Usage'),
    p('Import cardGroup from src/data/blocks.ts. Pass the column count (2 or 3) and an array of card objects:'),
    codeBlock(
      `import { bn, cardGroup } from '../../blocks';\n\ncontent: bn([\n  cardGroup(2, [\n    {\n      icon: 'hugeicons:rocket-01',\n      title: 'Getting Started',\n      body: 'Install and configure in under 5 minutes.',\n      href: '/article/quick-start',   // optional — makes the card a link\n    },\n    {\n      icon: 'hugeicons:book-open-01',\n      title: 'Guides',\n      body: 'Step-by-step walkthroughs for common tasks.',\n      href: '/article/configuration-guide',\n    },\n  ]),\n])`,
      'typescript'
    ),

    h2('Card object shape'),
    codeBlock(
      `{\n  icon?: string;      // hugeicons icon name — e.g. 'hugeicons:rocket-01'\n  title: string;      // card heading\n  body: string;       // card description text\n  href?: string;      // optional URL — makes the whole card clickable\n  imageUrl?: string;  // optional image shown at the top of the card\n}`,
      'typescript'
    ),

    callout('tips', 'Use href to link cards to related articles. The entire card becomes a clickable link — no separate button needed.'),

    h2('With images'),
    p('Cards support an optional imageUrl that renders a full-width image at the top of the card:'),
    codeBlock(
      `cardGroup(2, [\n  {\n    imageUrl: '/screenshots/dashboard.png',\n    title: 'Dashboard Overview',\n    body: 'A tour of the main dashboard and its key features.',\n    href: '/article/dashboard',\n  },\n])`,
      'typescript'
    ),
    callout('note', 'Images are cropped to a fixed height (h-36 / 144px) with object-cover. Use landscape images for best results.'),

    h2('Icons'),
    p('Card icons come from the Hugeicons set, loaded from the local @iconify-json/hugeicons package. Browse available icons at hugeicons.com and use the icon name in the format hugeicons:icon-name.'),

    h2('Columns'),
    tabs([
      { label: '2 columns', body: 'Use for feature overviews, navigation cards, and article links. Works well on all screen sizes.' },
      { label: '3 columns', body: 'Use for compact icon+title cards or when you have 6+ items. Collapses to 2 columns on tablet and 1 on mobile.' },
    ]),

    accordion('Can I have cards without icons?', 'Yes — omit the icon field or set it to an empty string. The card renders without the icon row.'),
    accordion('Can I have cards without links?', 'Yes — omit the href field. The card renders as a static div instead of an anchor tag.'),
    accordion('How many cards can I have in a group?', 'There is no hard limit. The grid wraps automatically. For very large sets, consider splitting into multiple cardGroup blocks with headings between them.'),

    h2('Expandable block'),
    p('The Expandable block is a lightweight alternative to Accordion for showing optional detail inline:'),
    expandable('Show advanced card options', 'You can combine imageUrl with icon — the image renders at the top and the icon appears below it in the card body. This is useful for product screenshots with a category icon.'),
  ]),
};
