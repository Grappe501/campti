# Cluster 3 implementation report

## 1. Audited

- `book1-regeneration-loop-service` prose → scene generation ordering
- `EpicContinuityDerivationService`, `EpicEmotionalGravityDerivationService`, `NarratorPresenceDerivationService` downstream artifacts
- `ProseGenerationConstraintDerivationService` narrator stub path
- `NarrativeSequenceValidationService`, `EpicContinuityValidationService` hook / anti-dropoff rules
- `enforcement-registry-service` subsystem rows for ENCS, EEGS, HCEL, narrator

## 2. Existing systems reused

- ENCS / EEGS packs and validations (unchanged schemas)
- `NarratorPresenceToProseService`
- Hook continuity logic already in `EpicContinuityValidationService`

## 3. New files

- `lib/services/canonical-runtime-cluster3-governance-service.ts`
- `lib/services/canonical-runtime-cluster3-governance-service.test.ts`
- `docs/build/cluster3-activation-spec.md`
- `docs/build/cluster3-implementation-report.md` (this file)
- `docs/build/activation-status-registry.md`
- `docs/build/deterministic-derivation-retirement-report.md`
- `docs/build/encs-eegs-hcel-narrator-runtime-promotion-report.md`

## 4. Updated files (non-exhaustive)

- `lib/services/book1-regeneration-loop-service.ts`
- `lib/services/prose-generation-constraint-derivation-service.ts`
- `lib/services/narrative-sequence-validation-service.ts`
- `lib/domain/narrative-sequence.ts`
- `lib/domain/author-command-cockpit.ts`
- `lib/services/author-command-cockpit-service.ts`
- `lib/services/enforcement-registry-service.ts`
- `lib/services/narrative-sequence-validation-service.test.ts`

## 5–8. Promotion summaries

See `docs/build/encs-eegs-hcel-narrator-runtime-promotion-report.md`.

## 9. Deterministic reduction

See `docs/build/deterministic-derivation-retirement-report.md`.

## 10. Enforcement

See `docs/build/activation-status-registry.md`. Registry validates (`npm run verify:enforcement-contract`).

## 11. Gates

- Sequence: `cluster3_hook_continuity_pressure` when ENCS validation emits ANTI-DROPOFF / reader-carry failures into `cluster3EpicContinuityHookRisks`.
- Prose: `cluster3_hcel_hook_transition_hard_signal`, pack validation flags, narrator hard-failure drift entries.

## 12. Cockpit

`cluster3RuntimeActivationTruth` on `AuthorCommandCockpitBundle` (beat-blocked and success paths).

## 13. Risks / deferred

- Production DB-backed `runSceneGeneration` path is not fully duplicated here; regeneration bundle remains the integrated test surface.
- Further reduction of deterministic ENCS/EEGS fixtures requires broader refactors of derivation services.

## 14. Next step

Wire the same `CanonicalRuntimeCluster3GovernanceService` entry point into any additional chapter pipeline that builds `ProseGenerationConstraints` immediately before scene generation, and thread real `recallWindows`/thread ids from persisted chapter state.
