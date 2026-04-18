# Scene Run — Replay Policy

## Principle

**Historical truth ≠ replay feasibility.**  
The ledger shows what was recorded. Replay asks: **if we invoked generation now with current guard rules, would it be allowed?**

## Eligibility (`classifyReplayEligibility`)

| Result | Typical cause |
|--------|----------------|
| `replay_allowed` | Current preflight `allowed`, full enough history, completed run |
| `replay_allowed_with_risk` | Current `allowed_with_risk` — operator must acknowledge in UI before `replaySceneRunAction` |
| `replay_blocked` | Current preflight `blocked` or preflight unavailable |
| `historical_only` | Row never started generation (e.g. rehearsal non-launch) |
| `insufficient_history` | Legacy/partial/orphan record — no safe anchor |

## Execution path

`replaySceneRunAction`:

1. Validates payload (Zod).
2. Loads ledger entry; denies if ineligible.
3. Writes `replay_requested` audit.
4. Calls **`executeGuardedSceneLaunch`** with `launchClass: interactive`, `launchSource: run_ledger_replay`, **current** `freshnessDigest`, `policyMode: replay_interactive_guard`, **`saveGenerationText: false`**.
5. Writes `replay_completed` or failure audit.

Intent is **server-derived** from the historical entry (`intentForReplayFromEntry`), not client-supplied.

## Honesty

Replay is **not** “same bytes as before.” Model and upstream truth may differ. UI copy states this explicitly.
