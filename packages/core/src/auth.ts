// ─────────────────────────────────────────────────────────────────────────────
// GatelyAuth — main factory function
// The single entry point. Returns a handler + API object.
// Designed to be acquisition-friendly: clean interface, no magic globals
// ─────────────────────────────────────────────────────────────────────────────

import type {
  GatelyAuthOptions,
  GatelyAuthContext,
  AuthSession,
  User,
  Session,
} from "./types/index.js";
import { GatelyAuthError, toErrorResponse } from "./error.js";
import {
  getCORSHeaders,
  handlePreflight,
  jsonResponse,
  redirectResponse,
  parseJsonBody,
  createLogger,
} from "./utils.js";
import {
  extractSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getBearerToken,
} from "./cookies.js";
import {
  getSessionByToken,
  revokeSession,
  revokeAllUserSessions,
  listUserSessions,
  requireSession,
  createSession,
} from "./session.js";
import {
  signUpEmail,
  signInEmail,
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,
} from "./providers/email-password.js";
import {
  sendMagicLink,
  verifyMagicLink,
  type MagicLinkConfig,
} from "./providers/magic-link.js";
import {
  sendEmailOTP,
  verifyEmailOTP,
  type EmailOTPConfig,
  type OTPType,
} from "./providers/email-otp.js";
import {
  buildOAuthRedirect,
  handleOAuthCallback,
} from "./providers/oauth.js";
import { checkRateLimit, buildRateLimitKey } from "./rate-limit.js";

// ── Rate-limit defaults per path ──────────────────────────────────────────────

const DEFAULT_RATE_LIMITS: Record<string, { window: number; max: number }> = {
  "/sign-up/email": { window: 60, max: 10 },
  "/sign-in/email": { window: 10, max: 5 },
  "/magic-link/send": { window: 60, max: 5 },
  "/otp/send": { window: 60, max: 5 },
  "/password/reset": { window: 60, max: 3 },
};

// ── Main factory ──────────────────────────────────────────────────────────────

