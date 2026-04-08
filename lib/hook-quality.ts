/**
 * Internal heuristics for return / thread hook copy (not shown to readers as scores).
 */

const GENERIC_PATTERNS = [
  /click here/i,
  /sign up/i,
  /unlock/i,
  /exclusive content/i,
  /don'?t miss/i,
  /limited time/i,
];

const SPOILERISH = [
  /dies\b/i,
  /kills\b/i,
  /murder/i,
  /reveals that/i,
  /turns out/i,
  /secret is/i,
];

const OVERSTATEMENT = [
  /most profound/i,
  /will change your life/i,
  /best story/i,
  /unforgettable experience/i,
];

const FLAT_PATTERNS = [
  /^continue\.?$/i,
  /^read more\.?$/i,
  /^next\.?$/i,
];

export function scoreReturnHook(hook: string): number {
  const t = hook.trim();
  if (t.length < 12) return 20;
  if (t.length > 180) return 55;
  let s = 72;
  if (detectHookGenericness(t)) s -= 25;
  if (detectHookSpoilerRisk(t)) s -= 20;
  if (detectHookOverstatement(t)) s -= 15;
  if (detectHookFlatness(t)) s -= 30;
  return Math.max(0, Math.min(100, s));
}

export function detectHookGenericness(hook: string): boolean {
  return GENERIC_PATTERNS.some((p) => p.test(hook));
}

export function detectHookSpoilerRisk(hook: string): boolean {
  return SPOILERISH.some((p) => p.test(hook));
}

export function detectHookOverstatement(hook: string): boolean {
  return OVERSTATEMENT.some((p) => p.test(hook));
}

export function detectHookFlatness(hook: string): boolean {
  const t = hook.trim();
  if (t.length < 18) return true;
  return FLAT_PATTERNS.some((p) => p.test(t));
}
