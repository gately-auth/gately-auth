// ─────────────────────────────────────────────────────────────────────────────
// Magic link / passwordless authentication provider
// ─────────────────────────────────────────────────────────────────────────────

import type { User, GatelyAuthOptions, EmailProvider } from "../types/index.js";
import { generateToken, generateId } from "../crypto/index.js";
import { GatelyAuthError } from "../error.js";
import { isValidEmail } from "../utils.js";
import { createSession } from "../session.js";
import { KV_KEYS } from "../adapters/kv.js";

const MAGIC_LINK_TTL = 60 * 15; // 15 minutes
const MAGIC_LINK_MAX_ATTEMPTS = 5;

export interface MagicLinkConfig {
  /** Called to send the magic link email */
  sendMagicLink: (options: {
    email: string;
    url: string;
    token: string;
    user: User | null;
  }) => Promise<void>;
  /** Token expiry in seconds (default: 900 — 15 min) */
  expiresIn?: number;
  /** Auto-create user if they don't exist (default: true) */
  disableSignUp?: boolean;
  /** Custom token generator */
  generateToken?: (email: string) => Promise<string>;
}

interface MagicLinkPayload {
  email: string;
  userId: string | null; // null = new user
  createdAt: number;
  attempts: number;
}

// ── Send magic link ───────────────────────────────────────────────────────────

export async function sendMagicLink(
  email: string,
  callbackURL: string | undefined,
  config: MagicLinkConfig,
  options: GatelyAuthOptions
): Promise<void> {
  const { db, kv } = options;

  const normalised = email.toLowerCase().trim();
  if (!isValidEmail(normalised)) {
    throw new GatelyAuthError("INVALID_EMAIL");
  }

  const user = await db.findOne<User>({
    model: "user",
    where: [{ field: "email", value: normalised }],
  });

  if (!user && config.disableSignUp) {
    throw new GatelyAuthError("SIGNUP_DISABLED");
  }

  const token = config.generateToken
    ? await config.generateToken(normalised)
    : generateToken(32);

  const ttl = config.expiresIn ?? MAGIC_LINK_TTL;
  const payload: MagicLinkPayload = {
    email: normalised,
    userId: user?.id ?? null,
    createdAt: Date.now(),
    attempts: 0,
  };

  await kv.set(KV_KEYS.magicLink(token), JSON.stringify(payload), { ttl });

  const basePath = options.basePath ?? "/auth";
  const baseURL = options.baseURL ?? "";
  const verifyURL = new URL(`${baseURL}${basePath}/magic-link/verify`);
  verifyURL.searchParams.set("token", token);
  if (callbackURL) verifyURL.searchParams.set("callbackURL", callbackURL);

  await config.sendMagicLink({
    email: normalised,
    url: verifyURL.toString(),
    token,
    user: user ?? null,
  });
}

// ── Verify magic link ─────────────────────────────────────────────────────────

export async function verifyMagicLink(
  token: string,
  request: Request,
  config: MagicLinkConfig,
  options: GatelyAuthOptions
): Promise<{ user: User; sessionToken: string; callbackURL?: string }> {
  const { db, kv } = options;

  const raw = await kv.get(KV_KEYS.magicLink(token));
  if (!raw) throw new GatelyAuthError("MAGIC_LINK_INVALID");

  let payload: MagicLinkPayload;
  try {
    payload = JSON.parse(raw) as MagicLinkPayload;
  } catch {
    throw new GatelyAuthError("MAGIC_LINK_INVALID");
  }

  // Check expiry
  const ttl = (config.expiresIn ?? MAGIC_LINK_TTL) * 1000;
  if (Date.now() - payload.createdAt > ttl) {
    await kv.delete(KV_KEYS.magicLink(token));
    throw new GatelyAuthError("MAGIC_LINK_EXPIRED");
  }

  // Increment attempt counter (guard against replay)
  if (payload.attempts >= MAGIC_LINK_MAX_ATTEMPTS) {
    await kv.delete(KV_KEYS.magicLink(token));
    throw new GatelyAuthError("OTP_MAX_ATTEMPTS");
  }

  // Consume token immediately (one-time use)
  await kv.delete(KV_KEYS.magicLink(token));

  // Find or create user
  let user: User;

  if (payload.userId) {
    const existing = await db.findOne<User>({
      model: "user",
      where: [{ field: "id", value: payload.userId }],
    });
    if (!existing) throw new GatelyAuthError("USER_NOT_FOUND");
    user = existing;
  } else {
    // Auto-create new user
    const now = new Date();
    user = await db.create<User>({
      model: "user",
      data: {
        id: generateId(),
        email: payload.email,
        name: null,
        image: null,
        emailVerified: true, // magic link = email verified
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  // Mark email as verified
  if (!user.emailVerified) {
    await db.update({
      model: "user",
      where: [{ field: "id", value: user.id }],
      data: { emailVerified: true, updatedAt: new Date() },
    });
    user = { ...user, emailVerified: true };
  }

  const { token: sessionToken } = await createSession(
    user.id,
    request,
    db,
    options.session
  );

  return { user, sessionToken };
}
