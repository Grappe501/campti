# Scene recommendation confidence adjustment

## Principles

- **Explainable:** Every nudge has a `confidenceAdjustment.kind` and optional `explanation` + `notes[]`.
- **Bounded:** At most **one step** of strength change (e.g. moderate → light, moderate → strong).
- **Non-dominant:** Rule-based `basis` remains the primary rationale; learning **augments** via `learningAugmentation` on each recommendation.
- **Sparse-safe:** Below minimum shown/outcome counts, adjustment is `insufficient_history` or `historical_note_only` without material strength moves.

## Adjustment kinds

| Kind | Meaning |
|------|---------|
| `confidence_adjusted_up` | Slightly stronger label after repeated favorable **observational** outcomes for this category in this scene window. |
| `confidence_adjusted_down` | Slightly weaker label when **observational** non-clean outcome share is high (e.g. replay category). |
| `insufficient_history` | Sample too thin — no reliable pattern. |
| `historical_note_only` | Narrative note or distribution summary without changing strength. |

## Current rule-based nudges (conservative)

- **`replay_now`:** if linked outcomes ≥ 5, shown ≥ 3, and churn pressure share ≥ **0.55** → demote one strength step + caution note.
- **`repair_instead_of_replay`:** if linked outcomes ≥ 5, churn share ≤ **0.32**, and clean allow share ≥ **0.35** → promote one step + note.

Thresholds are constants in `scene-recommendation-effectiveness-service.ts` and should be tuned deliberately with documentation updates.

## UI transparency

The Decision Assist card shows **rule-based strength vs effective strength** when they differ, plus violet “Historical pattern” copy that never implies certainty.
