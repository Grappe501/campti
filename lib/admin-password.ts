import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time compare for admin password (Node-only; login route).
 */
export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.CAMPTI_ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  try {
    const a = Buffer.from(candidate, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
