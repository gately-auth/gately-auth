import { bn, h2, p, bullet, codeBlock, callout, divider } from '../../blocks';

export const honoArticle = {
  id: 'hono',
  title: 'Hono',
  slug: 'hono',
  excerpt: 'Mount gately-auth inside a Hono Worker and protect routes with a session middleware.',
  category_id: 'integrations',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:fire-02' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('Hono is the most natural pairing for gately-auth. Both are built for Cloudflare Workers and share the same Request/Response model.'),

    h2('Setup'),
    codeBlock('npm install hono @gately/auth-core', 'bash'),

    h2('Mount the auth handler'),
    p('Use Hono\'s route-based handler to forward all /auth/* requests to gately-auth:'),
    codeBlock(`import { Hono } from 'hono'
import { gatelyAuth } from '@gately/auth-core'
import { createD1Adapter, createKVStore } from '@gately/auth-core/adapters'
import { gatelyEmail } from '@gately/auth-core/plugins'

type Env = {
  Bindings: {
    AUTH_DB: D1Database
    AUTH_KV: KVNamespace
    AUTH_SECRET: string
    GATELY_API_KEY: string
  }
}

const app = new Hono<Env>()

// Mount gately-auth on /auth/*
app.all('/auth/*', async (c) => {
  const auth = gatelyAuth({
    secret: c.env.AUTH_SECRET,
    db: createD1Adapter(c.env.AUTH_DB),
    kv: createKVStore(c.env.AUTH_KV),
    emailAndPassword: { enabled: true },
    plugins: [gatelyEmail({ apiKey: c.env.GATELY_API_KEY })],
  })
  return auth.handler(c.req.raw)
})

export default app`, 'typescript'),
    callout('info', 'Create the auth instance inside the handler so it picks up fresh env bindings on each request. The factory is cheap — there is no global state.'),

    h2('Session middleware'),
    p('Create a Hono middleware that reads the session and attaches it to context:'),
    codeBlock(`import type { MiddlewareHandler } from 'hono'
import type { AuthSession } from '@gately/auth-core'

declare module 'hono' {
  interface ContextVariableMap {
    session: AuthSession | null
  }
}

export const sessionMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const auth = gatelyAuth({
    secret: c.env.AUTH_SECRET,
    db: createD1Adapter(c.env.AUTH_DB),
    kv: createKVStore(c.env.AUTH_KV),
  })
  const session = await auth.api.getSession(c.req.raw)
  c.set('session', session)
  await next()
}

export const requireAuth: MiddlewareHandler<Env> = async (c, next) => {
  const session = c.get('session')
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  await next()
}`, 'typescript'),

    h2('Protected routes'),
    codeBlock(`app.use('/api/*', sessionMiddleware)

app.get('/api/me', requireAuth, (c) => {
  const session = c.get('session')!
  return c.json({ user: session.user })
})

app.get('/api/posts', requireAuth, async (c) => {
  const session = c.get('session')!
  // fetch posts for session.user.id
  return c.json({ posts: [] })
})`, 'typescript'),

    h2('Full example with Hono RPC'),
    p('For end-to-end type safety with Hono RPC, define your app type and export it for the client:'),
    codeBlock(`// src/index.ts
import { Hono } from 'hono'
import { sessionMiddleware, requireAuth } from './middleware'

const app = new Hono<Env>()

app.all('/auth/*', async (c) => { /* ... auth handler ... */ })

const api = app
  .use('/api/*', sessionMiddleware)
  .get('/api/me', requireAuth, (c) => {
    return c.json({ user: c.get('session')!.user })
  })

export type AppType = typeof api
export default app`, 'typescript'),
  ]),
};
