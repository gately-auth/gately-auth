// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare REST API helpers
// Used by the setup command to create D1 databases, KV namespaces,
// verify tokens, and fetch account info.
// ─────────────────────────────────────────────────────────────────────────────

const CF_API = "https://api.cloudflare.com/client/v4";

async function cfFetch<T>(
  path: string,
  apiToken: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${CF_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });

  const body = (await res.json()) as { success: boolean; result: T; errors: { message: string }[] };

  if (!body.success) {
    const msg = body.errors?.[0]?.message ?? `Cloudflare API error (${res.status})`;
    throw new Error(msg);
  }

  return body.result;
}

// ── Token / account verification ─────────────────────────────────────────────

export interface CFTokenInfo {
  id: string;
  status: "active" | "expired" | "disabled";
}

export interface CFUserInfo {
  email: string;
  id: string;
}

export interface CFAccount {
  id: string;
  name: string;
}

/** Verify the token is valid and return its status */
export async function verifyToken(apiToken: string): Promise<CFTokenInfo> {
  return cfFetch<CFTokenInfo>("/user/tokens/verify", apiToken);
}

/** Get the authenticated user's info */
export async function getUserInfo(apiToken: string): Promise<CFUserInfo> {
  return cfFetch<CFUserInfo>("/user", apiToken);
}

/** List accounts the token has access to */
export async function listAccounts(apiToken: string): Promise<CFAccount[]> {
  return cfFetch<CFAccount[]>("/accounts?per_page=50", apiToken);
}

// ── D1 ────────────────────────────────────────────────────────────────────────

export interface CFD1Database {
  uuid: string;
  name: string;
}

/** List all D1 databases for an account */
export async function listD1Databases(
  apiToken: string,
  accountId: string
): Promise<CFD1Database[]> {
  return cfFetch<CFD1Database[]>(
    `/accounts/${accountId}/d1/database?per_page=100`,
    apiToken
  );
}

/** Create a new D1 database */
export async function createD1Database(
  apiToken: string,
  accountId: string,
  name: string
): Promise<CFD1Database> {
  return cfFetch<CFD1Database>(
    `/accounts/${accountId}/d1/database`,
    apiToken,
    { method: "POST", body: JSON.stringify({ name }) }
  );
}

// ── KV ────────────────────────────────────────────────────────────────────────

export interface CFKVNamespace {
  id: string;
  title: string;
}

/** List KV namespaces for an account */
export async function listKVNamespaces(
  apiToken: string,
  accountId: string
): Promise<CFKVNamespace[]> {
  return cfFetch<CFKVNamespace[]>(
    `/accounts/${accountId}/storage/kv/namespaces?per_page=100`,
    apiToken
  );
}

/** Create a new KV namespace */
export async function createKVNamespace(
  apiToken: string,
  accountId: string,
  title: string
): Promise<CFKVNamespace> {
  return cfFetch<CFKVNamespace>(
    `/accounts/${accountId}/storage/kv/namespaces`,
    apiToken,
    { method: "POST", body: JSON.stringify({ title }) }
  );
}

// ── Workers secrets ───────────────────────────────────────────────────────────

/** Put a secret on a Worker script */
export async function putWorkerSecret(
  apiToken: string,
  accountId: string,
  workerName: string,
  secretName: string,
  secretValue: string
): Promise<void> {
  await cfFetch(
    `/accounts/${accountId}/workers/scripts/${workerName}/secrets`,
    apiToken,
    {
      method: "PUT",
      body: JSON.stringify({ name: secretName, text: secretValue, type: "secret_text" }),
    }
  );
}
