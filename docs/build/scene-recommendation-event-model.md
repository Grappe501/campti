# Scene recommendation event model

## Table: `SceneRecommendationEvent`

Append-only rows. Fields (see `prisma/schema.prisma`):

| Field | Role |
|-------|------|
| `sceneId` | Scene scope |
| `ledgerRunKey` | Optional assist context when opened from a run |
| `eventType` | `recommendation_shown` \| `recommendation_action_taken` \| `recommendation_outcome_linked` \| `recommendation_outcome_evaluated` |
| `actionType` | For `recommendation_action_taken`: `replay_requested`, `repair_requested`, `opened_research`, `opened_simulation`, `opened_diff`, `opened_preflight`, `launched_new_run` (server-side guarded launch after assist exposure), … |
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

**Replay vs launch:** a successful replay path may emit both `replay_requested` (replay intent) and `launched_new_run` (guarded terminal launch). They are distinct facts; effectiveness aggregation treats both as follow-up signals where applicable.
