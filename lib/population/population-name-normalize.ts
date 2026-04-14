/** Lowercase, strip most punctuation, collapse spaces — for dedupe keys only. */
export function normalizePopulationName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Last whitespace-delimited token of normalized name — coarse surname / family token for clustering. */
export function primaryFamilyTokenFromDisplayName(name: string): string {
  const n = normalizePopulationName(name);
  if (!n) return "";
  const parts = n.split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1]! : "";
}
