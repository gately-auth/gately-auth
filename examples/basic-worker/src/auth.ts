// ─────────────────────────────────────────────────────────────────────────────
// Auth configuration
// This is the only file you need to customise.
// ─────────────────────────────────────────────────────────────────────────────

import { gatelyAuth } from "@gately-auth/core";
import { createD1Adapter, createKVStore } from "@gately-auth/core/adapters";
import { gatelyEmail, emailTemplates } from "@gately-auth/core/plugins";

// ── Cloudflare Worker bindings ────────────────────────────────────────────────

export interface Env {
  // D1 + KV bindings (declared in wrangler.toml)
  AUTH_DB: D1Database;
  AUTH_KV: KVNamespace;

  // Vars (from [vars] in wrangler.toml)
  APP_NAME: string;
  GATELY_AUTH_BASE_URL: string;

  // Secrets (set via: npx wrangler secret put <KEY>)
  GATELY_AUTH_SECRET: string;
  GATELY_API_KEY: string;

  // Optional — social providers
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

// ── Auth factory ──────────────────────────────────────────────────────────────

export function createAuth(env: Env) {
  return gatelyAuth({
    // ── Identity ─────────────────────────────────────────────────────────────
    appName: env.APP_NAME,
    baseURL: env.GATELY_AUTH_BASE_URL,
    secret: env.GATELY_AUTH_SECRET,

    // ── Storage (Cloudflare D1 + KV) ─────────────────────────────────────────
    db: createD1Adapter(env.AUTH_DB),
    kv: createKVStore(env.AUTH_KV),

    // ── Email + password ──────────────────────────────────────────────────────
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // set to true for production
      minPasswordLength: 8,
      autoSignIn: true,

      // Password reset email
      sendResetPassword: async ({ user, url }) => {
        await createAuth(env).options.emailProvider?.send(
          emailTemplates.passwordReset({ appName: env.APP_NAME, url })
        );
      },
    },

    // ── Email verification ────────────────────────────────────────────────────
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await createAuth(env).options.emailProvider?.send({
          to: user.email,
          ...emailTemplates.emailVerification({ appName: env.APP_NAME, url }),
        });
      },
    },

    // ── Social providers ──────────────────────────────────────────────────────
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          socialProviders: {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
            ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
              ? {
                  github: {
                    clientId: env.GITHUB_CLIENT_ID,
                    clientSecret: env.GITHUB_CLIENT_SECRET,
                  },
                }
              : {}),
          },
        }
      : {}),

    // ── Plugins ───────────────────────────────────────────────────────────────
    plugins: [
      // Gately email — plugs into Gately's transactional email platform
      // delivers magic links, OTPs, password resets with tracking + deliverability
      gatelyEmail({
        apiKey: env.GATELY_API_KEY,
        fromName: env.APP_NAME,
      }),
    ],

    // ── Session config ────────────────────────────────────────────────────────
    session: {
      expiresIn: 60 * 60 * 24 * 7,   // 7 days
      updateAge: 60 * 60 * 24,         // extend daily
      cookieCache: {
        enabled: true,
        maxAge: 300,                    // 5-min KV cache — reduces D1 reads
      },
    },

    // ── Security ──────────────────────────────────────────────────────────────
    cookies: {
      prefix: "ga",
      secure: env.GATELY_AUTH_BASE_URL.startsWith("https"),
      sameSite: "lax",
    },

    rateLimit: {
      enabled: true,
      customRules: {
        "/sign-in/email": { window: 10, max: 5 },   // 5 attempts / 10s
        "/magic-link/send": { window: 60, max: 3 }, // 3 magic links / min
      },
    },

    trustedOrigins: [
      // Add your frontend URLs here
      // "https://myapp.com",
      // "http://localhost:3000",
    ],

    logger: {
      level: "info",
    },
  });
}
