import { NextResponse } from "next/server";
import { createAdminSessionToken, CAMPTI_ADMIN_SESSION_COOKIE, isAdminAuthConfigured } from "@/lib/admin-session";
import { verifyAdminPassword } from "@/lib/admin-password";

export async function POST(req: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: "CAMPTI_ADMIN_PASSWORD is not set — admin login disabled." },
      { status: 503 },
    );
  }

  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  try {
    const token = await createAdminSessionToken(7 * 24 * 60 * 60 * 1000);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(CAMPTI_ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Session error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
