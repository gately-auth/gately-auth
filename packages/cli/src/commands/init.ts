// ─────────────────────────────────────────────────────────────────────────────
// gately-auth init — scaffold a new auth Worker
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";

interface InitOptions {
  template: string;
  skipInstall?: boolean;
}

export async function init(opts: InitOptions): Promise<void> {
  console.log("\n" + chalk.bold("🔐 gately-auth init\n"));

  // Prompt for project details
  const answers = await prompts([
    {
      type: "text",
      name: "appName",
      message: "App name",
      initial: "my-app",
    },
    {
      type: "text",
      name: "workerName",
      message: "Cloudflare Worker name",
      initial: "my-app-auth",
    },
    {
      type: "confirm",
      name: "enableGatelyEmail",
      message: "Use Gately for transactional email? (recommended)",
      initial: true,
    },
    {
      type: "confirm",
      name: "enableGoogle",
      message: "Enable Google OAuth?",
      initial: false,
    },
    {
      type: "confirm",
      name: "enableGitHub",
      message: "Enable GitHub OAuth?",
      initial: false,
    },
  ]);

  const cwd = process.cwd();
  const spinner = ora("Scaffolding project...").start();

  try {
    // wrangler.toml
    writeFileSync(
      join(cwd, "wrangler.toml"),
      buildWranglerToml(answers.workerName, answers.appName)
    );

    // auth.ts (server)
    writeFileSync(
      join(cwd, "src", "auth.ts"),
      buildAuthConfig(answers),
      { flag: "w" }
    );

    // worker.ts entry point (Hono)
    mkdirSync(join(cwd, "src"), { recursive: true });
    writeFileSync(join(cwd, "src", "worker.ts"), buildWorkerEntry());

    // package.json (if not exists)
    if (!existsSync(join(cwd, "package.json"))) {
      writeFileSync(
        join(cwd, "package.json"),
        buildPackageJson(answers.workerName)
      );
    }

    // tsconfig.json
    writeFileSync(join(cwd, "tsconfig.json"), buildTsConfig());

    // .env.example
    writeFileSync(join(cwd, ".env.example"), buildEnvExample(answers));

    // .gitignore
    if (!existsSync(join(cwd, ".gitignore"))) {
      writeFileSync(
        join(cwd, ".gitignore"),
        "node_modules/\ndist/\n.wrangler/\n.env\n.dev.vars\n"
      );
    }

    spinner.succeed("Project scaffolded");

    console.log(`
${chalk.bold("Next steps:")}

  1. Create your D1 database:
     ${chalk.cyan("npx wrangler d1 create gately-auth")}
     Then update the ${chalk.yellow("database_id")} in ${chalk.yellow("wrangler.toml")}

  2. Create your KV namespace:
     ${chalk.cyan("npx wrangler kv:namespace create AUTH_KV")}
     Then update the ${chalk.yellow("id")} in ${chalk.yellow("wrangler.toml")}

  3. Run migrations:
     ${chalk.cyan("npx gately-auth migrate --local")}

  4. Set your secrets:
     ${chalk.cyan("npx wrangler secret put GATELY_AUTH_SECRET")}
${answers.enableGatelyEmail ? `     ${chalk.cyan("npx wrangler secret put GATELY_API_KEY")}` : ""}

  5. Start dev server:
     ${chalk.cyan("npx wrangler dev")}
`);
  } catch (err) {
    spinner.fail("Scaffold failed");
    throw err;
  }
}

// ── File templates ────────────────────────────────────────────────────────────

function buildWranglerToml(workerName: string, appName: string): string {
  return `name = "${workerName}"
main = "src/worker.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
APP_NAME = "${appName}"
GATELY_AUTH_BASE_URL = "https://${workerName}.workers.dev"

# D1 database for user data
[[d1_databases]]
binding = "AUTH_DB"
database_name = "gately-auth"
database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"

# KV for tokens, OTPs, rate-limiting
[[kv_namespaces]]
binding = "AUTH_KV"
id = "REPLACE_WITH_YOUR_KV_NAMESPACE_ID"

# Secrets (set via: npx wrangler secret put GATELY_AUTH_SECRET)
# GATELY_AUTH_SECRET  — required: sign tokens and cookies
# GATELY_API_KEY      — required for Gately email plugin
# GOOGLE_CLIENT_ID    — optional: Google OAuth
# GOOGLE_CLIENT_SECRET
# GITHUB_CLIENT_ID    — optional: GitHub OAuth
# GITHUB_CLIENT_SECRET

[observability.logs]
enabled = true
`;
}

