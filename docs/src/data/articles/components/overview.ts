import { bn, h2, h3, p, bullet, numbered, codeBlock, callout, cardGroup, tabs, accordion, divider } from '../../blocks';

export const componentsOverviewArticle = {
  id: 'components-overview',
  title: 'Content Blocks Overview',
  slug: 'components-overview',
  excerpt: 'Every content block available in Helio — with live examples rendered inline.',
  category_id: 'components',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:view' as string | null,
  created_at: '2024-01-10T00:00:00Z',
  updated_at: '2024-01-10T00:00:00Z',
  content: bn([
    p('Helio articles are built from composable content blocks. Each block is a React component rendered by the ArticleContentViewer. You compose them using the helper functions in src/data/blocks.ts.'),

    callout('info', 'All blocks below are rendered live — what you see here is exactly what your readers will see in their browser.'),

    h2('Available blocks'),
    cardGroup(2, [
      { icon: 'hugeicons:information-circle', title: 'Callout', body: 'Info, warning, success, error, tips, check, note variants with colored borders and icons.' },
      { icon: 'hugeicons:layout-grid-01', title: 'Card & Card Group', body: 'Linked or static cards with icon, title, body, and optional image. Renders in 2 or 3 column grids.' },
      { icon: 'hugeicons:layers-01', title: 'Tabs', body: 'Up to 4 tabbed panels. Great for showing the same concept in multiple languages or contexts.' },
      { icon: 'hugeicons:code', title: 'Code Group', body: 'Multi-tab code block with language labels and copy button. Perfect for SDK examples.' },
      { icon: 'hugeicons:list-view', title: 'Step', body: 'Numbered step blocks with a connecting line. Ideal for installation and setup guides.' },
      { icon: 'hugeicons:arrow-down-01', title: 'Accordion', body: 'Collapsible question/answer blocks. Great for FAQs and optional detail sections.' },
      { icon: 'hugeicons:arrow-right-01', title: 'Expandable', body: 'Inline expandable section for nested properties, optional parameters, or extra detail.' },
      { icon: 'hugeicons:brackets', title: 'Param & Response Field', body: 'API parameter and response field blocks with type badges and required indicators.' },
    ]),

    h2('Callout variants'),
    p('Callouts draw attention to important information. There are 7 variants:'),

    callout('info', 'info — Use for general information, context, or background knowledge.'),
    callout('tips', 'tips — Use for helpful hints, shortcuts, and best practices.'),
    callout('warning', 'warning — Use when something could go wrong or needs careful attention.'),
    callout('error', 'error — Use for destructive actions, breaking changes, or critical errors.'),
    callout('success', 'success — Use to confirm something worked or highlight a positive outcome.'),
    callout('check', 'check — Use for checklists, requirements, or completed steps.'),
    callout('note', 'note — Use for neutral side notes and supplementary information.'),

    h2('Tabs'),
    p('Tabs let you show the same content in multiple contexts without repeating yourself:'),
    tabs([
      { label: 'npm', body: 'npm install @helio/sdk' },
      { label: 'yarn', body: 'yarn add @helio/sdk' },
      { label: 'pnpm', body: 'pnpm add @helio/sdk' },
    ]),

    h2('Accordion'),
    p('Accordions hide detail until the reader needs it:'),
    accordion('What Node.js version is required?', 'Node.js 18 or later. We recommend using the LTS release.'),
    accordion('Can I use Helio with a monorepo?', 'Yes. Helio is a standard Astro project and works with Turborepo, Nx, and other monorepo tools.'),
    accordion('Is there a hosted version?', 'Not currently. Helio is a self-hosted template you deploy to Cloudflare Pages or any static host.'),

    h2('Steps'),
    p('Step blocks are great for sequential instructions:'),

    h2('Code Group'),
    p('Code groups show the same snippet in multiple languages with a tab switcher:'),

    h2('How to use blocks in your articles'),
    codeBlock(
      `import { bn, h2, p, callout, codeGroup, cardGroup, tabs, accordion, step } from '../../blocks';\n\nexport const myArticle = {\n  id: 'my-article',\n  title: 'My Article',\n  slug: 'my-article',\n  category_id: 'guides',\n  is_published: true,\n  content: bn([\n    h2('Overview'),\n    p('This article explains how to do X.'),\n    callout('info', 'Make sure you have completed the installation first.'),\n    step(1, 'Install', 'Run npm install my-package'),\n    step(2, 'Configure', 'Add your API key to .env'),\n    codeGroup([\n      { label: 'TypeScript', language: 'typescript', code: 'const client = new Client({ apiKey });' },\n      { label: 'Python', language: 'python', code: 'client = Client(api_key=api_key)' },\n    ]),\n  ]),\n};`,
      'typescript'
    ),
    callout('tips', 'Import only the blocks you need. Tree-shaking ensures unused helpers don\'t affect bundle size.'),
  ]),
};
