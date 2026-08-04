import { bn, h2, h3, p, bullet, codeBlock, callout, divider } from '../../blocks';

export const howItWorksArticle = {
  id: 'how-it-works',
  title: 'How It Works',
  slug: 'how-it-works',
  excerpt: 'The request lifecycle, handler routing, session flow, and how adapters connect to Cloudflare primitives.',
  category_id: 'core-concepts',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:layers-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('gately-auth is a single function — gatelyAuth() — that takes your configuration and returns a handler and a server-side API. There are no global singletons, no magic imports, and no Node.js APIs.'),

    h2('The gatelyAuth() factory'),
    p('Calling gatelyAuth() initialises the framework with your bindings and config. It returns two things:'),
    bullet('handler — a function that accepts a Request and returns a Response. Mount it on your Worker fetch handler.'),
    bullet('api — server-side helpers for reading sessions, creating sessions, and querying users from your own routes.'),
    codeBlock(`const auth = gatelyAuth({ ... })

// Mount on your Worker
return auth.handler(request)

// Use server-side API in protected routes
const session = await auth.api.getSession(request)
const user = await auth.api.getUserByEmail('user@example.com')`, 'typescript'),

    h2('Request routing'),
    p('The handler parses the URL pathname, strips the basePath prefix (default: /auth), and dispatches to the matching route. Every route returns a plain Web API Response — no framework coupling.'),
    p('CORS headers are applied to every response using the trustedOrigins option. Preflight OPTIONS requests are handled automatically.'),

    h2('Session lifecycle'),
    p('When a user signs in, gately-auth:'),
    bullet('Creates a Session record in D1 with an expiry timestamp'),
    bullet('Generates a signed session token (a random 32-byte token stored in D1, not a JWT)'),
    bullet('Writes the token into an HttpOnly, SameSite=Lax cookie'),
    bullet('Also returns it in the Set-Auth-Token response header for non-browser clients'),
    p('On subsequent requests, the handler reads the cookie or Authorization: Bearer header, looks up the session in D1 (or KV cache if cookieCache is enabled), and returns the user + session data.'),
    callout('info', 'Sessions are stored in D1, not encoded in the token itself. Revoking a session immediately invalidates it — there is no waiting for a JWT to expire.'),

    h2('D1 adapter'),
    p('createD1Adapter wraps your D1Database binding and implements the DatabaseAdapter interface — findOne, findMany, create, update, delete, count. All queries are parameterised to prevent SQL injection.'),
    codeBlock(`import { createD1Adapter } from '@gately/auth-core/adapters'

const db = createD1Adapter(env.AUTH_DB)`, 'typescript'),

    h2('KV adapter'),
    p('createKVStore wraps your KVNamespace and implements the KVStore interface — get, set (with TTL), delete. It is used for:'),
    bullet('Magic link tokens (TTL: 15 minutes)'),
    bullet('Email OTP codes (TTL: 10 minutes)'),
    bullet('Rate-limit counters (TTL: per-rule window)'),
    bullet('Optional session cache (TTL: configurable)'),
    codeBlock(`import { createKVStore } from '@gately/auth-core/adapters'

const kv = createKVStore(env.AUTH_KV)`, 'typescript'),

    h2('Plugin system'),
    p('Plugins extend gately-auth with additional email providers, custom endpoints, and lifecycle hooks. The gatelyEmail plugin registers a Gately-backed EmailProvider — used by password reset, magic links, OTP, and email verification.'),
    p('Custom plugins can also add schema fields, mount new routes under /auth/*, and intercept requests with before/after hooks.'),

    h2('Type inference'),
    p('gately-auth exports a $Infer property for TypeScript consumers:'),
    codeBlock(`const auth = gatelyAuth({ ... })
type Session = typeof auth.$Infer.Session
// { user: User, session: Session }`, 'typescript'),
  ]),
};
