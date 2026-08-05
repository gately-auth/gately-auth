<div align="center">
  <h1>🔐 gately-auth</h1>
  <p><strong>Cloudflare-native authentication framework</strong></p>
  <p>D1 · KV · Workers · Built for the edge</p>

  <p>
    <a href="https://www.npmjs.com/package/@gately/auth-core"><img src="https://img.shields.io/npm/v/@gately/auth-core?label=%40gately%2Fauth-core&color=black" alt="npm"></a>
    <a href="https://www.npmjs.com/package/@gately/auth-client"><img src="https://img.shields.io/npm/v/@gately/auth-client?label=%40gately%2Fauth-client&color=black" alt="npm"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="license"></a>
    <a href="https://github.com/gately-auth/gately-auth/actions"><img src="https://github.com/gately-auth/gately-auth/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  </p>

  <p>
    <a href="#quickstart">Quickstart</a> ·
    <a href="#packages">Packages</a> ·
    <a href="#how-it-works">How it works</a> ·
    <a href="https://gately-auth.dev/docs">Docs</a> ·
    <a href=".github/CONTRIBUTING.md">Contributing</a>
  </p>
</div>

---

## What is gately-auth?

gately-auth is a **production-grade authentication framework built entirely on Cloudflare's infrastructure**. Your users, sessions, and tokens live in **your** Cloudflare account — D1 for persistent data, KV for hot-path tokens.

It ships with:

- **Email + password** — PBKDF2-SHA512, auto sign-in, email verification
- **Magic links** — passwordless, one-time-use, 15-min TTL
- **Email OTP** — 6-digit codes with attempt limiting
- **OAuth 2.0 / OIDC** — Google, GitHub, and any OIDC provider (PKCE built-in)
- **Session management** — signed cookies, KV cache, revocation
- **Rate limiting** — KV-backed sliding window, per-route config
- **Plugin system** — extend auth flows without forking
- **Gately email plugin** — plug into Gately's transactional email platform for instant deliverability, tracking, and suppressions
- **TypeScript-first** — full type inference, `$Infer.Session` pattern

---

## Quickstart

### 1. Scaffold a Worker

```bash
npx @gately/auth-cli init
```

This creates `wrangler.toml`, `src/auth.ts`, and `src/worker.ts` ready to deploy.

### 2. Create your Cloudflare resources

```bash
# D1 database
npx wrangler d1 create gately-auth
# → copy the database_id into wrangler.toml

# KV namespace
npx wrangler kv:namespace create AUTH_KV
# → copy the id into wrangler.toml
```

### 3. Run migrations

```bash
npx @gately/auth-cli migrate --local
```

### 4. Set secrets

```bash
npx wrangler secret put GATELY_AUTH_SECRET
# Optional: Gately email
npx wrangler secret put GATELY_API_KEY
```

### 5. Start the dev server

```bash
npx wrangler dev
```

Your auth API is live at `http://localhost:8787/auth`.

---

## Manual setup (without the CLI)

```ts
// src/auth.ts
import { gatelyAuth } from "@gately/auth-core";
import { createD1Adapter, createKVStore } from "@gately/auth-core/adapters";
import { gatelyEmail } from "@gately/auth-core/plugins";

export function createAuth(env: Env) {
  return gatelyAuth({
    appName: "My App",
    baseURL: env.BASE_URL,
    secret: env.GATELY_AUTH_SECRET,
    db: createD1Adapter(env.AUTH_DB),
    kv: createKVStore(env.AUTH_KV),

    emailAndPassword: { enabled: true },

    plugins: [
      gatelyEmail({ apiKey: env.GATELY_API_KEY }),
    ],
  });
}
```

```ts
// src/worker.ts
import { createAuth, type Env } from "./auth";

export default {
  fetch(request: Request, env: Env) {
    return createAuth(env).handler(request);
  },
} satisfies ExportedHandler<Env>;
```

---

## Client setup

```bash
npm install @gately/auth-client
```

```ts
// lib/auth-client.ts
import { createAuthClient } from "@gately/auth-client";

export const authClient = createAuthClient({
  baseURL: "https://my-auth-worker.workers.dev",
});
```

### React

```tsx
import { createReactAuthClient } from "@gately/auth-client/react";

export const authClient = createReactAuthClient({
  baseURL: "https://my-auth-worker.workers.dev",
});

function App() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <Spinner />;
  if (!session) return <SignIn />;
  return <Dashboard user={session.user} />;
}
```

---

## API routes

