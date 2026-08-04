import { bn, h2, h3, p, bullet, codeBlock, callout, paramField, divider } from '../../blocks';

export const configurationArticle = {
  id: 'configuration',
  title: 'Configuration',
  slug: 'configuration',
  excerpt: 'Every option available in gatelyAuth() — secret, adapters, email, sessions, cookies, rate limiting, and more.',
  category_id: 'core-concepts',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:settings-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('gatelyAuth() accepts a single options object. Only secret, db, and kv are required.'),
    codeBlock(`import { gatelyAuth } from '@gately/auth-core'
import { createD1Adapter, createKVStore } from '@gately/auth-core/adapters'

const auth = gatelyAuth({
  secret: env.AUTH_SECRET,       // required
  db: createD1Adapter(env.AUTH_DB), // required
  kv: createKVStore(env.AUTH_KV),   // required
})`, 'typescript'),

    h2('Top-level options'),
    paramField('secret', 'string', true, 'Secret key used to sign session tokens and cookies. Use a random 32+ character string.'),
    paramField('db', 'DatabaseAdapter', true, 'D1 database adapter. Create with createD1Adapter(env.AUTH_DB).'),
    paramField('kv', 'KVStore', true, 'KV namespace adapter. Create with createKVStore(env.AUTH_KV).'),
    paramField('appName', 'string', false, 'Your application name. Used in email subjects and templates. Default: undefined.'),
    paramField('baseURL', 'string', false, 'Public URL of the auth Worker, e.g. https://auth.myapp.workers.dev. Used in email links.'),
    paramField('basePath', 'string', false, 'Route prefix for all auth endpoints. Default: "/auth".'),
    paramField('trustedOrigins', 'string[]', false, 'Origins allowed to make cross-origin auth requests. Wildcards not supported.'),
    paramField('emailProvider', 'EmailProvider', false, 'Email provider for transactional email. Set automatically by the gatelyEmail plugin.'),
    paramField('plugins', 'GatelyAuthPlugin[]', false, 'Array of plugins to extend functionality (e.g. gatelyEmail).'),

    h2('emailAndPassword'),
    p('Enable email and password authentication:'),
    codeBlock(`emailAndPassword: {
  enabled: true,
  disableSignUp: false,
  requireEmailVerification: false,
  minPasswordLength: 8,
  maxPasswordLength: 128,
  autoSignIn: true,
  sendResetPassword: async ({ user, url }) => {
    // custom reset password email
  },
}`, 'typescript'),
    paramField('enabled', 'boolean', false, 'Enable this auth method. Default: false.'),
    paramField('disableSignUp', 'boolean', false, 'Prevent new users from signing up. Sign-in still works for existing users.'),
    paramField('requireEmailVerification', 'boolean', false, 'Block sign-in until the user verifies their email.'),
    paramField('minPasswordLength', 'number', false, 'Minimum password length. Default: 8.'),
    paramField('maxPasswordLength', 'number', false, 'Maximum password length. Default: 128.'),
    paramField('autoSignIn', 'boolean', false, 'Automatically create a session after sign-up. Default: true.'),
    paramField('sendResetPassword', 'function', false, 'Custom password reset email function. If not provided, uses the configured emailProvider.'),

    h2('emailVerification'),
    codeBlock(`emailVerification: {
  sendOnSignUp: true,
  autoSignInAfterVerification: true,
  expiresIn: 86400, // 24 hours
  sendVerificationEmail: async ({ user, url }) => {
    // custom verification email
  },
}`, 'typescript'),

    h2('socialProviders'),
    p('Configure OAuth providers. The key is the provider ID used in /auth/oauth/:provider routes:'),
    codeBlock(`socialProviders: {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  },
}`, 'typescript'),
    callout('info', 'Set the OAuth callback URL in your provider dashboard to: https://your-worker.workers.dev/auth/oauth/google/callback'),

    h2('session'),
    codeBlock(`session: {
  expiresIn: 604800,    // 7 days (default)
  updateAge: 86400,     // extend session after 1 day of activity
  cookieCache: {
    enabled: true,
    maxAge: 300,         // cache session in signed cookie for 5 minutes
  },
}`, 'typescript'),
    paramField('expiresIn', 'number', false, 'Session TTL in seconds. Default: 604800 (7 days).'),
    paramField('updateAge', 'number', false, 'Extend session expiry after this many seconds of activity. Default: 86400 (1 day).'),
    paramField('cookieCache.enabled', 'boolean', false, 'Cache session data in a signed cookie to reduce D1 reads.'),

    h2('cookies'),
    codeBlock(`cookies: {
  prefix: 'gately-auth',
  secure: true,
  sameSite: 'lax',
  domain: '.myapp.com',
}`, 'typescript'),
    paramField('prefix', 'string', false, 'Cookie name prefix. Default: "gately-auth".'),
    paramField('secure', 'boolean', false, 'Force Secure flag even in non-HTTPS environments.'),
    paramField('sameSite', 'string', false, 'SameSite attribute. Options: "strict", "lax", "none". Default: "lax".'),
    paramField('domain', 'string', false, 'Domain for cross-subdomain cookies.'),

    h2('rateLimit'),
    p('Built-in rate limiting uses KV to count requests per path per IP. Enabled by default.'),
    codeBlock(`rateLimit: {
  enabled: true,
  customRules: {
    '/sign-in/email': { window: 10, max: 5 },
    '/sign-up/email': { window: 60, max: 10 },
  },
}`, 'typescript'),
    callout('info', 'Default limits: sign-in 5/10s, sign-up 10/60s, magic link 5/60s, OTP 5/60s, password reset 3/60s.'),
  ]),
};
