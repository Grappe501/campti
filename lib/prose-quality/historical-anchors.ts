import type { HistoricalAnchorMetrics } from "@/lib/prose-quality/types";

export function analyzeHistoricalAnchors(
  textLower: string,
  terms: string[] | undefined
): HistoricalAnchorMetrics | null {
  if (!terms || terms.length === 0) return null;
  const normalized = terms.map((t) => t.toLowerCase().trim()).filter(Boolean);
  const found: string[] = [];
  const missing: string[] = [];
  for (const t of normalized) {
    if (textLower.includes(t)) found.push(t);
    else missing.push(t);
  }
  const hitRate = normalized.length ? found.length / normalized.length : 0;
  return {
    termsRequested: normalized,
    termsFound: found,
    termsMissing: missing,
    hitRate,
  };
}
