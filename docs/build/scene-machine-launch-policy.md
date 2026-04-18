# Scene Machine Launch Policy

## Readiness truth

Machine launches consume the **same** preflight-derived `launchAllowance` and readiness classes as interactive launches. Policy differences apply only to **confirmation semantics** and **automation risk elevation**.

## Default posture (`DEFAULT_SCENE_MACHINE_LAUNCH_POLICY`)

- **`blocked`** → do not call `runSceneGeneration`; audit `launch_blocked` / `rejected_blocked`.
- **`allowed`** with **no** elevation requirement → proceed; `confirmationMode: machine_not_required`.
- **`allowed_with_risk`** or any case where `deriveLaunchConfirmationRequired` is true (including **`allowed` + `rehearsal_incomplete`**) → **deny** unless `allowMachineRiskyLaunch: true`.

When elevation is explicitly allowed:

- Proceed with `confirmationMode: machine_policy_allowed` (not human confirmation).
- `policyMode` becomes `machine_risk_elevation_allowed`.

## Freshness

Machine paths **do not** compare a client-supplied digest to the server rebuild. Each execution builds current preflight and uses that snapshot’s digest in audit (`freshnessDigestPrefix`). This is honest “execute what is true **now**” automation, not “replay a stale UI confirm.”

## Call sites

- `executeSceneRepair` → `executeMachineGuardedSceneLaunch` with `launchSource: scene_repair_service` (or `revision_job` from the worker).
- `orchestrateSceneDraftPackage` → `executeMachineGuardedSceneLaunch` with `intent: full_generation`, `launchSource: draft_package_orchestration`.

## Widening risk (intentional)

To allow a risky machine launch, pass `{ allowMachineRiskyLaunch: true }` on the guarded request. This must be **explicit in code** — there is no ambient “jobs may ignore risk” default.
