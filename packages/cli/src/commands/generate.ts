// ─────────────────────────────────────────────────────────────────────────────
// gately-auth generate — generate D1 migration SQL
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import chalk from "chalk";

interface GenerateOptions {
  config?: string;
  output?: string;
}

export async function generate(opts: GenerateOptions): Promise<void> {
  const outputDir = resolve(process.cwd(), opts.output ?? "./migrations");
  mkdirSync(outputDir, { recursive: true });

  // Core schema migration (always included)
  const coreSchema = getCoreSchema();
  const coreFile = join(outputDir, "0001_gately_auth_initial.sql");

  if (!existsSync(coreFile)) {
    writeFileSync(coreFile, coreSchema);
    console.log(chalk.green("✓") + " Created " + chalk.cyan("0001_gately_auth_initial.sql"));
  } else {
    console.log(chalk.dim("  Skipped (already exists): 0001_gately_auth_initial.sql"));
  }

  console.log(
    "\n" + chalk.green("✓") + " Migration files written to " + chalk.cyan(outputDir) +
    "\n\nRun " + chalk.cyan("gately-auth migrate --local") + " to apply.\n"
  );
}

function getCoreSchema(): string {
  // Try to read from the published package migrations
  const candidates = [
    resolve(__dirname, "../../core/migrations/0001_initial_schema.sql"),
    resolve(process.cwd(), "node_modules/@gately-auth/core/migrations/0001_initial_schema.sql"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return readFileSync(candidate, "utf-8");
    }
  }

  // Fallback: inline the schema
  return `-- gately-auth core schema (generated)
-- Run: gately-auth migrate --local

CREATE TABLE IF NOT EXISTS ga_users (
  id              TEXT     NOT NULL PRIMARY KEY,
  email           TEXT     NOT NULL UNIQUE COLLATE NOCASE,
  name            TEXT,
  image           TEXT,
  email_verified  INTEGER  NOT NULL DEFAULT 0,
  created_at      INTEGER  NOT NULL,
  updated_at      INTEGER  NOT NULL
);
CREATE INDEX IF NOT EXISTS ga_users_email ON ga_users (email);

CREATE TABLE IF NOT EXISTS ga_sessions (
  id           TEXT    NOT NULL PRIMARY KEY,
  user_id      TEXT    NOT NULL REFERENCES ga_users(id) ON DELETE CASCADE,
  token        TEXT    NOT NULL UNIQUE,
  expires_at   INTEGER NOT NULL,
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ga_sessions_token   ON ga_sessions (token);
CREATE INDEX IF NOT EXISTS ga_sessions_user_id ON ga_sessions (user_id);
CREATE INDEX IF NOT EXISTS ga_sessions_expires ON ga_sessions (expires_at);

CREATE TABLE IF NOT EXISTS ga_accounts (
  id                      TEXT    NOT NULL PRIMARY KEY,
  user_id                 TEXT    NOT NULL REFERENCES ga_users(id) ON DELETE CASCADE,
  provider_id             TEXT    NOT NULL,
  account_id              TEXT    NOT NULL,
  password                TEXT,
  access_token            TEXT,
  refresh_token           TEXT,
  access_token_expires_at INTEGER,
  id_token                TEXT,
  scope                   TEXT,
  created_at              INTEGER NOT NULL,
  updated_at              INTEGER NOT NULL,
  UNIQUE (provider_id, account_id)
);
CREATE INDEX IF NOT EXISTS ga_accounts_user_id  ON ga_accounts (user_id);
CREATE INDEX IF NOT EXISTS ga_accounts_provider ON ga_accounts (provider_id, account_id);

CREATE TABLE IF NOT EXISTS ga_verifications (
  id          TEXT    NOT NULL PRIMARY KEY,
  identifier  TEXT    NOT NULL,
  value       TEXT    NOT NULL,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ga_verifications_identifier ON ga_verifications (identifier);
CREATE INDEX IF NOT EXISTS ga_verifications_expires    ON ga_verifications (expires_at);
`;
}
