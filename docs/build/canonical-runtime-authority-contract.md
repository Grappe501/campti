# Canonical Runtime Authority Contract

## Authoritative Entrypoint Contract

Canonical production runtime is:

- runtime id: `scene_chapter_production_runtime`
- authority class: `canonical_production`

Authoritative service boundary:

1. `runSceneGeneration` resolves generation truth input and model execution.
2. `SceneGenerationEngineService.run` derives scene bundles used as production-ready generation artifacts.
3. `assembleChapterReaderText` assembles chapter output from runtime scene state.

## Canonical Artifact Qualification

An artifact is canonical only if all are true:

1. produced by runtime id `scene_chapter_production_runtime`
2. stamped with `runtimeAuthority.isCanonicalProduction=true`
3. emitted by a path with `canDriveProductionArtifacts=true`
4. passes authority-consistent validation checks

## Authoritative Readiness Evidence

Readiness decisions are authoritative only when:

1. runtime declaration has `canGateReadiness=true`
2. readiness payload is authority-labeled
3. evidence source does not claim non-canonical runtime as canonical production

## Advisory and Simulation Contract

- advisory systems remain active and reusable.
- advisory/simulation/report/test/legacy/deprecated systems are never canonical production authority.
- these systems must carry explicit runtime authority labels.
- these systems cannot mutate canonical output authority unless promoted through canonical runtime.

## Future Cluster Rules (Clusters 2-9)

1. Do not introduce a second canonical runtime.
2. New runtime paths must be declared in the registry before use.
3. New artifacts must expose machine-readable runtime authority stamp.
4. Any readiness/certification surface must assert `canGateReadiness=true`.
5. Advisory paths can inform canonical runtime but cannot claim canonical authority.
