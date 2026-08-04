// ─────────────────────────────────────────────────────────────────────────────
// Session management
// Handles create, validate, refresh, revoke sessions
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Session,
  User,
  AuthSession,
  DatabaseAdapter,
  KVStore,
  SessionConfig,
  CookieConfig,
} from "./types/index.js";
import { generateToken } from "./crypto/index.js";
import { generateId } from "./crypto/index.js";
import { GatelyAuthError } from "./error.js";
import { KV_KEYS } from "./adapters/kv.js";
import type { KVStoreExtended } from "./adapters/kv.js";

const DEFAULT_EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days
const DEFAULT_UPDATE_AGE = 60 * 60 * 24;      // 1 day

// ── Create session ────────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  request: Request,
  db: DatabaseAdapter,
  config: SessionConfig = {}
): Promise<{ session: Session; token: string }> {
  const token = generateToken(32);
  const now = new Date();
  const expiresIn = config.expiresIn ?? DEFAULT_EXPIRES_IN;

  const session = await db.create<Session>({
    model: "session",
    data: {
      id: generateId(),
      userId,
      token,
      expiresAt: new Date(now.getTime() + expiresIn * 1000),
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("User-Agent")?.slice(0, 512) ?? null,
      createdAt: now,
      updatedAt: now,
    },
  });

  return { session, token };
}

// ── Get session from token ────────────────────────────────────────────────────

export async function getSessionByToken(
  token: string,
  db: DatabaseAdapter,
  kv: KVStore,
  config: SessionConfig = {}
): Promise<AuthSession | null> {
  // 1. Try session cache in KV first (avoids D1 round-trip)
  if (config.cookieCache?.enabled) {
    const kvStore = kv as KVStore & KVStoreExtended;
    if ("getJSON" in kvStore) {
      const cached = await (kvStore as KVStoreExtended).getJSON<AuthSession>(
        KV_KEYS.sessionCache(token)
      );
      if (cached) return cached;
    }
  }

  // 2. Hit D1
  const session = await db.findOne<Session>({
    model: "session",
    where: [{ field: "token", value: token }],
  });

  if (!session) return null;

  // Check expiry
  if (new Date(session.expiresAt) < new Date()) {
    await db.delete({ model: "session", where: [{ field: "id", value: session.id }] });
    return null;
  }

  // Load user
  const user = await db.findOne<User>({
    model: "user",
    where: [{ field: "id", value: session.userId }],
  });

  if (!user) return null;

  const result: AuthSession = { user, session };

  // 3. Refresh session TTL if updateAge threshold crossed
  const updateAge = config.updateAge ?? DEFAULT_UPDATE_AGE;
  const updatedAt = new Date(session.updatedAt ?? session.createdAt);
  const age = (Date.now() - updatedAt.getTime()) / 1000;

  if (age > updateAge) {
    const expiresIn = config.expiresIn ?? DEFAULT_EXPIRES_IN;
    const newExpiry = new Date(Date.now() + expiresIn * 1000);
    await db.update({
      model: "session",
      where: [{ field: "id", value: session.id }],
      data: { expiresAt: newExpiry, updatedAt: new Date() },
    });
    result.session = { ...session, expiresAt: newExpiry };
  }

  // 4. Cache in KV
  if (config.cookieCache?.enabled) {
    const maxAge = config.cookieCache.maxAge ?? 300;
    const kvStore = kv as KVStore & KVStoreExtended;
    if ("setJSON" in kvStore) {
      await (kvStore as KVStoreExtended).setJSON(
        KV_KEYS.sessionCache(token),
        result,
        { ttl: maxAge }
      );
    }
  }

  return result;
}

// ── Revoke session ────────────────────────────────────────────────────────────

export async function revokeSession(
  token: string,
  db: DatabaseAdapter,
  kv: KVStore
): Promise<void> {
  await db.delete({
    model: "session",
    where: [{ field: "token", value: token }],
  });

  // Clear KV cache
  const kvStore = kv as KVStore & KVStoreExtended;
  if ("delete" in kvStore) {
    await kv.delete(KV_KEYS.sessionCache(token));
  }
}

/** Revoke all sessions for a user */
export async function revokeAllUserSessions(
  userId: string,
  db: DatabaseAdapter
): Promise<void> {
  // D1 doesn't support batch delete with WHERE easily via RETURNING,
  // so we find all then delete
  const sessions = await db.findMany<Session>({
    model: "session",
    where: [{ field: "userId", value: userId }],
  });

  for (const session of sessions) {
    await db.delete({
      model: "session",
      where: [{ field: "id", value: session.id }],
    });
  }
}

/** List all active sessions for a user */
export async function listUserSessions(
  userId: string,
  db: DatabaseAdapter
): Promise<Session[]> {
  const sessions = await db.findMany<Session>({
    model: "session",
    where: [
      { field: "userId", value: userId },
      { field: "expiresAt", value: Math.floor(Date.now() / 1000), operator: "gt" },
    ],
    orderBy: { field: "createdAt", direction: "desc" },
  });
  return sessions;
}

// ── Validate session (throws on invalid) ─────────────────────────────────────

export async function requireSession(
  token: string | null,
  db: DatabaseAdapter,
  kv: KVStore,
  config: SessionConfig = {}
): Promise<AuthSession> {
  if (!token) throw new GatelyAuthError("UNAUTHORIZED");

  const authSession = await getSessionByToken(token, db, kv, config);
  if (!authSession) throw new GatelyAuthError("SESSION_EXPIRED");

  return authSession;
}

// ── Client IP extraction ──────────────────────────────────────────────────────

function getClientIP(request: Request): string | null {
  return (
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    request.headers.get("X-Real-IP") ??
    null
  );
}
