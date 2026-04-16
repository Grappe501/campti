# EEGS Subsystem Map

## Authoritative Domain Layer

- `lib/domain/epic-emotional-gravity.ts`
  - Formal EEGS schema contract
  - Cross-scale emotional gravity objects
  - Downstream bias, cockpit summary, diagnostics artifacts

## Emotional Gravity Engines

- `lib/services/character-attachment-engine-service.ts`
- `lib/services/irreversibility-consequence-service.ts`
- `lib/services/fate-agency-engine-service.ts`
- `lib/services/relational-stakes-service.ts`
- `lib/services/generational-burden-service.ts`
- `lib/services/emotional-carry-forward-service.ts`
- `lib/services/temporal-emotional-continuity-service.ts`

## Orchestration + Validation

- `lib/services/epic-emotional-gravity-derivation-service.ts`
  - Builds full machine-usable EEGS pack
  - Emits downstream bias map
  - Emits cockpit emotional gravity summary
- `lib/services/epic-emotional-gravity-validation-service.ts`
  - Validates anti-thin emotion rule
  - Validates temporal continuity rule
  - Scores emotional gravity integrity

## Runtime Integration Points

- `lib/services/book1-regeneration-loop-service.ts`
  - Derives EEGS pack each run
  - Validates EEGS pack
  - Exposes EEGS outputs in regeneration artifacts
  - Feeds emotional gravity summary into cockpit bundle

## Cockpit Integration

- `lib/domain/author-command-cockpit.ts`
  - Added `emotionalGravity` section in authoritative bundle
- `lib/services/author-command-cockpit-service.ts`
  - Supports pass-through for emotional gravity section

## Test Surface

- `lib/services/epic-emotional-gravity-system.test.ts`
  - End-to-end EEGS contract, derivation, integration, and pack integrity tests
- `lib/services/author-command-cockpit-service.test.ts`
  - Verifies cockpit emotional gravity section rendering
- `lib/services/book1-regeneration-loop-service.test.ts`
  - Verifies EEGS artifacts exist in runtime output
