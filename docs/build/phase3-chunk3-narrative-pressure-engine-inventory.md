# Phase 3 - Chunk 3 - Narrative Pressure Engine Inventory

## Scope executed

Pressure system implementation only:

- narrative pressure signal contract
- deterministic pressure scoring and banding
- threshold-trigger output for downstream orchestration
- bounded explanation surface for pressure contributors

Out of scope:

- branch allow/deny governance
- full orchestrator seam composition
- author-facing explainability UI

## Target modules

Planned ownership surface:

- `lib/domain/` (pressure input/output and reason codes)
- `lib/services/` (pressure engine service)
- pressure-related utility modules already present in `lib/`

## Deliverables checklist

- [ ] Pressure contract defines required/optional signals
- [ ] Score normalization range is explicit and enforced
- [ ] Pressure bands (`low`, `medium`, `high`, etc.) are deterministic
- [ ] Threshold behavior emits machine-consumable directives
- [ ] Contributor explanations are bounded and non-prose

## Verification checklist

- [ ] Unit tests cover low/medium/high pressure scenarios
- [ ] Unit tests cover threshold crossing behavior
- [ ] Unit tests cover missing/partial signal normalization
- [ ] Unit tests cover deterministic scoring replay
- [ ] Verify command added/updated for pressure engine

## Evidence capture

Record exact evidence after execution:

- commands executed:
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
  - [ ] `npm run test -- narrative-pressure`
- updated files:
  - [ ] `<fill in>`
- notable decisions:
  - [ ] `<fill in>`
- residual risks:
  - [ ] `<fill in>`

## DoD gate

Chunk 3 is complete when pressure scoring is deterministic, threshold-aware, and validated by focused tests with bounded explanation output.
