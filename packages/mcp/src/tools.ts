// ─────────────────────────────────────────────────────────────────────────────
// MCP Tools — what AI agents can call
// ─────────────────────────────────────────────────────────────────────────────

import type { MCPTool } from './mcp.js';
import { searchDocs, getDoc, getDocsByCategory, listCategories, getDocs } from './docs.js';

export const tools: MCPTool[] = [
  {
    name: 'search_docs',
    description: 'Search the gately-auth documentation. Use this to find information about any feature, API, configuration option, or concept.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query — e.g. "magic links", "OAuth Google", "session management", "install", "React hooks"',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (default 5, max 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_doc',
    description: 'Get the full content of a documentation article by its slug. Use list_docs first to discover available slugs.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Article slug, e.g. "quick-start", "email-password", "react-hooks", "cli-overview"',
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
          description: 'Optional category filter: "Getting Started", "Core Concepts", "Auth Methods", "Client SDK", "CLI", "Plugins", "API Reference", "Integrations", "Deployment"',
        },
      },
    },
  },
  {
    name: 'get_quickstart',
    description: 'Get a complete, copy-paste ready quick start guide for setting up gately-auth in a Cloudflare Worker.',
    inputSchema: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          description: 'Target framework',
          enum: ['hono', 'plain', 'nextjs'],
        },
      },
    },
  },
  {
    name: 'get_install_command',
    description: 'Get the correct install command for gately-auth packages.',
    inputSchema: {
      type: 'object',
      properties: {
        package_manager: {
          type: 'string',
          description: 'Package manager',
          enum: ['npm', 'pnpm', 'yarn', 'bun'],
        },
        packages: {
          type: 'string',
          description: 'Which packages: "all", "core", "client", "cli"',
          enum: ['all', 'core', 'client', 'cli'],
        },
      },
    },
  },
  {
    name: 'get_all_docs',
    description: 'Fetch the complete documentation as a single text file from auth.usegately.com/articles.txt. Use this when you need full context to answer a broad question about gately-auth.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {

    case 'search_docs': {
      const query = String(args.query ?? '');
      const limit = Math.min(Number(args.limit ?? 5), 10);
      const results = await searchDocs(query, limit);
      if (results.length === 0) {
        return {
          found: false,
          message: `No docs found for "${query}". Try: "install", "session", "email", "oauth", "plugin", "react", "cli".`,
          suggestions: ['quick-start', 'installation', 'email-password', 'react-hooks'],
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
          excerpt: d.content.slice(0, 400) + (d.content.length > 400 ? '...' : ''),
        })),
      };
    }

    case 'get_doc': {
      const id = String(args.id ?? '');
      const doc = await getDoc(id);
      if (!doc) {
        const all = await getDocs();
        return {
          found: false,
          message: `Article "${id}" not found.`,
          available_ids: all.map(d => d.id),
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
      const list = category ? await getDocsByCategory(category) : await getDocs();
      const categories = await listCategories();
      return {
        total: list.length,
        categories,
        articles: list.map(d => ({
          id: d.id,
          title: d.title,
          category: d.category,
          url: d.url,
        })),
      };
    }

    case 'get_all_docs': {
      // Proxy the raw articles.txt so agents get the full unprocessed content
      try {
        const res = await fetch('https://auth.usegately.com/articles.txt', {
          headers: { 'User-Agent': 'gately-auth-mcp/1.0' },
        });
        const text = await res.text();
        return { content: text, source: 'https://auth.usegately.com/articles.txt' };
      } catch (err) {
        return { error: 'Failed to fetch full docs', detail: String(err) };
      }
    }

    case 'get_quickstart': {
      const framework = String(args.framework ?? 'plain');

      const workerCode = framework === 'hono'
        ? `import { Hono } from 'hono';
import { createAuth, type Env } from './auth';

const app = new Hono<{ Bindings: Env }>();

app.all('/auth/*', (c) => createAuth(c.env).handler(c.req.raw));

app.get('/api/me', async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.requireSession(c.req.raw);
  return c.json(session.user);
});

export default app;`
        : framework === 'nextjs'
        ? `// middleware.ts
import { getSessionCookie } from '@gately/auth-client';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const cookie = getSessionCookie(req.headers.get('cookie') ?? '');
  if (!cookie) return NextResponse.redirect(new URL('/sign-in', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };`
        : `import { createAuth, type Env } from './auth';

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return createAuth(env).handler(request);
  },
} satisfies ExportedHandler<Env>;`;

      return {
        framework,
        steps: [
          { step: 1, title: 'Install', command: 'npm install @gately/auth-core @gately/auth-client' },
          { step: 2, title: 'Create D1 database', command: 'npx wrangler d1 create auth-db' },
          { step: 3, title: 'Create KV namespace', command: 'npx wrangler kv namespace create AUTH_KV' },
          {
            step: 4, title: 'src/auth.ts',
            code: `import { gatelyAuth } from '@gately/auth-core';
import { createD1Adapter, createKVStore } from '@gately/auth-core/adapters';
import { gatelyEmail } from '@gately/auth-core/plugins';

export interface Env {
  AUTH_DB: D1Database;
  AUTH_KV: KVNamespace;
  AUTH_SECRET: string;
  GATELY_API_KEY: string;
  BASE_URL: string;
}

export function createAuth(env: Env) {
  return gatelyAuth({
    appName: 'My App',
    baseURL: env.BASE_URL,
    secret: env.AUTH_SECRET,
    db: createD1Adapter(env.AUTH_DB),
    kv: createKVStore(env.AUTH_KV),
    emailAndPassword: { enabled: true },
    plugins: [gatelyEmail({ apiKey: env.GATELY_API_KEY })],
  });
}`,
          },
          { step: 5, title: `src/${framework === 'hono' ? 'index' : 'worker'}.ts`, code: workerCode },
          { step: 6, title: 'Set secrets', command: 'npx wrangler secret put AUTH_SECRET\nnpx wrangler secret put GATELY_API_KEY' },
          { step: 7, title: 'Run migrations', command: 'npx @gately/auth-cli migrate --local' },
          { step: 8, title: 'Dev server', command: 'npx wrangler dev' },
        ],
        docs_url: 'https://auth.usegately.com/article/quick-start',
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
      const pmMap: Record<string, string> = { npm: 'npm install', pnpm: 'pnpm add', yarn: 'yarn add', bun: 'bun add' };
      const packages = packageMap[pkgs] ?? packageMap.core;
      const cmd = pmMap[pm] ?? 'npm install';
      return {
        command: `${cmd} ${packages.join(' ')}`,
        global_cli: `${cmd} -g @gately/auth-cli`,
        npm_url: `https://www.npmjs.com/package/${packages[0]}`,
        docs_url: 'https://auth.usegately.com/article/installation',
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
