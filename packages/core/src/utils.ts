// ─────────────────────────────────────────────────────────────────────────────
// Shared utilities — CORS, request parsing, response helpers
// ─────────────────────────────────────────────────────────────────────────────

import { GatelyAuthError } from "./error.js";

// ── CORS ──────────────────────────────────────────────────────────────────────

/** Match a trusted origin pattern (supports wildcards like *.example.com) */
export function matchOrigin(origin: string, pattern: string): boolean {
  if (pattern === origin) return true;
  if (pattern.includes("*")) {
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, "[^.]+");
    return new RegExp(`^${escaped}$`).test(origin);
  }
  return false;
}

export function isTrustedOrigin(
  origin: string | null,
  trustedOrigins: string[],
  baseURL: string
): boolean {
  if (!origin) return false;
  const baseOrigin = new URL(baseURL).origin;
  if (origin === baseOrigin) return true;
  return trustedOrigins.some((p) => matchOrigin(origin, p));
}

export function getCORSHeaders(
  origin: string | null,
  trustedOrigins: string[],
  baseURL: string
): Record<string, string> {
  const trusted = origin && isTrustedOrigin(origin, trustedOrigins, baseURL);
  if (!trusted) return {};
  return {
    "Access-Control-Allow-Origin": origin!,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  };
}

/** Handle OPTIONS preflight */
export function handlePreflight(
  request: Request,
  trustedOrigins: string[],
  baseURL: string
): Response | null {
  if (request.method !== "OPTIONS") return null;
  const origin = request.headers.get("Origin");
  const cors = getCORSHeaders(origin, trustedOrigins, baseURL);
  return new Response(null, { status: 204, headers: cors });
}

// ── Response helpers ──────────────────────────────────────────────────────────

export function jsonResponse(
  data: unknown,
  options: { status?: number; headers?: Record<string, string> } = {}
): Response {
  return new Response(JSON.stringify(data), {
    status: options.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export function redirectResponse(url: string, status = 302): Response {
  return new Response(null, {
    status,
    headers: { Location: url },
  });
}

// ── Request parsing ───────────────────────────────────────────────────────────

export async function parseJsonBody<T = Record<string, unknown>>(
  request: Request
): Promise<T> {
  try {
    const text = await request.text();
    if (!text) throw new GatelyAuthError("BAD_REQUEST", "Request body is empty");
    return JSON.parse(text) as T;
  } catch (err) {
    if (err instanceof GatelyAuthError) throw err;
    throw new GatelyAuthError("BAD_REQUEST", "Invalid JSON body");
  }
}

export function getSearchParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { params[k] = v; });
  return params;
}

// ── Email validation ──────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ── URL building ──────────────────────────────────────────────────────────────

export function buildURL(
  baseURL: string,
  path: string,
  params?: Record<string, string>
): string {
  const url = new URL(path, baseURL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

// ── Logger factory ────────────────────────────────────────────────────────────

import type { Logger } from "./types/index.js";

export function createLogger(options?: {
  disabled?: boolean;
  level?: "debug" | "info" | "warn" | "error";
}): Logger {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const minLevel = levels[options?.level ?? "info"];
  const disabled = options?.disabled ?? false;

  const shouldLog = (level: keyof typeof levels) =>
    !disabled && levels[level] >= minLevel;

  return {
    debug: (...args) => shouldLog("debug") && console.debug("[gately-auth]", ...args),
    info: (...args) => shouldLog("info") && console.info("[gately-auth]", ...args),
    warn: (...args) => shouldLog("warn") && console.warn("[gately-auth]", ...args),
    error: (...args) => shouldLog("error") && console.error("[gately-auth]", ...args),
  };
}
