# Scene Run Outcome Analytics — Domain Model

## Primary VM

**`SceneRunOutcomeAnalyticsViewModel`** — scene-scoped analytics built from recent `SceneRunLedgerEntry` rows (and optional DB context such as current generation text length).

### Core fields

- **Run counts** — total, windowed sample size.
- **Allowance / launch distributions** — clean vs risky vs blocked (and related bands as modeled in domain).
- **Launch class / source** — counts for machine, interactive, rehearsal, etc., aligned with ledger vocabulary.
- **Churn metrics** — repairs, revisions, replays, incomplete or failed generations.
- **Averages** — mean blocker, risk, advisory counts where present.
- **`instabilitySignals: SceneRunInstabilitySignal[]`** — grounded codes with severity and factual `basis`.
- **`pressureSources: SceneRunPressureSourceSummary[]`** — operational categories with `evidenceCount` and honest `notes` (not causal claims).
- **`trend: SceneRunTrendSummary`** — recent vs prior slice comparison; descriptive only.
- **`advisoryNotes: string[]`** — e.g. replay only via guarded path; research/sim review suggestions.

### Current output context (honest scope)

When per-run output linkage is missing, the VM may still include **current scene** generation text statistics so operators see live length/paragraph context. These stats are **not** attributed to individual historical runs in the aggregate.

## Validation

**`SceneRunOutcomeAnalyticsRequestSchema`** (Zod) — `sceneId`, optional `maxRuns`, optional narrative filters for future scope.

## Service

**`buildSceneRunOutcomeAnalytics`** in `scene-run-outcome-analytics-service.ts`:

- Loads ledger entries for the scene (via existing assembly/load path).
- Computes distributions, averages, instability list, pressure rollups, trend slices.
- Does **not** persist summaries by default.

## Broader trends

Chapter- or narrative-wide instability dashboards are **deferred** unless a cheap aggregation over existing APIs is added later; the spec allows a modest cockpit extension without duplicating truth.
