# Runtime Authority Lock Spec

## Purpose

Cluster 1 hardening establishes one canonical production runtime authority and prevents every other runtime surface from being interpreted as canonical production truth.

## Canonical Runtime Decision

- Canonical runtime id: `scene_chapter_production_runtime`
- Canonical authority class: `canonical_production`
- Canonical entrypoints:
  - `lib/services/scene-generation-service.ts::runSceneGeneration`
  - `lib/services/scene-generation-engine-service.ts::SceneGenerationEngineService.run`
  - `lib/services/chapter-assembly-service.ts::assembleChapterReaderText`

## Authority Classes

- `canonical_production`
- `advisory_runtime`
- `simulation_only`
- `report_only`
- `test_only`
- `legacy_or_duplicate`
- `deprecated`

## Lock Rules

1. Exactly one declaration can be `canonical_production`.
2. Any non-canonical runtime is forbidden from:
   - `canDriveProductionArtifacts=true`
   - `canAffectCanonicalOutput=true`
3. Readiness gating is allowed only when `canGateReadiness=true`.
4. Runtime artifacts and cockpit payloads must carry machine-readable `runtimeAuthority` stamps.
5. Claimed authority class must match registry declaration.

## Guardrail Enforcement Points

- `lib/services/runtime-authority-registry-service.ts`
  - registry declaration
  - duplicate/ambiguity exposure
  - canonical lock validation
  - claim/assertion APIs
- `lib/services/scene-generation-engine-service.ts`
  - canonical artifact generation guard
  - bundle-level runtime authority labeling
- `lib/services/generated-scene-bundle-validation-service.ts`
  - non-canonical spoof detection
- `lib/services/author-command-cockpit-service.ts`
  - cockpit runtime authority visibility
- report scripts (`run-production-certification`, `run-ecosystem-certification`)
  - readiness authority assertion
  - report payload labeling
