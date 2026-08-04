import { bn, h2, p, bullet, codeBlock, callout, codeGroup, divider } from '../../blocks';

export const cliOverviewArticle = {
  id: 'cli-overview',
  title: 'CLI Overview',
  slug: 'cli-overview',
  excerpt: 'The @gately/auth-cli — scaffold a Worker, generate migrations, apply them, and deploy.',
  category_id: 'cli',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:terminal' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('The @gately/auth-cli gives you four commands to manage your auth Worker from the terminal: init, generate, migrate, and deploy.'),

    h2('Install'),
    codeGroup([
      { label: 'npm', language: 'bash', code: 'npm install -g @gately/auth-cli' },
      { label: 'pnpm', language: 'bash', code: 'pnpm add -g @gately/auth-cli' },
    ]),
    p('Or run without installing using npx:'),
    codeBlock('npx @gately/auth-cli <command>', 'bash'),

    h2('init'),
    p('Scaffold a new gately-auth Worker in the current directory:'),
    codeBlock('gately-auth init', 'bash'),
    p('The init wizard will ask for your app name, which auth methods to enable, and whether to use Gately Email. It creates:'),
    bullet('src/auth.ts — your gatelyAuth() config'),
    bullet('src/index.ts — the Worker entry point with the handler mounted'),
    bullet('wrangler.toml — D1 and KV bindings pre-configured'),
    bullet('package.json — with @gately/auth-core and wrangler as dependencies'),
    codeBlock(`# Options
gately-auth init --template hono        # Hono framework (default)
gately-auth init --skip-install         # Skip npm install`, 'bash'),

    h2('generate'),
    p('Generate migration SQL from your auth configuration:'),
    codeBlock(`gately-auth generate
gately-auth generate --config auth.config.ts --output ./migrations`, 'bash'),
    p('Outputs a SQL file in ./migrations with the base schema (users, sessions, accounts, verifications) plus any extra fields from plugins or additionalUserFields.'),

    h2('migrate'),
    p('Apply migrations to your D1 database using Wrangler:'),
    codeBlock(`# Local dev database
gately-auth migrate --local

# Production database
gately-auth migrate --remote

# Preview SQL without running it
gately-auth migrate --local --dry-run

# Use a specific D1 binding name
gately-auth migrate --local --database MY_AUTH_DB`, 'bash'),
    callout('info', 'The default D1 binding name is AUTH_DB. If your wrangler.toml uses a different binding, pass it with --database.'),

    h2('deploy'),
    p('Deploy the Worker via Wrangler:'),
    codeBlock(`gately-auth deploy

# Deploy to a specific Wrangler environment
gately-auth deploy --env production`, 'bash'),
    p('This runs wrangler deploy under the hood. Make sure you have run wrangler login first.'),
  ]),
};
