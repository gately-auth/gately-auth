// ─────────────────────────────────────────────────────────────────────────────
// Auth client singleton
//
// In development the Vite proxy forwards /auth → http://localhost:8787/auth
// so we leave baseURL empty (same-origin). For production, set VITE_AUTH_URL.
// ─────────────────────────────────────────────────────────────────────────────

import { createReactAuthClient } from "@gately/auth-client/react";

export const authClient = createReactAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL ?? "",
  basePath: "/auth",
});
