// ─────────────────────────────────────────────────────────────────────────────
// Email OTP authentication provider
// ─────────────────────────────────────────────────────────────────────────────

import type { User, GatelyAuthOptions } from "../types/index.js";
import { generateOTP, generateId } from "../crypto/index.js";
import { GatelyAuthError } from "../error.js";
import { isValidEmail } from "../utils.js";
import { createSession } from "../session.js";
import { KV_KEYS } from "../adapters/kv.js";
import type { KVStoreExtended } from "../adapters/kv.js";

const OTP_TTL = 60 * 10;         // 10 minutes
const MAX_ATTEMPTS = 5;

export type OTPType = "sign-in" | "email-verification" | "forget-password";

export interface EmailOTPConfig {
  /** Called to deliver the OTP code to the user */
  sendOTP: (options: {
    email: string;
    otp: string;
    type: OTPType;
    user: User | null;
  }) => Promise<void>;
  /** OTP digit length (default: 6) */
  otpLength?: number;
  /** OTP expiry in seconds (default: 600 — 10 min) */
  expiresIn?: number;
  /** Max verification attempts before invalidating (default: 5) */
  allowedAttempts?: number;
  /** Auto-create user on first sign-in (default: true) */
  disableSignUp?: boolean;
}

interface OTPPayload {
  otp: string;
  email: string;
  type: OTPType;
  createdAt: number;
}

// ── Send OTP ──────────────────────────────────────────────────────────────────

export async function sendEmailOTP(
  email: string,
  type: OTPType,
  config: EmailOTPConfig,
  options: GatelyAuthOptions
): Promise<void> {
  const { db, kv } = options;
  const normalised = email.toLowerCase().trim();

  if (!isValidEmail(normalised)) throw new GatelyAuthError("INVALID_EMAIL");

  const user = await db.findOne<User>({
    model: "user",
    where: [{ field: "email", value: normalised }],
  });

  if (type === "sign-in" && !user && config.disableSignUp) {
    throw new GatelyAuthError("SIGNUP_DISABLED");
  }

  const otp = generateOTP(config.otpLength ?? 6);
  const ttl = config.expiresIn ?? OTP_TTL;

  const payload: OTPPayload = {
    otp,
    email: normalised,
    type,
    createdAt: Date.now(),
  };

  await kv.set(KV_KEYS.otp(normalised, type), JSON.stringify(payload), { ttl });

  // Reset attempt counter on new OTP
  const kvExt = kv as KVStoreExtended;
  if ("delete" in kvExt) {
    await kv.delete(KV_KEYS.otpAttempts(normalised, type));
  }

  await config.sendOTP({ email: normalised, otp, type, user: user ?? null });
}

// ── Verify OTP ────────────────────────────────────────────────────────────────

export async function verifyEmailOTP(
  email: string,
  code: string,
  type: OTPType,
  request: Request,
  config: EmailOTPConfig,
  options: GatelyAuthOptions
): Promise<{ user: User; sessionToken: string }> {
  const { db, kv } = options;
  const normalised = email.toLowerCase().trim();
  const maxAttempts = config.allowedAttempts ?? MAX_ATTEMPTS;

  // Check attempt count
  const attemptsKey = KV_KEYS.otpAttempts(normalised, type);
  const kvExt = kv as KVStoreExtended;
  let attempts = 0;

  if ("getJSON" in kvExt) {
    attempts = (await kvExt.getJSON<number>(attemptsKey)) ?? 0;
  } else {
    const raw = await kv.get(attemptsKey);
    attempts = raw ? parseInt(raw, 10) : 0;
  }

  if (attempts >= maxAttempts) {
    // Clean up expired OTP and attempts
    await kv.delete(KV_KEYS.otp(normalised, type));
    await kv.delete(attemptsKey);
    throw new GatelyAuthError("OTP_MAX_ATTEMPTS");
  }

  // Get stored OTP
  const raw = await kv.get(KV_KEYS.otp(normalised, type));
  if (!raw) throw new GatelyAuthError("OTP_INVALID");

  let payload: OTPPayload;
  try {
    payload = JSON.parse(raw) as OTPPayload;
  } catch {
    throw new GatelyAuthError("OTP_INVALID");
  }

  // Check expiry
  const ttl = (config.expiresIn ?? OTP_TTL) * 1000;
  if (Date.now() - payload.createdAt > ttl) {
    await kv.delete(KV_KEYS.otp(normalised, type));
    await kv.delete(attemptsKey);
    throw new GatelyAuthError("OTP_EXPIRED");
  }

  // Verify code (constant-time comparison)
  if (!timingSafeEqual(payload.otp, code.trim())) {
    // Increment attempts
    const newAttempts = attempts + 1;
    await kv.set(attemptsKey, String(newAttempts), {
      ttl: config.expiresIn ?? OTP_TTL,
    });
    throw new GatelyAuthError("OTP_INVALID");
  }

  // Consume OTP
  await kv.delete(KV_KEYS.otp(normalised, type));
  await kv.delete(attemptsKey);

  // Find or create user
  let user = await db.findOne<User>({
    model: "user",
    where: [{ field: "email", value: normalised }],
  });

  if (!user) {
    if (config.disableSignUp) throw new GatelyAuthError("SIGNUP_DISABLED");
    const now = new Date();
    user = await db.create<User>({
      model: "user",
      data: {
        id: generateId(),
        email: normalised,
        name: null,
        image: null,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  } else if (!user.emailVerified) {
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

// ── Constant-time string compare (prevent timing attacks on OTP) ──────────────

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
