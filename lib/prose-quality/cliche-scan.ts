import { CLICHE_PHRASES } from "@/lib/prose-quality/wordlists";
import type { ClicheHit } from "@/lib/prose-quality/types";

export function scanCliches(text: string): ClicheHit[] {
  const lower = text.toLowerCase();
  const hits: ClicheHit[] = [];
  for (const phrase of CLICHE_PHRASES) {
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(phrase, from);
      if (idx === -1) break;
      const excerptStart = Math.max(0, idx - 30);
      const excerptEnd = Math.min(text.length, idx + phrase.length + 30);
      hits.push({
        phrase,
        excerpt: text.slice(excerptStart, excerptEnd).replace(/\s+/g, " ").trim(),
        startOffset: idx,
        endOffset: idx + phrase.length,
      });
      from = idx + phrase.length;
    }
  }
  return hits.slice(0, 80);
}
