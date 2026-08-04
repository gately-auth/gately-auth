// ─────────────────────────────────────────────────────────────────────────────
// MCP Plugin — Model Context Protocol
//
// Exposes safe, standard JSON-RPC 2.0 endpoints so AI agents (Claude, GPT,
// custom Cloudflare Agents) can check session states and revoke tokens on
// behalf of users — without ever seeing passwords or secret keys.
//
// Endpoints mounted at:
//   POST /auth/mcp          — main JSON-RPC dispatcher
//   GET  /auth/mcp/manifest — MCP server manifest (tools list)
//
// All routes require either:
//   a) Authorization: Bearer <mcpSecret>   (preferred for agents)
//   b) A valid gately-auth session cookie  (fallback for user-scoped agents)
//
// Tools exposed:
//   inspect_session      — read session metadata for a token
//   revoke_session       — invalidate a single session token
//   revoke_all_sessions  — invalidate all sessions for a user
//   get_user             — read safe user profile fields
//   list_user_sessions   — list all active sessions for a user
// ─────────────────────────────────────────────────────────────────────────────

import type {
  GatelyAuthPlugin,
  AuthEndpointContext,
  Session,
  User,
} from "../types/index.js";
import { GatelyAuthError } from "../error.js";
import {
  getSessionByToken,
  revokeSession,
  revokeAllUserSessions,
  listUserSessions,
} from "../session.js";

// ── Config ────────────────────────────────────────────────────────────────────

export interface MCPPluginConfig {
  /**
   * Secret key required in the `Authorization: Bearer <mcpSecret>` header.
   * Keep this server-side only — MCP endpoints are agent-to-server only.
   *
   * If omitted, the plugin falls back to requiring a valid gately-auth
   * session from the caller (cookie or Bearer session token).
   */
  mcpSecret?: string;

  /**
   * Restrict which tools are available. Omit to expose all tools.
   */
  allowedTools?: MCPToolName[];

  /**
   * Server name reported in the MCP initialize/manifest response.
   * Default: "gately-auth"
   */
  serverName?: string;

  /**
   * Server version reported in the manifest.
   * Default: "1.0.0"
   */
  serverVersion?: string;
}

export type MCPToolName =
  | "inspect_session"
  | "revoke_session"
  | "revoke_all_sessions"
  | "get_user"
  | "list_user_sessions";

// ── JSON-RPC 2.0 wire types ───────────────────────────────────────────────────

interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

// JSON-RPC standard error codes
const RPC = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  UNAUTHORIZED: -32001,
  NOT_FOUND: -32002,
  FORBIDDEN: -32003,
} as const;

function rpcOk(id: string | number, result: unknown): Response {
  return Response.json({ jsonrpc: "2.0", id, result });
}

function rpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): Response {
  const status =
    code === RPC.UNAUTHORIZED || code === RPC.FORBIDDEN ? 401
    : code === RPC.NOT_FOUND ? 404
    : code === RPC.INVALID_PARAMS || code === RPC.INVALID_REQUEST ? 400
    : 200; // JSON-RPC errors normally return 200 per spec

  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code, message, ...(data !== undefined ? { data } : {}) },
    }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const ALL_TOOLS: MCPTool[] = [
  {
    name: "inspect_session",
    description:
      "Inspect a session token. Returns session metadata (expiry, IP, user agent, userId) without exposing secrets. Use this to check whether a session is still valid before acting on behalf of a user.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "The session token to inspect.",
        },
      },
      required: ["token"],
    },
  },
  {
    name: "revoke_session",
    description:
      "Revoke a single session token, immediately signing that session out. Use this when a user reports suspicious activity on a specific device.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "The session token to revoke.",
        },
      },
      required: ["token"],
    },
  },
  {
    name: "revoke_all_sessions",
    description:
      "Revoke every active session for a user, signing them out of all devices simultaneously. Use this for security incidents or account takeover responses.",
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The ID of the user whose sessions should all be revoked.",
        },
      },
      required: ["userId"],
    },
  },
  {
    name: "get_user",
    description:
      "Retrieve safe public profile fields for a user by their ID. Returns id, email, name, image, emailVerified, createdAt. Never returns passwords or tokens.",
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The ID of the user to look up.",
        },
      },
      required: ["userId"],
    },
  },
  {
    name: "list_user_sessions",
    description:
      "List all active sessions for a user. Returns session metadata (id, expiresAt, ipAddress, userAgent, createdAt) so an agent can present a device list to the user.",
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The ID of the user whose sessions to list.",
        },
      },
      required: ["userId"],
    },
  },
];

// ── Auth check ────────────────────────────────────────────────────────────────

/**
 * Returns true if the request carries a valid MCP secret or a valid
 * gately-auth session. Throws nothing — callers check the boolean.
 */
