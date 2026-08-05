// ─────────────────────────────────────────────────────────────────────────────
// Next.js middleware — edge-compatible session check
// Uses getSessionCookie() — reads the signed cookie without a DB call.
// ⚠️  This is an optimistic check. Always validate with auth.api.getSession()
//     on the server for any data-mutating operations.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "@gately/auth-client";

// Routes that require authentication
const PROTECTED = ["/dashboard", "/profile", "/settings", "/api/protected"];

// Routes that redirect to dashboard if already signed in
const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the session cookie (signed — tamper-proof, no DB needed)
  const sessionToken = await getSessionCookie(request, {
    secret: process.env.GATELY_AUTH_SECRET ?? "",
    cookiePrefix: "ga",
  });

  const isAuthenticated = Boolean(sessionToken);

  // Redirect unauthenticated users away from protected routes
  if (!isAuthenticated && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("callbackURL", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthenticated && AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public files
     * - auth Worker proxy
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
