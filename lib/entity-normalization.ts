export function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Conservative label normalization for deterministic matching.
 * Intentionally does NOT remove diacritics or aggressively rewrite historical naming.
 */
export function normalizeEntityLabel(input: string): string {
  return collapseWhitespace(input).toLowerCase();
}

export function normalizeNameForMatch(input: string): string {
  // Keep letters/numbers; remove obvious punctuation noise while preserving meaningful characters.
  const collapsed = collapseWhitespace(input).toLowerCase();
  return collapsed.replace(/[“”"'.:,;()[\]{}!?]/g, "");
}

export function normalizeTitleForMatch(input: string): string {
  const collapsed = collapseWhitespace(input).toLowerCase();
  return collapsed.replace(/[“”"'.:,;()[\]{}!?]/g, "");
}

export function scoreForLabelMatch(params: {
  normalizedNeedle: string;
  normalizedHaystack: string;
}): { score: number; why: string } | null {
  const n = params.normalizedNeedle;
  const h = params.normalizedHaystack;
  if (!n || !h) return null;
  if (n === h) return { score: 100, why: "exact_normalized" };
  if (h === n) return { score: 100, why: "exact_normalized" };
  if (h.startsWith(n) || n.startsWith(h)) return { score: 85, why: "starts_with_normalized" };
  if (h.includes(n) || n.includes(h)) return { score: 75, why: "contains_normalized" };
  return null;
}

