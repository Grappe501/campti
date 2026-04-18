# Scene Generation Preflight — Implementation Report

## What was added

- **Domain:** `lib/domain/scene-generation-preflight.ts`, `scene-generation-preflight-rules.ts`, `scene-generation-preflight-validation.ts` (Zod for `sceneId`).
- **Service:** `lib/services/scene-generation-preflight-service.ts` — canonical assembly from existing loaders and services (no duplicate scoring framework).
- **Actions:** `app/actions/scene-generation-preflight.ts` — load, recompute with `revalidatePath`, `assertSceneGenerationLaunchGateAction` for optional server-side gating.
- **UI:** `ScenePreflightTabSection` + `ScenePreflightTabClient` (full panel), `SceneDetailPreflightInline` on Details tab.
- **Scene admin route:** `app/admin/scenes/[id]/page.tsx` — third tab **Preflight** (`?tab=preflight`).
- **Tests:** Rules, validation, optional DB integration smoke for `buildSceneGenerationPreflight`.
- **Verification:** `scripts/verify-scene-generation-preflight.ts` and `npm run verify:scene-generation-preflight`.
- **Documentation:** This file plus `scene-generation-preflight-spec.md`, `scene-generation-preflight-operator-guide.md`, `scene-generation-readiness-model.md`, `scene-generation-remediation-map.md`.

## Files updated

- `app/admin/scenes/[id]/page.tsx` — tabs, copy, Suspense boundaries.
- `package.json` — `verify:scene-generation-preflight` script.
- `lib/services/scene-generation-preflight-service.ts` — execution environment **blocker** when `OPENAI_API_KEY` missing; character simulation **risk** row when cast is not uniformly ready (keeps allowance mapping honest).

## Schema / migrations

None. No persistence layer for preflight history in this pass.

## Fully working

- Preflight tab and Details inline strip on scene admin.
- Server-driven model assembly and **Re-run preflight** via server action + client refresh.
- Launch allowance and global headline aligned with blocker/risk lists.
- Optional `assertSceneGenerationLaunchGateAction` for future `runSceneGeneration` wrappers.

## Advisory / deferred

- **Legacy scene workspace** (`/admin/scenes/[id]/workspace`) currently redirects to the narrative cockpit; AI summary form gating was not mounted there to avoid dead code.
- **Final execution / Cluster 7** mapping remains observational-only until a safe read model exists without running generation.
- **Heuristic-only RICRE** labeling could be deepened using existing RICRE row metadata when exposed on `summarizeRicreForScene`.
- **Partial DB / migration drift:** `summarizeRicreForScene` is wrapped so preflight still returns a view model (advisory) instead of hard-failing the whole panel when RICRE tables are missing. Other loader failures still surface as scene-input blockers as before.

## Verification commands

```bash
npm run verify:scene-generation-preflight
```

## Risks and recommended next steps

- **Double fetch:** Details tab and Preflight tab each call `buildSceneGenerationPreflight` — acceptable for now; consider `React.cache` if profiling shows pain.
- **Wire `assertSceneGenerationLaunchGateAction`** into the canonical `runSceneGeneration` server path so blocked launches cannot bypass the UI.
- Add **cockpit-level** preflight strip when scene-scoped generation controls live entirely under `/admin/narrative`.
