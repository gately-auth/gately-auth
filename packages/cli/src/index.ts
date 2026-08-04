#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// gately-auth CLI
// ─────────────────────────────────────────────────────────────────────────────

import { Command } from "commander";
import chalk from "chalk";
import { init } from "./commands/init.js";
import { migrate } from "./commands/migrate.js";
import { generate } from "./commands/generate.js";
import { deploy } from "./commands/deploy.js";
import { login, logout } from "./commands/login.js";
import { setup } from "./commands/setup.js";

const program = new Command();

program
  .name("gately-auth")
  .description(
    chalk.bold("Gately Auth") +
      " — Cloudflare-native auth framework\n" +
      chalk.dim("  D1 + KV + Workers. Production-grade auth in minutes.")
  )
  .version("0.1.0");

// ── init ──────────────────────────────────────────────────────────────────────

program
  .command("init")
  .description("Scaffold a new gately-auth Worker in the current directory")
  .option("--template <name>", "Starter template (default: hono)", "hono")
  .option("--skip-install", "Skip dependency installation")
  .action(async (opts) => {
    try {
      await init(opts);
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }
  });

// ── generate ──────────────────────────────────────────────────────────────────

program
  .command("generate")
  .description("Generate D1 migration SQL from your auth config")
  .option("-c, --config <path>", "Path to auth config file", "auth.config.ts")
  .option("-o, --output <path>", "Output directory for migrations", "./migrations")
  .action(async (opts) => {
    try {
      await generate(opts);
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }
  });

// ── migrate ───────────────────────────────────────────────────────────────────

program
  .command("migrate")
  .description("Apply D1 migrations to your Cloudflare database")
  .option("--database <name>", "D1 database binding name (default: AUTH_DB)", "AUTH_DB")
  .option("--local", "Apply against local D1 database (wrangler dev)")
  .option("--remote", "Apply against production D1 database")
  .option("--dry-run", "Print SQL without executing")
  .action(async (opts) => {
    try {
      await migrate(opts);
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }
  });

// ── deploy ────────────────────────────────────────────────────────────────────

program
  .command("deploy")
  .description("Deploy the auth Worker via Wrangler")
  .option("--env <environment>", "Wrangler environment")
  .action(async (opts) => {
    try {
      await deploy(opts);
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }
  });

// ── login ─────────────────────────────────────────────────────────────────────

program
  .command("login")
  .description("Connect your Cloudflare account (saves credentials to ~/.gately/credentials.json)")
  .option("--force", "Re-authenticate even if already logged in")
  .action(async (opts) => {
    try {
      await login(opts);
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }
  });

// ── logout ────────────────────────────────────────────────────────────────────

program
  .command("logout")
  .description("Remove saved Cloudflare credentials")
  .action(async () => {
    try {
      await logout();
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }
  });

// ── setup ─────────────────────────────────────────────────────────────────────

program
  .command("setup")
  .description("Auto-provision D1 database, KV namespace, and secrets using your saved credentials")
  .option("--skip-migrate", "Skip running migrations after setup")
  .option("--skip-secret", "Skip setting the AUTH_SECRET Worker secret")
  .option("--config <path>", "Path to wrangler.toml", "wrangler.toml")
  .action(async (opts) => {
    try {
      await setup({
        skipMigrate: opts.skipMigrate,
        skipSecret: opts.skipSecret,
        config: opts.config,
      });
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }
  });

// ── whoami ────────────────────────────────────────────────────────────────────

program
  .command("whoami")
  .description("Show the currently logged-in Cloudflare account")
  .action(async () => {
    const { loadCredentials } = await import("./lib/credentials.js");
    const creds = loadCredentials();
    if (!creds?.cloudflareApiToken) {
      console.log(chalk.yellow("Not logged in. Run: gately-auth login"));
    } else {
      console.log(
        `\nLogged in as ${chalk.cyan(creds.email ?? "unknown")}\n` +
        `  Account ID: ${chalk.dim(creds.cloudflareAccountId)}\n` +
        `  Since:      ${chalk.dim(creds.savedAt)}\n`
      );
    }
  });

program.parse();
