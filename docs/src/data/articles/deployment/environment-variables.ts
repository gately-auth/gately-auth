import { bn, h2, p, bullet, codeBlock, callout, divider } from '../../blocks';

export const environmentVariablesArticle = {
  id: 'environment-variables',
  title: 'Environment Variables',
  slug: 'environment-variables',
  excerpt: 'All environment variables and secrets used by gately-auth, and how to configure them for local dev and production.',
  category_id: 'deployment',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:key-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('gately-auth uses Cloudflare bindings rather than traditional environment variables for D1 and KV. Secrets are managed with wrangler secret.'),

    h2('Required'),
    bullet('AUTH_SECRET — signs session tokens and cookies. Must be at least 32 characters. Generate with: openssl rand -base64 32'),
    bullet('AUTH_DB — D1 database binding (set in wrangler.toml, not an env var)'),
    bullet('AUTH_KV — KV namespace binding (set in wrangler.toml, not an env var)'),

    h2('Gately Email plugin'),
    bullet('GATELY_API_KEY — your Gately API key. Required when using gatelyEmail(). Get it from usegately.com.'),

    h2('OAuth providers'),
    bullet('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — from console.cloud.google.com'),
    bullet('GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET — from github.com/settings/developers'),

    h2('Local development'),
    p('For local wrangler dev, use the [vars] block in wrangler.toml for non-sensitive values. Sensitive values still go through wrangler secret:'),
    codeBlock(`# wrangler.toml — safe for version control
[vars]
AUTH_SECRET = "local-dev-secret-at-least-32-chars-long"

# NOT in wrangler.toml — set with wrangler secret put
# GATELY_API_KEY
# GOOGLE_CLIENT_ID
# GOOGLE_CLIENT_SECRET`, 'toml'),
    callout('warning', 'Do not put real API keys or OAuth secrets in wrangler.toml. Use wrangler secret for anything that would cause harm if leaked.'),

    h2('Setting secrets'),
    codeBlock(`# Set a secret (you will be prompted for the value)
npx wrangler secret put AUTH_SECRET
npx wrangler secret put GATELY_API_KEY
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET

# List secrets (values are not shown)
npx wrangler secret list

# Delete a secret
npx wrangler secret delete OLD_SECRET`, 'bash'),

    h2('Accessing in your Worker'),
    p('All bindings and secrets are available on the env object passed to your Worker fetch handler:'),
    codeBlock(`export interface Env {
  // Bindings (wrangler.toml)
  AUTH_DB: D1Database
  AUTH_KV: KVNamespace
  // Secrets (wrangler secret)
  AUTH_SECRET: string
  GATELY_API_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

export default {
  async fetch(request: Request, env: Env) {
    const auth = gatelyAuth({
      secret: env.AUTH_SECRET,
      db: createD1Adapter(env.AUTH_DB),
      kv: createKVStore(env.AUTH_KV),
      // ...
    })
    return auth.handler(request)
  }
}`, 'typescript'),

    h2('GitHub Actions'),
    p('Store production secrets as GitHub Actions secrets and pass them to wrangler deploy:'),
    codeBlock(`# .github/workflows/deploy.yml
- name: Deploy
  run: npx wrangler deploy
  env:
    CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}
    # Worker secrets are already set via wrangler secret put
    # and do not need to be passed here`, 'yaml'),
    callout('info', 'Wrangler reads CLOUDFLARE_API_TOKEN from the environment for CI auth. Worker secrets (AUTH_SECRET, etc.) are stored in Cloudflare and injected at runtime — you do not need to pass them to the CI command.'),
  ]),
};
