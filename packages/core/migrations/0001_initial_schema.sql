-- ─────────────────────────────────────────────────────────────────────────────
-- gately-auth initial schema
-- Cloudflare D1 (SQLite dialect)
-- All tables prefixed with ga_ to avoid conflicts with application tables
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Users ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ga_users (
  id              TEXT     NOT NULL PRIMARY KEY,
  email           TEXT     NOT NULL UNIQUE COLLATE NOCASE,
  name            TEXT,
  image           TEXT,
  email_verified  INTEGER  NOT NULL DEFAULT 0,  -- boolean: 0|1
  created_at      INTEGER  NOT NULL,             -- unix timestamp (seconds)
  updated_at      INTEGER  NOT NULL
);

CREATE INDEX IF NOT EXISTS ga_users_email ON ga_users (email);
CREATE INDEX IF NOT EXISTS ga_users_created_at ON ga_users (created_at DESC);

-- ── Sessions ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ga_sessions (
  id           TEXT    NOT NULL PRIMARY KEY,
  user_id      TEXT    NOT NULL REFERENCES ga_users(id) ON DELETE CASCADE,
  token        TEXT    NOT NULL UNIQUE,
  expires_at   INTEGER NOT NULL,  -- unix timestamp
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS ga_sessions_user_id  ON ga_sessions (user_id);
CREATE INDEX IF NOT EXISTS ga_sessions_token    ON ga_sessions (token);
CREATE INDEX IF NOT EXISTS ga_sessions_expires  ON ga_sessions (expires_at);

-- ── Accounts (OAuth + credential) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ga_accounts (
  id                        TEXT    NOT NULL PRIMARY KEY,
  user_id                   TEXT    NOT NULL REFERENCES ga_users(id) ON DELETE CASCADE,
  provider_id               TEXT    NOT NULL,  -- "credential", "google", "github", etc.
  account_id                TEXT    NOT NULL,  -- provider's user ID
  password                  TEXT,              -- pbkdf2 hashed (credential accounts only)
  access_token              TEXT,
  refresh_token             TEXT,
  access_token_expires_at   INTEGER,
  id_token                  TEXT,
  scope                     TEXT,
  created_at                INTEGER NOT NULL,
  updated_at                INTEGER NOT NULL,
  UNIQUE (provider_id, account_id)
);

CREATE INDEX IF NOT EXISTS ga_accounts_user_id    ON ga_accounts (user_id);
CREATE INDEX IF NOT EXISTS ga_accounts_provider   ON ga_accounts (provider_id, account_id);

-- ── Verifications (email confirm, tokens) ────────────────────────────────────
-- Short-lived tokens that need to be looked up by value.
-- Long-lived tokens (magic links, OTPs) live in KV, not here.

CREATE TABLE IF NOT EXISTS ga_verifications (
  id          TEXT    NOT NULL PRIMARY KEY,
  identifier  TEXT    NOT NULL,  -- email or user_id
  value       TEXT    NOT NULL,  -- hashed token
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS ga_verifications_identifier ON ga_verifications (identifier);
CREATE INDEX IF NOT EXISTS ga_verifications_expires    ON ga_verifications (expires_at);
CREATE INDEX IF NOT EXISTS ga_verifications_value      ON ga_verifications (value);

-- ── Cleanup trigger — expire old verifications automatically ─────────────────
-- Note: triggers run per-row, this is intentionally lightweight
-- For bulk cleanup, run: DELETE FROM ga_verifications WHERE expires_at < unixepoch()
