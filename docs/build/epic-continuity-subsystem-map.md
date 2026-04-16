# ENCS Subsystem Map

## Authoritative Domain Layer

- `lib/domain/epic-narrative-continuity.ts`
  - Formal epic continuity schema contract
  - Cross-scale continuity objects
  - Cockpit summary and diagnostics artifacts

## Continuity Engines

- `lib/services/epic-question-engine-service.ts`
- `lib/services/narrative-anchor-registry-service.ts`
- `lib/services/identity-persistence-service.ts`
- `lib/services/meaning-escalation-service.ts`
- `lib/services/reader-memory-strategy-service.ts`
- `lib/services/hook-orchestration-service.ts`
- `lib/services/temporal-transition-continuity-service.ts`

## Orchestration + Validation

- `lib/services/epic-continuity-derivation-service.ts`
  - Builds full machine-usable continuity pack
  - Emits downstream bias map
- `lib/services/epic-continuity-validation-service.ts`
  - Validates and scores continuity integrity

## Runtime Integration Points

- `lib/services/book1-regeneration-loop-service.ts`
  - Derives ENCS pack each run
  - Validates pack
  - Exposes ENCS outputs in regeneration artifacts
  - Feeds continuity summary into cockpit bundle

## Cockpit Integration

- `lib/domain/author-command-cockpit.ts`
  - Added `epicContinuity` section
- `lib/services/author-command-cockpit-service.ts`
  - Supports ENCS section pass-through

## Test Surface

- `lib/services/epic-continuity-system.test.ts`
  - End-to-end ENCS contract, derivation, integration, and pack integrity tests
- `lib/services/author-command-cockpit-service.test.ts`
  - Verifies cockpit continuity section rendering
