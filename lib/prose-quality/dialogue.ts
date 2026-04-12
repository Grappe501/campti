import { normalizeWords } from "@/lib/prose-quality/sentence-split";
import type { DialogueMetrics } from "@/lib/prose-quality/types";

/** Pull ASCII or curly double-quoted speech segments. */
export function extractQuotedSegments(text: string): string[] {
  const out: string[] = [];
  const re = /["“]([^"”]+)["”]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const inner = m[1]?.trim();
    if (inner && inner.length > 1) out.push(inner);
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
}

/**
 * Alternating quoted lines as pseudo-speakers A/B—useful when attributions are minimal.
 * Distinctiveness = 1 - Jaccard overlap of word sets (higher = more different).
 */
export function dialogueDistinctiveness(segments: string[]): DialogueMetrics {
  if (segments.length < 2) {
    return {
      quotedSegments: segments.length,
      alternatingDistinctiveness: null,
      note:
        segments.length === 0
          ? "No double-quoted dialogue detected—metrics skipped."
          : "Only one quoted segment—distinctiveness not computable.",
    };
  }
  const aWords = new Set<string>();
  const bWords = new Set<string>();
  for (let i = 0; i < segments.length; i++) {
    const ws = normalizeWords(segments[i]!);
    const set = i % 2 === 0 ? aWords : bWords;
    for (const w of ws) set.add(w);
  }
  const overlap = jaccard(aWords, bWords);
  const distinct = Math.max(0, Math.min(1, 1 - overlap));

  return {
    quotedSegments: segments.length,
    alternatingDistinctiveness: distinct,
    note:
      segments.length >= 4
        ? null
        : "Few quoted lines—distinctiveness is a weak signal; add attributions for real control.",
  };
}
