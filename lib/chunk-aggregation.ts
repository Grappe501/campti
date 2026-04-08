import type { ExtractionResultShape } from "@/lib/ingestion-contracts";

export type AggregationWarning = {
  kind: "chunk_failed" | "possible_duplicate" | "conflict";
  message: string;
};

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function pickKey(d: { name?: string; title?: string; label?: string }): string | null {
  const raw = (d.name ?? d.title ?? d.label ?? "").trim();
  return raw ? normKey(raw) : null;
}

function confidenceOf(d: { confidence?: number }): number {
  return typeof d.confidence === "number" ? d.confidence : 3;
}

function mergeNotes(primary: { notes?: string }, extra: string) {
  const next = extra.trim();
  if (!next) return;
  const base = (primary.notes ?? "").trim();
  primary.notes = base ? `${base}\n\n${next}` : next;
}

function dedupeByKey<T extends { notes?: string; confidence?: number } & Record<string, unknown>>(
  drafts: T[],
  label: string,
  warnings: AggregationWarning[],
): T[] {
  const buckets = new Map<string, T[]>();
  const passthrough: T[] = [];

  for (const d of drafts) {
    const k = pickKey(d as unknown as { name?: string; title?: string; label?: string });
    if (!k) {
      passthrough.push(d);
      continue;
    }
    const list = buckets.get(k) ?? [];
    list.push(d);
    buckets.set(k, list);
  }

  const out: T[] = [...passthrough];
  for (const [k, list] of buckets.entries()) {
    if (list.length === 1) {
      out.push(list[0]!);
      continue;
    }
    const sorted = [...list].sort((a, b) => confidenceOf(b) - confidenceOf(a));
    const primary = sorted[0]!;
    const alternates = sorted.slice(1);

    warnings.push({
      kind: "possible_duplicate",
      message: `${label}: possible duplicates grouped for "${k}" (${list.length} items). Kept highest-confidence as primary.`,
    });
    mergeNotes(
      primary,
      `Possible duplicates from chunk aggregation (${alternates.length} alternates) for key "${k}". Review for spelling variants vs distinct entities.`,
    );
    out.push(primary);
  }

  return out;
}

/**
 * Conservative aggregation:
 * - Combine arrays by type
 * - Normalize labels/titles via keying for duplicate grouping (no silent collapse of conflicts)
 * - Keep highest-confidence as primary; preserve alternates via reviewer notes + warnings
 */
export function aggregateChunkResults(params: {
  chunkResults: ExtractionResultShape[];
  failedChunkCount: number;
}): { aggregated: ExtractionResultShape; warnings: AggregationWarning[] } {
  const warnings: AggregationWarning[] = [];
  if (params.failedChunkCount > 0) {
    warnings.push({
      kind: "chunk_failed",
      message: `${params.failedChunkCount} chunk(s) failed extraction; aggregated result is partial.`,
    });
  }

  const combined: ExtractionResultShape = {
    summaryDraft: null,
    peopleDraft: [],
    placesDraft: [],
    eventsDraft: [],
    symbolsDraft: [],
    claimsDraft: [],
    chaptersDraft: [],
    scenesDraft: [],
    questionsDraft: [],
    continuityDraft: [],
  };

  const summaries: string[] = [];
  for (const r of params.chunkResults) {
    if (typeof r.summaryDraft === "string" && r.summaryDraft.trim()) {
      summaries.push(r.summaryDraft.trim());
    }
    combined.peopleDraft.push(...r.peopleDraft);
    combined.placesDraft.push(...r.placesDraft);
    combined.eventsDraft.push(...r.eventsDraft);
    combined.symbolsDraft.push(...r.symbolsDraft);
    combined.claimsDraft.push(...r.claimsDraft);
    combined.chaptersDraft.push(...r.chaptersDraft);
    combined.scenesDraft.push(...r.scenesDraft);
    combined.questionsDraft.push(...r.questionsDraft);
    combined.continuityDraft.push(...r.continuityDraft);
  }

  // Keep summary readable: de-dupe exact repeats, join with spacing.
  const seenSummary = new Set<string>();
  const dedupedSummaries: string[] = [];
  for (const s of summaries) {
    const k = normKey(s);
    if (seenSummary.has(k)) continue;
    seenSummary.add(k);
    dedupedSummaries.push(s);
  }
  combined.summaryDraft = dedupedSummaries.length ? dedupedSummaries.join("\n\n") : null;

  combined.peopleDraft = dedupeByKey(combined.peopleDraft, "people", warnings);
  combined.placesDraft = dedupeByKey(combined.placesDraft, "places", warnings);
  combined.eventsDraft = dedupeByKey(combined.eventsDraft, "events", warnings);
  combined.symbolsDraft = dedupeByKey(combined.symbolsDraft, "symbols", warnings);
  combined.claimsDraft = dedupeByKey(combined.claimsDraft, "claims", warnings);
  combined.chaptersDraft = dedupeByKey(combined.chaptersDraft, "chapters", warnings);
  combined.scenesDraft = dedupeByKey(combined.scenesDraft, "scenes", warnings);
  combined.questionsDraft = dedupeByKey(combined.questionsDraft, "questions", warnings);
  combined.continuityDraft = dedupeByKey(combined.continuityDraft, "continuity", warnings);

  return { aggregated: combined, warnings };
}

