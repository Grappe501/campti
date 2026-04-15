# Build Docs Intent

`docs/build/` is committed evidence and governance context for hardening/release readiness work.

## What belongs here

- Phase/chunk inventories that explain hardening scope, decisions, and residual risks.
- Readiness and audit artifacts that help operators/reviewers understand release trust posture.
- Traceability references that map verification umbrellas to subsystem proof points.

## What does not belong here

- Generated runtime output logs intended only for transient local debugging.
- Duplicate design docs that conflict with canonical architecture guidance.

## Source-of-truth boundaries

- Runtime behavior truth lives in code under `lib/`, `scripts/`, and `prisma/`.
- `docs/build/` is audit/supporting documentation, not executable authority.
- When docs and code disagree, update one explicitly; do not leave silent drift.
