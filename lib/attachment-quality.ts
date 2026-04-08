/**
 * Internal copy QA for attachment / premium invitations (literary surface, not analytics IDs).
 */

const GENERIC_RETURN = [
  /welcome back/i,
  /we missed you/i,
  /your account/i,
  /continue where you left off/i,
];

const SALESY_PREMIUM = [
  /upgrade now/i,
  /limited offer/i,
  /unlock premium/i,
  /subscribe today/i,
  /\bdeal\b/i,
];

const SPOILER_HEAVY = [
  /dies at the end/i,
  /the twist is/i,
  /actually the father/i,
];

export function detectGenericReturnCopy(text: string): boolean {
  return GENERIC_RETURN.some((p) => p.test(text));
}

export function detectOverlySalesyPremiumCopy(text: string): boolean {
  return SALESY_PREMIUM.some((p) => p.test(text));
}

export function detectSpoilerHeavyAttachmentCopy(text: string): boolean {
  return SPOILER_HEAVY.some((p) => p.test(text));
}

export function detectWeakEmotionalPull(text: string): boolean {
  const t = text.trim();
  if (t.length < 14) return true;
  if (/^[a-z\s]+$/i.test(t) && t.length < 40) return true;
  return false;
}

export function scoreAttachmentInvitation(text: string): number {
  let s = 70;
  if (detectGenericReturnCopy(text)) s -= 25;
  if (detectOverlySalesyPremiumCopy(text)) s -= 30;
  if (detectSpoilerHeavyAttachmentCopy(text)) s -= 35;
  if (detectWeakEmotionalPull(text)) s -= 20;
  return Math.max(0, Math.min(100, s));
}
