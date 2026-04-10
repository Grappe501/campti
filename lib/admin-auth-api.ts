import { NextResponse } from "next/server";
import { isAdminAuthConfigured, verifyAdminSessionFromCookieHeader } from "@/lib/admin-session";

/** Use at the start of /api/admin/* handlers when password auth is enabled. */
export async function requireAdminApiAuth(request: Request): Promise<NextResponse | null> {
  if (!isAdminAuthConfigured()) return null;
  const ok = await verifyAdminSessionFromCookieHeader(request.headers.get("cookie"));
  if (!ok) {
    return NextResponse.json(
      { error: "Unauthorized — sign in at /admin/login" },
      { status: 401 },
    );
  }
  return null;
}
