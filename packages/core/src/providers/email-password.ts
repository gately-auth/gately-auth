// ─────────────────────────────────────────────────────────────────────────────
// Email + Password authentication provider
// ─────────────────────────────────────────────────────────────────────────────

import type {
  User,
  Account,
  GatelyAuthOptions,
  AuthSession,
} from "../types/index.js";
import {
  hashPassword,
  verifyPassword,
  generateId,
  generateToken,
} from "../crypto/index.js";
import { GatelyAuthError } from "../error.js";
import { isValidEmail } from "../utils.js";
import { createSession } from "../session.js";
import { KV_KEYS } from "../adapters/kv.js";

// ── Sign Up ───────────────────────────────────────────────────────────────────

export interface SignUpEmailInput {
  email: string;
  password: string;
  name?: string;
  image?: string;
  /** Additional fields from additionalUserFields config */
  [key: string]: unknown;
}

export async function signUpEmail(
  input: SignUpEmailInput,
  request: Request,
  options: GatelyAuthOptions
): Promise<{ user: User; session: Session | null; token: string | null }> {
  const { db, kv, emailAndPassword: epConfig = {}, emailVerification: evConfig = {} } = options;

  if (epConfig.enabled === false) {
    throw new GatelyAuthError("BAD_REQUEST", "Email/password sign-up is not enabled");
  }

  if (epConfig.disableSignUp) {
    throw new GatelyAuthError("SIGNUP_DISABLED");
  }

  const email = input.email?.toLowerCase().trim();
  if (!email || !isValidEmail(email)) {
    throw new GatelyAuthError("INVALID_EMAIL");
  }

  const password = input.password;
  const minLen = epConfig.minPasswordLength ?? 8;
  const maxLen = epConfig.maxPasswordLength ?? 128;

  if (!password || password.length < minLen) {
    throw new GatelyAuthError("PASSWORD_TOO_SHORT", `Password must be at least ${minLen} characters`);
  }
  if (password.length > maxLen) {
    throw new GatelyAuthError("PASSWORD_TOO_LONG", `Password must be at most ${maxLen} characters`);
  }

  // Check existing user
  const existing = await db.findOne<User>({
    model: "user",
    where: [{ field: "email", value: email }],
  });

  if (existing) {
    throw new GatelyAuthError("EMAIL_ALREADY_EXISTS");
  }

  // Create user
  const now = new Date();
  const userId = generateId();
  const user = await db.create<User>({
    model: "user",
    data: {
      id: userId,
      email,
      name: input.name ?? null,
      image: input.image ?? null,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  // Create credential account
  const hashed = await hashPassword(password);
  await db.create<Account>({
    model: "account",
    data: {
      id: generateId(),
      userId,
      providerId: "credential",
      accountId: userId,
      password: hashed,
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      idToken: null,
      scope: null,
      createdAt: now,
      updatedAt: now,
    },
  });

  // Send verification email if configured
  if (evConfig.sendOnSignUp && evConfig.sendVerificationEmail) {
    const token = generateToken(32);
    const ttl = evConfig.expiresIn ?? 3600;
    await kv.set(KV_KEYS.emailVerification(token), userId, { ttl });

    const verifyURL = `${options.baseURL ?? ""}${options.basePath ?? "/auth"}/verify-email?token=${token}`;
    await evConfig.sendVerificationEmail({ user, url: verifyURL, token }).catch(
      (err) => options.logger && console.warn("[gately-auth] Failed to send verification email:", err)
    );
  }

  // Auto sign-in
  const autoSignIn = epConfig.autoSignIn !== false;
  if (!autoSignIn || (epConfig.requireEmailVerification && !user.emailVerified)) {
    return { user, session: null, token: null };
  }

  const { session, token } = await createSession(userId, request, db, options.session);
  return { user, session, token };
}

// ── Sign In ───────────────────────────────────────────────────────────────────

export interface SignInEmailInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export async function signInEmail(
  input: SignInEmailInput,
  request: Request,
  options: GatelyAuthOptions
): Promise<{ user: User; session: Session; token: string }> {
  const { db, emailAndPassword: epConfig = {} } = options;

  if (epConfig.enabled === false) {
    throw new GatelyAuthError("BAD_REQUEST", "Email/password sign-in is not enabled");
  }

  const email = input.email?.toLowerCase().trim();
  if (!email || !isValidEmail(email)) {
    throw new GatelyAuthError("INVALID_EMAIL");
  }

  const user = await db.findOne<User>({
    model: "user",
    where: [{ field: "email", value: email }],
  });

  if (!user) throw new GatelyAuthError("INVALID_CREDENTIALS");

  // Get credential account
  const account = await db.findOne<Account>({
    model: "account",
    where: [
      { field: "userId", value: user.id },
      { field: "providerId", value: "credential" },
    ],
  });

  if (!account?.password) throw new GatelyAuthError("INVALID_CREDENTIALS");

  const valid = await verifyPassword(input.password, account.password);
  if (!valid) throw new GatelyAuthError("INVALID_CREDENTIALS");

  if (epConfig.requireEmailVerification && !user.emailVerified) {
    throw new GatelyAuthError("EMAIL_NOT_VERIFIED");
  }

  const sessionConfig = input.rememberMe === false
    ? { ...options.session, expiresIn: 60 * 60 * 24 } // 1 day if don't remember
    : options.session;

  const { session, token } = await createSession(user.id, request, db, sessionConfig);

  // Update last sign-in timestamp
  await db.update({
    model: "user",
    where: [{ field: "id", value: user.id }],
    data: { updatedAt: new Date() },
  });

  return { user, session, token };
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function requestPasswordReset(
  email: string,
  options: GatelyAuthOptions
): Promise<void> {
  const { db, kv, emailAndPassword: epConfig = {} } = options;

  if (!epConfig.sendResetPassword) return; // silently skip if not configured

  const normalised = email.toLowerCase().trim();
  const user = await db.findOne<User>({
    model: "user",
    where: [{ field: "email", value: normalised }],
  });

  // Always return success — don't leak whether the email exists
  if (!user) return;

  const token = generateToken(32);
  const ttl = 3600; // 1 hour
  await kv.set(KV_KEYS.passwordReset(token), user.id, { ttl });

  const resetURL = `${options.baseURL ?? ""}${options.basePath ?? "/auth"}/reset-password?token=${token}`;
  await epConfig.sendResetPassword({ user, url: resetURL, token }).catch(
    (err) => console.warn("[gately-auth] Failed to send password reset email:", err)
  );
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string,
  options: GatelyAuthOptions
): Promise<void> {
  const { db, kv, emailAndPassword: epConfig = {} } = options;

  const minLen = epConfig.minPasswordLength ?? 8;
  const maxLen = epConfig.maxPasswordLength ?? 128;

  if (!newPassword || newPassword.length < minLen) {
    throw new GatelyAuthError("PASSWORD_TOO_SHORT");
  }
  if (newPassword.length > maxLen) {
    throw new GatelyAuthError("PASSWORD_TOO_LONG");
  }

  const userId = await kv.get(KV_KEYS.passwordReset(token));
  if (!userId) throw new GatelyAuthError("INVALID_TOKEN");

  const hashed = await hashPassword(newPassword);

  const account = await db.findOne<Account>({
    model: "account",
    where: [
      { field: "userId", value: userId },
      { field: "providerId", value: "credential" },
    ],
  });

  if (!account) {
    // Create credential account if user signed up via OAuth
    await db.create({
      model: "account",
      data: {
        id: generateId(),
        userId,
        providerId: "credential",
        accountId: userId,
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } else {
    await db.update({
      model: "account",
      where: [{ field: "id", value: account.id }],
      data: { password: hashed, updatedAt: new Date() },
    });
  }

  // Consume the token
  await kv.delete(KV_KEYS.passwordReset(token));
}

// ── Email verification ────────────────────────────────────────────────────────

export async function verifyEmail(
  token: string,
  request: Request,
  options: GatelyAuthOptions
): Promise<AuthSession | null> {
  const { db, kv, emailVerification: evConfig = {} } = options;

  const userId = await kv.get(KV_KEYS.emailVerification(token));
  if (!userId) throw new GatelyAuthError("VERIFICATION_TOKEN_INVALID");

  const user = await db.findOne<User>({
    model: "user",
    where: [{ field: "id", value: userId }],
  });

  if (!user) throw new GatelyAuthError("USER_NOT_FOUND");
  if (user.emailVerified) throw new GatelyAuthError("EMAIL_ALREADY_VERIFIED");

  await db.update({
    model: "user",
    where: [{ field: "id", value: userId }],
    data: { emailVerified: true, updatedAt: new Date() },
  });

  await kv.delete(KV_KEYS.emailVerification(token));

  if (evConfig.autoSignInAfterVerification) {
    const { session, token: sessionToken } = await createSession(
      userId,
      request,
      db,
      options.session
    );
    return { user: { ...user, emailVerified: true }, session };
  }

  return null;
}

// ── Locally scoped Session type import to avoid circular imports ──────────────
import type { Session } from "../types/index.js";
