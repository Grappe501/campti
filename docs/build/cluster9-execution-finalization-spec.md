# Cluster 9 — execution, demo, and author workflow finalization

## Purpose

Cluster 9 closes the loop between **canonical runtime execution** (`scene_chapter_production_runtime`), **operator inspection** (`cockpit_inspection_helpers`), and **author-owned persistence** for character simulation inputs. There is no alternate “demo runtime”: the demo narrative is the same code path with explicit runtime labels.

## Final execution contract (machine + human)

- **Domain:** `lib/domain/final-execution-package.ts` — `FinalExecutionPackage`, `FinalExecutionReadinessScorecard`, `FinalDryRunDefectLog`.
- **Assembly:** `lib/services/final-execution-package-service.ts` — builds a package from a `SceneGenerationRunResult` + Cluster 7 envelope.
- **Readiness:** `lib/services/final-readiness-scorecard-service.ts` — booleans and risk copy derived from the package (evidence-based, not aspirational).
- **Operator runbook (structured):** `lib/services/final-demo-runbook-service.ts`.
- **Author workflow steps:** `lib/services/final-author-workflow-service.ts`.

## Author-owned character simulation truth

- **Prisma:** `CharacterSimulationAuthorBundle` (1:1 `Person`) — `simulationMindProfileJson`, `simulationVoiceProfileJson` (partial or full shapes matching `CharacterMindProfile` / simulation `CharacterVoiceProfile`).
- **Hydration:** `loadPersistedCharacterSimulationProfilesForPersonIds` merges into deterministic seeds in `CharacterMindSeedService` before `CharacterSimulationRuntimeDerivationService.derive`.
- **Canonical path:** `runSceneGeneration` loads bundles before Cluster 8 derive. Cockpit inspection uses the same merge.
- **Hash:** `persistedCharacterSimulationProfiles` is included in `canonical-scene-generation-hash` when present.
- **Resilience:** If migration `20260418100000_character_simulation_author_bundle_cluster9` is not applied (`P2021`), the loader returns `{}` and truth falls back to seed-only (no hidden demo branch).

## Cockpit operator UX

- **Author Command Cockpit** surfaces `operatorExecutionSummary` (canonical vs cockpit runtime, profile truth, quick links).
- **Character simulation** panel includes `profileTruth`: `persisted_author` | `deterministic_seed_only` | `mixed`.

## Dry run

- **Script:** `npx tsx scripts/cluster9-final-dry-run.ts` (loads `.env` when present).
- **Outputs:** `reports/final-execution-package.json`, `reports/final-readiness-scorecard.json`, `reports/final-dry-run-defect-log.json`, `reports/cluster9-demo-runbook.snapshot.json`.
- **LLM:** When `OPENAI_API_KEY` is missing, the script records a defect and emits a **rehearsal stub** package (`readinessStatus: rehearsal_incomplete`) — truthful, not a fake success.

## Tests

- `npm run verify:cluster9` — `lib/services/cluster9-final-execution.test.ts`.

## Acceptance mapping

| Criterion | Implementation |
|-----------|----------------|
| Formal contract | `final-execution-package.ts` + services |
| Coherent author workflow | Cockpit links + `final-author-workflow-service` |
| Demo-ready cockpit | Operator summary + Cluster 7 strip + enforcement truth |
| Persisted character truth | Prisma model + hydration on canonical path |
| Dry run + defects | Script + JSON defect log |
| Readiness scorecard | `final-readiness-scorecard-service` |
| No demo-only path | Single canonical stack; inspection runtime labeled |
| Report | `docs/build/cluster9-implementation-report.md` |
