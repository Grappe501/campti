# Machine Guarded Launch Unification — Spec

## Purpose

Close **machine** and **script** gaps around `runSceneGeneration` so launch governance is **universal**, not UI-only. This pass **does not** add a second readiness engine: it reuses `buildSceneGenerationPreflight`, `preflightVmToGuardResult`, and allowance vocabulary from preflight.

## Launch classes

| Class | Entry examples | Freshness basis | Risk / confirmation |
|--------|----------------|-----------------|----------------------|
| **interactive** | `confirmAndLaunchSceneGenerationAction`, guarded scene-generation actions | Client `freshnessDigest` must match server rebuild | Human `riskAcknowledged` when preflight requires it |
| **machine** | `executeSceneRepair`, revision jobs, `orchestrateSceneDraftPackage` | Execution-time preflight only (no stale-compare to a prior UI digest) | **No** human impersonation; default **deny** when elevation is required unless `allowMachineRiskyLaunch` |
| **rehearsal** | `cluster9-final-dry-run.ts` | Execution-time preflight; optional **non-mutating** path | Same risk posture as machine when mutating; explicit `rehearsal_non_launch` audit when not calling the model |

## Shared core

- **`executeGuardedSceneLaunch`** in `lib/services/scene-launch-guard-service.ts` — single path for preflight rebuild, policy, audit, and `runSceneGeneration`.
- **`executeSceneLaunchAfterGuard`** — interactive wrapper (unchanged external contract).
- **`executeMachineGuardedSceneLaunch`** — automation wrapper.
- **`executeRehearsalGuardedSceneLaunch`** — script/CI wrapper.

## Audit

`SceneLaunchAuditLog` gains nullable columns: `launchClass`, `launchSource`, `policyMode`, `confirmationMode` (plus existing `meta` JSON). Machine paths record `riskAcknowledged: false` even when proceeding under `machine_policy_allowed`.

## Non-goals (this pass)

- Run Ledger UI (foundation only).
- Module-level mutex inside `runSceneGeneration` (optional defense in depth; deferred).
