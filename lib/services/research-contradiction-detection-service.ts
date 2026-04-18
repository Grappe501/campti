import type { CanonComparisonRecord } from "@/lib/domain/canon-reconciliation";

/**
 * Surfaces contradiction-shaped comparisons for author review (observability).
 */
export class ResearchContradictionDetectionService {
  listContradictions(comparisons: CanonComparisonRecord[]): CanonComparisonRecord[] {
    return comparisons.filter(
      (c) =>
        c.comparisonResult === "contradicts_canon" ||
        c.comparisonResult === "contradicts_runtime_assumption" ||
        Boolean(c.contradictionType),
    );
  }
}
