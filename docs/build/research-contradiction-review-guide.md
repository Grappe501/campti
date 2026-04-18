# Research — contradiction review guide

## What “contradiction-shaped” means

`ResearchContradictionDetectionService` filters `AuthorCanonComparison` rows where:

- `comparisonResult` is `contradicts_canon` or `contradicts_runtime_assumption`, **or**
- `contradictionType` is non-null.

This is **approximate** — driven by token overlap heuristics in `CanonComparisonService`, not formal proof.

## Operator workflow

1. Run **comparisons** on the claim to refresh stored comparisons.
2. Review the **Contradiction-shaped** panel on `/admin/research` and per-claim comparison lines.
3. Decide whether to accept, mark uncertain, diverge, or reject — documenting rationale where required.

## Cockpit alignment

Scene-scoped cockpit counts (`summarizeRicreForScene`) use the same comparison predicates for the contradiction tally — observational only.
