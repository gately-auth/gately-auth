// ─────────────────────────────────────────────────────────────────────────────
// Core types for @gately/auth-core
// Designed to be acquisition-friendly: clean interfaces, no framework coupling
// ─────────────────────────────────────────────────────────────────────────────

// ── Cloudflare bindings ───────────────────────────────────────────────────────

export interface GatelyAuthBindings {
  /** Cloudflare D1 database for users, sessions, accounts, verifications */
  AUTH_DB: D1Database;
  /** Cloudflare KV for magic links, OTPs, rate-limit counters, session cache */
  AUTH_KV: KVNamespace;
}

// ── Database entities ─────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Additional fields added by plugins or additionalFields config */
  [key: string]: unknown;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Additional fields added by plugins */
  [key: string]: unknown;
}

export interface Account {
  id: string;
  userId: string;
  /** e.g. "credential", "google", "github", "magic-link" */
  providerId: string;
  accountId: string;
  password: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
  idToken: string | null;
  scope: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Verification {
  id: string;
  /** email address or userId */
  identifier: string;
  /** hashed token value */
  value: string;
  expiresAt: Date;
  createdAt: Date;
}

// ── Auth responses ────────────────────────────────────────────────────────────

export interface AuthSession {
  user: User;
  session: Session;
}

export interface SignUpResult {
  user: User;
  session: Session | null;
  token: string | null;
}

export interface SignInResult {
  user: User;
  session: Session;
  token: string;
  /** Present when 2FA is required */
  twoFactorRequired?: boolean;
}

// ── Email provider ────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}

// ── Database adapter ──────────────────────────────────────────────────────────

export type ModelName = "user" | "session" | "account" | "verification";

export type WhereClause = {
  field: string;
  value: string | number | boolean | null;
  operator?: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "like";
}[];

export interface DatabaseAdapter {
  /** Find a single record by where clause */
  findOne<T = Record<string, unknown>>(options: {
    model: ModelName;
    where: WhereClause;
    select?: string[];
  }): Promise<T | null>;

  /** Find multiple records */
  findMany<T = Record<string, unknown>>(options: {
    model: ModelName;
    where?: WhereClause;
    limit?: number;
    offset?: number;
    orderBy?: { field: string; direction: "asc" | "desc" };
  }): Promise<T[]>;

  /** Create a new record */
  create<T = Record<string, unknown>>(options: {
    model: ModelName;
    data: Record<string, unknown>;
  }): Promise<T>;

  /** Update an existing record */
  update<T = Record<string, unknown>>(options: {
    model: ModelName;
    where: WhereClause;
    data: Record<string, unknown>;
  }): Promise<T | null>;

  /** Delete record(s) */
  delete(options: {
    model: ModelName;
    where: WhereClause;
  }): Promise<void>;

  /** Count records */
  count(options: {
    model: ModelName;
    where?: WhereClause;
  }): Promise<number>;
}

// ── KV store interface ────────────────────────────────────────────────────────

export interface KVStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ttl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

// ── Plugin system ─────────────────────────────────────────────────────────────

export interface GatelyAuthPlugin {
  /** Unique identifier for the plugin */
  id: string;
  /** Human-readable name */
  name?: string;
  /** Additional database schema fields this plugin needs */
  schema?: {
    user?: {
      fields?: Record<string, FieldDefinition>;
    };
    session?: {
      fields?: Record<string, FieldDefinition>;
    };
    [tableName: string]: {
      fields?: Record<string, FieldDefinition>;
      modelName?: string;
    } | undefined;
  };
  /** Extra route handlers (will be mounted at /auth/...) */
  endpoints?: Record<string, AuthEndpointHandler>;
  /** Lifecycle hooks */
  hooks?: {
    before?: HookEntry[];
    after?: HookEntry[];
  };
  /** Called when the plugin is initialized */
  init?: (ctx: GatelyAuthContext) => void | Promise<void>;
}

export interface FieldDefinition {
  type: "string" | "number" | "boolean" | "date";
  required?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  /** Whether users can supply this field on sign-up */
  input?: boolean;
}

// ── Route handlers ────────────────────────────────────────────────────────────

export interface AuthEndpointContext {
  request: Request;
  url: URL;
  db: DatabaseAdapter;
  kv: KVStore;
  options: GatelyAuthOptions;
  /** Resolved session for the current request, if authenticated */
  session: AuthSession | null;
}

export type AuthEndpointHandler = (
  ctx: AuthEndpointContext
) => Promise<Response>;

// ── Hooks ─────────────────────────────────────────────────────────────────────

export interface HookContext extends AuthEndpointContext {
  path: string;
  method: string;
  body: Record<string, unknown> | null;
}

export interface HookEntry {
  matcher: (ctx: HookContext) => boolean;
  handler: (ctx: HookContext) => Promise<void | { context: HookContext }>;
}

// ── Main config ───────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Enable rate limiting (default: true in production) */
  enabled?: boolean;
  /** Time window in seconds (default: 10) */
  window?: number;
  /** Max requests per window (default: 100) */
  max?: number;
  /** Per-path overrides */
  customRules?: Record<string, { window: number; max: number }>;
}

