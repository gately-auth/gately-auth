// ─────────────────────────────────────────────────────────────────────────────
// @gately/auth-client/react — React hooks
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { createAuthClient } from "./client.js";
import type { SessionData, AuthClientOptions, ApiError } from "./client.js";

export { createAuthClient };
export type { AuthClientOptions, SessionData, ApiError };

// ── useSession hook ───────────────────────────────────────────────────────────

interface UseSessionReturn {
  data: SessionData | null;
  isPending: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * React client factory with reactive useSession hook.
 *
 * @example
 * ```tsx
 * import { createReactAuthClient } from '@gately/auth-client/react'
 *
 * export const authClient = createReactAuthClient({
 *   baseURL: 'https://my-auth.workers.dev',
 * })
 *
 * function App() {
 *   const { data: session, isPending } = authClient.useSession()
 *   if (isPending) return <Spinner />
 *   if (!session) return <SignIn />
 *   return <Dashboard user={session.user} />
 * }
 * ```
 */
export function createReactAuthClient(options: AuthClientOptions = {}) {
  const client = createAuthClient(options);
  const sessionSignal = client.useSession();

  function useSession(): UseSessionReturn {
    const makeRefetch = (set: React.Dispatch<React.SetStateAction<UseSessionReturn>>) =>
      async () => {
        set((prev) => ({ ...prev, isPending: true }));
        const result = await client.getSession();
        set((prev) => ({
          ...prev,
          data: result.data,
          error: result.error,
          isPending: false,
        }));
      };

    const [state, setState] = useState<UseSessionReturn>(() => {
      const initial = sessionSignal.get();
      return {
        data: initial.data,
        isPending: initial.isPending,
        error: initial.error,
        refetch: async () => {},
      };
    });

    useEffect(() => {
      // Attach refetch now that setState is stable
      setState((prev) => ({ ...prev, refetch: makeRefetch(setState) }));

      // Subscribe to session signal changes
      const unsubscribe = sessionSignal.subscribe((newState) => {
        setState({
          data: newState.data,
          isPending: newState.isPending,
          error: newState.error,
          refetch: makeRefetch(setState),
        });
      });

      // useEffect cleanup must return void or a cleanup function
      return () => { unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return state;
  }

  return {
    ...client,
    useSession,
  };
}

// Needed for React.Dispatch type reference
import type React from "react";
