# Run Ledger + Replay Panel — Spec

## What it is

- **Run Ledger:** Curated, scene-scoped **history** of model-backed generation attempts, assembled from `SceneLaunchAuditLog` (start → completion pairs, rehearsal non-launch rows, orphans).
- **Replay Panel:** **Forward-governed** action: re-execute generation under **today’s** preflight/guard using `executeGuardedSceneLaunch`, with **`saveGenerationText: false`** (no silent DB prose write).

## What it is not

- Not a raw SQL/JSON log viewer.
- Not deterministic reproduction of old model output.
- Not a bypass of launch guard (replay uses current digest + interactive confirmation rules).

## Surfaces

- Scene admin **`Runs`** tab: `/admin/scenes/[id]?tab=runs`
- Author cockpit quick link (scene scope): **Run ledger (scene)**

## Replay classification

- Audit event types: `replay_requested`, `replay_denied_by_policy`, `replay_blocked`, `replay_completed`, `replay_failed`.
- `launchSource: run_ledger_replay` on replay-specific rows; inner guard events retain normal `executeGuardedSceneLaunch` classification.

## Deferred

- Durable storage of full preflight VM per run (today: audit fields + hash preview only).
- Persisted output linkage keyed by run id (today: `cluster7RunId` from completion meta when present).
- Global multi-scene explorer (optional; scene-first shipped).
