# Phase 3 - Chunk 2 - Chapter / Movement Progression Inventory

## Scope executed

Progression layer only:

- chapter/movement progression contracts
- deterministic progression transition service
- progression blocking and resume logic
- progression verification for forward-only narrative flow

Out of scope:

- pressure scoring and escalation
- branch governance enforcement
- orchestrator-level composition

## Target modules

Planned ownership surface:

- `lib/domain/` (chapter/movement progression contract)
- `lib/services/` (progression service)
- scene/chapter integration seams already used by current narrative pipeline

## Deliverables checklist

- [ ] Progression contract distinguishes chapter, movement, and transition status
- [ ] Service enforces allowed transition matrix
- [ ] Service exposes explicit blocked-state reasons
- [ ] Resume path is deterministic and idempotent
- [ ] Integration notes capture compatibility with existing chapter assembly surfaces

## Verification checklist

- [ ] Unit tests cover valid forward progression
- [ ] Unit tests cover blocked progression and reason codes
- [ ] Unit tests cover resume/replay idempotence
- [ ] Tests assert no hidden state mutation outside returned payload
- [ ] Verify command added/updated for progression subsystem

## Evidence capture

Record exact evidence after execution:

- commands executed:
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
  - [ ] `npm run test -- chapter-movement-progression`
- updated files:
  - [ ] `<fill in>`
- notable decisions:
  - [ ] `<fill in>`
- residual risks:
  - [ ] `<fill in>`

## DoD gate

Chunk 2 is complete when chapter/movement progression is deterministic, blocked-state aware, and fully verified for forward progression and resume behavior.
