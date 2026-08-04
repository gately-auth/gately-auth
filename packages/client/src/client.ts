// ─────────────────────────────────────────────────────────────────────────────
// Gately Auth client — framework-agnostic
// Mirrors Better Auth's createAuthClient API so switching is minimal
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionData {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    emailVerified: boolean;
    [key: string]: unknown;
  };
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
    [key: string]: unknown;
  };
}

export interface FetchOptions {
  headers?: Record<string, string>;
  onSuccess?: (ctx: { data: unknown; response: Response }) => void;
  onError?: (ctx: { error: { code: string; message: string; status: number }; response: Response }) => void;
  onRequest?: (ctx: { request: RequestInit }) => void;
}

export interface SignUpEmailInput {
  email: string;
  password: string;
  name?: string;
  image?: string;
  [key: string]: unknown;
}

export interface SignInEmailInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthClientPlugin {
  id: string;
  getActions?: (fetchFn: FetchFn) => Record<string, unknown>;
  getAtoms?: (fetchFn: FetchFn) => Record<string, unknown>;
  $InferServerPlugin?: unknown;
}

type FetchFn = <T>(path: string, options?: RequestInit) => Promise<{ data: T | null; error: ApiError | null }>;

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export interface AuthClientOptions {
  /** Base URL of your auth server (default: same origin) */
  baseURL?: string;
  /** Base path for auth routes (default: "/auth") */
  basePath?: string;
  /** Client plugins */
  plugins?: AuthClientPlugin[];
  /** Default fetch options applied to every request */
  fetchOptions?: FetchOptions;
  /** Custom credentials mode (default: "include") */
  credentials?: RequestCredentials;
}

// ── Create auth client ────────────────────────────────────────────────────────

