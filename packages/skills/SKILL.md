# gately-auth

Gately-auth is a **Cloudflare Workers-native** authentication framework. It uses Cloudflare D1 (SQLite) for users and sessions, and Cloudflare KV for magic links, OTPs, and rate limiting. It does not use Node.js APIs.

## Package names

```
@gately/auth-core    — Worker handler, D1/KV adapters, providers, plugins
@gately/auth-client  — Browser/React client SDK
@gately/auth-cli     — CLI: scaffold, login, setup, migrate, deploy
```

## Installation

```bash
npm install @gately/auth-core          # server
npm install @gately/auth-client        # frontend
npm install -g @gately/auth-cli        # CLI
```

## Core setup pattern

Always create a `createAuth(env)` factory function — never instantiate auth globally.

```typescript
// src/auth.ts
import { gatelyAuth } from '@gately/auth-core'
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
    baseURL: 'https://my-worker.workers.dev',
    db: createD1Adapter(env.AUTH_DB),
    kv: createKVStore(env.AUTH_KV),
    emailAndPassword: { enabled: true },
    plugins: [gatelyEmail({ apiKey: env.GATELY_API_KEY })],
  })
}
```

## Worker entry pattern

```typescript
// src/worker.ts
import { createAuth, type Env } from './auth'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const auth = createAuth(env)
    return auth.handler(request)
  }
}
```

## wrangler.toml bindings (required)

```toml
[[d1_databases]]
binding = "AUTH_DB"
database_name = "auth-db"
database_id = "your-d1-database-id"

[[kv_namespaces]]
binding = "AUTH_KV"
id = "your-kv-namespace-id"
```

## Auth routes (all auto-handled under /auth/*)

```
POST   /auth/sign-up/email
POST   /auth/sign-in/email
POST   /auth/sign-out
GET    /auth/session
POST   /auth/magic-link/send
GET    /auth/magic-link/verify
POST   /auth/otp/send
POST   /auth/otp/verify
GET    /auth/oauth/:provider
GET    /auth/oauth/:provider/callback
POST   /auth/password/reset
POST   /auth/password/reset/confirm
GET    /auth/verify-email
GET    /auth/sessions
DELETE /auth/sessions/:token
```

## Server-side session API

```typescript
const auth = createAuth(env)

// In any route handler:
const session = await auth.api.getSession(request)       // null if not authenticated
const session = await auth.api.requireSession(request)   // throws UNAUTHORIZED if not authenticated
const user = await auth.api.getUserByEmail('user@example.com')
const user = await auth.api.getUserById('usr_abc123')
```

## CLI workflow

```bash
gately-auth init          # scaffold project
gately-auth login         # connect Cloudflare account
gately-auth setup         # create D1 + KV, patch wrangler.toml
gately-auth migrate --local   # apply schema to local D1
gately-auth migrate --remote  # apply schema to production
gately-auth deploy        # deploy Worker
```

## Error handling

All errors follow this shape:
```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" } }
```

Common codes: `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `SESSION_EXPIRED`, `RATE_LIMIT_EXCEEDED`, `MAGIC_LINK_EXPIRED`, `OTP_INVALID`, `UNAUTHORIZED`.

## Important conventions

- Never put `gatelyAuth()` at module level — always inside a function that receives `env`
- D1 binding name must be `AUTH_DB` by default (configurable)
- KV binding name must be `AUTH_KV` by default (configurable)
- `AUTH_SECRET` must be at least 32 characters — use `wrangler secret put AUTH_SECRET` for production
- `basePath` defaults to `/auth` — mount your Worker to handle `/auth/*`
- Sessions are stored in D1, not JWTs — revoking is instant

## Docs

Full documentation: https://g-a.usegately.com
MCP server: https://mcp.g-a.usegately.com/mcp
