import { bn, h2, h3, p, bullet, numbered, codeBlock, callout, codeGroup, tabs, accordion, step, cardGroup, divider } from '../../blocks';

export const quickStartArticle = {
  id: 'quick-start',
  title: 'Quick Start',
  slug: 'quick-start',
  excerpt: 'Make your first content change in under 5 minutes — update the config, add a category, and write your first article.',
  category_id: 'getting-started',
  is_published: true,
  display_order: 3,
  sidebar_title: null as string | null,
  icon: 'hugeicons:rocket-01' as string | null,
  created_at: '2024-01-03T00:00:00Z',
  updated_at: '2024-01-03T00:00:00Z',
  content: bn([
    p('This guide walks you through the three things you\'ll do first: update your branding, add a category, and write an article. Each step takes about a minute.'),

    callout('tips', 'Keep the dev server running while you follow this guide. Every file save triggers a hot reload so you see changes instantly.'),

    h2('Step 1 — Update your branding'),
    p('Open src/data/config.ts and change these fields to match your product:'),
    codeBlock(
      `export const helpCenterConfig = {\n  portal_name: 'Acme Docs',          // shown in header + browser tab\n  primary_color: '#7c3aed',           // brand color — buttons, links, accents\n  welcome_title: 'How can we help?',\n  welcome_subtitle: 'Search our docs or browse categories below.',\n  heading_font: 'Onest',\n  body_font: 'Onest',\n};`,
      'typescript'
    ),
    callout('info', 'Save the file. The dev server reloads and you\'ll see your new name and color across the entire site immediately.'),

    h2('Step 2 — Add a category'),
    p('Create a new file in src/data/categories/:'),
    codeBlock(
      `// src/data/categories/integrations.ts\nexport const integrationsCategory = {\n  id: 'integrations',\n  name: 'Integrations',\n  description: 'Connect your product with third-party tools.',\n  icon: 'hugeicons:plug-socket',\n  display_order: 3,\n  folder_id: null,\n  parent_category_id: null,\n};`,
      'typescript'
    ),
    p('Then register it in src/data/index.ts:'),
    codeBlock(
      `import { integrationsCategory } from './categories/integrations';\n\nexport const categories = [\n  gettingStartedCategory,\n  guidesCategory,\n  integrationsCategory,  // add here\n];`,
      'typescript'
    ),

    h2('Step 3 — Write your first article'),
    p('Create a new file in src/data/articles/integrations/:'),
    codeBlock(
      `// src/data/articles/integrations/stripe.ts\nexport const stripeArticle = {\n  id: 'stripe-integration',\n  title: 'Stripe Integration',\n  slug: 'stripe-integration',\n  excerpt: 'Connect your account to Stripe for payment processing.',\n  category_id: 'integrations',\n  is_published: true,\n  display_order: 1,\n  sidebar_title: null,\n  icon: null,\n  created_at: '2024-01-01T00:00:00Z',\n  updated_at: '2024-01-01T00:00:00Z',\n  content: \`\n<h2>Overview</h2>\n<p>Connect your account to Stripe in under 5 minutes.</p>\n  \`.trim(),\n};`,
      'typescript'
    ),
    p('Register it in src/data/index.ts:'),
    codeBlock(
      `import { stripeArticle } from './articles/integrations/stripe';\n\nexport const articles = [\n  // ...existing articles\n  stripeArticle,\n];`,
      'typescript'
    ),
    callout('success', 'Visit http://localhost:4321 — your new category and article appear in the sidebar, home page, and search automatically.'),

    h2('What happens automatically'),
    p('When you register content in index.ts, Helio handles the rest:'),
    bullet('The article appears in the sidebar under its category'),
    bullet('The category appears on the home page grid'),
    bullet('The article is indexed by the client-side search (Cmd+K)'),
    bullet('The article is included in /sitemap.xml'),
    bullet('The article gets a canonical URL, Open Graph tags, and JSON-LD structured data'),
    bullet('The Table of Contents is generated from h2/h3 headings in the content'),

    h2('Using content blocks'),
    p('Instead of plain HTML, you can use the block builder helpers from src/data/blocks.ts to compose rich content with callouts, tabs, code groups, steps, and cards:'),
    codeBlock(
      `import { bn, h2, p, callout, codeGroup, step } from '../../blocks';\n\nexport const myArticle = {\n  // ...\n  content: bn([\n    h2('Getting started'),\n    p('Follow these steps to connect Stripe.'),\n    callout('info', 'You need a Stripe account before proceeding.'),\n    step(1, 'Install the SDK', 'Run: npm install stripe'),\n    step(2, 'Add your key', 'Set STRIPE_SECRET_KEY in your .env file.'),\n    codeGroup([\n      { label: 'Node.js', language: 'typescript', code: 'const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);' },\n      { label: 'Python', language: 'python', code: 'stripe.api_key = os.environ[\"STRIPE_SECRET_KEY\"]' },\n    ]),\n  ]),\n};`,
      'typescript'
    ),

    h2('Deploying'),
    p('When you\'re ready to go live:'),
    codeBlock('npm run build\nnpm run deploy', 'bash'),
    p('Or connect your GitHub repo to Cloudflare Pages for automatic deploys on every push.'),

    accordion('What is the build command for Cloudflare Pages?', 'Build command: npm run build — Output directory: dist — Node version: 18'),
    accordion('Do I need environment variables to deploy?', 'No. Helio runs on local data only. No API keys or environment variables are required.'),
    accordion('Can I use a custom domain?', 'Yes. In Cloudflare Pages, go to Custom Domains and add your domain. DNS propagation takes a few minutes.'),
  ]),
};
