import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { CAMPTI_SESSION_COOKIE } from "@/lib/campti-session";

export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  if (!request.cookies.get(CAMPTI_SESSION_COOKIE)?.value?.trim()) {
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

export const config = {
  matcher: ["/", "/read/:path*"],
};
