// ─────────────────────────────────────────────────────────────────────────────
// MCP Tools — what AI agents can call
// ─────────────────────────────────────────────────────────────────────────────

import type { MCPTool } from './mcp.js';
import { searchDocs, getDoc, getDocsByCategory, listCategories, docs } from './docs.js';

export const tools: MCPTool[] = [
  {
    name: 'search_docs',
    description: 'Search the gately-auth documentation. Use this to find information about any gately-auth feature, API, configuration option, or concept.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query — e.g. "magic links", "session management", "install", "OAuth Google"',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5, max: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_doc',
    description: 'Get the full content of a specific documentation article by its ID or slug.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The article ID or slug, e.g. "quick-start", "email-password", "cli-overview"',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_docs',
    description: 'List all available documentation articles, optionally filtered by category.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional category filter. Categories: Getting Started, Core Concepts, Auth Methods, Client SDK, CLI, Plugins, API Reference, Deployment',
        },
      },
    },
  },
  {
    name: 'get_quickstart',
    description: 'Get a complete quick start guide for setting up gately-auth in a Cloudflare Worker project.',
    inputSchema: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          description: 'Optional framework — "hono", "plain", "nextjs"',
          enum: ['hono', 'plain', 'nextjs'],
        },
      },
    },
  },
  {
    name: 'get_install_command',
    description: 'Get the install command for gately-auth packages.',
    inputSchema: {
      type: 'object',
      properties: {
        package_manager: {
          type: 'string',
          description: 'Package manager to use',
          enum: ['npm', 'pnpm', 'yarn', 'bun'],
        },
        packages: {
          type: 'string',
          description: 'Which packages to install: "all", "core", "client", "cli"',
          enum: ['all', 'core', 'client', 'cli'],
        },
      },
    },
  },
];

export function callTool(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case 'search_docs': {
      const query = String(args.query ?? '');
      const limit = Math.min(Number(args.limit ?? 5), 10);
      const results = searchDocs(query, limit);
      if (results.length === 0) {
        return {
          found: false,
          message: `No documentation found for "${query}". Try broader terms like "install", "session", "email", "oauth", or "plugin".`,
          suggestions: ['quick-start', 'installation', 'configuration', 'email-password'],
        };
      }
      return {
        found: true,
        count: results.length,
        results: results.map(d => ({
          id: d.id,
          title: d.title,
          category: d.category,
          url: d.url,
          excerpt: d.content.slice(0, 300) + '...',
        })),
      };
    }

    case 'get_doc': {
      const id = String(args.id ?? '');
      const doc = getDoc(id);
      if (!doc) {
        const available = docs.map(d => d.id).join(', ');
        return {
          found: false,
          message: `Article "${id}" not found.`,
          available_ids: available,
        };
      }
      return {
        found: true,
        id: doc.id,
        title: doc.title,
        category: doc.category,
        url: doc.url,
        content: doc.content,
        tags: doc.tags,
      };
    }

    case 'list_docs': {
      const category = args.category ? String(args.category) : undefined;
      const list = category ? getDocsByCategory(category) : docs;
      const categories = listCategories();
      return {
        total: list.length,
        categories,
        articles: list.map(d => ({
          id: d.id,
          title: d.title,
          category: d.category,
          url: d.url,
          tags: d.tags,
        })),
      };
    }

    case 'get_quickstart': {
      const framework = String(args.framework ?? 'plain');
      const workerCode = framework === 'hono'
        ? `import { Hono } from 'hono'
import { createAuth, type Env } from './auth'

const app = new Hono<{ Bindings: Env }>()

app.all('/auth/*', async (c) => {
  const auth = createAuth(c.env)
  return auth.handler(c.req.raw)
})

export default app`
        : `import { createAuth, type Env } from './auth'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const auth = createAuth(env)
    return auth.handler(request)
  }
}`;

      return {
        steps: [
          {
            step: 1,
            title: 'Install packages',
            command: 'npm install @gately/auth-core @gately/auth-client',
          },
          {
            step: 2,
            title: 'Create D1 database',
            command: 'npx wrangler d1 create auth-db',
          },
          {
            step: 3,
            title: 'Create KV namespace',
            command: 'npx wrangler kv namespace create AUTH_KV',
          },
          {
            step: 4,
            title: 'Create src/auth.ts',
            code: `import { gatelyAuth } from '@gately/auth-core'
import { createD1Adapter, createKVStore } from '@gately/auth-core/adapters'
import { gatelyEmail } from '@gately/auth-core/plugins'

export interface Env {
  AUTH_DB: D1Database
  AUTH_KV: KVNamespace
  AUTH_SECRET: string
  GATELY_API_KEY: string
}

export function createAuth(env: Env) {
  return gatelyAuth({
    appName: 'My App',
    secret: env.AUTH_SECRET,
    db: createD1Adapter(env.AUTH_DB),
    kv: createKVStore(env.AUTH_KV),
    emailAndPassword: { enabled: true },
    plugins: [gatelyEmail({ apiKey: env.GATELY_API_KEY })],
  })
}`,
          },
          {
            step: 5,
            title: `Create src/${framework === 'hono' ? 'index' : 'worker'}.ts`,
            code: workerCode,
          },
          {
            step: 6,
            title: 'Run migrations',
            command: 'gately-auth migrate --local',
          },
          {
            step: 7,
            title: 'Start dev server',
            command: 'npx wrangler dev',
          },
        ],
        docs_url: 'https://g-a.usegately.com/article/quick-start',
      };
    }

    case 'get_install_command': {
      const pm = String(args.package_manager ?? 'npm');
      const pkgs = String(args.packages ?? 'core');

      const packageMap: Record<string, string[]> = {
        all: ['@gately/auth-core', '@gately/auth-client'],
        core: ['@gately/auth-core'],
        client: ['@gately/auth-client'],
        cli: ['@gately/auth-cli'],
      };

      const pmMap: Record<string, string> = {
        npm: 'npm install',
        pnpm: 'pnpm add',
        yarn: 'yarn add',
        bun: 'bun add',
      };

      const packages = packageMap[pkgs] ?? packageMap.core;
      const cmd = pmMap[pm] ?? 'npm install';
      const command = `${cmd} ${packages.join(' ')}`;

      const globalCli = pm === 'npm'
        ? 'npm install -g @gately/auth-cli'
        : pm === 'pnpm'
        ? 'pnpm add -g @gately/auth-cli'
        : `${cmd} -g @gately/auth-cli`;

      return {
        command,
        global_cli: globalCli,
        npm_url: `https://www.npmjs.com/package/${packages[0]}`,
        docs_url: 'https://g-a.usegately.com/article/installation',
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
