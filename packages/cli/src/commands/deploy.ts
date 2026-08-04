// ─────────────────────────────────────────────────────────────────────────────
// gately-auth deploy — deploy auth Worker via Wrangler
// ─────────────────────────────────────────────────────────────────────────────

import { spawnSync } from "node:child_process";
import chalk from "chalk";
import ora from "ora";

interface DeployOptions {
  env?: string;
}

export async function deploy(opts: DeployOptions): Promise<void> {
  const spinner = ora("Deploying auth Worker...").start();

  const args = ["wrangler", "deploy"];
  if (opts.env) {
    args.push("--env", opts.env);
  }

  const result = spawnSync("npx", args, {
    encoding: "utf-8",
    stdio: "pipe",
    cwd: process.cwd(),
  });

  if (result.status !== 0) {
    spinner.fail("Deploy failed");
    console.error(chalk.red(result.stderr ?? result.stdout ?? "Unknown error"));
    throw new Error("Wrangler deploy failed");
  }

  spinner.succeed("Auth Worker deployed");

  if (result.stdout) {
    // Extract the deployed URL from wrangler output
    const urlMatch = result.stdout.match(/https:\/\/[^\s]+\.workers\.dev/);
    if (urlMatch) {
      console.log(`\n  ${chalk.bold("Auth URL:")} ${chalk.cyan(urlMatch[0])}`);
    }
    console.log(chalk.dim(result.stdout.trim()));
  }
}
