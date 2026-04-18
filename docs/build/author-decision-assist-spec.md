# Author Decision Assist — Specification

## Purpose

The **Author Decision Assist** layer turns preflight, scene research, character simulation rollup, run ledger, and outcome analytics into **traceable, advisory** next-step guidance. It does **not** autopilot launches, mutate prose, or silently change guard or replay policy.

## What it answers

- Whether to open Preflight, Research, Simulation Workbench, or Runs next.
- Whether replay is reasonable **only** when current allowance and gates support it — with explicit demotion when churn or research/simulation pressure dominates.
- When to pause replay/repair loops and inspect diffs instead.

## Inputs (single truth surfaces)

- `buildSceneGenerationPreflight` — blockers, risks, subsystem flags.
- `loadSceneResearchTab` — contradictions, open claims, contradiction-shaped counts.
- `buildCharacterSimulationWorkbenchSceneRollup` — per-person blocking readiness.
- `loadSceneRunLedger` + `buildSceneRunOutcomeAnalytics` — churn, failures, allowance mix.
- `buildSceneRunDiffViewModel` (internal) — material change between two latest runs for inspect-diff hints.

## Outputs

- `SceneDecisionAssistViewModel` with a **primary** recommendation, **secondary** list, **suppression** log, **honesty** banner, and optional **run focus** when `ledgerRunKey` is supplied.
- Each `SceneDecisionRecommendation` includes factual evidence, labeled heuristics, triggers, strength, and **wired** actions (tabs and hrefs only — no fake buttons).

## Fact vs heuristic

- **Fact**: Pulled from preflight rows, research VM fields, rollup levels, ledger counters.
- **Heuristic**: Composite churn score, correlation language (“may correlate”), repair-vs-replay lean — always in `heuristicNotes` or marked in evidence kind.

## Strength

`strong` | `moderate` | `light` | `informational` — advisory only, never implied certainty. Strong recommendations are **capped** when history is legacy-heavy or run count is low.

## Suppression

Weaker or conflicting advice is demoted when:

- Preflight blockers dominate (replay not co-prioritized).
- Research or simulation pressure is moderate/strong (replay downgraded).
- Churn signals conflict with “replay now” (replay lightened).

## Surfaces

- Scene **Decision assist** tab (`?tab=assist`).
- Run Ledger **compact** card when a run is selected (server reload with `ledgerRunKey`).
- Author Command Cockpit **compact card** (scene scope).

## Persistence / instrumentation

No recommendation persistence in this pass; optional future lightweight logging is documented as deferred.

## Related docs

- `scene-decision-recommendation-model.md`
- `scene-decision-recommendation-rules.md`
- `scene-decision-recommendation-evidence.md`
- `author-decision-assist-implementation-report.md`
