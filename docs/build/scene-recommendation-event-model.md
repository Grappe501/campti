# Scene recommendation event model

## Table: `SceneRecommendationEvent`

Append-only rows. Fields (see `prisma/schema.prisma`):

| Field | Role |
|-------|------|
| `sceneId` | Scene scope |
| `ledgerRunKey` | Optional assist context when opened from a run |
| `eventType` | `recommendation_shown` \| `recommendation_action_taken` \| `recommendation_outcome_linked` \| `recommendation_outcome_evaluated` |
| `actionType` | For action events: `replay_requested`, `opened_research`, … |
| `recommendationIds` | JSON array of string ids |
| `recommendationCategories` | JSON array of taxonomy categories |
| `linkedLaunchAuditId` / `linkedLedgerRunKey` | Outcome correlation |
| `parentEventId` | Optional pointer to a prior `recommendation_shown` row |
| `displayBatchId` | Groups one assist render |
| `contextSummary` | Short human-readable note |
| `meta` | JSON (allowance, generation success, link status, etc.) |

## Event taxonomy (first pass)

- **Shown:** one row per assist evaluation with the full visible set.
- **Action taken:** optional; parent inferred as latest prior shown if not supplied.
- **Outcome linked:** written from the guarded launch completion path; duplicates skipped per `linkedLedgerRunKey`.
- **Outcome evaluated:** used when no prior show exists — records honesty (`no_observed_outcome`) without fabricating a pair.

## Instrumentation limits

Not every navigation is logged. Documented gaps are intentional to avoid overcollection; the UI states when follow-up history is empty.
