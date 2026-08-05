// ─────────────────────────────────────────────────────────────────────────────
// @gately/auth-core — public API
// ─────────────────────────────────────────────────────────────────────────────

// Main factory
export { gatelyAuth } from "./auth.js";
export type { GatelyAuthInstance } from "./auth.js";

// Types
export type {
  User,
  Session,
  Account,
  Verification,
  AuthSession,
  SignUpResult,
  SignInResult,
  GatelyAuthOptions,
  GatelyAuthPlugin,
  GatelyAuthContext,
  GatelyAuthBindings,
  DatabaseAdapter,
  KVStore,
  EmailProvider,
  SendEmailOptions,
  SocialProviderConfig,
  SessionConfig,
  CookieConfig,
  RateLimitConfig,
  FieldDefinition,
  ModelName,
  WhereClause,
  Logger,
} from "./types/index.js";

// Error handling
export { GatelyAuthError, toErrorResponse } from "./error.js";
export type { ErrorCode } from "./error.js";

// Adapters (re-exported for convenience)
export { createD1Adapter } from "./adapters/d1.js";
export {
  createKVStore,
  createInMemoryKVStore,
  KV_KEYS,
} from "./adapters/kv.js";
export type { KVStoreExtended } from "./adapters/kv.js";

// Crypto utilities
export {
  generateId,
  generateToken,
  generateOTP,
  generateRandomString,
  hashPassword,
  verifyPassword,
  signJWT,
  verifyJWT,
  encrypt,
  decrypt,
  sha256,
} from "./crypto/index.js";

// Cookie utilities
export {
  getSessionCookie,
  parseCookies,
  getCookie,
  serializeCookie,
  extractSessionToken,
} from "./cookies.js";

// Session utilities
export {
  createSession,
  getSessionByToken,
  revokeSession,
  revokeAllUserSessions,
  listUserSessions,
  requireSession,
} from "./session.js";

// Utilities
export {
  isValidEmail,
  getCORSHeaders,
  jsonResponse,
  redirectResponse,
  buildURL,
  createLogger,
} from "./utils.js";
