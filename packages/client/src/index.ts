// ─────────────────────────────────────────────────────────────────────────────
// @gately-auth/client — vanilla / framework-agnostic client
// ─────────────────────────────────────────────────────────────────────────────

export { createAuthClient } from "./client.js";
export type {
  AuthClient,
  AuthClientOptions,
  AuthClientPlugin,
  SessionData,
  SignUpEmailInput,
  SignInEmailInput,
  FetchOptions,
} from "./client.js";
