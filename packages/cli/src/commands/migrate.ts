// ─────────────────────────────────────────────────────────────────────────────
// gately-auth migrate — apply D1 migrations
// ─────────────────────────────────────────────────────────────────────────────

import { execSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import chalk from "chalk";
import ora from "ora";

interface MigrateOptions {
  database?: string;
  local?: boolean;
  remote?: boolean;
  dryRun?: boolean;
  migrationsDir?: string;
}

export async function migrate(opts: MigrateOptions): Promise<void> {
  const database = opts.database ?? "AUTH_DB";
  const isLocal = opts.local ?? !opts.remote;
  const migrationsDir = opts.migrationsDir ?? findMigrationsDir();

  if (!migrationsDir) {
    throw new Error(
      "No migrations directory found. Run `gately-auth generate` first, " +
      "or pass --migrations-dir to specify the path."
    );
  }

  // Collect .sql files sorted by name
  const sqlFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(migrationsDir, f));

  if (sqlFiles.length === 0) {
    console.log(chalk.yellow("No migration files found in", migrationsDir));
    return;
  }

  console.log(
    `\n${chalk.bold("gately-auth migrate")}\n` +
    `  Database: ${chalk.cyan(database)}\n` +
    `  Mode:     ${chalk.cyan(isLocal ? "local" : "remote")}\n` +
    `  Files:    ${chalk.cyan(sqlFiles.length.toString())}\n`
  );

  for (const file of sqlFiles) {
    const fileName = file.split(/[\\/]/).pop()!;
    const spinner = ora(`Applying ${fileName}`).start();

    if (opts.dryRun) {
      const sql = readFileSync(file, "utf-8");
      spinner.info(`[dry-run] ${fileName}`);
      console.log(chalk.dim(sql.slice(0, 300)));
      continue;
    }

    const args = [
      "wrangler", "d1", "execute", database,
      "--file", file,
      isLocal ? "--local" : "--remote",
    ];

    const result = spawnSync("npx", args, {
      encoding: "utf-8",
      stdio: "pipe",
    });

    if (result.status !== 0) {
      spinner.fail(`Failed: ${fileName}`);
      console.error(chalk.red(result.stderr ?? result.stdout ?? "Unknown error"));
      throw new Error(`Migration failed: ${fileName}`);
    }

    spinner.succeed(fileName);
  }

  console.log(
    "\n" + chalk.green("✓") + " All migrations applied successfully"
  );
}

function findMigrationsDir(): string | null {
  const candidates = [
    "./migrations",
    "./node_modules/@gately/auth-core/migrations",
  ];

  for (const candidate of candidates) {
    const resolved = resolve(process.cwd(), candidate);
    if (existsSync(resolved)) return resolved;
  }

  return null;
}
