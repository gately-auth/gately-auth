# gately-auth Recipes

## Email + password sign-up and sign-in

```typescript
// Enable in gatelyAuth config:
emailAndPassword: {
  enabled: true,
  requireEmailVerification: false,
  minPasswordLength: 8,
}

// Client:
const { data, error } = await authClient.signUp.email({
  email: 'user@example.com',
  password: 'secret123',
  name: 'Alice',
})

const { data, error } = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'secret123',
})
```

## Magic link (passwordless)

```typescript
// Requires gatelyEmail plugin — no extra config needed

// Send:
await authClient.signIn.magicLink({ email: 'user@example.com', callbackURL: '/dashboard' })

// The verify route (GET /auth/magic-link/verify?token=xxx) is handled automatically
```

## Email OTP

```typescript
// Add email-otp plugin:
plugins: [
  gatelyEmail({ apiKey: env.GATELY_API_KEY }),
  {
    id: 'email-otp',
    name: 'Email OTP',
    config: {
      sendOTP: async ({ email, otp }, options) => {
        await options.emailProvider?.send({
          to: email,
          subject: 'Your verification code',
          html: `<p>Code: <strong>${otp}</strong></p>`,
        })
      },
    },
  },
]

// Send code:
await authClient.otp.send({ email: 'user@example.com', type: 'sign-in' })

// Verify:
await authClient.signIn.otp({ email: 'user@example.com', code: '123456' })
```

## OAuth (Google, GitHub)

```typescript
// Configure in gatelyAuth:
socialProviders: {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  },
}

// Callback URLs to register with providers:
// https://your-worker.workers.dev/auth/oauth/google/callback
// https://your-worker.workers.dev/auth/oauth/github/callback

// Client — redirects browser to provider:
await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' })
```

## React hooks (useSession)

```typescript
// Create client once in lib/auth-client.ts:
import { createReactAuthClient } from '@gately/auth-client/react'

export const authClient = createReactAuthClient({
  baseURL: 'https://my-worker.workers.dev',
})

// In any component:
const { data: session, isPending, error } = authClient.useSession()

if (isPending) return <Spinner />
if (!session) return <SignInPage />
return <Dashboard user={session.user} />
```

## Protect a route (Next.js middleware)

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from '@gately/auth-client'

export function middleware(request: NextRequest) {
  const cookie = getSessionCookie(request)
  if (!cookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  return NextResponse.next()
}
```

## Protect a route (Hono middleware)

```typescript
import { createAuth } from './auth'

app.use('/api/*', async (c, next) => {
  const auth = createAuth(c.env)
  const session = await auth.api.getSession(c.req.raw)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  c.set('session', session)
  await next()
})
```

## Admin plugin (ban/unban users)

```typescript
import { adminPlugin } from '@gately/auth-core/plugins'

plugins: [adminPlugin({ adminSecret: env.ADMIN_SECRET })]

// Server-to-server calls:
await fetch('/auth/admin/users/usr_abc123/ban', {
  method: 'POST',
  headers: { 'X-Admin-Key': process.env.ADMIN_SECRET },
})
```

## Username plugin

```typescript
import { usernamePlugin } from '@gately/auth-core/plugins'

plugins: [usernamePlugin({ minLength: 3, required: true })]

// Sign up with username:
await authClient.signUp.email({ email, password, username: 'alice_dev' })

// Check availability:
const res = await fetch('/auth/username/check?username=alice_dev')
const { available } = await res.json()
```

## Google One Tap

```typescript
import { oneTapPlugin } from '@gately/auth-core/plugins'

plugins: [oneTapPlugin({ clientId: env.GOOGLE_CLIENT_ID })]

// Frontend:
google.accounts.id.initialize({
  client_id: 'YOUR_CLIENT_ID',
  callback: async ({ credential }) => {
    await fetch('/auth/one-tap/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    })
    window.location.href = '/dashboard'
  },
})
google.accounts.id.prompt()
```

## Sign out

```typescript
await authClient.signOut()
// or server-side:
await auth.api.revokeSession(token)
await auth.api.revokeAllSessions(userId)
```

## TypeScript inference

```typescript
const auth = createAuth(env)
type Session = typeof auth.$Infer.Session
// { user: User, session: Session }

const client = createReactAuthClient({ baseURL })
type Session = typeof client.$Infer.Session
```
