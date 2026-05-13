# Recommendation → outcome linking rules

**Scope:** Bounded, append-only pairing of a completed guarded launch to the most recent prior `recommendation_shown` for the same scene. Implemented in `lib/services/scene-recommendation-outcome-linking-service.ts`.

## Preconditions

- `ledgerRunKey` must be present; otherwise no linkage row is written.
- Duplicate `recommendation_outcome_linked` rows for the same `ledgerRunKey` are skipped (idempotent).

## Parent selection

1. Load up to the two most recent `recommendation_shown` events with `createdAt` **strictly before** the launch start audit’s `createdAt`.
2. If none: append `recommendation_outcome_evaluated` with `meta.linkStatus: "no_observed_outcome"` — does not invent a parent.
3. Otherwise parent = the newest of those rows; `recommendation_outcome_linked` copies that parent’s category list.

## Link status

| Status | When |
|--------|------|
| `linked_outcome` | Default when a parent show exists and timing is unambiguous. |
| `ambiguous_followup` | Two most recent shows are within **60 seconds** of each other — cannot tell which set the author acted on; marked honestly. |

## Meta on linked rows

- `launchAllowance`, `generationSucceeded`, `linkStatus`, `startAuditId` — for effectiveness aggregation only; **not** causal claims.

## Non-goals

- No cross-scene linkage.
- No semantic interpretation of prose quality; churn of allowance / generation flags is separate from bounded output diff.