export function createAuthClient(options: AuthClientOptions = {}) {
  const baseURL = (options.baseURL ?? "").replace(/\/$/, "");
  const basePath = (options.basePath ?? "/auth").replace(/\/$/, "");
  const credentials = options.credentials ?? "include";

  // ── Core fetch wrapper ────────────────────────────────────────────────────

  async function $fetch<T>(
    path: string,
    init: RequestInit = {},
    fetchOptions?: FetchOptions
  ): Promise<{ data: T | null; error: ApiError | null; response: Response | null }> {
    const url = `${baseURL}${basePath}${path}`;

    const merged: RequestInit = {
      credentials,
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...options.fetchOptions?.headers,
        ...fetchOptions?.headers,
        ...(init.headers as Record<string, string> | undefined),
      },
    };

    fetchOptions?.onRequest?.({ request: merged });
    options.fetchOptions?.onRequest?.({ request: merged });

    let response: Response;
    try {
      response = await fetch(url, merged);
    } catch (err) {
      const error: ApiError = {
        code: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Network request failed",
        status: 0,
      };
      fetchOptions?.onError?.({ error, response: new Response() });
      return { data: null, error, response: null };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const errBody = body as { error?: { code?: string; message?: string } } | null;
      const error: ApiError = {
        code: errBody?.error?.code ?? "UNKNOWN_ERROR",
        message: errBody?.error?.message ?? response.statusText,
        status: response.status,
      };
      fetchOptions?.onError?.({ error, response });
      options.fetchOptions?.onError?.({ error, response });
      return { data: null, error, response };
    }

    const data = body as T;
    fetchOptions?.onSuccess?.({ data, response });
    options.fetchOptions?.onSuccess?.({ data, response });

    // Store token if present in response header
    const authToken = response.headers.get("Set-Auth-Token");
    if (authToken) {
      _sessionToken = authToken;
      _notifySubscribers();
    }

    return { data, error: null, response };
  }

  // ── In-memory session token (for non-browser use) ──────────────────────────
  let _sessionToken: string | null = null;
  const _subscribers = new Set<() => void>();
  let _sessionCache: SessionData | null = null;
  let _sessionPending = false;

  function _notifySubscribers() {
    for (const sub of _subscribers) sub();
  }

  // ── Auth methods ───────────────────────────────────────────────────────────

  const signUp = {
    async email(
      input: SignUpEmailInput,
      fetchOptions?: FetchOptions
    ): Promise<{ data: { user: SessionData["user"] } | null; error: ApiError | null }> {
      const result = await $fetch<{ user: SessionData["user"] }>(
        "/sign-up/email",
        { method: "POST", body: JSON.stringify(input) },
        fetchOptions
      );
      if (result.data) _sessionCache = null;
      return result;
    },
  };

  const signIn = {
    async email(
      input: SignInEmailInput,
      fetchOptions?: FetchOptions
    ): Promise<{ data: SessionData | null; error: ApiError | null }> {
      const result = await $fetch<SessionData>(
        "/sign-in/email",
        { method: "POST", body: JSON.stringify(input) },
        fetchOptions
      );
      if (result.data) {
        _sessionCache = result.data;
        _notifySubscribers();
      }
      return result;
    },

    async magicLink(
      input: { email: string; callbackURL?: string },
      fetchOptions?: FetchOptions
    ) {
      return $fetch<{ success: boolean }>(
        "/magic-link/send",
        { method: "POST", body: JSON.stringify(input) },
        fetchOptions
      );
    },

    async otp(
      input: { email: string; code: string; type?: string },
      fetchOptions?: FetchOptions
    ) {
      return $fetch<{ user: SessionData["user"] }>(
        "/otp/verify",
        { method: "POST", body: JSON.stringify(input) },
        fetchOptions
      );
    },

    async social(
      input: { provider: string; callbackURL?: string },
      fetchOptions?: FetchOptions
    ): Promise<{ data: { url: string } | null; error: ApiError | null }> {
      const params = new URLSearchParams();
      if (input.callbackURL) params.set("callbackURL", input.callbackURL);
      const redirectURL = `${baseURL}${basePath}/oauth/${input.provider}?${params}`;

      if (typeof window !== "undefined") {
        window.location.href = redirectURL;
        return { data: { url: redirectURL }, error: null };
      }
      return { data: { url: redirectURL }, error: null };
    },
  };

  async function signOut(fetchOptions?: FetchOptions) {
    const result = await $fetch<{ success: boolean }>(
      "/sign-out",
      { method: "POST" },
      fetchOptions
    );
    _sessionToken = null;
    _sessionCache = null;
    _notifySubscribers();
    return result;
  }

  async function getSession(fetchOptions?: FetchOptions): Promise<{
    data: SessionData | null;
    error: ApiError | null;
  }> {
    if (_sessionCache) return { data: _sessionCache, error: null };
    const result = await $fetch<SessionData | { user: null; session: null }>(
      "/session",
      { method: "GET" },
      fetchOptions
    );
    if (result.data && "user" in result.data && result.data.user !== null) {
      _sessionCache = result.data as SessionData;
    } else {
      _sessionCache = null;
    }
    return { data: _sessionCache, error: result.error };
  }

  // ── Reactive useSession ────────────────────────────────────────────────────
  // Framework-agnostic subscription model (nanostores-compatible interface)

  function useSession() {
    type State = {
      data: SessionData | null;
      isPending: boolean;
      error: ApiError | null;
      refetch: () => Promise<void>;
    };

    let state: State = {
      data: _sessionCache,
      isPending: !_sessionCache,
      error: null,
      refetch: async () => {
        _sessionCache = null;
        state.isPending = true;
        _notifySubscribers();
        await getSession();
      },
    };

    if (!_sessionCache && !_sessionPending) {
      _sessionPending = true;
      getSession().then(({ data, error }) => {
        state.data = data;
        state.error = error;
        state.isPending = false;
        _sessionPending = false;
        _notifySubscribers();
      });
    }

    return {
      subscribe(callback: (state: State) => void) {
        const handler = () => {
          state = { ...state, data: _sessionCache };
          callback(state);
        };
        _subscribers.add(handler);
        callback(state);
        return () => _subscribers.delete(handler);
      },
      get() {
        return state;
      },
    };
  }

  // ── Password management ────────────────────────────────────────────────────

  const password = {
    async sendResetEmail(
      input: { email: string },
      fetchOptions?: FetchOptions
    ) {
      return $fetch<{ success: boolean }>(
        "/password/reset",
        { method: "POST", body: JSON.stringify(input) },
        fetchOptions
      );
    },

    async reset(
      input: { token: string; newPassword: string },
      fetchOptions?: FetchOptions
    ) {
      return $fetch<{ success: boolean }>(
        "/password/reset/confirm",
        { method: "POST", body: JSON.stringify(input) },
        fetchOptions
      );
    },
  };

  // ── OTP ────────────────────────────────────────────────────────────────────

  const otp = {
    async send(input: { email: string; type?: string }, fetchOptions?: FetchOptions) {
      return $fetch<{ success: boolean }>(
        "/otp/send",
        { method: "POST", body: JSON.stringify(input) },
        fetchOptions
      );
    },
  };

  // ── Sessions management ────────────────────────────────────────────────────

  const session = {
    async list(fetchOptions?: FetchOptions) {
      return $fetch<{ sessions: SessionData["session"][] }>("/sessions", {}, fetchOptions);
    },

    async revoke(token: string, fetchOptions?: FetchOptions) {
      return $fetch<{ success: boolean }>(
        `/sessions/${encodeURIComponent(token)}`,
        { method: "DELETE" },
        fetchOptions
      );
    },

    async revokeAll(fetchOptions?: FetchOptions) {
      return $fetch<{ success: boolean }>("/sessions", { method: "DELETE" }, fetchOptions);
    },
  };

  // ── Plugin extensions ──────────────────────────────────────────────────────

  const pluginActions: Record<string, unknown> = {};
  const pluginAtoms: Record<string, unknown> = {};

  for (const plugin of options.plugins ?? []) {
    const simpleFetch = <T>(path: string, init?: RequestInit) =>
      $fetch<T>(path, init ?? {});

    if (plugin.getActions) {
      Object.assign(pluginActions, plugin.getActions(simpleFetch as FetchFn));
    }
    if (plugin.getAtoms) {
      Object.assign(pluginAtoms, plugin.getAtoms(simpleFetch as FetchFn));
    }
  }

  // ── Public client interface ────────────────────────────────────────────────

  return {
    signUp,
    signIn,
    signOut,
    getSession,
    useSession,
    password,
    otp,
    session,
    /** Raw fetch for custom requests */
    $fetch,
    /** For TypeScript inference: typeof client.$Infer.Session */
    $Infer: {} as { Session: SessionData },
    /** Plugin-injected methods */
    ...pluginActions,
    ...pluginAtoms,
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
