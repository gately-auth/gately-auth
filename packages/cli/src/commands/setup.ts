// ─────────────────────────────────────────────────────────────────────────────
// gately-auth setup — auto-provision Cloudflare resources
//
// Uses the saved credentials from `gately-auth login` to:
//   1. Create (or reuse) a D1 database
//   2. Create (or reuse) a KV namespace
//   3. Patch wrangler.toml with the real IDs
//   4. Generate a strong AUTH_SECRET and set it as a Worker secret
//   5. Run the initial migration
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { loadCredentials } from "../lib/credentials.js";
import {
  listD1Databases,
  createD1Database,
  listKVNamespaces,
  createKVNamespace,
  putWorkerSecret,
  type CFD1Database,
  type CFKVNamespace,
} from "../lib/cloudflare-api.js";

export interface SetupOptions {
  /** Skip running migrations after setup */
  skipMigrate?: boolean;
  /** Skip setting the AUTH_SECRET worker secret */
  skipSecret?: boolean;
  /** Path to wrangler.toml (default: ./wrangler.toml) */
  config?: string;
}

export async function setup(opts: SetupOptions = {}): Promise<void> {
  console.log("\n" + chalk.bold("⚙️  gately-auth setup\n"));

  // ── Check credentials ─────────────────────────────────────────────────────

  const creds = loadCredentials();
  if (!creds?.cloudflareApiToken) {
    throw new Error(
      "Not logged in. Run " + chalk.cyan("gately-auth login") + " first."
    );
  }

  const { cloudflareApiToken: token, cloudflareAccountId: accountId, email } = creds;
  console.log(
    chalk.dim(`Logged in as ${email} · account ${accountId}\n`)
  );

  // ── Read wrangler.toml ────────────────────────────────────────────────────

  const tomlPath = resolve(process.cwd(), opts.config ?? "wrangler.toml");
  if (!existsSync(tomlPath)) {
    throw new Error(
      `wrangler.toml not found at ${tomlPath}.\n` +
      `Run ${chalk.cyan("gately-auth init")} first to scaffold the project.`
    );
  }

  let toml = readFileSync(tomlPath, "utf-8");

  // Extract worker name from toml
  const nameMatch = toml.match(/^name\s*=\s*["']?([^"'\n]+)["']?/m);
  const workerName = nameMatch?.[1]?.trim() ?? "gately-auth-worker";

  // ── D1 database ───────────────────────────────────────────────────────────

  console.log(chalk.bold("1. D1 database\n"));

  const existingDbs = await listD1Databases(token, accountId);
  let db: CFD1Database;

  // Check if wrangler.toml already has a real database_id (not the placeholder)
  const hasRealDbId = toml.includes("database_id") &&
    !toml.includes("REPLACE_WITH_YOUR_D1_DATABASE_ID") &&
    !toml.includes('database_id = ""');

  if (hasRealDbId) {
    console.log(chalk.dim("  wrangler.toml already has a database_id — skipping D1 creation\n"));
    db = { uuid: "existing", name: "existing" };
  } else {
    // Suggest name based on existing databases or worker name
    const suggestedDbName = `${workerName}-db`.replace(/[^a-z0-9-]/g, "-").toLowerCase();

    // Check if it already exists on Cloudflare
    const existing = existingDbs.find(
      (d) => d.name === suggestedDbName || d.name === "gately-auth"
    );

    if (existing) {
      const { reuse } = await prompts({
        type: "confirm",
        name: "reuse",
        message: `D1 database "${existing.name}" already exists. Reuse it?`,
        initial: true,
      });

      if (reuse) {
        db = existing;
        console.log(`  ${chalk.green("✓")} Reusing: ${chalk.cyan(db.name)} (${db.uuid})\n`);
      } else {
        const { dbName } = await prompts({
          type: "text",
          name: "dbName",
          message: "D1 database name",
          initial: suggestedDbName + "-2",
        });
        const spinner = ora(`Creating D1 database "${dbName}"...`).start();
        db = await createD1Database(token, accountId, dbName);
        spinner.succeed(`Created: ${chalk.cyan(db.name)} (${db.uuid})`);
        console.log();
      }
    } else {
      const { dbName } = await prompts({
        type: "text",
        name: "dbName",
        message: "D1 database name",
        initial: suggestedDbName,
      });
      const spinner = ora(`Creating D1 database "${dbName}"...`).start();
      db = await createD1Database(token, accountId, dbName);
      spinner.succeed(`Created: ${chalk.cyan(db.name)} (${db.uuid})`);
      console.log();
    }

    // Patch wrangler.toml
    if (db.uuid !== "existing") {
      toml = toml
        .replace(
          /database_name\s*=\s*["'][^"']*["']/,
          `database_name = "${db.name}"`
        )
        .replace(
          /database_id\s*=\s*["'][^"']*["']/,
          `database_id = "${db.uuid}"`
        );
    }
  }

  // ── KV namespace ──────────────────────────────────────────────────────────

  console.log(chalk.bold("2. KV namespace\n"));

  const existingKVs = await listKVNamespaces(token, accountId);
  let kv: CFKVNamespace;

  const hasRealKVId = toml.includes('id = "') &&
    !toml.includes("REPLACE_WITH_YOUR_KV_NAMESPACE_ID") &&
    !/id\s*=\s*""\s*/.test(toml);

  if (hasRealKVId) {
    console.log(chalk.dim("  wrangler.toml already has a KV id — skipping KV creation\n"));
    kv = { id: "existing", title: "existing" };
  } else {
    const suggestedKVName = `${workerName}-kv`.replace(/[^a-zA-Z0-9_-]/g, "_").toUpperCase();
    const existingKV = existingKVs.find(
      (k) => k.title === suggestedKVName || k.title === "AUTH_KV"
    );

    if (existingKV) {
      const { reuse } = await prompts({
        type: "confirm",
        name: "reuse",
        message: `KV namespace "${existingKV.title}" already exists. Reuse it?`,
        initial: true,
      });
      kv = reuse ? existingKV : await createKVNamespaceFresh(token, accountId, suggestedKVName + "_2");
    } else {
      const { kvName } = await prompts({
        type: "text",
        name: "kvName",
        message: "KV namespace name",
        initial: suggestedKVName,
      });
      const spinner = ora(`Creating KV namespace "${kvName}"...`).start();
      kv = await createKVNamespace(token, accountId, kvName);
      spinner.succeed(`Created: ${chalk.cyan(kv.title)} (${kv.id})`);
      console.log();
    }

    // Patch wrangler.toml KV id
    if (kv.id !== "existing") {
      toml = toml.replace(
        /(\[\[kv_namespaces\]\][^\[]*id\s*=\s*")([^"]*)(")/,
        `$1${kv.id}$3`
      );
    }
  }

  // ── Write patched wrangler.toml ───────────────────────────────────────────

  writeFileSync(tomlPath, toml);
  console.log(chalk.green("✓") + ` Updated ${chalk.cyan("wrangler.toml")}\n`);

  // ── AUTH_SECRET ───────────────────────────────────────────────────────────

  if (!opts.skipSecret) {
    console.log(chalk.bold("3. AUTH_SECRET\n"));

    // Check if .dev.vars already has a secret for local dev
    const devVarsPath = join(process.cwd(), ".dev.vars");
    const hasLocalSecret = existsSync(devVarsPath) &&
      readFileSync(devVarsPath, "utf-8").includes("GATELY_AUTH_SECRET");

    if (!hasLocalSecret) {
      // Generate a strong secret
      const secret = randomBytes(32).toString("base64url");
      const devVarsContent = existsSync(devVarsPath)
        ? readFileSync(devVarsPath, "utf-8") + `\nGATELY_AUTH_SECRET=${secret}\n`
        : `GATELY_AUTH_SECRET=${secret}\n`;
      writeFileSync(devVarsPath, devVarsContent, { mode: 0o600 });
      console.log(chalk.green("✓") + " Generated AUTH_SECRET → " + chalk.cyan(".dev.vars") + "\n");
    }

    // Set as Worker secret via Wrangler (requires wrangler to be installed)
    const { setRemote } = await prompts({
      type: "confirm",
      name: "setRemote",
      message: "Set AUTH_SECRET as a Wrangler secret on the remote Worker now?",
      initial: true,
    });

    if (setRemote) {
      const secret = randomBytes(32).toString("base64url");
      const spinner = ora("Setting AUTH_SECRET secret...").start();
      try {
        // Use wrangler secret put via stdin
        const result = spawnSync(
          "npx",
          ["wrangler", "secret", "put", "GATELY_AUTH_SECRET"],
          {
            input: secret,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
          }
        );
        if (result.status === 0) {
          spinner.succeed("AUTH_SECRET set on Worker");
        } else {
          spinner.warn("Could not set secret automatically — run manually:");
          console.log(chalk.cyan("  npx wrangler secret put GATELY_AUTH_SECRET"));
        }
      } catch {
        spinner.warn("Could not set secret automatically");
      }
      console.log();
    }
  }

  // ── Run migrations ────────────────────────────────────────────────────────

  if (!opts.skipMigrate) {
    const { runMigrate } = await prompts({
      type: "confirm",
      name: "runMigrate",
      message: "Run migrations on the local D1 database now?",
      initial: true,
    });

    if (runMigrate) {
      console.log();
      const { migrate } = await import("./migrate.js");
      await migrate({ local: true });
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  console.log(`
${chalk.green.bold("✓ Setup complete!")}

Your gately-auth Worker is ready for local development:

  ${chalk.cyan("npx wrangler dev")}          Start the local dev server
  ${chalk.cyan("gately-auth migrate --remote")}  Apply migrations to production

Deploy to Cloudflare:

  ${chalk.cyan("gately-auth deploy")}
`);
}

async function createKVNamespaceFresh(
  token: string,
  accountId: string,
  name: string
): Promise<CFKVNamespace> {
  const ora_ = (await import("ora")).default;
  const spinner = ora_(`Creating KV namespace "${name}"...`).start();
  const kv = await createKVNamespace(token, accountId, name);
  spinner.succeed(`Created: ${chalk.cyan(kv.title)} (${kv.id})`);
  console.log();
  return kv;
}
