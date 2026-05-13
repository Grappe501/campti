# Stability forecast / early warning model

**Purpose:** Conservative, **evidence-backed** advisory messages when a scene’s recent pattern resembles known churn or improvement shapes — not predictions of the next run.

**Source:** `SceneStabilityForecast` in `lib/domain/scene-stability-operating.ts`, rules in `buildStabilityForecasts` (`lib/services/scene-stability-operating-service.ts`).

## Derivation labels

| `derivation` | Meaning |
|--------------|---------|
| `fact` | Direct counts from loaded subsystems (e.g. blocking contradictions + risky launches). |
| `heuristic` | Composed thresholds (e.g. replay + risky launch pattern, churn score + output movement). |
| `low_confidence` | Thin history (e.g. very few runs in window) — forecast explicitly limited. |

## Current rule codes (inspect in code for thresholds)

- `replay_churn_risk` — elevated replay audits and risky allowances.
- `research_truth_pressure` — blocking research contradictions with risky launches.
- `simulation_instability` — simulation rollup shows blocked readiness.
- `output_churn_with_operational_churn` — operational churn score plus output fingerprint/length movement.
- `trending_cleaner` — only when analytics trend is favorable (low risky share, sufficient clean share); still advisory.
- `low_run_volume` — warns that patterns are weak when the window has few runs.
- `linked_output_drift_persists` — **fact**: several consecutive durable snapshots show bounded length or fingerprint movement (independent of governance “2+ slice” material diff rule).

## Basis array

Each forecast includes human-readable `basis` lines so operators can see **why** it fired without hidden scoring.

## Non-goals

- No auto-launch or guard overrides.
- No causal attribution (“replay caused failure”).
