# Scene recommendation effectiveness model

## View model

`SceneRecommendationEffectivenessViewModel` (`lib/domain/scene-recommendation-learning.ts`) includes:

- `honestyBanner` — observational framing.
- `overallHistoryStatus` — `insufficient_history` \| `low_confidence_pattern` \| `history_available` (aggregated).
- `stats.categoryCorrelations[]` — per-category:
  - `shownCount`, `followedCount`, `outcomeLinkedCount`
  - `subsequentAllowanceDistribution` (allowed / allowed_with_risk / blocked / failed_generation / unknown)
  - `churnPressureShare` — non-clean / total linked outcomes (heuristic)
  - `linkStatus` — `linked_outcome` \| `ambiguous_followup` \| `no_observed_outcome`
  - `sparseData`, `historyStatus`

## Aggregation window

Default **90 days**, scene-scoped. Tunable via `loadRecommendationEffectivenessAction` / service parameter.

## Outcome linking rules (bounded)

1. On launch completion, find `recommendation_shown` rows with `createdAt` **strictly before** the launch start audit time.
2. Take the **most recent** such row as the parent.
3. If two shows fall within **60 seconds** of each other, mark `ambiguous_followup` in meta (does not discard the row).
4. If no parent exists, append `recommendation_outcome_evaluated` explaining the gap.
5. Skip duplicate `recommendation_outcome_linked` for the same `ledgerRunKey`.

## Churn proxy

“Churn pressure” is the share of linked outcomes that are not clean allows (risky, blocked, or failed generation). It is **not** semantic churn of prose; see the durable output linkage subsystem for text deltas.
