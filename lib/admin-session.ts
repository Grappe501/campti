/**
 * Signed admin session cookie (Web Crypto — works in Edge proxy and Node routes).
 * When CAMPTI_ADMIN_PASSWORD is unset, admin UI is open (legacy dev); when set, session required.
 */

export const CAMPTI_ADMIN_SESSION_COOKIE = "campti_admin_session";

const encoder = new TextEncoder();

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i]! ^ b[i]!;
  return r === 0;
}

function getSessionSecret(): string {
  const s =
    process.env.CAMPTI_ADMIN_SESSION_SECRET?.trim() ||
    process.env.CAMPTI_ADMIN_PASSWORD?.trim() ||
    "";
  return s;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.CAMPTI_ADMIN_PASSWORD?.trim());
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", keyMaterial, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function uint8ToB64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlEncodeBuf(buf: ArrayBuffer): string {
  return uint8ToB64url(new Uint8Array(buf));
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function createAdminSessionToken(ttlMs: number): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) throw new Error("CAMPTI_ADMIN_SESSION_SECRET or CAMPTI_ADMIN_PASSWORD required to sign sessions");

  const exp = Date.now() + ttlMs;
  const payload = JSON.stringify({ exp, v: 1 });
  const key = await importHmacKey(secret);
  const payloadBytes = encoder.encode(payload);
  const sig = await crypto.subtle.sign("HMAC", key, payloadBytes);
  const payloadB64 = uint8ToB64url(payloadBytes);
  const sigB64 = b64urlEncodeBuf(sig);
  return `${payloadB64}.${sigB64}`;
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token?.trim()) return false;
  const secret = getSessionSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;

  try {
    const payloadBytes = b64urlDecode(parts[0]!);
    const payload = new TextDecoder().decode(payloadBytes);
    const { exp } = JSON.parse(payload) as { exp: number };
    if (typeof exp !== "number" || exp < Date.now()) return false;

    const key = await importHmacKey(secret);
    const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const sigBuf = b64urlDecode(parts[1]!);

    if (sigBuf.length !== expected.byteLength) return false;
    return timingSafeEqualBytes(sigBuf, new Uint8Array(expected));
  } catch {
    return false;
  }
}

export async function verifyAdminSessionFromCookieHeader(cookieHeader: string | null): Promise<boolean> {
  if (!cookieHeader) return false;
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CAMPTI_ADMIN_SESSION_COOKIE}=([^;]+)`));
  const raw = m?.[1] ? decodeURIComponent(m[1]) : null;
  return verifyAdminSessionToken(raw);
}
