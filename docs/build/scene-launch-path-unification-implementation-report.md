# Scene Launch Path Unification — Implementation Report (Machine Guarded)

**Date:** 2026-04-18  

## Summary

Implemented **Machine Guarded Launch Unification**: all known canonical bypasses now route through **`executeGuardedSceneLaunch`** (interactive / machine / rehearsal) with comparable **`SceneLaunchAuditLog`** classification fields.

## Direct `runSceneGeneration(` call sites (after pass)

| File | Status |
|------|--------|
| `lib/services/scene-generation-service.ts` | Definition + thin internal wrappers (`generateSceneDraft`, etc.) — documented as low-level |
| `lib/services/scene-launch-guard-service.ts` | **Only** canonical guarded invocation |

## Refactored bypass callers

| Path | Mechanism |
|------|-----------|
| `executeSceneRepair` | `executeMachineGuardedSceneLaunch` — intent from repair plan (`draft` / `rewrite` / `repair`) |
| `actionExecuteSceneRepair` | Unchanged signature; inherits guarded repair |
| `runClaimedRevisionJob` | Passes `launchSource: revision_job` + job id meta |
| `orchestrateSceneDraftPackage` / `actionOrchestrateSceneDraftPackage` | `executeMachineGuardedSceneLaunch`, `intent: full_generation`, `draft_package_orchestration` |
| `scripts/cluster9-final-dry-run.ts` | `executeRehearsalGuardedSceneLaunch` (mutating + non-mutating branches) |

## Schema

Migration **`20260418193000`** (pre-existing) + **`20260418220000_scene_launch_audit_classification`**: adds `launchClass`, `launchSource`, `policyMode`, `confirmationMode` to `SceneLaunchAuditLog`.

## Verification

```bash
npm run verify:machine-guarded-launch
npm run verify:scene-launch-guard
```

## Deferred

- **Optional** enqueue-time digest pairing for revision jobs (current: execution-time truth only).
- **Defense in depth:** internal allow-list flag inside `runSceneGeneration` (high friction).
- **Book1 bundle engine** remains structurally separate from DB `runSceneGeneration` (unchanged).

## Risks

- **Stricter automation:** revision/repair/orchestration now **fail** when preflight requires human-style elevation unless code passes `allowMachineRiskyLaunch: true` (intentional).