function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  if (header.startsWith("MCP-Key ")) return header.slice(8).trim();
  return null;
}

// ── Safe user projection ──────────────────────────────────────────────────────

function safeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

function safeSession(session: Session) {
  return {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    // token is intentionally omitted
  };
}

// ── Tool executor ─────────────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  params: Record<string, unknown>,
  ctx: AuthEndpointContext
): Promise<unknown> {
  const { db, kv, options } = ctx;

  switch (toolName) {
    case "inspect_session": {
      const token = params["token"];
      if (typeof token !== "string" || !token) {
        throw { code: RPC.INVALID_PARAMS, message: "token (string) is required" };
      }
      const authSession = await getSessionByToken(token, db, kv, options.session);
      if (!authSession) {
        throw { code: RPC.NOT_FOUND, message: "Session not found or expired" };
      }
      return {
        session: safeSession(authSession.session),
        user: safeUser(authSession.user),
        valid: true,
      };
    }

    case "revoke_session": {
      const token = params["token"];
      if (typeof token !== "string" || !token) {
        throw { code: RPC.INVALID_PARAMS, message: "token (string) is required" };
      }
      // Verify it exists before revoking so we can return a meaningful error
      const authSession = await getSessionByToken(token, db, kv, options.session);
      if (!authSession) {
        throw { code: RPC.NOT_FOUND, message: "Session not found or already expired" };
      }
      await revokeSession(token, db, kv);
      return { revoked: true, userId: authSession.user.id };
    }

    case "revoke_all_sessions": {
      const userId = params["userId"];
      if (typeof userId !== "string" || !userId) {
        throw { code: RPC.INVALID_PARAMS, message: "userId (string) is required" };
      }
      // Verify the user exists first
      const user = await db.findOne<User>({
        model: "user",
        where: [{ field: "id", value: userId }],
      });
      if (!user) {
        throw { code: RPC.NOT_FOUND, message: "User not found" };
      }
      await revokeAllUserSessions(userId, db);
      return { revoked: true, userId };
    }

    case "get_user": {
      const userId = params["userId"];
      if (typeof userId !== "string" || !userId) {
        throw { code: RPC.INVALID_PARAMS, message: "userId (string) is required" };
      }
      const user = await db.findOne<User>({
        model: "user",
        where: [{ field: "id", value: userId }],
      });
      if (!user) {
        throw { code: RPC.NOT_FOUND, message: "User not found" };
      }
      return { user: safeUser(user) };
    }

    case "list_user_sessions": {
      const userId = params["userId"];
      if (typeof userId !== "string" || !userId) {
        throw { code: RPC.INVALID_PARAMS, message: "userId (string) is required" };
      }
      const user = await db.findOne<User>({
        model: "user",
        where: [{ field: "id", value: userId }],
      });
      if (!user) {
        throw { code: RPC.NOT_FOUND, message: "User not found" };
      }
      const sessions = await listUserSessions(userId, db);
      return {
        sessions: sessions.map(safeSession),
        count: sessions.length,
      };
    }

    default:
      throw { code: RPC.METHOD_NOT_FOUND, message: `Unknown tool: ${toolName}` };
  }
}

// ── Plugin factory ────────────────────────────────────────────────────────────

/**
 * MCP Plugin
 *
 * Exposes a Model Context Protocol server so AI agents can securely inspect
 * and manage auth sessions on behalf of users.
 *
 * Endpoints:
 *   GET  /auth/mcp/manifest   — MCP server manifest with tool definitions
 *   POST /auth/mcp            — JSON-RPC 2.0 dispatcher for tool calls
 *
 * Authentication (checked in order):
 *   1. `Authorization: Bearer <mcpSecret>` — set mcpSecret in config for agents
 *   2. Valid gately-auth session cookie/token — fallback for user-scoped agents
 *
 * @example
 * ```ts
 * import { gatelyAuth } from "@gately/auth-core"
 * import { mcpPlugin } from "@gately/auth-core/plugins"
 *
 * const auth = gatelyAuth({
 *   plugins: [
 *     mcpPlugin({
 *       mcpSecret: env.MCP_SECRET,
 *       allowedTools: ["inspect_session", "revoke_session"],
 *     }),
 *   ],
 * })
 * ```
 *
 * @example Agent tool call (JSON-RPC 2.0)
 * ```json
 * POST /auth/mcp
 * Authorization: Bearer <MCP_SECRET>
 * Content-Type: application/json
 *
 * {
 *   "jsonrpc": "2.0",
 *   "id": 1,
 *   "method": "tools/call",
 *   "params": {
 *     "name": "inspect_session",
 *     "arguments": { "token": "<session-token>" }
 *   }
 * }
 * ```
 */
