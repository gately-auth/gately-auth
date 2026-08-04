import { bn, h2, p, bullet, numbered, codeBlock, callout, step, divider } from '../../blocks';

export const deployToCloudflareArticle = {
  id: 'deploy-to-cloudflare',
  title: 'Deploy to Cloudflare',
  slug: 'deploy-to-cloudflare',
  excerpt: 'Deploy your gately-auth Worker to Cloudflare with production secrets, D1, and KV.',
  category_id: 'deployment',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:cloud-upload' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('gately-auth is designed to be deployed as a Cloudflare Worker. Deployment takes about 2 minutes once your D1 and KV resources are set up.'),

    h2('Pre-deployment checklist'),
    bullet('D1 database created and binding added to wrangler.toml'),
    bullet('KV namespace created and binding added to wrangler.toml'),
    bullet('AUTH_SECRET set as a Wrangler secret (not in wrangler.toml)'),
    bullet('baseURL in your auth config set to the production Worker URL'),
    bullet('trustedOrigins includes your frontend domain'),

    h2('1. Set production secrets'),
    p('Never commit secrets to version control. Use wrangler secret for all sensitive values:'),
    codeBlock(`npx wrangler secret put AUTH_SECRET
# Paste your 32+ character secret when prompted

npx wrangler secret put GATELY_API_KEY
# Paste your Gately API key`, 'bash'),

    h2('2. Run production migrations'),
    codeBlock('gately-auth migrate --remote', 'bash'),
    p('This runs the schema SQL against your production D1 database. Safe to run multiple times — uses IF NOT EXISTS.'),

    h2('3. Deploy the Worker'),
    codeBlock(`# Using the CLI
gately-auth deploy

# Or directly with Wrangler
npx wrangler deploy`, 'bash'),
    p('Wrangler will print the Worker URL, e.g. https://my-auth-worker.your-subdomain.workers.dev.'),

    h2('4. Update baseURL'),
    p('Set the production Worker URL in your gatelyAuth config:'),
    codeBlock(`gatelyAuth({
  baseURL: 'https://my-auth-worker.your-subdomain.workers.dev',
  // ...
})`, 'typescript'),
    callout('warning', 'baseURL is used to build verification links and OAuth callback URLs in emails. An incorrect baseURL will break password reset, email verification, and magic links.'),

    h2('5. Set a custom domain (optional)'),
    p('In the Cloudflare dashboard go to Workers & Pages → your Worker → Settings → Domains & Routes → Add Custom Domain. A URL like auth.myapp.com is cleaner than the workers.dev subdomain.'),

    h2('Wrangler environments'),
    p('Use Wrangler environments to manage staging and production with separate D1/KV bindings:'),
    codeBlock(`# wrangler.toml
[env.staging]
name = "my-auth-staging"

[[env.staging.d1_databases]]
binding = "AUTH_DB"
database_name = "auth-db-staging"
database_id = "staging-db-id"

[env.production]
name = "my-auth-production"

[[env.production.d1_databases]]
binding = "AUTH_DB"
database_name = "auth-db-prod"
database_id = "prod-db-id"`, 'toml'),
    codeBlock(`# Deploy to staging
gately-auth deploy --env staging

# Deploy to production
gately-auth deploy --env production`, 'bash'),

    h2('CI/CD with GitHub Actions'),
    codeBlock(`# .github/workflows/deploy.yml
name: Deploy Auth Worker

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}`, 'yaml'),
    callout('info', 'Store your Cloudflare API token as a GitHub Actions secret. Create one at cloudflare.com/profile/api-tokens with the Workers:Edit permission.'),
  ]),
};
