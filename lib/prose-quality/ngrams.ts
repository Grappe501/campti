import { STOPWORDS } from "@/lib/prose-quality/wordlists";
import { normalizeWords } from "@/lib/prose-quality/sentence-split";

export function collectRepeatedPhrases(
  text: string,
  nMin: number,
  nMax: number,
  minOccurrences: number
): { normalized: string; count: number; exampleExcerpt?: string }[] {
  const lower = text.toLowerCase();
  const words = normalizeWords(lower);
  const counts = new Map<string, number>();

  for (let n = nMin; n <= nMax; n++) {
    for (let i = 0; i + n <= words.length; i++) {
      const slice = words.slice(i, i + n);
      if (slice.some((w) => STOPWORDS.has(w))) continue;
      const key = slice.join(" ");
      if (key.length < 10) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const out: { normalized: string; count: number }[] = [];
  for (const [k, c] of counts) {
    if (c >= minOccurrences) out.push({ normalized: k, count: c });
  }
  out.sort((a, b) => b.count - a.count || b.normalized.length - a.normalized.length);
  return out.slice(0, 40);
}
