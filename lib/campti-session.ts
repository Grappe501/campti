import { cookies } from "next/headers";

export const CAMPTI_SESSION_COOKIE = "campti_session";

/**
 * Anonymous reader session id (set by root `middleware.ts`). Server-only.
 */
export async function getCamptiSessionId(): Promise<string | null> {
  const c = await cookies();
  const v = c.get(CAMPTI_SESSION_COOKIE)?.value?.trim();
  return v && v.length > 0 ? v : null;
}
