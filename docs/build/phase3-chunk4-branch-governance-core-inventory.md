# Phase 3 - Chunk 4 - Branch Governance Core Inventory

## Scope executed

Branch governance foundation only:

- branch policy contract and decision schema
- branch validation and fail-closed enforcement service
- policy reason-code output for traceability
- baseline governance verification surface

Out of scope:

- full storyline orchestrator composition
- scene/interaction wiring
- author/debug explainability endpoints

## Target modules

Planned ownership surface:

- `lib/domain/` (branch governance contract)
- `lib/services/` (branch governance service)
- `lib/certification/` (enforcement and governance checks where applicable)

## Deliverables checklist

- [ ] Governance contract models allow, deny, and degrade outcomes
- [ ] Service fails closed for unknown policy state
- [ ] Violation output includes stable reason codes
- [ ] Policy decisions are deterministic for identical input
- [ ] Truth and role boundaries are explicitly guarded

## Verification checklist

- [ ] Unit tests cover allowed branch path
- [ ] Unit tests cover denied branch path
- [ ] Unit tests cover degraded/fallback branch path
- [ ] Unit tests cover unknown policy fail-closed behavior
- [ ] Verify command added/updated for branch governance

## Evidence capture

Record exact evidence after execution:

- commands executed:
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
  - [ ] `npm run test -- branch-governance`
- updated files:
  - [ ] `<fill in>`
- notable decisions:
  - [ ] `<fill in>`
- residual risks:
  - [ ] `<fill in>`

## DoD gate

Chunk 4 is complete when branch governance enforces deterministic fail-closed policy decisions and all governance paths are verified.
