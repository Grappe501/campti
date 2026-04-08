import type { ExtractionResultShape } from "@/lib/ingestion-contracts";

/**
 * Lightweight heuristics for reviewer-facing warnings after normalization.
 */
export function deriveExtractionWarnings(
  result: ExtractionResultShape,
): string[] {
  const warnings: string[] = [];

  if (
    result.claimsDraft.some(
      (c) => typeof c.confidence === "number" && c.confidence <= 2,
    )
  ) {
    warnings.push("Some claims are low confidence — verify against primary records.");
  }

  if (result.questionsDraft.length > 0) {
    warnings.push("Unresolved ambiguities or open questions were flagged — review before treating as fact.");
  }

  const personNames = result.peopleDraft
    .map((p) => (p.name ?? p.label ?? "").trim().toLowerCase())
    .filter(Boolean);
  const dupBuckets = new Map<string, number>();
  for (const n of personNames) {
    dupBuckets.set(n, (dupBuckets.get(n) ?? 0) + 1);
  }
  if ([...dupBuckets.values()].some((c) => c > 1)) {
    warnings.push("Multiple similar person entries — check for duplicate names or spelling variants.");
  }

  const eventsMissingDates = result.eventsDraft.filter(
    (e) =>
      (e.startYear == null || e.startYear === undefined) &&
      (e.endYear == null || e.endYear === undefined),
  );
  if (eventsMissingDates.length > 0) {
    warnings.push("Some events lack years — add dates from sources when possible.");
  }

  const placesMissingType = result.placesDraft.filter(
    (p) => !p.placeTypeSuggestion?.trim(),
  );
  if (placesMissingType.length > 0) {
    warnings.push("Some places lack a type suggestion — classify when the text supports it.");
  }

  const missingRecordHint = [
    ...result.peopleDraft,
    ...result.placesDraft,
    ...result.eventsDraft,
  ].filter((d) => !d.recordTypeSuggestion);
  if (missingRecordHint.length > 0) {
    warnings.push("Some drafts omit recordTypeSuggestion — consider historical vs oral vs hybrid.");
  }

  return warnings;
}
