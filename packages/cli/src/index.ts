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

program.parse();