export function gatelyAuth(options: GatelyAuthOptions) {
  const logger = createLogger(options.logger);
  const basePath = options.basePath ?? "/auth";
  const baseURL = options.baseURL ?? "";
  const trustedOrigins = options.trustedOrigins ?? [];
  const cookieConfig = options.cookies ?? {};
  // Helper: build cookie config for setSessionCookie — strip undefined expiresIn
  const sessionCookieConfig = (extraExpiresIn?: number) => ({
    ...cookieConfig,
    ...(extraExpiresIn !== undefined ? { expiresIn: extraExpiresIn } : {}),
  });

  const ctx: GatelyAuthContext = {
    options,
    db: options.db,
    kv: options.kv,
    secret: options.secret,
    baseURL,
    basePath,
    logger,
  };

  // Initialise plugins
  for (const plugin of options.plugins ?? []) {
    plugin.init?.(ctx);
  }

  // ── Per-request rate limiter ────────────────────────────────────────────────

  async function applyRateLimit(request: Request, path: string): Promise<void> {
    const rlConfig = options.rateLimit;
    if (rlConfig?.enabled === false) return;

    const customRules = {
      ...DEFAULT_RATE_LIMITS,
      ...(rlConfig?.customRules ?? {}),
    };

    const rule = customRules[path];
    if (!rule) return;

    const key = buildRateLimitKey(request, path);
    await checkRateLimit(options.kv, key, {
      ...rlConfig,
      customRules,
      path,
    });
  }

  // ── Route handler ───────────────────────────────────────────────────────────

  async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const cors = getCORSHeaders(origin, trustedOrigins, baseURL || url.origin);

    // Handle preflight
    const preflight = handlePreflight(request, trustedOrigins, baseURL || url.origin);
    if (preflight) return preflight;

    // Strip basePath prefix
    let path = url.pathname;
    if (path.startsWith(basePath)) {
      path = path.slice(basePath.length) || "/";
    }

    const method = request.method.toUpperCase();

    try {
      // ── GET /health ───────────────────────────────────────────────────────
      if (path === "/health" && method === "GET") {
        return jsonResponse({ ok: true, version: "1.0.0" }, { headers: cors });
      }

      // ── GET /session ──────────────────────────────────────────────────────
      if (path === "/session" && method === "GET") {
        const token = await extractSessionToken(request, options.secret, cookieConfig);
        if (!token) {
          return jsonResponse({ user: null, session: null }, { headers: cors });
        }
        const authSession = await getSessionByToken(
          token,
          options.db,
          options.kv,
          options.session
        );
        if (!authSession) {
          return jsonResponse({ user: null, session: null }, { headers: cors });
        }
        return jsonResponse(authSession, { headers: cors });
      }

      // ── POST /sign-up/email ───────────────────────────────────────────────
      if (path === "/sign-up/email" && method === "POST") {
        await applyRateLimit(request, "/sign-up/email");
        const body = await parseJsonBody(request);
        const result = await signUpEmail(
          body as Parameters<typeof signUpEmail>[0],
          request,
          options
        );
        const resHeaders = new Headers({ "Content-Type": "application/json", ...cors });
        if (result.token) {
          await setSessionCookie(resHeaders, result.token, options.secret, sessionCookieConfig(options.session?.expiresIn));
          resHeaders.set("Set-Auth-Token", result.token);
        }
        return new Response(JSON.stringify(result), { status: 201, headers: resHeaders });
      }

      // ── POST /sign-in/email ───────────────────────────────────────────────
      if (path === "/sign-in/email" && method === "POST") {
        await applyRateLimit(request, "/sign-in/email");
        const body = await parseJsonBody(request);
        const result = await signInEmail(
          body as unknown as Parameters<typeof signInEmail>[0],
          request,
          options
        );
        const resHeaders = new Headers({ "Content-Type": "application/json", ...cors });
        await setSessionCookie(resHeaders, result.token, options.secret, sessionCookieConfig(options.session?.expiresIn));
        resHeaders.set("Set-Auth-Token", result.token);
        return new Response(JSON.stringify(result), { status: 200, headers: resHeaders });
      }

      // ── POST /sign-out ────────────────────────────────────────────────────
      if (path === "/sign-out" && method === "POST") {
        const token = await extractSessionToken(request, options.secret, cookieConfig);
        if (token) {
          await revokeSession(token, options.db, options.kv);
        }
        const resHeaders = new Headers({ "Content-Type": "application/json", ...cors });
        clearSessionCookie(resHeaders, cookieConfig);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: resHeaders,
        });
      }

      // ── POST /password/reset (request reset) ─────────────────────────────
      if (path === "/password/reset" && method === "POST") {
        await applyRateLimit(request, "/password/reset");
        const body = await parseJsonBody<{ email: string }>(request);
        await requestPasswordReset(body.email, options);
        return jsonResponse({ success: true }, { headers: cors });
      }

      // ── POST /password/reset/confirm ──────────────────────────────────────
      if (path === "/password/reset/confirm" && method === "POST") {
        const body = await parseJsonBody<{ token: string; newPassword: string }>(request);
        await confirmPasswordReset(body.token, body.newPassword, options);
        return jsonResponse({ success: true }, { headers: cors });
      }

      // ── GET /verify-email?token=xxx ───────────────────────────────────────
      if (path === "/verify-email" && method === "GET") {
        const token = url.searchParams.get("token");
        if (!token) throw new GatelyAuthError("VERIFICATION_TOKEN_INVALID");

        const callbackURL = url.searchParams.get("callbackURL") ?? "/";
        const authSession = await verifyEmail(token, request, options);

        const resHeaders = new Headers({ ...cors });
        if (authSession) {
          const { token: sessionToken } = authSession as { token?: string } & AuthSession;
          // verifyEmail creates session — we need to grab token separately
          // For now just redirect; client uses /session to fetch state
        }
        return redirectResponse(callbackURL);
      }

      // ── POST /magic-link/send ─────────────────────────────────────────────
      if (path === "/magic-link/send" && method === "POST") {
        await applyRateLimit(request, "/magic-link/send");
        const body = await parseJsonBody<{
          email: string;
          callbackURL?: string;
        }>(request);

        const mlPlugin = options.plugins?.find((p) => p.id === "magic-link") as
          | (GatelyAuthPlugin & { config: MagicLinkConfig })
          | undefined;

        const mlConfig: MagicLinkConfig = mlPlugin?.config ?? {
          sendMagicLink: async ({ email, url: mlURL }) => {
            await options.emailProvider?.send({
              to: email,
              subject: `Sign in to ${options.appName ?? "your app"}`,
              html: `<a href="${mlURL}">Click here to sign in</a>`,
            });
          },
        };

        await sendMagicLink(body.email, body.callbackURL, mlConfig, options);
        return jsonResponse({ success: true }, { headers: cors });
      }

      // ── GET /magic-link/verify?token=xxx ──────────────────────────────────
      if (path === "/magic-link/verify" && method === "GET") {
        const token = url.searchParams.get("token");
        const callbackURL = url.searchParams.get("callbackURL") ?? "/";
        if (!token) throw new GatelyAuthError("MAGIC_LINK_INVALID");

        const mlPlugin = options.plugins?.find((p) => p.id === "magic-link") as
          | (GatelyAuthPlugin & { config: MagicLinkConfig })
          | undefined;

        const mlConfig: MagicLinkConfig = mlPlugin?.config ?? {
          sendMagicLink: async () => {},
        };

        const { sessionToken } = await verifyMagicLink(token, request, mlConfig, options);

        const resHeaders = new Headers({ ...cors });
        await setSessionCookie(resHeaders, sessionToken, options.secret, sessionCookieConfig(options.session?.expiresIn));
        resHeaders.set("Set-Auth-Token", sessionToken);
        resHeaders.set("Location", callbackURL);
        return new Response(null, { status: 302, headers: resHeaders });
      }

      // ── POST /otp/send ────────────────────────────────────────────────────
      if (path === "/otp/send" && method === "POST") {
        await applyRateLimit(request, "/otp/send");
        const body = await parseJsonBody<{ email: string; type?: OTPType }>(request);

        const otpPlugin = options.plugins?.find((p) => p.id === "email-otp") as
          | (GatelyAuthPlugin & { config: EmailOTPConfig })
          | undefined;

        if (!otpPlugin) throw new GatelyAuthError("BAD_REQUEST", "OTP plugin not configured");

        await sendEmailOTP(
          body.email,
          body.type ?? "sign-in",
          otpPlugin.config,
          options
        );
        return jsonResponse({ success: true }, { headers: cors });
      }

      // ── POST /otp/verify ──────────────────────────────────────────────────
      if (path === "/otp/verify" && method === "POST") {
        const body = await parseJsonBody<{
          email: string;
          code: string;
          type?: OTPType;
        }>(request);

        const otpPlugin = options.plugins?.find((p) => p.id === "email-otp") as
          | (GatelyAuthPlugin & { config: EmailOTPConfig })
          | undefined;

        if (!otpPlugin) throw new GatelyAuthError("BAD_REQUEST", "OTP plugin not configured");

        const { user, sessionToken } = await verifyEmailOTP(
          body.email,
          body.code,
          body.type ?? "sign-in",
          request,
          otpPlugin.config,
          options
        );

        const resHeaders = new Headers({ "Content-Type": "application/json", ...cors });
        await setSessionCookie(resHeaders, sessionToken, options.secret, sessionCookieConfig(options.session?.expiresIn));
        resHeaders.set("Set-Auth-Token", sessionToken);
        return new Response(JSON.stringify({ user }), { status: 200, headers: resHeaders });
      }

      // ── GET /oauth/:provider ──────────────────────────────────────────────
      const oauthRedirectMatch = path.match(/^\/oauth\/([^/]+)$/);
      if (oauthRedirectMatch && method === "GET") {
        const providerId = oauthRedirectMatch[1]!;
        const callbackURL = url.searchParams.get("callbackURL") ?? "/";
        const { redirectURL } = await buildOAuthRedirect(providerId, callbackURL, options);
        return redirectResponse(redirectURL);
      }

      // ── GET /oauth/:provider/callback ─────────────────────────────────────
      const oauthCallbackMatch = path.match(/^\/oauth\/([^/]+)\/callback$/);
      if (oauthCallbackMatch && method === "GET") {
        const providerId = oauthCallbackMatch[1]!;
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const callbackURL = url.searchParams.get("callbackURL") ?? "/";

        if (!code || !state) throw new GatelyAuthError("INVALID_OAUTH_STATE");

        const { sessionToken } = await handleOAuthCallback(
          providerId,
          code,
          state,
          request,
          options
        );

        const resHeaders = new Headers({ ...cors });
        await setSessionCookie(resHeaders, sessionToken, options.secret, sessionCookieConfig(options.session?.expiresIn));
        resHeaders.set("Set-Auth-Token", sessionToken);
        resHeaders.set("Location", callbackURL);
        return new Response(null, { status: 302, headers: resHeaders });
      }

      // ── GET /sessions ─────────────────────────────────────────────────────
      if (path === "/sessions" && method === "GET") {
        const token = await extractSessionToken(request, options.secret, cookieConfig);
        const authSession = await requireSession(token, options.db, options.kv, options.session);
        const sessions = await listUserSessions(authSession.user.id, options.db);
        return jsonResponse({ sessions }, { headers: cors });
      }

      // ── DELETE /sessions/:token ───────────────────────────────────────────
      const revokeMatch = path.match(/^\/sessions\/(.+)$/);
      if (revokeMatch && method === "DELETE") {
        const token = await extractSessionToken(request, options.secret, cookieConfig);
        await requireSession(token, options.db, options.kv, options.session);
        const sessionTokenToRevoke = revokeMatch[1]!;
        await revokeSession(sessionTokenToRevoke, options.db, options.kv);
        return jsonResponse({ success: true }, { headers: cors });
      }

      // ── DELETE /sessions (revoke all) ─────────────────────────────────────
      if (path === "/sessions" && method === "DELETE") {
        const token = await extractSessionToken(request, options.secret, cookieConfig);
        const authSession = await requireSession(token, options.db, options.kv, options.session);
        await revokeAllUserSessions(authSession.user.id, options.db);
        const resHeaders = new Headers({ "Content-Type": "application/json", ...cors });
        clearSessionCookie(resHeaders, cookieConfig);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: resHeaders });
      }

      // ── Plugin endpoints ──────────────────────────────────────────────────
      for (const plugin of options.plugins ?? []) {
        if (!plugin.endpoints) continue;
        for (const [endpointPath, endpointHandler] of Object.entries(plugin.endpoints)) {
          if (path === endpointPath || path.startsWith(`${endpointPath}/`)) {
            const token = await extractSessionToken(request, options.secret, cookieConfig).catch(() => null);
            const session = token
              ? await getSessionByToken(token, options.db, options.kv, options.session)
              : null;

            return endpointHandler({
              request,
              url,
              db: options.db,
              kv: options.kv,
              options,
              session,
            });
          }
        }
      }

      // ── 404 ───────────────────────────────────────────────────────────────
      return jsonResponse(
        { error: { code: "NOT_FOUND", message: `Route ${method} ${path} not found` } },
        { status: 404, headers: cors }
      );

    } catch (err) {
      logger.error("Request error:", err);
      return toErrorResponse(err, cors);
    }
  }

  // ── Server-side API (for use in Actions, middleware, etc.) ─────────────────

  const api = {
    /** Get session from request headers */
    async getSession(req: Request): Promise<AuthSession | null> {
      const token = await extractSessionToken(req, options.secret, cookieConfig);
      if (!token) return null;
      return getSessionByToken(token, options.db, options.kv, options.session);
    },

    /** Get session or throw UNAUTHORIZED */
    async requireSession(req: Request): Promise<AuthSession> {
      const token = await extractSessionToken(req, options.secret, cookieConfig);
      return requireSession(token, options.db, options.kv, options.session);
    },

    /** Revoke a session by token */
    async revokeSession(token: string): Promise<void> {
      return revokeSession(token, options.db, options.kv);
    },

    /** Revoke all sessions for a user */
    async revokeAllSessions(userId: string): Promise<void> {
      return revokeAllUserSessions(userId, options.db);
    },

    /** List active sessions for a user */
    async listSessions(userId: string): Promise<Session[]> {
      return listUserSessions(userId, options.db);
    },

    /** Create a session for a user (server-side) */
    async createSession(
      userId: string,
      req: Request
    ): Promise<{ session: Session; token: string }> {
      return createSession(userId, req, options.db, options.session);
    },

    /** Find user by email */
    async getUserByEmail(email: string): Promise<User | null> {
      return options.db.findOne<User>({
        model: "user",
        where: [{ field: "email", value: email.toLowerCase().trim() }],
      });
    },

    /** Find user by ID */
    async getUserById(id: string): Promise<User | null> {
      return options.db.findOne<User>({
        model: "user",
        where: [{ field: "id", value: id }],
      });
    },
  };

  return {
    handler,
    api,
    options,
    /** For type inference: typeof auth.$Infer.Session */
    $Infer: {} as { Session: AuthSession; User: User },
  };
}

export type GatelyAuthInstance = ReturnType<typeof gatelyAuth>;

// Re-export convenience types
import type { GatelyAuthPlugin } from "./types/index.js";
