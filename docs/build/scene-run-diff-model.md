# Scene Run Diff — Domain Model

## Entry points

- **`SceneRunDiffRequest`** — Zod-validated: `sceneId`, `ledgerRunKeyA`, `ledgerRunKeyB` (same scene enforced in service).
- **`SceneRunComparisonSelection`** — optional preset id + resolved run keys for UI state.
- **`SceneRunDiffViewModel`** — full structured comparison for two ledger rows.

## Summary and completeness

- **`SceneRunStructuredDiffSummary`** — operator-legible “what changed” bullets; references completeness, not hidden precision.
- **`SceneRunComparisonCompleteness`** — `full_comparison` | `partial_comparison` | `insufficient_output_linkage` | `legacy_run_history`.

## Deltas (typed)

| Model | Role |
|--------|------|
| `SceneRunGovernanceDelta` | Launch class, source, policy, allowance, confirmation, counts, audit final action, replay eligibility *as of ledger assembly* |
| `SceneRunPreflightDelta` | Readiness class, subsystem readiness, digest/hash, scope notes; may be partial when preflight snapshot missing |
| `SceneRunExecutionDelta` | Generation lifecycle, output-produced flag, failure/degradation, ids |
| `SceneRunOutputDelta` | Existence, length stats, structure hints, artifact/version deltas when available; `proseComparisonAvailable` gates interpretation |

## Outcome signals (per comparison)

- **`SceneRunOutcomeSignals`** — factual deltas plus optional **advisory** `heuristics: SceneRunQualityHeuristic[]`.
- **`SceneRunInstabilitySignal`** — used in analytics aggregates; diff path may emit advisory instability-style hints via heuristics.

## Heuristic shape

Each **`SceneRunQualityHeuristic`** includes:

- `code` — stable string (e.g. `stability_improved`, `output_churn_high`).
- `label` — short operator-facing title.
- `basis` — what was observed.
- `strength` — `low` | `medium` | `high` (advisory).
- `derivation` — `"fact"` | `"heuristic"`.

Heuristics must never be serialized as if they were measured quality scores.

## Relation to flat ledger diff

`SceneRunFlatDiffSummary` (in `scene-run-ledger.ts`) remains the **shallow** field-equality summary for the ledger table. **`SceneRunDiffViewModel`** is the **structured** operator diff built by `scene-run-diff-service.ts`.

## Chronological ordering

For “improved/declined” stability heuristics, the service orders runs by `occurredAt` (newer vs older) so blocker/risk decreases read as improvement regardless of selection order in the UI.
