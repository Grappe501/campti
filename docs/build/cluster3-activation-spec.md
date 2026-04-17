# Cluster 3 — Continuity, emotional gravity, hook, narrator activation

## Canonical path

Book 1 chapter regeneration orchestration (`book1-regeneration-loop-service`) is the integration surface:

1. Literary device merge → base `proseConstraints`
2. Sequence derivation → ENCS (recall windows)
3. ENCS + EEGS packs + validations
4. Sequence validation (includes **HCEL hook risks** from ENCS validation)
5. EEGS pack, narrator pack + validations
6. **`CanonicalRuntimeCluster3GovernanceService`** merges ENCS/EEGS/narrator into `proseConstraints` **before** `SceneGenerationEngineService.run`
7. Prose preflight / output path consume merged constraints

## Non-goals

- No parallel “shadow” runtime: all promotion goes through the same `proseConstraints` → scene generation handoff.
- First-person narrator remains gated by existing narrator validation (hard failures surface as `cluster3_*` drift/validation flags).

## Cockpit

`AuthorCommandCockpitBundle.cluster3RuntimeActivationTruth` documents merge status, validation outcomes, and residual sample-seeded scaffolding in ENCS/EEGS packs.
