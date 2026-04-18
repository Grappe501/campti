# Recommendation effectiveness / learning loop — specification

## Purpose

Close the loop between **Decision Assist** (what was advised), **operator follow-up** (optional, minimal instrumentation), and **subsequent guarded launches** (bounded outcomes). The system learns **observational patterns** only — no autopilot, no hidden guard changes, no prose-quality scoring.

## What is observed

1. **Recommendation shown** — each Decision Assist load logs the visible recommendation ids and categories (after suppression/ranking).
2. **Follow-up action** — optional logs when the operator uses instrumented links (scene tabs, research/simulation hrefs) or server-side replay.
3. **Outcome linked** — after a guarded launch completes (success or generation failure), the run is paired with the **latest prior** `recommendation_shown` for that scene (see linking rules).

## What is not claimed

- Causality (“the recommendation caused the outcome”).
- Completeness of follow-up (many actions are not instrumented).
- Optimal next step or percentage “correctness.”

## Non-goals

- ML / embedding black boxes.
- Changing launch, replay, or guard policy from this layer.
- Penalizing authors for ignoring advice.

## Related implementation

- Persistence: `SceneRecommendationEvent` (Prisma).
- Services: `scene-recommendation-learning-log-service`, `scene-recommendation-outcome-linking-service`, `scene-recommendation-effectiveness-service`.
- UI: Decision Assist tab — historical notes, strength transparency, effectiveness summary panel.
