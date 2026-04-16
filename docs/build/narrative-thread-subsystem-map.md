# Narrative Thread Subsystem Map

## Domain Layer

- `lib/domain/narrative-thread.ts`
  - canonical schemas and types for thread objects, nodes, chapter composition, callback/reentry, reinterpretation, setting coverage, cockpit inspection, and thread pack

## Service Layer

- `lib/services/narrative-thread-validation-service.ts`
  - schema + semantic validation
  - thread state transition policy
- `lib/services/narrative-thread-derivation-service.ts`
  - Book 1 sample pack generation
  - cockpit inspection derivation and density analytics
- `lib/services/narrative-thread-to-chapter-state-service.ts`
  - thread -> chapter-state axis influence
  - chapter-state -> thread activation recommendation
  - continuity projection for chapter-state integration
- `lib/services/narrative-thread-to-beat-profile-service.ts`
  - active thread -> beat weight bias
  - merge into chapter-state beat recommendation
- `lib/services/chapter-composition-service.ts`
  - multi-scene chapter composition model
  - disconnection + delayed convergence viability checks
- `lib/services/thread-callback-reentry-service.ts`
  - callback event derivation
  - delayed convergence event synthesis
  - multi-POV reinterpretation payload derivation
- `lib/services/setting-thread-coverage-service.ts`
  - Red River route recurrence coverage
  - direct + indirect appearance accounting

## Integration Layer

- `lib/services/book1-regeneration-loop-service.ts`
  - consumes sample thread pack
  - projects continuity threads into chapter-state derivation input
  - injects thread beat influence into beat recommendation
  - emits cockpit `narrativeThreads` payload
  - includes setting coverage recommendations in cockpit warnings

- `lib/services/author-command-cockpit-service.ts`
  - accepts optional `narrativeThreads` inspection payload

- `components/admin/author-command-cockpit.tsx`
  - renders thread counts, callback markers, delayed convergence markers, reinterpretation candidates, scene density, and warnings

## Existing Systems Reused

- chapter-state derivation/validation (`lib/chapter-state/*`)
- chapter-state -> beat assembly adapter (`lib/services/chapter-state-to-beat-assembly-chain-service.ts`)
- narrative psychology overlays (`lib/services/narrative-psychology-*.ts`)
- authoritative cockpit bundle/service/component (`lib/domain/author-command-cockpit.ts`, `lib/services/author-command-cockpit-service.ts`, `components/admin/author-command-cockpit.tsx`)

## Data Flow

1. Build narrative thread pack
2. Project continuity lines into chapter-state inputs
3. Derive chapter-state and thread/chapter influence
4. Derive thread beat influence and merge with psychology + chapter-state beat recommendation
5. Assemble beat chain
6. Derive thread inspection + setting coverage
7. Surface thread analytics in cockpit