All routes are mounted at your `basePath` (default `/auth`).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/session` | Get current session |
| `POST` | `/auth/sign-up/email` | Create account |
| `POST` | `/auth/sign-in/email` | Sign in |
| `POST` | `/auth/sign-out` | Sign out |
| `POST` | `/auth/magic-link/send` | Send magic link |
| `GET` | `/auth/magic-link/verify?token=` | Verify magic link |
| `POST` | `/auth/otp/send` | Send OTP code |
| `POST` | `/auth/otp/verify` | Verify OTP code |
| `POST` | `/auth/password/reset` | Request password reset |
| `POST` | `/auth/password/reset/confirm` | Confirm password reset |
| `GET` | `/auth/verify-email?token=` | Verify email address |
| `GET` | `/auth/oauth/:provider` | Start OAuth flow |
| `GET` | `/auth/oauth/:provider/callback` | OAuth callback |
| `GET` | `/auth/sessions` | List active sessions |
| `DELETE` | `/auth/sessions/:token` | Revoke a session |
| `DELETE` | `/auth/sessions` | Revoke all sessions |
| `GET` | `/auth/health` | Health check |

---

## Server-side API

```ts
// In a Hono route, Next.js Server Action, etc.
const auth = createAuth(env);

// Get session (returns null if not authenticated)
const session = await auth.api.getSession(request);

// Require session (throws 401 if not authenticated)
const session = await auth.api.requireSession(request);

// Revoke all sessions for a user
await auth.api.revokeAllSessions(userId);

// Look up a user
const user = await auth.api.getUserByEmail("user@example.com");
```

---

## How it works

```
Browser / Client
     │
     │  HTTP (cookie or Bearer token)
     ▼
Cloudflare Worker  ←── gately-auth handler
     │
     ├── D1 Database      users, sessions, accounts, verifications
     ├── KV Namespace     magic links, OTPs, rate-limit counters, session cache
     └── Gately API       transactional email (magic links, OTPs, password resets)
```

**No external auth services.** No per-user pricing. Your data stays in your Cloudflare account.

---

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@gately/auth-core`](packages/core) | [![npm](https://img.shields.io/npm/v/@gately/auth-core?color=black)](https://www.npmjs.com/package/@gately/auth-core) | Worker handler, D1/KV adapters, all providers |
| [`@gately/auth-client`](packages/client) | [![npm](https://img.shields.io/npm/v/@gately/auth-client?color=black)](https://www.npmjs.com/package/@gately/auth-client) | Browser client, React hooks |
| [`@gately/auth-cli`](packages/cli) | [![npm](https://img.shields.io/npm/v/@gately/auth-cli?color=black)](https://www.npmjs.com/package/@gately/auth-cli) | CLI — init, migrate, generate, deploy |
| [`@gately/auth-mcp`](packages/mcp) | [![npm](https://img.shields.io/npm/v/@gately/auth-mcp?color=black)](https://www.npmjs.com/package/@gately/auth-mcp) | MCP server runtime for agent-aware auth workflows |
| [`@gately/auth-skills`](packages/skills) | [![npm](https://img.shields.io/npm/v/@gately/auth-skills?color=black)](https://www.npmjs.com/package/@gately/auth-skills) | Composable auth skills for agent actions |

---

## Plugin system

```ts
import type { GatelyAuthPlugin } from "@gately/auth-core";

export function myPlugin(): GatelyAuthPlugin {
  return {
    id: "my-plugin",
    // Add fields to the user table
    schema: {
      user: {
        fields: {
          role: { type: "string", defaultValue: "user", input: false },
        },
      },
    },
    // Add custom routes at /auth/my-plugin/...
    endpoints: {
      "/my-plugin/status": async ({ session }) => {
        return new Response(JSON.stringify({ ok: true }));
      },
    },
    // Hook into auth lifecycle
    hooks: {
      after: [{
        matcher: (ctx) => ctx.path === "/sign-up/email",
        handler: async (ctx) => {
          // e.g. send a welcome Slack notification
        },
      }],
    },
  };
}
```

---

## Database schema

gately-auth creates four tables prefixed with `ga_` to avoid conflicts with your application tables:

| Table | Purpose |
|-------|---------|
| `ga_users` | User accounts |
| `ga_sessions` | Active sessions |
| `ga_accounts` | OAuth + credential accounts |
| `ga_verifications` | Email verification tokens |

Short-lived tokens (magic links, OTPs, rate-limit windows) live in **KV** — not D1 — to keep your database clean and fast.

---

## CLI

```bash
# Scaffold a new auth Worker
npx @gately/auth-cli init

# Generate migration SQL from your config
npx @gately/auth-cli generate

# Apply migrations
npx @gately/auth-cli migrate --local   # local wrangler dev
npx @gately/auth-cli migrate --remote  # production

# Deploy
npx @gately/auth-cli deploy
```

---

## Examples

| Example | Description |
|---------|-------------|
| [`examples/basic-worker`](examples/basic-worker) | Standalone Hono Worker — the minimal setup |
| [`examples/nextjs`](examples/nextjs) | Next.js App Router with middleware, sign-in/up pages, dashboard |

---

## Contributing

We welcome contributions. See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for the full guide.

**Quick start:**

```bash
git clone https://github.com/gately-auth/gately-auth.git
cd gately-auth
pnpm install
pnpm build
pnpm test
```

---

## License

Apache License 2.0 — see [LICENSE](LICENSE).

Copyright 2025 [Gately, Inc.](https://usegately.com)
