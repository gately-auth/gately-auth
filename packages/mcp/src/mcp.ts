// ─────────────────────────────────────────────────────────────────────────────
// MCP Protocol implementation (HTTP + SSE transport)
// Implements the Model Context Protocol spec for tool calling.
// ─────────────────────────────────────────────────────────────────────────────

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export function mcpOk(id: string | number | null, result: unknown): MCPResponse {
  return { jsonrpc: '2.0', id, result };
}

export function mcpError(
  id: string | number | null,
  code: number,
  message: string
): MCPResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

export const SERVER_INFO = {
  name: 'gately-auth-docs',
  version: '0.1.0',
};

export const CAPABILITIES = {
  tools: {},
};
