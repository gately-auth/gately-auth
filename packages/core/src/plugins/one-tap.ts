// ─────────────────────────────────────────────────────────────────────────────
// Google One Tap Plugin
// Exchanges a Google ID token (from the One Tap / Sign in With Google button)
// for a gately-auth session without a full OAuth redirect flow.
// ─────────────────────────────────────────────────────────────────────────────

import type { GatelyAuthPlugin, User } from "../types/index.js";
import { GatelyAuthError } from "../error.js";
import { generateId } from "../crypto/index.js";
import { createSession } from "../session.js";
import { setSessionCookie } from "../cookies.js";

export interface OneTapPluginConfig {
  /**
   * Your Google OAuth client ID (same one used for the One Tap JS snippet).
   */
  clientId: string;
  /**
   * Where to redirect after a successful One Tap sign-in (default: "/").
   */
  callbackURL?: string;
}

interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

async function verifyGoogleIdToken(
  idToken: string,
  clientId: string
): Promise<GoogleTokenPayload> {
  // Google's tokeninfo endpoint validates the token server-side.
  // For production you can switch to the Google Auth Library approach
  // using the JWK endpoint — but tokeninfo is simpler and works on Workers.
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!res.ok) {
    throw new GatelyAuthError("INVALID_TOKEN", "Google ID token verification failed");
  }

  const payload = (await res.json()) as GoogleTokenPayload;

  // Verify the token was issued for our client
  if (payload.aud !== clientId) {
    throw new GatelyAuthError("INVALID_TOKEN", "Google ID token was issued for a different client");
  }

  // Verify not expired
  if (Date.now() / 1000 > payload.exp) {
    throw new GatelyAuthError("INVALID_TOKEN", "Google ID token has expired");
  }

  return payload;
}

/**
 * Google One Tap Plugin
 *
 * Handles the credential response from the Google One Tap prompt or the
 * "Sign in with Google" button without a redirect flow.
 *
 * Adds the following endpoint:
 *   POST /auth/one-tap/callback
 *     Body: { credential: string, callbackURL?: string }
 *     Returns: sets session cookie + redirects (or returns JSON for API clients)
 *
 * Usage in your frontend:
 * ```html
 * <script>
 *   google.accounts.id.initialize({
 *     client_id: 'YOUR_GOOGLE_CLIENT_ID',
 *     callback: async ({ credential }) => {
 *       await fetch('/auth/one-tap/callback', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         credentials: 'include',
 *         body: JSON.stringify({ credential }),
 *       })
 *       window.location.href = '/dashboard'
 *     }
 *   })
 *   google.accounts.id.prompt()
 * </script>
 * ```
 *
 * @example
 * ```ts
 * import { gatelyAuth } from '@gately/auth-core'
 * import { oneTapPlugin } from '@gately/auth-core/plugins'
 *
 * const auth = gatelyAuth({
 *   plugins: [
 *     oneTapPlugin({ clientId: env.GOOGLE_CLIENT_ID }),
 *   ],
 * })
 * ```
 */
export function oneTapPlugin(config: OneTapPluginConfig): GatelyAuthPlugin {
  return {
    id: "google-one-tap",
    name: "Google One Tap",

    endpoints: {
      "/one-tap/callback": async ({ request, db, kv, options }) => {
        if (request.method !== "POST") {
          throw new GatelyAuthError("METHOD_NOT_ALLOWED");
        }

        let body: { credential?: string; callbackURL?: string };
        try {
          body = await request.json() as { credential?: string; callbackURL?: string };
        } catch {
          throw new GatelyAuthError("BAD_REQUEST", "Invalid JSON body");
        }

        if (!body.credential) {
          throw new GatelyAuthError("BAD_REQUEST", "credential is required");
        }

        // Verify the Google ID token
        const payload = await verifyGoogleIdToken(body.credential, config.clientId);

        if (!payload.email) {
          throw new GatelyAuthError("PROVIDER_EMAIL_MISSING");
        }

        // Find or create the user
        let user = await db.findOne<User>({
          model: "user",
          where: [{ field: "email", value: payload.email.toLowerCase() }],
        });

        if (!user) {
          user = await db.create<User>({
            model: "user",
            data: {
              id: generateId(),
              email: payload.email.toLowerCase(),
              name: payload.name ?? null,
              image: payload.picture ?? null,
              emailVerified: payload.email_verified ?? false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

          // Create an OAuth account record linking Google to this user
          await db.create({
            model: "account",
            data: {
              id: generateId(),
              userId: user.id,
              providerId: "google",
              accountId: payload.sub,
              password: null,
              accessToken: null,
              refreshToken: null,
              accessTokenExpiresAt: null,
              idToken: null,
              scope: "openid email profile",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }

        // Create a gately-auth session
        const { token } = await createSession(user.id, request, db, options.session);

        const callbackURL = body.callbackURL ?? config.callbackURL ?? "/";
        const accept = request.headers.get("Accept") ?? "";
        const isJsonClient = accept.includes("application/json");

        const resHeaders = new Headers({ "Content-Type": "application/json" });
        await setSessionCookie(resHeaders, token, options.secret, options.cookies ?? {});
        resHeaders.set("Set-Auth-Token", token);

        if (isJsonClient) {
          return new Response(JSON.stringify({ user, token }), {
            status: 200,
            headers: resHeaders,
          });
        }

        resHeaders.set("Location", callbackURL);
        return new Response(null, { status: 302, headers: resHeaders });
      },
    },
  };
}
