// ─────────────────────────────────────────────────────────────────────────────
// gately-auth login — connect your Cloudflare account
//
// Opens the Cloudflare dashboard to create an API token with the required
// permissions, then asks you to paste it back. The token is saved to
// ~/.gately/credentials.json (mode 600) for use by other commands.
// ─────────────────────────────────────────────────────────────────────────────

import { execSync } from "node:child_process";
import chalk from "chalk";
import prompts from "prompts";
import ora from "ora";
import {
  saveCredentials,
  loadCredentials,
  credentialsPath,
} from "../lib/credentials.js";
import {
  verifyToken,
  getUserInfo,
  listAccounts,
  type CFAccount,
} from "../lib/cloudflare-api.js";

// The Cloudflare API token template deep-link with the permissions
// gately-auth needs: D1:Edit, KV:Edit, Workers Scripts:Edit, Account Settings:Read
const CF_TOKEN_CREATE_URL =
  "https://dash.cloudflare.com/profile/api-tokens/create" +
  "?permissionGroupKeys=d1%3Aedit%2Ckv%3Aedit%2Cworkers%3Aedit%2Caccount%3Aread" +
  "&name=gately-auth-cli";

export interface LoginOptions {
  force?: boolean;
}

export async function login(opts: LoginOptions = {}): Promise<void> {
  console.log("\n" + chalk.bold("🔐 gately-auth login\n"));

  // Check for existing credentials
  const existing = loadCredentials();
  if (existing && !opts.force) {
    console.log(
      chalk.green("✓") +
        ` Already logged in as ${chalk.cyan(existing.email ?? "unknown")} ` +
        chalk.dim(`(${existing.cloudflareAccountId})\n`)
    );
    const { reauth } = await prompts({
      type: "confirm",
      name: "reauth",
      message: "Re-authenticate with a new token?",
      initial: false,
    });
    if (!reauth) return;
  }

  // ── Step 1: Guide user to create the token ────────────────────────────────

  console.log(chalk.bold("Step 1 — Create a Cloudflare API token\n"));
  console.log(
    "We need a Cloudflare API token with these permissions:\n" +
      chalk.dim("  • D1 — Edit\n") +
      chalk.dim("  • KV — Edit\n") +
      chalk.dim("  • Workers Scripts — Edit\n") +
      chalk.dim("  • Account Settings — Read\n")
  );
  console.log(
    "Opening the Cloudflare dashboard...\n" +
      chalk.dim(CF_TOKEN_CREATE_URL) +
      "\n"
  );

  // Open URL in default browser (cross-platform)
  try {
    const platform = process.platform;
    if (platform === "win32") {
      execSync(`start "" "${CF_TOKEN_CREATE_URL}"`, { stdio: "ignore" });
    } else if (platform === "darwin") {
      execSync(`open "${CF_TOKEN_CREATE_URL}"`, { stdio: "ignore" });
    } else {
      execSync(`xdg-open "${CF_TOKEN_CREATE_URL}"`, { stdio: "ignore" });
    }
  } catch {
    console.log(
      chalk.yellow("Could not open browser automatically.") +
        " Please open this URL manually:\n" +
        chalk.cyan(CF_TOKEN_CREATE_URL) +
        "\n"
    );
  }

  // ── Step 2: Paste the token ───────────────────────────────────────────────

  console.log(chalk.bold("Step 2 — Paste your API token\n"));
  console.log(
    chalk.dim(
      "In the Cloudflare dashboard:\n" +
        "  1. Select the pre-filled template or set permissions manually\n" +
        "  2. Choose an account scope\n" +
        "  3. Click Continue to summary → Create token\n" +
        "  4. Copy the token shown (it is only shown once)\n"
    )
  );

  const { apiToken } = await prompts({
    type: "password",
    name: "apiToken",
    message: "Paste your Cloudflare API token",
    validate: (v: string) => (v.trim().length > 10 ? true : "Token looks too short"),
  });

  if (!apiToken?.trim()) {
    throw new Error("No token provided — login cancelled");
  }

  // ── Step 3: Verify the token ──────────────────────────────────────────────

  const spinner = ora("Verifying token...").start();
  let tokenInfo;
  let userInfo;
  let accounts: CFAccount[];

  try {
    tokenInfo = await verifyToken(apiToken.trim());
    if (tokenInfo.status !== "active") {
      spinner.fail(`Token status: ${tokenInfo.status}`);
      throw new Error("Token is not active. Please create a new token.");
    }

    userInfo = await getUserInfo(apiToken.trim());
    accounts = await listAccounts(apiToken.trim());
    spinner.succeed(`Token verified — ${chalk.cyan(userInfo.email)}`);
  } catch (err) {
    spinner.fail("Token verification failed");
    throw err;
  }

  // ── Step 4: Choose account ────────────────────────────────────────────────

  let accountId: string;
  let accountName: string;

  if (accounts.length === 0) {
    throw new Error("No Cloudflare accounts found for this token.");
  } else if (accounts.length === 1) {
    accountId = accounts[0]!.id;
    accountName = accounts[0]!.name;
    console.log(`\nUsing account: ${chalk.cyan(accountName)}`);
  } else {
    const { chosen } = await prompts({
      type: "select",
      name: "chosen",
      message: "Select a Cloudflare account",
      choices: accounts.map((a) => ({ title: a.name, value: a.id })),
    });
    accountId = chosen;
    accountName = accounts.find((a) => a.id === chosen)?.name ?? chosen;
  }

  // ── Step 5: Save credentials ──────────────────────────────────────────────

  saveCredentials({
    cloudflareApiToken: apiToken.trim(),
    cloudflareAccountId: accountId,
    email: userInfo.email,
    savedAt: new Date().toISOString(),
  });

  console.log(`
${chalk.green("✓")} Logged in as ${chalk.cyan(userInfo.email)}
  Account:     ${chalk.cyan(accountName)}
  Credentials: ${chalk.dim(credentialsPath())}

Run ${chalk.cyan("gately-auth setup")} to create your D1 database and KV namespace automatically.
`);
}

export async function logout(): Promise<void> {
  const { loadCredentials, clearCredentials } = await import("../lib/credentials.js");
  const creds = loadCredentials();
  if (!creds?.cloudflareApiToken) {
    console.log(chalk.yellow("Not currently logged in."));
    return;
  }
  clearCredentials();
  console.log(chalk.green("✓") + " Logged out. Credentials cleared from " + credentialsPath());
}
