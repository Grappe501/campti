import { z } from "zod";

/**
 * Semantic default: if a source row omits enforcement, derive the nearest truthful category — never emit blank strings.
 * Anti-regression: cockpit / runtime / validation summaries use {@link Book1ConsoleLawConstraintRow} only via normalizers below.
 */
export const BOOK1_CONSOLE_ENFORCEMENT = {
  /** Artifact omitted enforcement; row is still a chronology invariant (stable category label). */
  chronologyInvariant: "chronology_invariant",
  futureArcConstraint: "future_arc_constraint",
  sceneLawConstraint: "scene_law_constraint",
} as const;

/**
 * Source `chapter_law.chronologyInvariants[]` row. `enforcement` is optional in artifacts; normalized outputs always resolve it.
 */
export const Book1ChapterLawChronologyInvariantSourceRowSchema = z.object({
  id: z.string(),
  rule: z.string(),
  enforcement: z.string().optional(),
});

export type Book1ChapterLawChronologyInvariantSourceRow = z.infer<typeof Book1ChapterLawChronologyInvariantSourceRowSchema>;

/**
 * Canonical row shape for chapter-law and scene-law constraints surfaced in Book 1 character console packets.
 * Enforcement is always present: explicit source text when provided, otherwise a stable machine label.
 */
export const Book1ConsoleLawConstraintRowSchema = z.object({
  id: z.string(),
  constraint: z.string(),
  enforcement: z.string(),
});

export type Book1ConsoleLawConstraintRow = z.infer<typeof Book1ConsoleLawConstraintRowSchema>;

/** Alias: any normalized constraint summary used in cockpit/runtime/validation must match this shape (enforcement required). */
export type NormalizedConstraintSummaryRow = Book1ConsoleLawConstraintRow;

function enforcementFromChronologySource(raw: string | undefined | null): string {
  if (typeof raw !== "string") return BOOK1_CONSOLE_ENFORCEMENT.chronologyInvariant;
  const t = raw.trim();
  return t.length > 0 ? t : BOOK1_CONSOLE_ENFORCEMENT.chronologyInvariant;
}

/** Preserves non-empty operator/validator enforcement from artifacts; otherwise derives `chronology_invariant`. */
export function chronologyInvariantToConsoleConstraintRow(row: {
  id: string;
  rule: string;
  enforcement?: string | null;
}): Book1ConsoleLawConstraintRow {
  return {
    id: row.id,
    constraint: row.rule,
    enforcement: enforcementFromChronologySource(row.enforcement),
  };
}

/** Future-arc rows do not carry enforcement in source JSON; classify explicitly for cockpit summaries. */
export function futureArcConstraintToConsoleConstraintRow(row: {
  id: string;
  mustPreserve: string;
  forbiddenResolution: string;
}): Book1ConsoleLawConstraintRow {
  return {
    id: row.id,
    constraint: `${row.mustPreserve} | Forbidden: ${row.forbiddenResolution}`,
    enforcement: BOOK1_CONSOLE_ENFORCEMENT.futureArcConstraint,
  };
}

/** Scene-local outline/draft preservation rules are classified for traceability (SL-* ids). */
export function sceneLawConstraintToConsoleRow(row: { id: string; constraint: string }): Book1ConsoleLawConstraintRow {
  return {
    id: row.id,
    constraint: row.constraint,
    enforcement: BOOK1_CONSOLE_ENFORCEMENT.sceneLawConstraint,
  };
}
