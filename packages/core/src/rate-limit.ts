// ─────────────────────────────────────────────────────────────────────────────
// KV-backed rate limiting
// Sliding window counter stored in KV — no D1 writes on hot paths
// ─────────────────────────────────────────────────────────────────────────────

import type { RateLimitConfig, KVStore } from "./types/index.js";
import { GatelyAuthError } from "./error.js";
import { KV_KEYS } from "./adapters/kv.js";
import type { KVStoreExtended } from "./adapters/kv.js";

interface RateLimitState {
  count: number;
  windowStart: number;
}

/** Check rate limit — throws RATE_LIMIT_EXCEEDED if over the limit.
 *  Returns headers for Retry-After on the caller to attach. */
export async function checkRateLimit(
  kv: KVStore,
  key: string,
  config: RateLimitConfig & { path?: string }
): Promise<{ retryAfter?: number }> {
  if (config.enabled === false) return {};

  const window = getWindowForPath(config);
  const max = getMaxForPath(config);
  const now = Math.floor(Date.now() / 1000);
  const kvKey = KV_KEYS.rateLimit(key);

  const kvExt = kv as KVStore & KVStoreExtended;
  const stored = "getJSON" in kvExt
    ? await kvExt.getJSON<RateLimitState>(kvKey)
    : null;

  let state: RateLimitState;

  if (!stored || now - stored.windowStart >= window) {
    // New window
    state = { count: 1, windowStart: now };
  } else {
    state = { count: stored.count + 1, windowStart: stored.windowStart };
  }

  const remaining = max - state.count;
  const windowEnd = state.windowStart + window;
  const retryAfter = windowEnd - now;

  // Store updated state
  if ("setJSON" in kvExt) {
    await kvExt.setJSON(kvKey, state, { ttl: window });
  }

  if (state.count > max) {
    throw Object.assign(
      new GatelyAuthError("RATE_LIMIT_EXCEEDED"),
      { retryAfter }
    );
  }

  return { retryAfter: remaining <= 0 ? retryAfter : undefined } as { retryAfter?: number };
}

function getWindowForPath(config: RateLimitConfig & { path?: string }): number {
  if (config.path && config.customRules?.[config.path]) {
    return config.customRules[config.path]!.window;
  }
  return config.window ?? 10;
}

function getMaxForPath(config: RateLimitConfig & { path?: string }): number {
  if (config.path && config.customRules?.[config.path]) {
    return config.customRules[config.path]!.max;
  }
  return config.max ?? 100;
}

/** Build a rate-limit key from request IP + path */
export function buildRateLimitKey(request: Request, suffix: string): string {
  const ip =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown";
  return `${ip}:${suffix}`;
}
