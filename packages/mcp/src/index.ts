// ─────────────────────────────────────────────────────────────────────────────
// Gately Auth MCP Server
// Hosted at /mcp — exposes gately-auth docs to MCP-capable AI clients.
//
// Implements the Model Context Protocol over HTTP with SSE transport.
// Compatible with: Cursor, Claude Code, Open Code, Kiro, and any MCP client.
//
// Endpoint: https://mcp.g-a.usegately.com/mcp
// ─────────────────────────────────────────────────────────────────────────────

import { tools, callTool } from './tools.js';
import { mcpOk, mcpError, SERVER_INFO, CAPABILITIES, type MCPRequest } from './mcp.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Max-Age': '86400',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function handleMCP(request: Request): Promise<Response> {
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  // SSE endpoint — clients connect here for streaming
  if (request.method === 'GET') {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Send the endpoint event immediately
    const endpointEvent = `event: endpoint\ndata: ${JSON.stringify({ uri: '/mcp' })}\n\n`;
    writer.write(encoder.encode(endpointEvent)).catch(() => {});

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...CORS,
      },
    });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: MCPRequest;
  try {
    body = await request.json() as MCPRequest;
  } catch {
    return json(mcpError(null, -32700, 'Parse error'), 400);
  }

  const { id, method, params } = body;

  // ── MCP method dispatch ───────────────────────────────────────────────────

  switch (method) {
    // Handshake
    case 'initialize': {
      return json(mcpOk(id, {
        protocolVersion: '2024-11-05',
        serverInfo: SERVER_INFO,
        capabilities: CAPABILITIES,
      }));
    }

    case 'initialized': {
      return json(mcpOk(id, {}));
    }

    case 'ping': {
      return json(mcpOk(id, {}));
    }

    // List available tools
    case 'tools/list': {
      return json(mcpOk(id, { tools }));
    }

    // Call a tool
    case 'tools/call': {
      const toolName = String((params as any)?.name ?? '');
      const toolArgs = ((params as any)?.arguments ?? {}) as Record<string, unknown>;

      const tool = tools.find(t => t.name === toolName);
      if (!tool) {
        return json(mcpError(id, -32602, `Tool not found: ${toolName}`));
      }

      try {
        const result = callTool(toolName, toolArgs);
        return json(mcpOk(id, {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        }));
      } catch (err) {
        return json(mcpError(id, -32603, String(err)));
      }
    }

    // Resources (not implemented — return empty)
    case 'resources/list': {
      return json(mcpOk(id, { resources: [] }));
    }

    case 'prompts/list': {
      return json(mcpOk(id, {
        prompts: [
          {
            name: 'setup_gately_auth',
            description: 'Scaffold a complete gately-auth Cloudflare Worker project',
            arguments: [
              { name: 'framework', description: 'Worker framework (hono or plain)', required: false },
            ],
          },
        ],
      }));
    }

    case 'prompts/get': {
      const promptName = String((params as any)?.name ?? '');
      if (promptName === 'setup_gately_auth') {
        const framework = String((params as any)?.arguments?.framework ?? 'plain');
        return json(mcpOk(id, {
          description: 'Set up gately-auth in a Cloudflare Worker',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Set up gately-auth in this Cloudflare Worker project using ${framework}. Install @gately/auth-core and @gately/auth-client. Create src/auth.ts with gatelyAuth() configured with createD1Adapter(env.AUTH_DB), createKVStore(env.AUTH_KV), gatelyEmail plugin, and emailAndPassword enabled. Mount auth.handler(request) on all /auth/* routes. Add D1 and KV bindings to wrangler.toml. Run gately-auth migrate --local to apply the schema.`,
              },
            },
          ],
        }));
      }
      return json(mcpError(id, -32602, `Prompt not found: ${promptName}`));
    }

    default: {
      return json(mcpError(id, -32601, `Method not found: ${method}`));
    }
  }
}

// ── Worker entry ──────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return json({ ok: true, server: SERVER_INFO });
    }

    // MCP endpoint
    if (url.pathname === '/mcp') {
      return handleMCP(request);
    }

    // Info page
    if (url.pathname === '/') {
      return new Response(
        JSON.stringify({
          name: 'Gately Auth MCP Server',
          version: SERVER_INFO.version,
          description: 'Connect your AI editor or agent to gately-auth documentation.',
          endpoint: '/mcp',
          tools: tools.map(t => ({ name: t.name, description: t.description })),
          usage: {
            cursor: 'Add to ~/.cursor/mcp.json: { "gately-auth": { "url": "https://mcp.g-a.usegately.com/mcp" } }',
            claude_code: 'claude mcp add gately-auth https://mcp.g-a.usegately.com/mcp',
            manual: 'Use URL transport with endpoint: https://mcp.g-a.usegately.com/mcp',
          },
        }, null, 2),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...CORS },
        }
      );
    }

    return json({ error: 'Not found' }, 404);
  },
};
