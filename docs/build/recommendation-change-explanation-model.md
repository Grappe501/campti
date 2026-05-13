# Recommendation strength / learning explanation model

**Purpose:** When effectiveness learning adjusts **displayed** recommendation strength or leaves it unchanged, operators see **explicit lines** explaining why — no silent mutation.

**Source:** `SceneRecommendationLearningAugmentation.strengthChangeExplanationLines` in `lib/domain/scene-recommendation-learning.ts`, populated by `buildAdjustment` in `lib/services/scene-recommendation-effectiveness-service.ts`. Surfaced in `components/admin/scene-decision-assist-client.tsx`.

## Separation of concerns

- **`basis` / rule triggers:** Remain on the recommendation’s factual `basis` object (unchanged by learning).
- **`learningAugmentation`:** Historical notes, confidence adjustment kind, and strength change lines — clearly labeled as observational.

## Typical explanation lines

- **Insufficient history:** e.g. fewer than three logged shows in the window — strength not nudged.
- **Sparse outcomes:** outcomes linked but below adjustment thresholds — note only.
- **Adjusted down / up:** states one-step strength change and cites **threshold constants** (non-clean share, clean share) — still “bounded, observational — does not change guard policy.”
- **Unchanged with distribution:** references observational counts only.

## Guarantees

- Every path through `buildAdjustment` sets `strengthChangeExplanationLines` (non-empty array).
- Adjustments never modify guard policy or auto-run behavior.
