// ─────────────────────────────────────────────────────────────────────────────
// Gately Auth client — Next.js setup
// Import this everywhere you need auth state
// ─────────────────────────────────────────────────────────────────────────────

import { createReactAuthClient } from "@gately/auth-client/react";

export const authClient = createReactAuthClient({
  // Point to your deployed gately-auth Worker
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8787",
  basePath: "/auth",

  // Global error handler
  fetchOptions: {
    onError: ({ error }) => {
      if (error.status === 401) {
        // Redirect to sign-in on auth failure
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
      }
    },
  },
});

export type { SessionData } from "@gately/auth-client";
