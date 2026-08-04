// ─────────────────────────────────────────────────────────────────────────────
// Credentials — read/write ~/.gately/credentials.json
// Stores the Cloudflare API token and account ID between CLI sessions.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

export interface GatelyCredentials {
  /** Cloudflare API token with Workers:Edit + D1:Edit + KV:Edit permissions */
  cloudflareApiToken: string;
  /** Cloudflare account ID */
  cloudflareAccountId: string;
  /** Email of the authenticated user */
  email?: string;
  /** When these credentials were saved */
  savedAt: string;
}

const CREDS_DIR = join(homedir(), ".gately");
const CREDS_FILE = join(CREDS_DIR, "credentials.json");

export function saveCredentials(creds: GatelyCredentials): void {
  mkdirSync(CREDS_DIR, { recursive: true });
  writeFileSync(CREDS_FILE, JSON.stringify(creds, null, 2), { mode: 0o600 });
}

export function loadCredentials(): GatelyCredentials | null {
  if (!existsSync(CREDS_FILE)) return null;
  try {
    const raw = readFileSync(CREDS_FILE, "utf-8");
    return JSON.parse(raw) as GatelyCredentials;
  } catch {
    return null;
  }
}

export function clearCredentials(): void {
  if (existsSync(CREDS_FILE)) {
    writeFileSync(CREDS_FILE, "{}", { mode: 0o600 });
  }
}

export function credentialsPath(): string {
  return CREDS_FILE;
}
