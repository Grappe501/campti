# Scene Launch Audit Model

## Table: `SceneLaunchAuditLog`

Stores **append-only** operator-relevant events for guarded scene launches.

Key fields:

- `eventType` — e.g. `launch_guard_evaluated`, `launch_blocked`, `launch_rejected_stale`, `launch_rejected_confirmation_required`, `launch_confirmed_and_started`, `launch_allowed_clean_completed`, `launch_allowed_with_risk_completed`, `launch_generation_failed`, `launch_cancelled`
- `sceneId` — FK to `Scene` (cascade delete)
- `launchAllowance`, counts, `freshnessDigestPrefix` (first 16 hex chars — avoids storing full digest)
- `riskAcknowledged`, `confirmationRequired`, `guardEvaluatedAtIso`, `inputHashPreview`
- `intent` — `full_generation` | `draft` | `rewrite` | `repair`
- `meta` — JSON for small structured extras (e.g. Cluster 7 run id prefix)

## Soft failure

`writeSceneLaunchAudit` catches persistence errors so an older database without the migration does not brick generation — operators should still run migrations for production audit integrity.
