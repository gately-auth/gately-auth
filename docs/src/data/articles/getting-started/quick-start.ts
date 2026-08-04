import { bn, h2, h3, p, bullet, numbered, codeBlock, callout, codeGroup, step, divider } from '../../blocks';

export const quickStartArticle = {
  id: 'quick-start',
  title: 'Quick Start',
  slug: 'quick-start',
  excerpt: 'A complete working auth Worker with email/password sign-up and sign-in in under 5 minutes.',
  category_id: 'getting-started',
  is_published: true,
  display_order: 3,
  sidebar_title: null as string | null,
  icon: 'hugeicons:rocket-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('This guide walks through building a minimal but complete Cloudflare Worker that handles user sign-up, sign-in, sign-out, and session retrieval.'),
    callout('info', 'Want the CLI to scaffold this for you? Run: gately-auth init'),

    h2('1. Create your auth instance'),
    p('Create src/auth.ts. This is where you configure gately-auth with your Cloudflare bindings:'),
    codeBlock(`import { gatelyAuth } from '@gately/auth-core'
import { createD1Adapter, createKVStore } from '@gately/auth-core/adapters'
import { gatelyEmail } from '@gately/auth-core/plugins'

export interface Env {
  AUTH_DB: D1Database
  AUTH_KV: KVNamespace
  AUTH_SECRET: string
  GATELY_API_KEY: string
}

export function createAuth(env: Env) {
  return gatelyAuth({
    appName: 'My App',
    secret: env.AUTH_SECRET,
    baseURL: 'https://my-auth.workers.dev',
    db: createD1Adapter(env.AUTH_DB),
    kv: createKVStore(env.AUTH_KV),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      gatelyEmail({ apiKey: env.GATELY_API_KEY }),
    ],
  })
}`, 'typescript'),

    h2('2. Mount the handler'),
    p('Create src/index.ts and route all /auth/* requests to the gately-auth handler:'),
    codeBlock(`import { createAuth, type Env } from './auth'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const auth = createAuth(env)
    const url = new URL(request.url)

    // Hand off all auth routes
    if (url.pathname.startsWith('/auth')) {
      return auth.handler(request)
    }

    // Protected route example
    if (url.pathname === '/me') {
      const session = await auth.api.getSession(request)
      if (!session) {
        return new Response('Unauthorized', { status: 401 })
      }
      return Response.json({ user: session.user })
    }

    return new Response('Not found', { status: 404 })
  }
}`, 'typescript'),

    h2('3. Run locally'),
    codeBlock('npx wrangler dev', 'bash'),
    p('Your Worker is now listening on http://localhost:8787.'),

    h2('4. Test sign-up'),
    codeBlock(`curl -X POST http://localhost:8787/auth/sign-up/email \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"secret123","name":"Test User"}'`, 'bash'),
    p('A successful response returns the user object with a 201 status:'),
    codeBlock(`{
  "user": {
    "id": "usr_abc123",
    "email": "test@example.com",
    "name": "Test User",
    "emailVerified": false,
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "token": "eyJ..."
}`, 'json'),

    h2('5. Test sign-in'),
    codeBlock(`curl -X POST http://localhost:8787/auth/sign-in/email \\
  -H "Content-Type: application/json" \\
  -c cookies.txt \\
  -d '{"email":"test@example.com","password":"secret123"}'`, 'bash'),
    p('The response sets a session cookie and returns the session data.'),

    h2('6. Get the current session'),
    codeBlock(`curl http://localhost:8787/auth/session \\
  -b cookies.txt`, 'bash'),

    h2('7. Sign out'),
    codeBlock(`curl -X POST http://localhost:8787/auth/sign-out \\
  -b cookies.txt`, 'bash'),

    h2('Available routes'),
    p('Once mounted, gately-auth exposes the following routes under /auth:'),
    codeBlock(`POST   /auth/sign-up/email
POST   /auth/sign-in/email
POST   /auth/sign-out
GET    /auth/session
GET    /auth/verify-email?token=xxx
POST   /auth/password/reset
POST   /auth/password/reset/confirm
POST   /auth/magic-link/send
GET    /auth/magic-link/verify?token=xxx
POST   /auth/otp/send
POST   /auth/otp/verify
GET    /auth/oauth/:provider
GET    /auth/oauth/:provider/callback
GET    /auth/sessions
DELETE /auth/sessions/:token
DELETE /auth/sessions
GET    /auth/health`, 'bash'),

    callout('success', 'You have a working auth Worker. Next, add the client SDK to your frontend to manage sessions from the browser.'),
  ]),
};
