import { bn, h2, h3, p, bullet, codeBlock, callout, paramField, responseField, divider } from '../../blocks';

export const coreApiArticle = {
  id: 'core-api',
  title: '@gately/auth-core API',
  slug: 'core-api',
  excerpt: 'Complete reference for gatelyAuth(), all exported functions, types, and adapters.',
  category_id: 'api-reference',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:code' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    h2('gatelyAuth(options)'),
    p('The main factory function. Returns { handler, api, options, $Infer }.'),
    codeBlock(`import { gatelyAuth } from '@gately/auth-core'
const auth = gatelyAuth({ ... })`, 'typescript'),

    h3('auth.handler(request)'),
    p('A fetch handler that accepts a Request and returns a Promise<Response>. Mount it on your Worker for all /auth/* routes.'),

    h3('auth.api'),
    p('Server-side helper methods for use in protected routes, middleware, and Cloudflare Workers actions:'),
    bullet('getSession(req) → AuthSession | null — read session from request'),
    bullet('requireSession(req) → AuthSession — throws UNAUTHORIZED if no session'),
    bullet('revokeSession(token) → void — invalidate a single session'),
    bullet('revokeAllSessions(userId) → void — invalidate all sessions for a user'),
    bullet('listSessions(userId) → Session[] — list all active sessions'),
    bullet('createSession(userId, req) → { session, token } — create a session server-side'),
    bullet('getUserByEmail(email) → User | null'),
    bullet('getUserById(id) → User | null'),

    h2('Adapters'),

    h3('createD1Adapter(db: D1Database)'),
    p('Wraps your D1Database binding and returns a DatabaseAdapter. All queries are parameterised.'),
    codeBlock(`import { createD1Adapter } from '@gately/auth-core/adapters'
const db = createD1Adapter(env.AUTH_DB)`, 'typescript'),

    h3('createKVStore(kv: KVNamespace)'),
    p('Wraps your KVNamespace and returns a KVStore with get, set (with TTL), and delete.'),
    codeBlock(`import { createKVStore } from '@gately/auth-core/adapters'
const kv = createKVStore(env.AUTH_KV)`, 'typescript'),

    h3('createInMemoryKVStore()'),
    p('An in-memory KVStore implementation for unit testing — no Cloudflare runtime needed.'),

    h2('Crypto utilities'),
    p('All functions from @gately/auth-core/crypto:'),
    bullet('generateId() — cryptographically random ID prefixed with a short string'),
    bullet('generateToken() — 32-byte random hex token'),
    bullet('generateOTP(length?) — numeric OTP string (default: 6 digits)'),
    bullet('hashPassword(password) — Argon2id hash'),
    bullet('verifyPassword(password, hash) — constant-time comparison'),
    bullet('signJWT(payload, secret, expiresIn?) — sign a compact JWT'),
    bullet('verifyJWT(token, secret) — verify and decode a JWT'),
    bullet('encrypt(text, secret) — AES-GCM encryption'),
    bullet('decrypt(ciphertext, secret) — AES-GCM decryption'),
    bullet('sha256(data) — SHA-256 hex digest'),

    h2('Cookie utilities'),
    bullet('getSessionCookie(request, secret, config?) — extract and verify session token from request cookies'),
    bullet('parseCookies(cookieHeader) — parse a Cookie header string into a Record'),
    bullet('getCookie(cookies, name) — get a single cookie by name'),
    bullet('extractSessionToken(request, secret, config?) — tries cookie then Bearer header'),

    h2('Session utilities'),
    bullet('createSession(userId, request, db, config?) — create a new session record'),
    bullet('getSessionByToken(token, db, kv, config?) — look up a session, extend TTL if needed'),
    bullet('revokeSession(token, db, kv) — delete session from D1 and KV'),
    bullet('revokeAllUserSessions(userId, db) — delete all sessions for a user'),
    bullet('listUserSessions(userId, db) — list all active sessions'),
    bullet('requireSession(token, db, kv, config?) — throws UNAUTHORIZED if not found'),

    h2('Error handling'),
    codeBlock(`import { GatelyAuthError, toErrorResponse } from '@gately/auth-core'

try {
  // ...
} catch (err) {
  return toErrorResponse(err, corsHeaders)
}

// Or throw structured errors:
throw new GatelyAuthError('UNAUTHORIZED', 'You must be signed in')`, 'typescript'),
    p('GatelyAuthError has code, status (HTTP status), and message. toErrorResponse wraps any thrown value into a JSON Response.'),

    h2('Key types'),
    codeBlock(`// User stored in D1
interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  [key: string]: unknown  // plugin-added fields
}

// Session stored in D1
interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

// Returned by getSession / requireSession
interface AuthSession {
  user: User
  session: Session
}`, 'typescript'),
  ]),
};
