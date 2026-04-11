import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { CAMPTI_SESSION_COOKIE } from "@/lib/campti-session";
import { isAdminAuthConfigured, verifyAdminSessionFromCookieHeader } from "@/lib/admin-session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    isAdminAuthConfigured()
  ) {
    if (pathname.startsWith("/admin/login") || pathname.startsWith("/api/admin/auth/")) {
      return continueWithReaderCookie(request);
    }
    const cookieHeader = request.headers.get("cookie");
    const ok = await verifyAdminSessionFromCookieHeader(cookieHeader);
    if (!ok) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "Unauthorized — sign in at /admin/login" },
          { status: 401 },
        );
      }
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(login);
    }
  }

  return continueWithReaderCookie(request);
}

function continueWithReaderCookie(request: NextRequest) {
  const res = NextResponse.next();
  if (pathnameIsReaderScoped(request.nextUrl.pathname) && !request.cookies.get(CAMPTI_SESSION_COOKIE)?.value?.trim()) {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    res.cookies.set(CAMPTI_SESSION_COOKIE, id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  return res;
}

function pathnameIsReaderScoped(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/read");
}

export const config = {
  matcher: ["/", "/read/:path*", "/admin/:path*", "/api/admin/:path*"],
};
