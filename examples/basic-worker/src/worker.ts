// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare Worker entry point
// Mounts gately-auth at /auth/* — everything else is your app
// ─────────────────────────────────────────────────────────────────────────────

import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth, type Env } from "./auth.js";

const app = new Hono<{ Bindings: Env }>();

// ── CORS ──────────────────────────────────────────────────────────────────────
// gately-auth handles its own CORS internally, but Hono routes also need it

app.use(
  "*",
  cors({
    origin: (origin) => origin, // mirror origin (gately-auth validates trusted origins)
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// ── Mount gately-auth at /auth/* ──────────────────────────────────────────────

app.all("/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// ── Example: protected API endpoint ──────────────────────────────────────────

app.get("/api/me", async (c) => {
  const auth = createAuth(c.env);

  const session = await auth.api.getSession(c.req.raw);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({
    user: session.user,
    session: {
      id: session.session.id,
      expiresAt: session.session.expiresAt,
    },
  });
});

// ── Example: admin-only endpoint ─────────────────────────────────────────────

app.get("/api/admin", async (c) => {
  const auth = createAuth(c.env);

  let session;
  try {
    session = await auth.api.requireSession(c.req.raw);
  } catch {
    return c.json({ error: "Authentication required" }, 401);
  }

  // Add your own role check here
  // if (session.user.role !== "admin") return c.json({ error: "Forbidden" }, 403);

  return c.json({ message: "Welcome, admin!", userId: session.user.id });
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/", (c) =>
  c.json({
    service: "gately-auth example",
    auth: "/auth",
    docs: "https://gately-auth.dev",
  })
);

// ── Export ────────────────────────────────────────────────────────────────────

export default app;
