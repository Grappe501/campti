# Phase 3 - Chunk 1 - Arc Engine Core Inventory

## Scope executed

Arc engine foundation only:

- storyline arc domain contract and typing
- deterministic arc state derivation primitives
- baseline arc transition policy and guardrails
- verification surface for arc determinism and bounded outputs

Out of scope:

- chapter/movement progression orchestration
- branch governance routing
- scene wiring and UI exposure

## Target modules

Planned ownership surface:

- `lib/domain/` (arc contracts, statuses, reason codes)
- `lib/services/` (arc engine service)
- `lib/contracts/contract-registry.ts` (contract governance registration if externally consumed)

## Deliverables checklist

- [ ] Arc domain types and enums are defined and documented
- [ ] Arc engine service returns deterministic output for same input
- [ ] Arc transitions reject invalid previous-state combinations
- [ ] Explanation payload exposes machine-readable reason codes only
- [ ] Contract governance alignment is recorded (registered or intentionally internal)

## Verification checklist

- [ ] Unit tests cover happy path arc derivation
- [ ] Unit tests cover invalid transition rejection
- [ ] Unit tests cover no-prose/no-leakage payload boundaries
- [ ] Unit tests cover deterministic replay behavior
- [ ] Related verify script is added/updated in `package.json`

## Evidence capture

Record exact evidence after execution:

- commands executed:
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
  - [ ] `npm run test -- arc-engine`
- updated files:
  - [ ] `<fill in>`
- notable decisions:
  - [ ] `<fill in>`
- residual risks:
  - [ ] `<fill in>`

## DoD gate

Chunk 1 is complete when arc outputs are deterministic, guardrailed, and fully covered by focused tests with no newly introduced lint/type errors.
