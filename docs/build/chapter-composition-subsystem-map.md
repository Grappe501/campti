# Chapter Composition Subsystem Map

## Upstream Inputs

- `narrative_psychology`: `lib/domain/narrative-psychology.ts`
- `chapter_state`: `lib/domain/chapter-state.ts`
- `narrative_threads`: `lib/domain/narrative-thread.ts`
- route presence events + required route locations

## Composition Core

- schemas/types: `lib/domain/chapter-composition.ts`
- derivation: `lib/services/chapter-composition-derivation-service.ts`
- scene realization: `lib/services/chapter-composition-to-scene-plan-service.ts`
- beat/prose downstream hints: `lib/services/chapter-composition-to-beat-bias-service.ts`
- validation: `lib/services/chapter-composition-validation-service.ts`
- density/thinness: `lib/services/chapter-composition-density-service.ts`

## Delayed Convergence / Callback / Reinterpretation

- callback planning: `lib/services/chapter-callback-planning-service.ts`
- reinterpretation anchors: `lib/services/chapter-reinterpretation-anchor-service.ts`

## Route and Philosophy Subsystems

- route recurrence ledger: `lib/services/route-recurrence-ledger-service.ts`
- philosophy propagation planner: `lib/services/philosophy-propagation-service.ts`

## Cockpit Surface

- bundle contract: `lib/domain/author-command-cockpit.ts`
- bundle assembly: `lib/services/author-command-cockpit-service.ts`
- authoritative UI surface: `components/admin/author-command-cockpit.tsx`
- runtime wiring: `lib/services/book1-regeneration-loop-service.ts`

## Test Coverage

- composition and derivation: `lib/services/chapter-composition-derivation-service.test.ts`
- cockpit summary integration: `lib/services/author-command-cockpit-service.test.ts`

## Data Flow

1. Psychology/state/thread data enters derivation service.
2. Scene roles + count + delayed convergence are composed.
3. Callback + reinterpretation + route ledger + philosophy plans attach.
4. Density analysis scores chapter thickness.
5. Validation service confirms plan integrity.
6. Cockpit summary surfaces composition quality and carry-forward pressure.
