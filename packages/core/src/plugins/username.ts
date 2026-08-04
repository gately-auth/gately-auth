// ─────────────────────────────────────────────────────────────────────────────
// Username Plugin
// Adds a unique username field to the user table.
// Accepts username on sign-up and exposes a /auth/username/check endpoint.
// ─────────────────────────────────────────────────────────────────────────────

import type { GatelyAuthPlugin, User } from "../types/index.js";
import { GatelyAuthError } from "../error.js";

export interface UsernamePluginConfig {
  /**
   * Minimum username length (default: 3).
   */
  minLength?: number;
  /**
   * Maximum username length (default: 32).
   */
  maxLength?: number;
  /**
   * Regex the username must match (default: alphanumeric + underscore + hyphen).
   */
  pattern?: RegExp;
  /**
   * Whether username is required on sign-up (default: false — optional).
   */
  required?: boolean;
}

function validateUsername(
  username: string,
  config: UsernamePluginConfig
): string {
  const min = config.minLength ?? 3;
  const max = config.maxLength ?? 32;
  const pattern = config.pattern ?? /^[a-zA-Z0-9_-]+$/;

  const trimmed = username.trim().toLowerCase();

  if (trimmed.length < min) {
    throw new GatelyAuthError("BAD_REQUEST", `Username must be at least ${min} characters`);
  }
  if (trimmed.length > max) {
    throw new GatelyAuthError("BAD_REQUEST", `Username must be at most ${max} characters`);
  }
  if (!pattern.test(trimmed)) {
    throw new GatelyAuthError(
      "BAD_REQUEST",
      "Username may only contain letters, numbers, underscores, and hyphens"
    );
  }

  return trimmed;
}

/**
 * Username Plugin
 *
 * Adds a `username` field to the user table. Usernames are:
 * - Lowercased and trimmed automatically
 * - Validated for length and character set
 * - Unique across all users
 *
 * Adds the following endpoints:
 *   GET /auth/username/check?username=xxx — check availability (no auth required)
 *
 * The username field is accepted on sign-up via the standard email/password
 * sign-up body: { email, password, username }.
 *
 * @example
 * ```ts
 * import { gatelyAuth } from '@gately/auth-core'
 * import { usernamePlugin } from '@gately/auth-core/plugins'
 *
 * const auth = gatelyAuth({
 *   plugins: [
 *     usernamePlugin({ minLength: 3, required: true }),
 *   ],
 * })
 * ```
 */
export function usernamePlugin(config: UsernamePluginConfig = {}): GatelyAuthPlugin {
  return {
    id: "username",
    name: "Username",

    schema: {
      user: {
        fields: {
          username: {
            type: "string",
            required: config.required ?? false,
            unique: true,
            input: true,
          },
        },
      },
    },

    hooks: {
      before: [
        {
          // Intercept sign-up to validate and check uniqueness
          matcher: (ctx) =>
            ctx.path === "/sign-up/email" && ctx.method === "POST",
          handler: async (ctx) => {
            const body = ctx.body as Record<string, unknown> | null;
            const rawUsername = body?.username as string | undefined;

            if (!rawUsername) {
              if (config.required) {
                throw new GatelyAuthError("BAD_REQUEST", "Username is required");
              }
              return;
            }

            const username = validateUsername(rawUsername, config);

            // Check uniqueness
            const existing = await ctx.db.findOne<User>({
              model: "user",
              where: [{ field: "username", value: username }],
            });

            if (existing) {
              throw new GatelyAuthError("BAD_REQUEST", "Username is already taken");
            }

            // Normalise username back into body for the sign-up handler
            if (ctx.body) {
              (ctx.body as Record<string, unknown>).username = username;
            }
          },
        },
      ],
    },

    endpoints: {
      // ── GET /auth/username/check?username=xxx ─────────────────────────────
      "/username/check": async ({ request, url, db }) => {
        if (request.method !== "GET") {
          throw new GatelyAuthError("METHOD_NOT_ALLOWED");
        }

        const rawUsername = url.searchParams.get("username");
        if (!rawUsername) {
          throw new GatelyAuthError("BAD_REQUEST", "username query parameter required");
        }

        let username: string;
        try {
          username = validateUsername(rawUsername, config);
        } catch (err) {
          return Response.json({ available: false, error: (err as Error).message });
        }

        const existing = await db.findOne<User>({
          model: "user",
          where: [{ field: "username", value: username }],
        });

        return Response.json({ available: !existing, username });
      },
    },
  };
}
