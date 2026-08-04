// ─────────────────────────────────────────────────────────────────────────────
// Generic OAuth 2.0 / OIDC provider
// Supports Google, GitHub, any OIDC-compliant provider
// PKCE built-in for all flows
// ─────────────────────────────────────────────────────────────────────────────

import type { User, Account, SocialProviderConfig, GatelyAuthOptions } from "../types/index.js";
import {
  generateToken,
  generateId,
  generateRandomString,
  sha256,
  base64UrlEncode,
} from "../crypto/index.js";
import { GatelyAuthError } from "../error.js";
import { createSession } from "../session.js";
import { KV_KEYS } from "../adapters/kv.js";

export interface OAuthProviderDefinition {
  id: string;
  name: string;
  authorizationURL: string;
  tokenURL: string;
  userInfoURL?: string;
  /** If the provider supports OIDC discovery */
  discoveryURL?: string;
  defaultScopes: string[];
  /** Map provider user-info to our User shape */
  mapProfile: (profile: Record<string, unknown>) => {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    emailVerified: boolean;
  };
}

// ── Built-in provider definitions ─────────────────────────────────────────────

export const PROVIDERS: Record<string, OAuthProviderDefinition> = {
  google: {
    id: "google",
    name: "Google",
    authorizationURL: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenURL: "https://oauth2.googleapis.com/token",
    userInfoURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    defaultScopes: ["openid", "email", "profile"],
    mapProfile: (p) => ({
      id: p["sub"] as string,
      email: p["email"] as string | null,
      name: p["name"] as string | null,
      image: p["picture"] as string | null,
      emailVerified: Boolean(p["email_verified"]),
    }),
  },
  github: {
    id: "github",
    name: "GitHub",
    authorizationURL: "https://github.com/login/oauth/authorize",
    tokenURL: "https://github.com/login/oauth/access_token",
    userInfoURL: "https://api.github.com/user",
    defaultScopes: ["read:user", "user:email"],
    mapProfile: (p) => ({
      id: String(p["id"]),
      email: p["email"] as string | null,
      name: (p["name"] ?? p["login"]) as string | null,
      image: p["avatar_url"] as string | null,
      emailVerified: p["email"] !== null && p["email"] !== undefined,
    }),
  },
};

// ── State payload stored in KV ────────────────────────────────────────────────

interface OAuthState {
  provider: string;
  callbackURL: string;
  codeVerifier: string;
  createdAt: number;
}

// ── Step 1: Build authorization redirect ─────────────────────────────────────

export async function buildOAuthRedirect(
  providerId: string,
  callbackURL: string,
  options: GatelyAuthOptions
): Promise<{ redirectURL: string }> {
  const { kv, socialProviders = {} } = options;
  const config = socialProviders[providerId] as SocialProviderConfig | undefined;

  if (!config) throw new GatelyAuthError("PROVIDER_NOT_CONFIGURED");

  const def = PROVIDERS[providerId];
  if (!def) throw new GatelyAuthError("PROVIDER_NOT_CONFIGURED");

  // PKCE code verifier + challenge
  const codeVerifier = generateToken(48);
  const codeChallenge = base64UrlEncode(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(codeVerifier)
      )
    )
  );

  // State token (CSRF protection)
  const state = generateToken(24);
  const redirectURI =
    config.redirectURI ??
    `${options.baseURL ?? ""}${options.basePath ?? "/auth"}/oauth/${providerId}/callback`;

  const statePayload: OAuthState = {
    provider: providerId,
    callbackURL,
    codeVerifier,
    createdAt: Date.now(),
  };

  await kv.set(KV_KEYS.oauthState(state), JSON.stringify(statePayload), {
    ttl: 600, // 10 minutes
  });

  const scopes = config.scopes ?? def.defaultScopes;
  const authURL = new URL(def.authorizationURL);
  authURL.searchParams.set("client_id", config.clientId);
  authURL.searchParams.set("redirect_uri", redirectURI);
  authURL.searchParams.set("response_type", "code");
  authURL.searchParams.set("scope", scopes.join(" "));
  authURL.searchParams.set("state", state);
  authURL.searchParams.set("code_challenge", codeChallenge);
  authURL.searchParams.set("code_challenge_method", "S256");

  // Provider-specific params
  if (providerId === "google") {
    authURL.searchParams.set("access_type", "offline");
  }

  return { redirectURL: authURL.toString() };
}

// ── Step 2: Handle callback, exchange code for tokens ────────────────────────

