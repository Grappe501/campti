# Phase 3 - Chunk 7 - Author / Debug Storyline Explainability Inventory

## Scope executed

Explainability layer only:

- storyline explainability contract
- deterministic explainability mapping service
- author/debug retrieval seam integration
- leakage-safe explainability gating between author/debug and reader surfaces

Out of scope:

- reader-facing debug tools
- certification matrix and final release decision
- unrelated workflow UI changes

## Target modules

Planned ownership surface:

- `lib/domain/` (storyline explainability payload contract)
- `lib/services/` (storyline explainability assembly service)
- `app/actions/` (author/debug explainability endpoints where applicable)

## Deliverables checklist

- [ ] Explainability contract captures reason codes and factor contributions
- [ ] Service outputs deterministic explainability for identical storyline input
- [ ] Explainability retrieval is role-gated and endpoint-bounded
- [ ] Reader surfaces do not receive author/debug explanation by default
- [ ] Trace correlation IDs are included for audit/debug workflows

## Verification checklist

- [ ] Unit tests cover explainability payload shape stability
- [ ] Unit tests cover deterministic mapping behavior
- [ ] Tests cover role-gating and leakage prevention
- [ ] Tests cover missing/partial source-data handling
- [ ] Verify command added/updated for storyline explainability

## Evidence capture

Record exact evidence after execution:

- commands executed:
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
  - [ ] `npm run test -- storyline-explainability`
- updated files:
  - [ ] `<fill in>`
- notable decisions:
  - [ ] `<fill in>`
- residual risks:
  - [ ] `<fill in>`

## DoD gate

Chunk 7 is complete when author/debug explainability is deterministic, role-gated, traceable, and validated against leakage risk.