export function mcpPlugin(config: MCPPluginConfig = {}): GatelyAuthPlugin {
  const serverName = config.serverName ?? "gately-auth";
  const serverVersion = config.serverVersion ?? "1.0.0";

  // Filter tools to only those allowed by config
  const availableTools = config.allowedTools
    ? ALL_TOOLS.filter((t) => config.allowedTools!.includes(t.name as MCPToolName))
    : ALL_TOOLS;

  // ── Auth guard ──────────────────────────────────────────────────────────────

  async function authenticate(ctx: AuthEndpointContext): Promise<void> {
    const incomingToken = extractBearerToken(ctx.request);

    // 1. Check MCP secret if configured
    if (config.mcpSecret) {
      if (incomingToken === config.mcpSecret) return; // ✓ valid agent key
      // Fall through and also check for a valid session below
    }

    // 2. Fall back to an active gately-auth session
    if (ctx.session) return; // ✓ caller has a valid user session

    // 3. Nothing matched
    throw new GatelyAuthError("UNAUTHORIZED", "MCP: provide a valid Authorization header or session cookie");
  }

  return {
    id: "mcp",
    name: "MCP",

    // ── Endpoints ─────────────────────────────────────────────────────────────

    endpoints: {
      // ── GET /auth/mcp/manifest ─────────────────────────────────────────────
      "/mcp/manifest": async (ctx) => {
        if (ctx.request.method !== "GET") {
          throw new GatelyAuthError("METHOD_NOT_ALLOWED");
        }

        await authenticate(ctx);

        const manifest = {
          schema_version: "v1",
          name: serverName,
          version: serverVersion,
          description: "Auth session management tools for AI agents",
          tools: availableTools,
        };

        return Response.json(manifest);
      },

      // ── POST /auth/mcp — JSON-RPC 2.0 dispatcher ──────────────────────────
      "/mcp": async (ctx) => {
        if (ctx.request.method !== "POST") {
          throw new GatelyAuthError("METHOD_NOT_ALLOWED");
        }

        // Parse body
        let rpc: MCPRequest;
        try {
          rpc = await ctx.request.json() as MCPRequest;
        } catch {
          return rpcError(null, RPC.PARSE_ERROR, "Invalid JSON");
        }

        // Validate JSON-RPC envelope
        if (rpc.jsonrpc !== "2.0" || typeof rpc.method !== "string" || rpc.id == null) {
          return rpcError(rpc.id ?? null, RPC.INVALID_REQUEST, "Invalid JSON-RPC 2.0 request");
        }

        // Auth check
        try {
          await authenticate(ctx);
        } catch {
          return rpcError(rpc.id, RPC.UNAUTHORIZED, "Authentication required");
        }

        const { id, method, params = {} } = rpc;

        // ── MCP lifecycle methods ────────────────────────────────────────────

        // initialize — agent handshake, return server capabilities
        if (method === "initialize") {
          return rpcOk(id, {
            protocolVersion: "2024-11-05",
            serverInfo: { name: serverName, version: serverVersion },
            capabilities: { tools: {} },
          });
        }

        // notifications/initialized — no-op acknowledgement
        if (method === "notifications/initialized") {
          return rpcOk(id, {});
        }

        // tools/list — return available tool definitions
        if (method === "tools/list") {
          return rpcOk(id, { tools: availableTools });
        }

        // tools/call — execute a tool
        if (method === "tools/call") {
          const toolName = params["name"];
          const args = (params["arguments"] ?? {}) as Record<string, unknown>;

          if (typeof toolName !== "string" || !toolName) {
            return rpcError(id, RPC.INVALID_PARAMS, "params.name (string) is required");
          }

          // Check the tool is available
          const toolDef = availableTools.find((t) => t.name === toolName);
          if (!toolDef) {
            return rpcError(
              id,
              RPC.METHOD_NOT_FOUND,
              `Tool "${toolName}" not found. Available: ${availableTools.map((t) => t.name).join(", ")}`
            );
          }

          try {
            const result = await executeTool(toolName, args, ctx);
            // MCP tools/call wraps result in a content array
            return rpcOk(id, {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
              isError: false,
            });
          } catch (err) {
            // Typed application errors from executeTool
            if (
              err &&
              typeof err === "object" &&
              "code" in err &&
              "message" in err
            ) {
              const appErr = err as { code: number; message: string };
              return rpcOk(id, {
                content: [{ type: "text", text: appErr.message }],
                isError: true,
              });
            }
            // Unexpected errors
            return rpcError(id, RPC.INTERNAL_ERROR, "Internal error executing tool");
          }
        }

        // Unknown method
        return rpcError(id, RPC.METHOD_NOT_FOUND, `Method "${method}" not supported`);
      },
    },
  };
}
