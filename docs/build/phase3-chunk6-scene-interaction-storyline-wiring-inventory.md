# Phase 3 - Chunk 6 - Scene / Interaction Storyline Wiring Inventory

## Scope executed

Wiring layer only:

- storyline orchestrator output integration into scene and interaction entry seams
- payload shaping for downstream read/render surfaces
- bounded exposure rules for storyline state in interaction mode
- seam-level verification for end-to-end flow continuity

Out of scope:

- author/debug explainability tooling
- certification matrix and final signoff
- product-level UI redesign

## Target modules

Planned ownership surface:

- `app/actions/` (scene/interaction action seams where applicable)
- `lib/services/scene-interaction-entry-service.ts`
- `lib/services/character-reply-generation-adapter.ts`
- `lib/services/conversation-read-model-mapper.ts` (if payload projection changes)

## Deliverables checklist

- [ ] Scene entry paths consume storyline orchestration payload
- [ ] Interaction paths consume bounded storyline context
- [ ] Reader-visible payload excludes internal governance internals by default
- [ ] Storyline identifiers are propagated for traceability
- [ ] Existing scene/interaction behavior remains backward compatible where required

## Verification checklist

- [ ] Integration tests cover scene-mode storyline wiring
- [ ] Integration tests cover interaction-mode storyline wiring
- [ ] Tests cover missing storyline payload fallback behavior
- [ ] Tests assert no leakage of internal-only debug fields
- [ ] Verify command added/updated for storyline wiring seams

## Evidence capture

Record exact evidence after execution:

- commands executed:
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
  - [ ] `npm run test -- storyline-wiring`
- updated files:
  - [ ] `<fill in>`
- notable decisions:
  - [ ] `<fill in>`
- residual risks:
  - [ ] `<fill in>`

## DoD gate

Chunk 6 is complete when scene and interaction seams consume storyline outputs correctly, with bounded payload exposure and passing integration coverage.
