# Narrative Psychology Subsystem Map

## Services
- `lib/services/narrative-psychology-derivation-service.ts`
  - Builds Book 1 production architecture and chapter 1-8 targets.
- `lib/services/narrative-psychology-validation-service.ts`
  - Hard-fails vague, cliffhanger-only, and tone-incompatible psychology.
- `lib/services/narrative-psychology-to-chapter-state-service.ts`
  - Maps chapter psychology targets into chapter-state axis biases.
- `lib/services/narrative-psychology-to-beat-profile-service.ts`
  - Maps chapter-state narrative bias into beat-weight bias.

## Runtime Integration Point
- `lib/services/book1-regeneration-loop-service.ts`
  - Derives and validates architecture.
  - Produces chapter-level psychology artifacts.
  - Injects psychology bias into state-driven beat assembly.
  - Surfaces cockpit-visible psychology + drift summary.

## Cockpit Surfaces
- `lib/domain/author-command-cockpit.ts`
- `lib/services/author-command-cockpit-service.ts`
- `components/admin/author-command-cockpit.tsx`

Added cockpit sections:
- Narrative psychology summary
- Pull score and carry-forward hook
- Drift warnings
