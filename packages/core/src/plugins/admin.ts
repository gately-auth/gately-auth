// ─────────────────────────────────────────────────────────────────────────────
// Admin Plugin
// Adds protected admin endpoints for user management.
// All routes require the X-Admin-Key header matching adminSecret.
// ─────────────────────────────────────────────────────────────────────────────

import type { GatelyAuthPlugin, User } from "../types/index.js";
import { GatelyAuthError } from "../error.js";

export interface AdminPluginConfig {
  /**
   * Secret key required in X-Admin-Key header for all admin routes.
   * Keep this out of client-side code — admin endpoints are server-to-server only.
   */
  adminSecret: string;
  /**
   * Default page size for list endpoints (default: 50, max: 200).
   */
  defaultPageSize?: number;
}

function requireAdminKey(request: Request, adminSecret: string): void {
  const provided = request.headers.get("X-Admin-Key");
  if (!provided || provided !== adminSecret) {
    throw new GatelyAuthError("UNAUTHORIZED", "Invalid or missing X-Admin-Key header");
  }
}

/**
 * Admin Plugin
 *
 * Adds the following endpoints under /auth/admin:
 *
 *   GET    /auth/admin/users              — paginated user list
 *   GET    /auth/admin/users/:id          — get user by ID
 *   PATCH  /auth/admin/users/:id          — update user fields
 *   DELETE /auth/admin/users/:id          — delete user and all their sessions
 *   POST   /auth/admin/users/:id/ban      — set accountDisabled = true
 *   POST   /auth/admin/users/:id/unban    — set accountDisabled = false
 *   DELETE /auth/admin/users/:id/sessions — revoke all sessions for a user
 *
 * All routes require the X-Admin-Key: <adminSecret> header.
 *
 * @example
 * ```ts
 * import { gatelyAuth } from '@gately/auth-core'
 * import { adminPlugin } from '@gately/auth-core/plugins'
 *
 * const auth = gatelyAuth({
 *   plugins: [
 *     adminPlugin({ adminSecret: env.ADMIN_SECRET }),
 *   ],
 * })
 * ```
 */
