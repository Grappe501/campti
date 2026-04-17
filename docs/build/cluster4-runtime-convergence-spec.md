# Cluster 4 — Canonical runtime convergence (spec)

## Objective

Eliminate governance divergence between:

- **Book1 regeneration** (`book1-regeneration-loop-service`) — already used Cluster 3 governance via `CanonicalRuntimeCluster3GovernanceService.applyToProseConstraints`.
- **DB / production scene generation** (`runSceneGeneration` → `loadSceneGenerationInput` → `generateSceneProseWithModel`) — previously did not route prose constraints through the same merge.

## Convergence mechanism

1. **`CanonicalNarrativeGovernanceOrchestrationService`** — single orchestration entry that:
   - derives narrative sequence plans;
   - derives and validates ENCS / EEGS / narrator packs;
   - runs `CanonicalRuntimeCluster3GovernanceService.applyToProseConstraints` (no duplicated merge rules).

2. **`prepareCanonicalPreGenerationBundleForScene`** (`scene-generation-governance-input-adapter`) — builds chapter state, beat assembly, base prose (`ProseGenerationConstraintDerivationService` with `deferNarratorToCluster3`), composition plan from persisted scenes, and calls the orchestration service.

3. **Production wiring** — `runSceneGeneration` attaches `canonicalPreGeneration` to `SceneGenerationInput` by default (`applyCanonicalNarrativeGovernance` defaults to true).

4. **Prompt + hash** — `compactCanonicalGovernanceLines` feeds governance into the LLM user prompt; `canonicalPreGeneration` is included in the canonical scene generation hash payload.

## Truthful divergence

- **Literary-device-to-prose layer**: regeneration applies `LiteraryDeviceToProseConstraintsService` before governance; the DB adapter documents parity notes on the pre-generation bundle when literary layering differs.

## Cockpit

`runtimeConvergenceTruth` on `AuthorCommandCockpitBundle` summarizes path, merge application, and signal activity (Cluster 4).
