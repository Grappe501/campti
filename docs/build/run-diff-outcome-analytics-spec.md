# Run Diff + Outcome Analytics — Specification

## Purpose

This layer turns the **Run Ledger** from a passive timeline into a **comparative and diagnostic** surface. It answers operator questions grounded in execution history: what changed between runs, whether governance or outcomes shifted, and where repeated pressure or instability appears—without inventing a universal “quality score” or replacing author judgment.

## Non-goals

- No fabricated prose-quality oracle.
- No raw JSON blobs as the primary UX.
- No replay or mutation triggered from analytics; suggestions are advisory and must route through the existing guarded replay path.
- No conflation of operational cleanliness with literary merit.

## Three comparison dimensions

1. **Launch / governance** — launch class, source, policy mode, allowance, confirmation, blocker/risk/advisory counts (from ledger + audit proxy where present), audit final action.
2. **Execution / outcome** — generation started/completed, output produced, failure/degradation/partial signals, run/execution identifiers when present.
3. **Output / artifact** — only where trustworthy per-run linkage exists. When prose is not keyed per ledger run, the system reports **insufficient output linkage** and may still surface **current** scene generation text stats for context only.

## Fact vs heuristic

- **Fact**: Fields copied or derived directly from ledger entries, audit logs, or linked IDs without interpretive scoring.
- **Heuristic / advisory**: Labeled `SceneRunQualityHeuristic` with `basis`, `strength`, and `derivation: "heuristic"`. Examples: stability improved/declined from blocker/risk count trends, output churn when length deltas are large, repair-loop or replay-divergence risk flags from pattern counts.

## Historical completeness

Structured comparisons carry `SceneRunComparisonCompleteness`:

- `full_comparison` — all major slices present.
- `partial_comparison` — some slices missing or legacy-shaped rows.
- `insufficient_output_linkage` — no reliable per-run prose/artifact pairing.
- `legacy_run_history` — older rows lack normalized guard/preflight fields.

The UI and reports must not imply precision that the data does not support.

## Scene-level analytics

Aggregates recent runs for one scene:

- Counts and distributions: allowance bands, launch class, launch source, interactive vs machine vs rehearsal.
- Operational churn: repair/revision/replay counts, incomplete/failed generation, average blocker/risk/advisory.
- **Instability signals** — grounded codes (e.g. repeated risky launches, repair loops, execution failures).
- **Pressure source summary** — operational framing (research, simulation, environment, governance, input completeness) from available facts; not asserted causality.
- **Trend summary** — recent vs prior window descriptive stats, clearly labeled.

## Default comparison selection

Helpers suggest pairs: latest vs previous, latest interactive vs latest machine, and replay-vs-original style ordering when metadata allows. Cross-scene comparison is rejected for the structured diff path.

## Server boundary

Structured run comparison is built via **`loadSceneRunStructuredDiffAction`**: the client sends a Zod-validated `{ sceneId, ledgerRunKeyA, ledgerRunKeyB }`, and the server reloads the ledger window and assembles the diff. Outcome analytics use **`loadSceneRunOutcomeAnalyticsAction`** (or direct server-component calls for the initial tab load).

## Persistence

Analytics are computed from ledger data. No additional analytics tables are required for this pass.

## Related docs

- `scene-run-diff-model.md` — diff view model and deltas.
- `scene-run-outcome-analytics-model.md` — analytics VM and aggregates.
- `scene-run-instability-signals.md` — instability codes and interpretation.
- `run-diff-outcome-analytics-implementation-report.md` — what was built and what is deferred.
