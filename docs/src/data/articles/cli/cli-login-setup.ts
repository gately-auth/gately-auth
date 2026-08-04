import { bn, h2, h3, p, bullet, codeBlock, callout, step, divider } from '../../blocks';

export const cliLoginSetupArticle = {
  id: 'cli-login-setup',
  title: 'Login & Setup',
  slug: 'cli-login-setup',
  excerpt: 'Use gately-auth login and gately-auth setup to connect your Cloudflare account and auto-provision D1, KV, and secrets.',
  category_id: 'cli',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:key-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('Instead of manually creating a D1 database, KV namespace, and copy-pasting IDs into wrangler.toml, the CLI can do it all for you after a one-time login.'),

    h2('gately-auth login'),
    p('Connects your Cloudflare account. Opens your browser to the Cloudflare API token creation page with the required permissions pre-selected, then saves the token to ~/.gately/credentials.json.'),
    codeBlock('gately-auth login', 'bash'),
    p('Required token permissions:'),
    bullet('D1 — Edit'),
    bullet('KV — Edit'),
    bullet('Workers Scripts — Edit'),
    bullet('Account Settings — Read'),
    callout('info', 'Credentials are saved to ~/.gately/credentials.json with mode 600 (owner read/write only). The file is never committed to your project.'),
    p('Options:'),
    codeBlock('gately-auth login --force    # Re-authenticate even if already logged in', 'bash'),

    h2('gately-auth whoami'),
    p('Shows the currently authenticated account:'),
    codeBlock(`gately-auth whoami

# Output:
# Logged in as you@example.com
#   Account ID: abc123def456
#   Since:      2025-01-01T00:00:00.000Z`, 'bash'),

    h2('gately-auth setup'),
    p('Auto-provisions all Cloudflare resources for your auth Worker. Run this after gately-auth init and gately-auth login:'),
    codeBlock('gately-auth setup', 'bash'),
    p('What it does:'),
    bullet('Creates (or reuses) a D1 database on your account'),
    bullet('Creates (or reuses) a KV namespace on your account'),
    bullet('Patches wrangler.toml with the real database_id and KV id'),
    bullet('Generates a strong AUTH_SECRET and writes it to .dev.vars for local dev'),
    bullet('Optionally sets AUTH_SECRET as a Wrangler Worker secret for production'),
    bullet('Optionally runs the initial migration on your local D1 database'),
    p('If a resource with the suggested name already exists on Cloudflare, setup asks if you want to reuse it — no duplicate creation.'),

    h2('Options'),
    codeBlock(`gately-auth setup --skip-migrate   # Don't run migrations after setup
gately-auth setup --skip-secret    # Don't set AUTH_SECRET Worker secret
gately-auth setup --config ./wrangler.toml  # Custom wrangler.toml path`, 'bash'),

    h2('gately-auth logout'),
    p('Removes saved credentials from ~/.gately/credentials.json:'),
    codeBlock('gately-auth logout', 'bash'),

    h2('Full workflow'),
    codeBlock(`# 1. Scaffold the project
gately-auth init

# 2. Connect Cloudflare (opens browser, paste token back)
gately-auth login

# 3. Create D1, KV, patch wrangler.toml, set secrets
gately-auth setup

# 4. Start local dev
npx wrangler dev

# 5. Deploy to production
gately-auth deploy`, 'bash'),
    callout('success', 'Steps 1-3 replace what used to require 10+ manual commands and copy-pasting IDs. The entire setup takes about 2 minutes.'),
  ]),
};