export interface SessionConfig {
  /** Session TTL in seconds (default: 604800 — 7 days) */
  expiresIn?: number;
  /** How often to extend the session in seconds (default: 86400 — 1 day) */
  updateAge?: number;
  /** Cache session in a signed cookie to reduce D1 lookups */
  cookieCache?: {
    enabled: boolean;
    maxAge?: number;
  };
}

export interface CookieConfig {
  /** Prefix for all cookies (default: "gately-auth") */
  prefix?: string;
  /** Force secure cookies even in non-HTTPS environments */
  secure?: boolean;
  /** SameSite attribute (default: "lax") */
  sameSite?: "strict" | "lax" | "none";
  /** Domain for cross-subdomain cookies */
  domain?: string;
}

export interface GatelyAuthOptions {
  /** App name — used in emails and TOTP issuer */
  appName?: string;
  /** Base URL of the auth server */
  baseURL?: string;
  /** Base path for auth routes (default: "/auth") */
  basePath?: string;
  /** Secret key for signing tokens and cookies */
  secret: string;
  /** D1 database binding */
  db: DatabaseAdapter;
  /** KV namespace binding */
  kv: KVStore;
  /** Email provider for transactional email */
  emailProvider?: EmailProvider;
  /** Trusted origins for CSRF protection */
  trustedOrigins?: string[];
  /** Email + password authentication */
  emailAndPassword?: {
    enabled?: boolean;
    disableSignUp?: boolean;
    requireEmailVerification?: boolean;
    minPasswordLength?: number;
    maxPasswordLength?: number;
    autoSignIn?: boolean;
    sendResetPassword?: (options: {
      user: User;
      url: string;
      token: string;
    }) => Promise<void>;
  };
  /** Email verification config */
  emailVerification?: {
    sendVerificationEmail?: (options: {
      user: User;
      url: string;
      token: string;
    }) => Promise<void>;
    sendOnSignUp?: boolean;
    autoSignInAfterVerification?: boolean;
    expiresIn?: number;
  };
  /** Social OAuth providers */
  socialProviders?: Record<string, SocialProviderConfig>;
  /** Plugins to extend functionality */
  plugins?: GatelyAuthPlugin[];
  /** Session configuration */
  session?: SessionConfig;
  /** Cookie configuration */
  cookies?: CookieConfig;
  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig;
  /** Additional fields on the user table */
  additionalUserFields?: Record<string, FieldDefinition>;
  /** Logger configuration */
  logger?: {
    disabled?: boolean;
    level?: "debug" | "info" | "warn" | "error";
  };
}

// ── Social providers ──────────────────────────────────────────────────────────

export interface SocialProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectURI?: string;
  scopes?: string[];
  /** Map profile fields to user fields */
  mapProfileToUser?: (profile: Record<string, unknown>) => Partial<User>;
}

// ── Context passed internally ─────────────────────────────────────────────────

export interface GatelyAuthContext {
  options: GatelyAuthOptions;
  db: DatabaseAdapter;
  kv: KVStore;
  secret: string;
  baseURL: string;
  basePath: string;
  logger: Logger;
}

// ── Logger ────────────────────────────────────────────────────────────────────

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
