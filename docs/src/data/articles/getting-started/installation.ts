import { bn, h2, h3, p, bullet, numbered, codeBlock, callout, codeGroup, tabs, divider } from '../../blocks';

export const installationArticle = {
  id: 'installation',
  title: 'Installation',
  slug: 'installation',
  excerpt: 'How to install Helio locally and get the dev server running in under 2 minutes.',
  category_id: 'getting-started',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:download-04' as string | null,
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  content: bn([
    h2('Requirements'),
    p('Before you start, make sure you have the following installed:'),
    bullet('Node.js 18 or later — https://nodejs.org'),
    bullet('npm, yarn, or pnpm'),
    bullet('Git'),
    callout('info', 'Helio is deployed to Cloudflare Pages. You do not need a Cloudflare account to develop locally — only to deploy.'),

    h2('Clone the repository'),
    p('Start by cloning the Helio repo to your local machine:'),
    codeBlock('git clone https://github.com/your-org/helio.git\ncd helio', 'bash'),

    h2('Install dependencies'),
    p('Install all dependencies using your preferred package manager:'),
    codeGroup([
      { label: 'npm', language: 'bash', code: 'npm install' },
      { label: 'yarn', language: 'bash', code: 'yarn install' },
      { label: 'pnpm', language: 'bash', code: 'pnpm install' },
    ]),

    h2('Start the dev server'),
    p('Run the development server. Astro will start on port 4321 by default:'),
    codeBlock('npm run dev', 'bash'),
    p('Open http://localhost:4321 in your browser. You should see the Helio help center home page.'),
    callout('success', 'The dev server supports hot module replacement — changes to articles, config, and components update instantly without a full reload.'),

    h2('Project structure'),
    p('Here is what the key folders contain:'),
    codeBlock(
      'src/\n  data/\n    index.ts        # register all categories and articles here\n    config.ts       # branding, fonts, colors, SEO\n    faqs.ts         # home page FAQ accordion\n    categories/     # one .ts file per category\n    articles/       # one folder per category, one .ts file per article\n  components/       # React UI components\n  pages/            # Astro SSR pages\n  lib/\n    localData.ts    # data layer — no external API\n  styles/\n    globals.css     # Tailwind base + font face declarations',
      'bash'
    ),

    h2('Environment variables'),
    p('Helio runs fully on local data — no environment variables are required for local development. The .env.example file is kept for reference if you re-enable API mode.'),
    callout('note', 'If you see a .env.example file, you can safely ignore it. All data comes from src/data/ in local mode.'),

    h2('Next steps'),
    numbered('Open src/data/config.ts and update portal_name, primary_color, and welcome_title'),
    numbered('Replace the template articles in src/data/articles/ with your own content'),
    numbered('Run npm run build to check for any TypeScript errors before deploying'),
    numbered('Run npm run deploy to publish to Cloudflare Pages'),
  ]),
};
