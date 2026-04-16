# Prose Generation Subsystem Map

## Domain Contracts
- `lib/domain/prose-generation-constraints.ts`
  - `ProseGenerationConstraints`
  - `ProseGenerationPreflight`
  - `ProseGenerationValidationResult`
  - `Chapter1ProseGenerationPacket`
  - `ProseGenerationOutputPathReport`

## Services
- `prose-generation-constraint-derivation-service.ts`
  - Derives prose constraints from psychology + chapter state + beat chain.
- `prose-generation-preflight-service.ts`
  - Generates paragraph-level preflight constraints.
- `prose-generation-validation-service.ts`
  - Detects hard/soft drift classes.
- `prose-generation-output-path-service.ts`
  - Builds Chapter 1 packet and constrained sample output path.

## Runtime Wiring
- `book1-regeneration-loop-service.ts`
  - Derives constraints after beat chain validation.
  - Emits prose preflight and output-path report artifacts.
  - Runs post-generation prose validation.

## Cockpit Wiring
- `AuthorCommandCockpitBundle` now includes:
  - prose mode,
  - narrative distance,
  - sensory density target,
  - exposition/emotional ceiling/ambiguity allowances,
  - ending momentum profile,
  - compliance and drift warnings.
