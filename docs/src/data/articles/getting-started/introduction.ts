import { bn, h2, h3, p, bullet, codeBlock, callout, card, cardGroup, divider } from '../../blocks';

export const introductionArticle = {
  id: 'introduction',
  title: 'Introduction',
  slug: 'introduction',
  excerpt: 'What gately-auth is, what it solves, and how it fits into a Cloudflare Workers project.',
  category_id: 'getting-started',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:book-open-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('gately-auth is a production-grade authentication framework built specifically for Cloudflare Workers. It uses D1 for user and session storage, KV for magic links, OTPs, rate-limit counters, and session caching — all running at the edge without a separate auth server.'),

    h2('Why gately-auth'),
    p('Most auth libraries are designed for Node.js servers. They rely on filesystem access, native crypto modules, or long-running processes. None of those exist on Workers.'),
    p('gately-auth is written from the ground up for the Workers runtime:'),
    bullet('Stores users and sessions in Cloudflare D1 (SQLite at the edge)'),
    bullet('Uses KV for ephemeral data — OTPs, magic links, rate-limit windows'),
    bullet('Ships a single fetch handler — mount it on any route in your Worker'),
    bullet('Zero Node.js dependencies — runs natively on the V8 isolate'),
    bullet('Works with Hono, itty-router, or as a standalone Worker'),

    h2('What it includes'),
    cardGroup(2, [
      card({ icon: 'hugeicons:mail-01', title: 'Email + Password', body: 'Sign up, sign in, email verification, and password reset. Configurable minimum length and auto sign-in after verification.' }),
      card({ icon: 'hugeicons:magic-wand-01', title: 'Magic Links', body: 'Passwordless sign-in via a time-limited link sent to the user\'s email address.' }),
      card({ icon: 'hugeicons:smartphone-01', title: 'Email OTP', body: 'Six-digit one-time codes for sign-in, sign-up, or two-factor flows.' }),
      card({ icon: 'hugeicons:google', title: 'OAuth / Social', body: 'Google, GitHub, and any OAuth 2.0 provider — PKCE, state validation, and profile mapping built in.' }),
    ]),

    h2('Packages'),
    p('gately-auth is a monorepo with three packages:'),
    bullet('@gately/auth-core — the Worker handler, adapters, providers, session management, and plugin system'),
    bullet('@gately/auth-client — a browser/React client SDK with reactive session state'),
    bullet('@gately/auth-cli — CLI to scaffold, generate migrations, and deploy'),

    h2('How it works'),
    p('You call gatelyAuth() with your D1 database, KV namespace, secret, and the auth methods you want to enable. It returns a handler function and a server-side API object.'),
    codeBlock(`import { gatelyAuth } from '@gately/auth-core'
import { createD1Adapter, createKVStore } from '@gately/auth-core/adapters'

export const auth = gatelyAuth({
  secret: env.AUTH_SECRET,
  db: createD1Adapter(env.AUTH_DB),
  kv: createKVStore(env.AUTH_KV),
  emailAndPassword: { enabled: true },
})

// In your Worker fetch handler:
export default {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/auth')) {
      return auth.handler(request)
    }
    return new Response('Not found', { status: 404 })
  }
}`, 'typescript'),

    callout('info', 'The handler mounts at /auth by default. Every auth route — sign-up, sign-in, session, OAuth callbacks — is served from that path.'),

    h2('Next steps'),
    bullet('Follow the Installation guide to install the packages and run the CLI'),
    bullet('Read the Quick Start to have a working Worker in under 5 minutes'),
    bullet('Check Core Concepts to understand how sessions, adapters, and plugins work'),
  ]),
};
