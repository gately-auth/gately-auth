import { bn, h2, h3, p, bullet, numbered, codeBlock, callout, codeGroup, divider } from '../../blocks';

export const installationArticle = {
  id: 'installation',
  title: 'Installation',
  slug: 'installation',
  excerpt: 'Install gately-auth packages and set up D1 and KV bindings in your Cloudflare Worker.',
  category_id: 'getting-started',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:download-04' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    h2('Requirements'),
    bullet('Node.js 18 or later'),
    bullet('A Cloudflare account (free tier is fine)'),
    bullet('Wrangler CLI installed globally: npm install -g wrangler'),
    callout('info', 'gately-auth runs entirely on Cloudflare primitives. You need a D1 database and a KV namespace — both available on the free plan.'),

    h2('Install the packages'),
    p('Install @gately/auth-core into your Worker project:'),
    codeGroup([
      { label: 'npm', language: 'bash', code: 'npm install @gately/auth-core' },
      { label: 'pnpm', language: 'bash', code: 'pnpm add @gately/auth-core' },
      { label: 'yarn', language: 'bash', code: 'yarn add @gately/auth-core' },
    ]),
    p('Install the CLI globally to scaffold and manage your auth Worker:'),
    codeGroup([
      { label: 'npm', language: 'bash', code: 'npm install -g @gately/auth-cli' },
      { label: 'pnpm', language: 'bash', code: 'pnpm add -g @gately/auth-cli' },
    ]),
    p('If you are building a browser app or React frontend, also install the client SDK:'),
    codeGroup([
      { label: 'npm', language: 'bash', code: 'npm install @gately/auth-client' },
      { label: 'pnpm', language: 'bash', code: 'pnpm add @gately/auth-client' },
    ]),

    h2('Create a D1 database'),
    p('gately-auth stores users, sessions, accounts, and verification tokens in a Cloudflare D1 SQLite database.'),
    codeBlock('npx wrangler d1 create auth-db', 'bash'),
    p('Wrangler will print the database ID. Copy it — you need it in wrangler.toml.'),

    h2('Create a KV namespace'),
    p('KV is used for magic links, OTPs, rate-limit counters, and optional session caching.'),
    codeBlock('npx wrangler kv namespace create AUTH_KV', 'bash'),

    h2('Configure wrangler.toml'),
    p('Add both bindings to your wrangler.toml:'),
    codeBlock(`name = "my-auth-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "AUTH_DB"
database_name = "auth-db"
database_id = "your-database-id-here"

[[kv_namespaces]]
binding = "AUTH_KV"
id = "your-kv-namespace-id-here"

[vars]
AUTH_SECRET = "change-this-to-a-long-random-string"`, 'toml'),
    callout('warning', 'Do not commit real secrets to version control. Use wrangler secret put AUTH_SECRET for production values.'),

    h2('Set a strong secret'),
    p('The secret is used to sign session tokens and cookies. Generate a random 32+ character string:'),
    codeBlock('openssl rand -base64 32', 'bash'),
    p('For local development you can use the [vars] block in wrangler.toml. For production use a Wrangler secret:'),
    codeBlock('npx wrangler secret put AUTH_SECRET', 'bash'),

    h2('Run database migrations'),
    p('Use the CLI to apply the initial schema to your D1 database:'),
    codeBlock('# Local dev\ngately-auth migrate --local\n\n# Production\ngately-auth migrate --remote', 'bash'),
    p('This creates the users, sessions, accounts, and verifications tables.'),

    h2('Next steps'),
    bullet('Follow the Quick Start to write your first auth Worker'),
    bullet('Read about Email + Password auth to enable sign-up and sign-in'),
  ]),
};
