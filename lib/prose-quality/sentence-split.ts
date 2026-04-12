/**
 * English prose sentence boundaries—good enough for metrics, not legal citation.
 */
export function splitSentences(text: string): string[] {
  const t = text.replace(/\r\n/g, "\n").trim();
  if (!t) return [];
  const rough = t.split(/(?<=[.!?])\s+(?=[A-Z"“])/);
  const merged: string[] = [];
  for (const chunk of rough) {
    const sub = chunk
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    merged.push(...sub);
  }
  return merged.filter((s) => s.length > 0);
}

export function normalizeWords(line: string): string[] {
  return line
    .toLowerCase()
    .replace(/[—–\-]/g, " ")
    .replace(/[^a-z0-9'\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}
