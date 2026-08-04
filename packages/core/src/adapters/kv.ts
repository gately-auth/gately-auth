// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare KV adapter
// ─────────────────────────────────────────────────────────────────────────────

import type { KVStore } from "../types/index.js";

export function createKVStore(
  kv: KVNamespace,
  namespace = "ga"
): KVStore & KVStoreExtended {
  const prefix = (key: string) => `${namespace}:${key}`;

  return {
    async get(key: string): Promise<string | null> {
      return kv.get(prefix(key));
    },

    async set(key: string, value: string, options?: { ttl?: number }): Promise<void> {
      const putOptions: KVNamespacePutOptions = {};
      if (options?.ttl !== undefined) putOptions.expirationTtl = options.ttl;
      await kv.put(prefix(key), value, putOptions);
    },

    async delete(key: string): Promise<void> {
      await kv.delete(prefix(key));
    },

    async getJSON<T>(key: string): Promise<T | null> {
      const raw = await kv.get(prefix(key));
      if (!raw) return null;
      try { return JSON.parse(raw) as T; } catch { return null; }
    },

    async setJSON<T>(key: string, value: T, options?: { ttl?: number }): Promise<void> {
      const putOptions: KVNamespacePutOptions = {};
      if (options?.ttl !== undefined) putOptions.expirationTtl = options.ttl;
      await kv.put(prefix(key), JSON.stringify(value), putOptions);
    },

    async increment(key: string, ttl?: number): Promise<number> {
      const current = await kv.get(prefix(key));
      const next = (current ? parseInt(current, 10) : 0) + 1;
      const putOptions: KVNamespacePutOptions = {};
      if (ttl !== undefined) putOptions.expirationTtl = ttl;
      await kv.put(prefix(key), String(next), putOptions);
      return next;
    },
  };
}

export interface KVStoreExtended extends KVStore {
  getJSON<T>(key: string): Promise<T | null>;
  setJSON<T>(key: string, value: T, options?: { ttl?: number }): Promise<void>;
  increment(key: string, ttl?: number): Promise<number>;
}

export const KV_KEYS = {
  magicLink: (token: string) => `ml:${token}`,
  otp: (identifier: string, type: string) => `otp:${type}:${identifier}`,
  otpAttempts: (identifier: string, type: string) => `otp_attempts:${type}:${identifier}`,
  passwordReset: (token: string) => `pr:${token}`,
  rateLimit: (key: string) => `rl:${key}`,
  sessionCache: (token: string) => `sc:${token}`,
  oauthState: (state: string) => `oauth:${state}`,
  emailVerification: (token: string) => `ev:${token}`,
} as const;

// ── In-memory KV for testing ──────────────────────────────────────────────────

export function createInMemoryKVStore(): KVStore & KVStoreExtended {
  const store = new Map<string, { value: string; expiresAt?: number }>();

  function isExpired(key: string): boolean {
    const entry = store.get(key);
    if (!entry) return true;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      store.delete(key);
      return true;
    }
    return false;
  }

  return {
    async get(key) {
      if (isExpired(key)) return null;
      return store.get(key)?.value ?? null;
    },
    async set(key, value, options) {
      const entry: { value: string; expiresAt?: number } = { value };
      if (options?.ttl) entry.expiresAt = Date.now() + options.ttl * 1000;
      store.set(key, entry);
    },
    async delete(key) { store.delete(key); },
    async getJSON<T>(key: string): Promise<T | null> {
      if (isExpired(key)) return null;
      const raw = store.get(key)?.value;
      if (!raw) return null;
      try { return JSON.parse(raw) as T; } catch { return null; }
    },
    async setJSON<T>(key: string, value: T, options?: { ttl?: number }): Promise<void> {
      const entry: { value: string; expiresAt?: number } = { value: JSON.stringify(value) };
      if (options?.ttl) entry.expiresAt = Date.now() + options.ttl * 1000;
      store.set(key, entry);
    },
    async increment(key: string, ttl?: number): Promise<number> {
      if (isExpired(key)) {
        const entry: { value: string; expiresAt?: number } = { value: "1" };
        if (ttl) entry.expiresAt = Date.now() + ttl * 1000;
        store.set(key, entry);
        return 1;
      }
      const current = parseInt(store.get(key)?.value ?? "0", 10);
      const next = current + 1;
      const existing = store.get(key);
      const entry: { value: string; expiresAt?: number } = { value: String(next) };
      if (existing?.expiresAt) entry.expiresAt = existing.expiresAt;
      store.set(key, entry);
      return next;
    },
  };
}
