import { ABSTRACT_NOUNS, SENSORY_LEXICON } from "@/lib/prose-quality/wordlists";
import { normalizeWords, splitSentences } from "@/lib/prose-quality/sentence-split";
import type { SensoryMetrics } from "@/lib/prose-quality/types";

export function analyzeSensory(text: string): SensoryMetrics {
  const words = new Set(normalizeWords(text));
  let sensoryHits = 0;
  let abstractHits = 0;
  for (const w of words) {
    if (SENSORY_LEXICON.has(w)) sensoryHits += 1;
    if (ABSTRACT_NOUNS.has(w)) abstractHits += 1;
  }
  const denom = sensoryHits + abstractHits + 0.5;
  const ratio = sensoryHits / denom;

  const sents = splitSentences(text);
  const thinExcerpts: string[] = [];
  for (const s of sents) {
    const ws = normalizeWords(s);
    if (ws.length < 6) continue;
    let sCount = 0;
    let aCount = 0;
    for (const w of ws) {
      if (SENSORY_LEXICON.has(w)) sCount++;
      if (ABSTRACT_NOUNS.has(w)) aCount++;
    }
    if (aCount >= 2 && sCount === 0 && ws.length < 35) {
      thinExcerpts.push(s.length > 160 ? `${s.slice(0, 157)}…` : s);
    }
    if (thinExcerpts.length >= 8) break;
  }

  return {
    sensoryHits,
    abstractHits,
    ratio,
    thinExcerpts,
  };
}