export async function handleOAuthCallback(
  providerId: string,
  code: string,
  state: string,
  request: Request,
  options: GatelyAuthOptions
): Promise<{ user: User; sessionToken: string; isNewUser: boolean }> {
  const { db, kv, socialProviders = {} } = options;
  const config = socialProviders[providerId] as SocialProviderConfig | undefined;
  if (!config) throw new GatelyAuthError("PROVIDER_NOT_CONFIGURED");

  const def = PROVIDERS[providerId];
  if (!def) throw new GatelyAuthError("PROVIDER_NOT_CONFIGURED");

  // Validate state
  const rawState = await kv.get(KV_KEYS.oauthState(state));
  if (!rawState) throw new GatelyAuthError("INVALID_OAUTH_STATE");
  await kv.delete(KV_KEYS.oauthState(state));

  let statePayload: OAuthState;
  try {
    statePayload = JSON.parse(rawState) as OAuthState;
  } catch {
    throw new GatelyAuthError("INVALID_OAUTH_STATE");
  }

  if (statePayload.provider !== providerId) {
    throw new GatelyAuthError("INVALID_OAUTH_STATE");
  }

  const redirectURI =
    config.redirectURI ??
    `${options.baseURL ?? ""}${options.basePath ?? "/auth"}/oauth/${providerId}/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch(def.tokenURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectURI,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: statePayload.codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("[gately-auth] OAuth token exchange failed:", body);
    throw new GatelyAuthError("OAUTH_CODE_EXCHANGE_FAILED");
  }

  const tokens = await tokenRes.json() as Record<string, unknown>;
  const accessToken = tokens["access_token"] as string;
  const refreshToken = tokens["refresh_token"] as string | undefined;
  const idToken = tokens["id_token"] as string | undefined;

  // Fetch user profile
  const profileRaw = await fetchUserProfile(
    def,
    accessToken,
    idToken,
    config.mapProfileToUser
  );

  if (!profileRaw.email) {
    // GitHub: need a second call for the primary email
    if (providerId === "github") {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "gately-auth" },
      });
      if (emailRes.ok) {
        const emails = await emailRes.json() as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        const primary = emails.find((e) => e.primary && e.verified);
        if (primary) profileRaw.email = primary.email;
      }
    }
  }

  if (!profileRaw.email) throw new GatelyAuthError("PROVIDER_EMAIL_MISSING");

  const email = profileRaw.email.toLowerCase().trim();

  // Look up or create user
  let user = await db.findOne<User>({
    model: "user",
    where: [{ field: "email", value: email }],
  });

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const now = new Date();
    const mapped = config.mapProfileToUser?.(profileRaw as Record<string, unknown>) ?? {};
    user = await db.create<User>({
      model: "user",
      data: {
        id: generateId(),
        email,
        name: mapped.name ?? profileRaw.name ?? null,
        image: mapped.image ?? profileRaw.image ?? null,
        emailVerified: profileRaw.emailVerified ?? true,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  // Upsert OAuth account
  const existingAccount = await db.findOne<Account>({
    model: "account",
    where: [
      { field: "providerId", value: providerId },
      { field: "accountId", value: profileRaw.id },
    ],
  });

  const now = new Date();
  const expiresAt = tokens["expires_in"]
    ? new Date(Date.now() + Number(tokens["expires_in"]) * 1000)
    : null;

  if (!existingAccount) {
    await db.create<Account>({
      model: "account",
      data: {
        id: generateId(),
        userId: user.id,
        providerId,
        accountId: profileRaw.id,
        password: null,
        accessToken,
        refreshToken: refreshToken ?? null,
        accessTokenExpiresAt: expiresAt,
        idToken: idToken ?? null,
        scope: (config.scopes ?? def.defaultScopes).join(" "),
        createdAt: now,
        updatedAt: now,
      },
    });
  } else {
    await db.update({
      model: "account",
      where: [{ field: "id", value: existingAccount.id }],
      data: {
        accessToken,
        refreshToken: refreshToken ?? existingAccount.refreshToken,
        accessTokenExpiresAt: expiresAt,
        idToken: idToken ?? existingAccount.idToken,
        updatedAt: now,
      },
    });
  }

  const { token: sessionToken } = await createSession(
    user.id,
    request,
    db,
    options.session
  );

  return { user, sessionToken, isNewUser };
}

// ── Fetch user profile ────────────────────────────────────────────────────────

async function fetchUserProfile(
  def: OAuthProviderDefinition,
  accessToken: string,
  idToken: string | undefined,
  customMapper?: SocialProviderConfig["mapProfileToUser"]
): Promise<ReturnType<OAuthProviderDefinition["mapProfile"]>> {
  // Try OIDC ID token first (avoids extra HTTP call)
  if (idToken) {
    try {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/"))
        ) as Record<string, unknown>;
        return def.mapProfile(payload);
      }
    } catch { /* fall through to userInfo endpoint */ }
  }

  const url = def.userInfoURL;
  if (!url) throw new GatelyAuthError("OAUTH_CODE_EXCHANGE_FAILED");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "User-Agent": "gately-auth/1.0",
    },
  });

  if (!res.ok) throw new GatelyAuthError("OAUTH_CODE_EXCHANGE_FAILED");

  const profile = await res.json() as Record<string, unknown>;
  return def.mapProfile(profile);
}