export function adminPlugin(config: AdminPluginConfig): GatelyAuthPlugin {
  const pageSize = Math.min(config.defaultPageSize ?? 50, 200);

  return {
    id: "admin",
    name: "Admin",

    // Add accountDisabled field to the user schema
    schema: {
      user: {
        fields: {
          accountDisabled: {
            type: "boolean",
            required: false,
            defaultValue: false,
            input: false,
          },
        },
      },
    },

    endpoints: {
      // ── GET /auth/admin/users ─────────────────────────────────────────────
      "/admin/users": async ({ request, url, db }) => {
        if (request.method !== "GET") {
          throw new GatelyAuthError("METHOD_NOT_ALLOWED");
        }
        requireAdminKey(request, config.adminSecret);

        const limit = Math.min(
          parseInt(url.searchParams.get("limit") ?? String(pageSize), 10),
          200
        );
        const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

        const users = await db.findMany<User>({
          model: "user",
          limit,
          offset,
          orderBy: { field: "createdAt", direction: "desc" },
        });

        const total = await db.count({ model: "user" });

        return Response.json({ users, total, limit, offset });
      },

      // ── /auth/admin/users/:id — get, patch, delete ───────────────────────
      "/admin/users/:id": async ({ request, url, db }) => {
        requireAdminKey(request, config.adminSecret);

        // Extract :id from the URL path segment after /admin/users/
        const segments = url.pathname.split("/");
        const idIndex = segments.findIndex((s) => s === "users") + 1;
        const userId = segments[idIndex];

        if (!userId) throw new GatelyAuthError("BAD_REQUEST", "User ID required");

        // ── GET ─────────────────────────────────────────────────────────────
        if (request.method === "GET") {
          const user = await db.findOne<User>({
            model: "user",
            where: [{ field: "id", value: userId }],
          });
          if (!user) throw new GatelyAuthError("USER_NOT_FOUND");
          return Response.json({ user });
        }

        // ── PATCH ────────────────────────────────────────────────────────────
        if (request.method === "PATCH") {
          let body: Record<string, unknown>;
          try {
            body = await request.json() as Record<string, unknown>;
          } catch {
            throw new GatelyAuthError("BAD_REQUEST", "Invalid JSON body");
          }

          // Only allow safe fields to be updated by admin
          const allowed: (keyof User)[] = ["name", "image", "emailVerified"];
          const data: Record<string, unknown> = {};
          for (const key of allowed) {
            if (key in body) data[key] = body[key];
          }

          const user = await db.update<User>({
            model: "user",
            where: [{ field: "id", value: userId }],
            data,
          });

          if (!user) throw new GatelyAuthError("USER_NOT_FOUND");
          return Response.json({ user });
        }

        // ── DELETE ───────────────────────────────────────────────────────────
        if (request.method === "DELETE") {
          const user = await db.findOne<User>({
            model: "user",
            where: [{ field: "id", value: userId }],
          });
          if (!user) throw new GatelyAuthError("USER_NOT_FOUND");

          // Delete all sessions first
          await db.delete({ model: "session", where: [{ field: "userId", value: userId }] });
          // Delete accounts (OAuth links)
          await db.delete({ model: "account", where: [{ field: "userId", value: userId }] });
          // Delete user
          await db.delete({ model: "user", where: [{ field: "id", value: userId }] });

          return Response.json({ success: true });
        }

        throw new GatelyAuthError("METHOD_NOT_ALLOWED");
      },

      // ── POST /auth/admin/users/:id/ban ───────────────────────────────────
      "/admin/users/:id/ban": async ({ request, url, db }) => {
        if (request.method !== "POST") throw new GatelyAuthError("METHOD_NOT_ALLOWED");
        requireAdminKey(request, config.adminSecret);

        const segments = url.pathname.split("/");
        const idIndex = segments.findIndex((s) => s === "users") + 1;
        const userId = segments[idIndex];
        if (!userId) throw new GatelyAuthError("BAD_REQUEST", "User ID required");

        const user = await db.update<User>({
          model: "user",
          where: [{ field: "id", value: userId }],
          data: { accountDisabled: true },
        });

        if (!user) throw new GatelyAuthError("USER_NOT_FOUND");

        // Revoke all active sessions immediately
        await db.delete({ model: "session", where: [{ field: "userId", value: userId }] });

        return Response.json({ success: true, user });
      },

      // ── POST /auth/admin/users/:id/unban ─────────────────────────────────
      "/admin/users/:id/unban": async ({ request, url, db }) => {
        if (request.method !== "POST") throw new GatelyAuthError("METHOD_NOT_ALLOWED");
        requireAdminKey(request, config.adminSecret);

        const segments = url.pathname.split("/");
        const idIndex = segments.findIndex((s) => s === "users") + 1;
        const userId = segments[idIndex];
        if (!userId) throw new GatelyAuthError("BAD_REQUEST", "User ID required");

        const user = await db.update<User>({
          model: "user",
          where: [{ field: "id", value: userId }],
          data: { accountDisabled: false },
        });

        if (!user) throw new GatelyAuthError("USER_NOT_FOUND");
        return Response.json({ success: true, user });
      },

      // ── DELETE /auth/admin/users/:id/sessions ─────────────────────────────
      "/admin/users/:id/sessions": async ({ request, url, db }) => {
        if (request.method !== "DELETE") throw new GatelyAuthError("METHOD_NOT_ALLOWED");
        requireAdminKey(request, config.adminSecret);

        const segments = url.pathname.split("/");
        const idIndex = segments.findIndex((s) => s === "users") + 1;
        const userId = segments[idIndex];
        if (!userId) throw new GatelyAuthError("BAD_REQUEST", "User ID required");

        await db.delete({ model: "session", where: [{ field: "userId", value: userId }] });
        return Response.json({ success: true });
      },
    },
  };
}
