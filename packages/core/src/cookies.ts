// ─────────────────────────────────────────────────────────────────────────────
// Cookie management
// ─────────────────────────────────────────────────────────────────────────────

import type { CookieConfig } from "./types/index.js";
import { signCookieValue, unsignCookieValue } from "./crypto/index.js";

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  domain?: string;
  path?: string;
}

// ── Cookie names ──────────────────────────────────────────────────────────────

export function getCookieNames(prefix = "gately-auth") {
  return {
    sessionToken: `${prefix}.session_token`,
    sessionCache: `${prefix}.session_data`,
    oauthState: `${prefix}.oauth_state`,
    magicLink: `${prefix}.ml_pending`,
  } as const;
}

// ── Parse cookies from request ────────────────────────────────────────────────

export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(";").flatMap((pair) => {
      const eqIdx = pair.indexOf("=");
      if (eqIdx === -1) return [];
      const key = pair.slice(0, eqIdx).trim();
      const val = pair.slice(eqIdx + 1).trim();
      return [[key, decodeURIComponent(val)]];
    })
  );
}

/** Get a single cookie from a request */
export function getCookie(request: Request, name: string): string | null {
  const cookies = parseCookies(request);
  return cookies[name] ?? null;
}

// ── Serialize a cookie into a Set-Cookie string ───────────────────────────────

export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): string {
  const parts: string[] = [
    `${name}=${encodeURIComponent(value)}`,
  ];

  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);

  parts.push(`Path=${options.path ?? "/"}`);

  if (options.httpOnly !== false) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");

  const sameSite = options.sameSite ?? "lax";
  parts.push(`SameSite=${sameSite.charAt(0).toUpperCase() + sameSite.slice(1)}`);

  return parts.join("; ");
}

// ── Session token cookie helpers ──────────────────────────────────────────────

export async function setSessionCookie(
  headers: Headers,
  token: string,
  secret: string,
  config: CookieConfig & { expiresIn?: number }
): Promise<void> {
  const signed = await signCookieValue(token, secret);
  const names = getCookieNames(config.prefix);
  const isProduction = config.secure ?? false;
  const cookieOpts: CookieOptions = {
    maxAge: config.expiresIn ?? 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: isProduction,
    sameSite: config.sameSite ?? "lax",
  };
  if (config.domain !== undefined) cookieOpts.domain = config.domain;

  headers.append("Set-Cookie", serializeCookie(names.sessionToken, signed, cookieOpts));
}

export async function getSessionTokenFromCookie(
  request: Request,
  secret: string,
  config: CookieConfig
): Promise<string | null> {
  const names = getCookieNames(config.prefix);
  const raw = getCookie(request, names.sessionToken);
  if (!raw) return null;
  return unsignCookieValue(raw, secret);
}

export function clearSessionCookie(
  headers: Headers,
  config: CookieConfig
): void {
  const names = getCookieNames(config.prefix);
  headers.append(
    "Set-Cookie",
    serializeCookie(names.sessionToken, "", {
      maxAge: 0,
      httpOnly: true,
      secure: config.secure ?? false,
    })
  );
}

// ── Bearer token helper (for non-browser clients) ─────────────────────────────

export function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

/** Extract session token from either cookie or Authorization header */
export async function extractSessionToken(
  request: Request,
  secret: string,
  config: CookieConfig
): Promise<string | null> {
  // 1. Cookie (preferred for browser clients)
  const fromCookie = await getSessionTokenFromCookie(request, secret, config);
  if (fromCookie) return fromCookie;

  // 2. Bearer token (for API clients)
  const bearer = getBearerToken(request);
  if (bearer) return bearer;

  return null;
}

// ── Get session cookie for middleware (no DB round-trip) ──────────────────────

/** Read the raw session token from a request without verifying against the DB.
 *  Useful in edge middleware for quick redirect logic.
 *  ⚠️  Does NOT validate the session — always call getSession() for real auth. */
export async function getSessionCookie(
  request: Request,
  options?: { cookiePrefix?: string; secret: string }
): Promise<string | null> {
  if (!options?.secret) return null;
  const names = getCookieNames(options.cookiePrefix);
  const raw = getCookie(request, names.sessionToken);
  if (!raw) return null;
  return unsignCookieValue(raw, options.secret);
}
