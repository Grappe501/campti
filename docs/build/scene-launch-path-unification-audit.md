# Scene Launch Path Unification Audit

**Updated:** 2026-04-18  
**Goal:** Every path that reaches **`runSceneGeneration`** goes through **guard evaluation**, **allowance policy**, and **audit recording** via **`executeGuardedSceneLaunch`** (interactive, machine, or rehearsal), except **internal** `scene-generation-service` wrappers.

**Single implementation of LLM scene prose:** `lib/services/scene-generation-service.ts` → `runSceneGeneration` → `generateSceneProseWithModel`.

---

## Guarded — universal coverage

| Entry | Mechanism |
|--------|-----------|
| Author UI — Preflight + Cockpit | `confirmAndLaunchSceneGenerationAction` → `executeSceneLaunchAfterGuard` → `executeGuardedSceneLaunch` (`interactive`) |
| Server actions — full / draft / rewrite / repair | `app/actions/scene-generation.ts` → `executeSceneLaunchAfterGuard` |
| Scene repair | `executeSceneRepair` → `executeMachineGuardedSceneLaunch` (`scene_repair_service`) |
| Revision jobs | `runClaimedRevisionJob` → `executeSceneRepair` with `launchSource: revision_job` |
| Draft package orchestration | `orchestrateSceneDraftPackage` → `executeMachineGuardedSceneLaunch` (`draft_package_orchestration`) |
| Cluster 9 dry-run script | `executeRehearsalGuardedSceneLaunch` (`cluster9_dry_run`) |

---

## Direct `runSceneGeneration(` inventory (production TS/TSX)

| Location | Role |
|----------|------|
| `scene-generation-service.ts` | Definition + thin wrappers — **low-level**; documented |
| `scene-launch-guard-service.ts` | **Only** external caller after unification |

---

## Indirect callers (via wrappers)

`generateSceneDraft` / `rewriteSceneDraft` / `repairSceneContinuity` remain **internal** to `scene-generation-service`; canonical repair/orchestration **must not** call them directly (repair now uses guarded machine launch with the correct `intent`).

---

## Not `runSceneGeneration` (unchanged)

| Component | Reason |
|-----------|--------|
| `SceneGenerationEngineService` | Book/chapter **bundle** engine — deterministic / structural |
| Deprecated aliases in `scene-generation-llm-adapter.ts` | Not production prose entry |

---

## Verification commands

```bash
npm run verify:machine-guarded-launch
rg "runSceneGeneration\\(" --glob "*.ts" --glob "*.tsx"
```

Expected: call sites limited to **`scene-generation-service`** (internals) and **`scene-launch-guard-service`** (guarded).

---

## Follow-on: Run Ledger + Replay Panel

Use **`SceneLaunchAuditLog.launchClass` / `launchSource` / `confirmationMode`** plus preflight hash preview and `cluster7RuntimeTruth.runId` for trustworthy replay across interactive and machine launches.
