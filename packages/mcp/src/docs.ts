// ─────────────────────────────────────────────────────────────────────────────
// Gately Auth documentation knowledge base
// This is the content the MCP server exposes to AI agents and editors.
// ─────────────────────────────────────────────────────────────────────────────

export interface DocEntry {
  id: string;
  title: string;
  category: string;
  slug: string;
  url: string;
  content: string;
  tags: string[];
}

const BASE_URL = 'https://g-a.usegately.com';

export const docs: DocEntry[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    category: 'Getting Started',
    slug: 'introduction',
    url: `${BASE_URL}/article/introduction`,
    tags: ['intro', 'overview', 'cloudflare', 'workers', 'd1', 'kv'],
    content: `gately-auth is a production-grade authentication framework built for Cloudflare Workers. It uses D1 for user and session storage, KV for magic links, OTPs, and rate limiting. Install: npm install @gately/auth-core. The main function is gatelyAuth() which returns a handler and server-side API. No Node.js required.`,
  },
  {
    id: 'installation',
    title: 'Installation',
    category: 'Getting Started',
    slug: 'installation',
    url: `${BASE_URL}/article/installation`,
    tags: ['install', 'setup', 'npm', 'pnpm', 'd1', 'kv', 'wrangler'],
    content: `Install: npm install @gately/auth-core. For frontend: npm install @gately/auth-client. For CLI: npm install -g @gately/auth-cli. Create D1: npx wrangler d1 create auth-db. Create KV: npx wrangler kv namespace create AUTH_KV. Add to wrangler.toml: [[d1_databases]] binding="AUTH_DB" and [[kv_namespaces]] binding="AUTH_KV". Set secret: npx wrangler secret put AUTH_SECRET. Run migrations: gately-auth migrate --local.`,
  },
  {
    id: 'quick-start',
    title: 'Quick Start',
    category: 'Getting Started',
    slug: 'quick-start',
    url: `${BASE_URL}/article/quick-start`,
    tags: ['quickstart', 'example', 'handler', 'fetch', 'hono'],
    content: `Create src/auth.ts: import { gatelyAuth } from '@gately/auth-core'; import { createD1Adapter, createKVStore } from '@gately/auth-core/adapters'; export function createAuth(env) { return gatelyAuth({ secret: env.AUTH_SECRET, db: createD1Adapter(env.AUTH_DB), kv: createKVStore(env.AUTH_KV), emailAndPassword: { enabled: true } }); }. In worker: auth.handler(request). Routes: POST /auth/sign-up/email, POST /auth/sign-in/email, POST /auth/sign-out, GET /auth/session.`,
  },
  {
    id: 'configuration',
    title: 'Configuration',
    category: 'Core Concepts',
    slug: 'configuration',
    url: `${BASE_URL}/article/configuration`,
    tags: ['config', 'options', 'secret', 'baseurl', 'cookies', 'ratelimit', 'session'],
    content: `gatelyAuth(options) accepts: secret (required), db (required D1 adapter), kv (required KV adapter), appName, baseURL, basePath (default /auth), trustedOrigins, emailProvider, plugins, emailAndPassword, emailVerification, socialProviders, session (expiresIn, updateAge, cookieCache), cookies (prefix, secure, sameSite, domain), rateLimit (enabled, customRules), additionalUserFields, logger.`,
  },
  {
    id: 'how-it-works',
    title: 'How It Works',
    category: 'Core Concepts',
    slug: 'how-it-works',
    url: `${BASE_URL}/article/how-it-works`,
    tags: ['architecture', 'session', 'handler', 'adapter', 'request'],
    content: `gatelyAuth() returns handler and api. handler(request) processes all /auth/* routes. Sessions stored in D1 as rows — instant revocation. KV used for OTPs, magic links, rate limits. createD1Adapter wraps D1Database. createKVStore wraps KVNamespace. auth.api.getSession(req), auth.api.requireSession(req), auth.api.getUserByEmail(email), auth.api.getUserById(id).`,
  },
  {
    id: 'plugins',
    title: 'Plugins',
    category: 'Core Concepts',
    slug: 'plugins',
    url: `${BASE_URL}/article/plugins`,
    tags: ['plugins', 'extend', 'hooks', 'endpoints', 'schema'],
    content: `Plugins extend gately-auth with email providers, custom routes, schema fields, and hooks. Plugin interface: id, name, schema, endpoints, hooks (before/after), init(ctx). Official plugins: gatelyEmail, adminPlugin, usernamePlugin, oneTapPlugin. Pass in plugins array: gatelyAuth({ plugins: [gatelyEmail({ apiKey })] }).`,
  },
  {
    id: 'email-password',
    title: 'Email + Password',
    category: 'Auth Methods',
    slug: 'email-password',
    url: `${BASE_URL}/article/email-password`,
    tags: ['email', 'password', 'signup', 'signin', 'reset', 'verification'],
    content: `Enable: emailAndPassword: { enabled: true, requireEmailVerification: false, minPasswordLength: 8 }. POST /auth/sign-up/email body: { email, password, name }. POST /auth/sign-in/email body: { email, password }. POST /auth/password/reset body: { email }. POST /auth/password/reset/confirm body: { token, newPassword }. GET /auth/verify-email?token=xxx. Client: authClient.signUp.email({ email, password }), authClient.signIn.email({ email, password }).`,
  },
  {
    id: 'magic-links',
    title: 'Magic Links',
    category: 'Auth Methods',
    slug: 'magic-links',
    url: `${BASE_URL}/article/magic-links`,
    tags: ['magic-link', 'passwordless', 'email', 'token', 'kv'],
    content: `POST /auth/magic-link/send body: { email, callbackURL }. GET /auth/magic-link/verify?token=xxx. Tokens stored in KV with 15 min TTL, single use. Requires email provider (gatelyEmail plugin). Client: authClient.signIn.magicLink({ email, callbackURL }).`,
  },
  {
    id: 'email-otp',
    title: 'Email OTP',
    category: 'Auth Methods',
    slug: 'email-otp',
    url: `${BASE_URL}/article/email-otp`,
    tags: ['otp', '2fa', 'code', 'verification', 'kv'],
    content: `Requires email-otp plugin. POST /auth/otp/send body: { email, type }. POST /auth/otp/verify body: { email, code, type }. Types: sign-in, sign-up, email-verification. 6-digit codes, 10min TTL, max 5 attempts. Client: authClient.otp.send({ email }), authClient.signIn.otp({ email, code }).`,
  },
  {
    id: 'oauth-social',
    title: 'OAuth / Social Sign-in',
    category: 'Auth Methods',
    slug: 'oauth-social',
    url: `${BASE_URL}/article/oauth-social`,
    tags: ['oauth', 'google', 'github', 'social', 'pkce', 'callback'],
    content: `Configure: socialProviders: { google: { clientId, clientSecret }, github: { clientId, clientSecret } }. Callback URL: https://your-worker.workers.dev/auth/oauth/google/callback. GET /auth/oauth/:provider redirects to provider. GET /auth/oauth/:provider/callback handles response. Client: authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' }).`,
  },
  {
    id: 'client-overview',
    title: 'Client SDK Overview',
    category: 'Client SDK',
    slug: 'client-overview',
    url: `${BASE_URL}/article/client-overview`,
    tags: ['client', 'sdk', 'browser', 'session', 'fetch'],
    content: `Install: npm install @gately/auth-client. import { createAuthClient } from '@gately/auth-client'. const authClient = createAuthClient({ baseURL: 'https://my-auth.workers.dev' }). Methods: signUp.email, signIn.email, signIn.magicLink, signIn.otp, signIn.social, signOut, getSession, password.sendResetEmail, password.reset, otp.send, session.list, session.revoke, session.revokeAll.`,
  },
  {
    id: 'react-hooks',
    title: 'React Hooks',
    category: 'Client SDK',
    slug: 'react-hooks',
    url: `${BASE_URL}/article/react-hooks`,
    tags: ['react', 'hooks', 'useSession', 'usesession', 'frontend'],
    content: `import { createReactAuthClient } from '@gately/auth-client/react'. const authClient = createReactAuthClient({ baseURL }). const { data: session, isPending, error, refetch } = authClient.useSession(). session.user has id, email, name, image, emailVerified. Automatically updates on sign-in/sign-out.`,
  },
  {
    id: 'cli-overview',
    title: 'CLI Overview',
    category: 'CLI',
    slug: 'cli-overview',
    url: `${BASE_URL}/article/cli-overview`,
    tags: ['cli', 'init', 'migrate', 'generate', 'deploy'],
    content: `Install: npm install -g @gately/auth-cli. Commands: gately-auth init (scaffold Worker), gately-auth generate (create migration SQL), gately-auth migrate --local (apply to local D1), gately-auth migrate --remote (apply to production), gately-auth deploy (deploy via Wrangler), gately-auth login (connect Cloudflare account), gately-auth setup (auto-provision D1 + KV), gately-auth whoami.`,
  },
  {
    id: 'cli-login-setup',
    title: 'Login & Setup',
    category: 'CLI',
    slug: 'cli-login-setup',
    url: `${BASE_URL}/article/cli-login-setup`,
    tags: ['login', 'setup', 'cloudflare', 'provision', 'd1', 'kv', 'secret'],
    content: `gately-auth login opens browser to Cloudflare API token creation. Required permissions: D1 Edit, KV Edit, Workers Scripts Edit, Account Settings Read. Credentials saved to ~/.gately/credentials.json. gately-auth setup creates D1 + KV, patches wrangler.toml, generates AUTH_SECRET, runs migrations. Full workflow: init → login → setup → wrangler dev → deploy.`,
  },
  {
    id: 'gately-email-plugin',
    title: 'Gately Email Plugin',
    category: 'Plugins',
    slug: 'gately-email-plugin',
    url: `${BASE_URL}/article/gately-email-plugin`,
    tags: ['email', 'gately', 'plugin', 'transactional', 'templates'],
    content: `import { gatelyEmail } from '@gately/auth-core/plugins'. Add to plugins: [gatelyEmail({ apiKey: env.GATELY_API_KEY, fromEmail: 'noreply@myapp.com' })]. Handles all transactional emails: password reset, magic link, OTP, email verification. Also exports emailTemplates.magicLink, emailTemplates.otp, emailTemplates.passwordReset, emailTemplates.emailVerification.`,
  },
  {
    id: 'admin-plugin',
    title: 'Admin Plugin',
    category: 'Plugins',
    slug: 'admin-plugin',
    url: `${BASE_URL}/article/admin-plugin`,
    tags: ['admin', 'ban', 'delete', 'user management', 'server-side'],
    content: `import { adminPlugin } from '@gately/auth-core/plugins'. Requires X-Admin-Key header. Endpoints: GET /auth/admin/users (paginated), GET /auth/admin/users/:id, PATCH /auth/admin/users/:id, DELETE /auth/admin/users/:id, POST /auth/admin/users/:id/ban (revokes sessions), POST /auth/admin/users/:id/unban, DELETE /auth/admin/users/:id/sessions.`,
  },
  {
    id: 'username-plugin',
    title: 'Username Plugin',
    category: 'Plugins',
    slug: 'username-plugin',
    url: `${BASE_URL}/article/username-plugin`,
    tags: ['username', 'signup', 'unique', 'validation'],
    content: `import { usernamePlugin } from '@gately/auth-core/plugins'. Options: minLength (default 3), maxLength (default 32), pattern (regex), required (default false). Pass username in sign-up body. GET /auth/username/check?username=xxx returns { available: boolean, username: string }. Usernames are lowercased and trimmed automatically.`,
  },
  {
    id: 'one-tap-plugin',
    title: 'Google One Tap Plugin',
    category: 'Plugins',
    slug: 'one-tap-plugin',
    url: `${BASE_URL}/article/one-tap-plugin`,
    tags: ['google', 'one-tap', 'oauth', 'id-token', 'no-redirect'],
    content: `import { oneTapPlugin } from '@gately/auth-core/plugins'. Config: clientId (Google OAuth client ID), callbackURL. Adds POST /auth/one-tap/callback endpoint. Send credential from Google One Tap JS: fetch('/auth/one-tap/callback', { method: 'POST', body: JSON.stringify({ credential }) }). Verifies Google ID token server-side, creates or finds user, returns session.`,
  },
  {
    id: 'error-codes',
    title: 'Error Codes',
    category: 'API Reference',
    slug: 'error-codes',
    url: `${BASE_URL}/article/error-codes`,
    tags: ['errors', 'codes', 'http', 'status', 'handling'],
    content: `Error format: { error: { code, message } }. Common codes: INVALID_CREDENTIALS (401), EMAIL_ALREADY_EXISTS (409), EMAIL_NOT_VERIFIED (403), SESSION_EXPIRED (401), INVALID_TOKEN (401), RATE_LIMIT_EXCEEDED (429), MAGIC_LINK_EXPIRED (400), OTP_INVALID (400), OTP_MAX_ATTEMPTS (429), PROVIDER_NOT_CONFIGURED (400), SIGNUP_DISABLED (403), UNAUTHORIZED (401), INTERNAL_ERROR (500).`,
  },
  {
    id: 'deploy-to-cloudflare',
    title: 'Deploy to Cloudflare',
    category: 'Deployment',
    slug: 'deploy-to-cloudflare',
    url: `${BASE_URL}/article/deploy-to-cloudflare`,
    tags: ['deploy', 'cloudflare', 'production', 'wrangler', 'secret', 'worker'],
    content: `Steps: 1. wrangler secret put AUTH_SECRET. 2. gately-auth migrate --remote. 3. gately-auth deploy (or npx wrangler deploy). Set baseURL to production Worker URL. For GitHub Actions: store CLOUDFLARE_API_TOKEN secret, use in CI. Compatibility flags: nodejs_compat required.`,
  },
];

export function searchDocs(query: string, limit = 5): DocEntry[] {
  const q = query.toLowerCase();
  const scored = docs.map(doc => {
    let score = 0;
    if (doc.title.toLowerCase().includes(q)) score += 10;
    if (doc.category.toLowerCase().includes(q)) score += 5;
    if (doc.tags.some(t => t.includes(q))) score += 8;
    if (doc.content.toLowerCase().includes(q)) score += 3;
    // Exact word match bonus
    const words = q.split(/\s+/);
    for (const word of words) {
      if (doc.title.toLowerCase().includes(word)) score += 4;
      if (doc.content.toLowerCase().includes(word)) score += 1;
    }
    return { doc, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.doc);
}

export function getDoc(id: string): DocEntry | null {
  return docs.find(d => d.id === id || d.slug === id) ?? null;
}

export function getDocsByCategory(category: string): DocEntry[] {
  return docs.filter(d => d.category.toLowerCase() === category.toLowerCase());
}

export function listCategories(): string[] {
  return [...new Set(docs.map(d => d.category))];
}
