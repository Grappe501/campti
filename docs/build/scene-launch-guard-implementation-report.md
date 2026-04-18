# Scene Launch Guard — Implementation Report

## Added

- **Domain:** `lib/domain/scene-launch-guard.ts`, `scene-launch-guard-policy.ts`, `scene-launch-guard-validation.ts` (Zod).
- **Services:** `scene-launch-guard-service.ts` (`evaluateSceneLaunchGuard`, `executeSceneLaunchAfterGuard`, `computeSceneLaunchFreshnessDigest`, `preflightVmToGuardResult`), `scene-launch-audit-service.ts`.
- **Actions:** `app/actions/scene-launch-guard.ts` — evaluate, confirm+launch, optional blocked acknowledgement audit.
- **Scene generation actions:** `app/actions/scene-generation.ts` now **requires** `launchGuard` on `actionRunSceneGeneration` and guarded object inputs for draft/rewrite/repair.
- **Preflight gate:** `assertSceneGenerationLaunchGateAction` now delegates to `evaluateSceneLaunchGuard` for consistent truth.
- **UI:** `SceneGenerationLaunchPanel` on **Preflight tab** and **Author cockpit (scene scope)**; risk + blocker modals; structured copy.
- **Prisma:** `SceneLaunchAuditLog` model + migration `20260418193000_scene_launch_audit_log`.
- **Tests:** policy + digest unit tests; `scripts/verify-scene-launch-guard.ts`; `npm run verify:scene-launch-guard`.

## Updated

- `app/admin/narrative/page.tsx`, `components/admin/author-command-cockpit.tsx`, `components/admin/scene-preflight-tab-*.tsx`, `app/actions/scene-generation-preflight.ts`, `package.json`.

## Schema

- New table **`SceneLaunchAuditLog`**; relation **`Scene.sceneLaunchAuditLogs`**.

## Working

- Guarded **full scene generation** from Preflight + Cockpit through `confirmAndLaunchSceneGenerationAction` / `executeSceneLaunchAfterGuard`.
- Stale digest rejection, blocked path, risk confirmation path, audit writes (when migration applied).

## Machine Guarded Launch Unification (2026-04-18)

- **Core:** `executeGuardedSceneLaunch`, `executeMachineGuardedSceneLaunch`, `executeRehearsalGuardedSceneLaunch` in `scene-launch-guard-service.ts`.
- **Domain:** `lib/domain/scene-guarded-launch.ts`, `scene-machine-launch-policy.ts`, `scene-rehearsal-launch-policy.ts`.
- **Refactors:** `executeSceneRepair`, `revision-job-runner`, `orchestrateSceneDraftPackage`, `scripts/cluster9-final-dry-run.ts` — all guarded; audit columns `launchClass`, `launchSource`, `policyMode`, `confirmationMode`.
- **Docs:** `machine-guarded-launch-unification-spec.md`, `scene-machine-launch-policy.md`, `scene-rehearsal-launch-policy.md`, `scene-launch-path-unification-implementation-report.md`.
- **Verify:** `npm run verify:machine-guarded-launch` (also folded into `verify:scene-launch-guard`).

## Deferred

- **Typed override roles** (operator break-glass) — not implemented; would need explicit policy + audit fields.
- **Optional** enqueue-time digest pairing for long-delayed revision jobs (today: execution-time preflight only).

## Verification

```bash
npm run typecheck
npm run verify:scene-launch-guard
npm run verify:machine-guarded-launch
```

## Next step

**Run Ledger + Replay Panel** — consume `SceneLaunchAuditLog` classification + `cluster7RuntimeTruth.runId` for cross-mode replay.