function buildAuthConfig(answers: Record<string, unknown>): string {
  const socialProviders: string[] = [];

  if (answers["enableGoogle"]) {
    socialProviders.push(`    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },`);
  }

  if (answers["enableGitHub"]) {
    socialProviders.push(`    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },`);
  }

  const gatelyEmailPlugin = answers["enableGatelyEmail"]
    ? `    // Gately email — transactional email with deliverability + tracking
    gatelyEmail({ apiKey: env.GATELY_API_KEY }),`
    : "";

  return `import { gatelyAuth } from '@gately/auth-core'
import { createD1Adapter } from '@gately/auth-core/adapters'
import { createKVStore } from '@gately/auth-core/adapters'
${answers["enableGatelyEmail"] ? "import { gatelyEmail } from '@gately/auth-core/plugins'" : ""}

export interface Env {
  AUTH_DB: D1Database
  AUTH_KV: KVNamespace
  APP_NAME: string
  GATELY_AUTH_BASE_URL: string
  GATELY_AUTH_SECRET: string
  ${answers["enableGatelyEmail"] ? "GATELY_API_KEY: string" : ""}
  ${answers["enableGoogle"] ? "GOOGLE_CLIENT_ID: string\n  GOOGLE_CLIENT_SECRET: string" : ""}
  ${answers["enableGitHub"] ? "GITHUB_CLIENT_ID: string\n  GITHUB_CLIENT_SECRET: string" : ""}
}

export function createAuth(env: Env) {
  return gatelyAuth({
    appName: env.APP_NAME,
    baseURL: env.GATELY_AUTH_BASE_URL,
    secret: env.GATELY_AUTH_SECRET,
    db: createD1Adapter(env.AUTH_DB),
    kv: createKVStore(env.AUTH_KV),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },

    ${socialProviders.length > 0 ? `socialProviders: {
${socialProviders.join("\n")}
    },` : ""}

    plugins: [
${gatelyEmailPlugin}
    ],

    session: {
      expiresIn: 60 * 60 * 24 * 7,   // 7 days
      updateAge: 60 * 60 * 24,         // refresh daily
      cookieCache: { enabled: true, maxAge: 300 },
    },

    rateLimit: {
      enabled: true,
    },

    trustedOrigins: [
      // Add your frontend origins here
      // "https://myapp.com",
      // "http://localhost:3000",
    ],
  })
}
`;
}

function buildWorkerEntry(): string {
  return `import { createAuth, type Env } from './auth'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const auth = createAuth(env)
    return auth.handler(request)
  },
} satisfies ExportedHandler<Env>
`;
}

function buildPackageJson(name: string): string {
  return JSON.stringify(
    {
      name,
      version: "0.0.1",
      private: true,
      type: "module",
      scripts: {
        dev: "wrangler dev",
        deploy: "wrangler deploy",
        migrate: "gately-auth migrate --remote",
        "migrate:local": "gately-auth migrate --local",
      },
      dependencies: {
        "@gately/auth-core": "^0.1.0",
      },
      devDependencies: {
        "@cloudflare/workers-types": "^4.0.0",
        "gately-auth": "^0.1.0",
        typescript: "^5.5.0",
        wrangler: "^3.0.0",
      },
    },
    null,
    2
  );
}

function buildTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        lib: ["ES2022"],
        types: ["@cloudflare/workers-types"],
        skipLibCheck: true,
        isolatedModules: true,
      },
    },
    null,
    2
  );
}

function buildEnvExample(answers: Record<string, unknown>): string {
  return `# gately-auth secrets
# Copy to .dev.vars for local development with Wrangler

GATELY_AUTH_SECRET=replace-with-a-strong-random-secret
${answers["enableGatelyEmail"] ? "GATELY_API_KEY=your-gately-api-key-here" : ""}
${answers["enableGoogle"] ? "GOOGLE_CLIENT_ID=your-google-client-id\nGOOGLE_CLIENT_SECRET=your-google-client-secret" : ""}
${answers["enableGitHub"] ? "GITHUB_CLIENT_ID=your-github-client-id\nGITHUB_CLIENT_SECRET=your-github-client-secret" : ""}
`;
}
