# CHUNK 6 Verification Surface Inventory

This report documents verification-surface gaps identified in CHUNK 6, what was strengthened, and what remains.

## Scope

- Goal: close critical verification gaps for chronology, epic mapping, certification consistency, contract coverage, and runtime dependency consistency.
- Out of scope: feature logic, architecture redesign, broad contract/storage redesign.

## Task 1 Verification Gap Inventory

| Area | Gap found | Why it matters | Addressed now |
|---|---|---|---|
| World-state chronology enforcement | No dedicated top-level verification command despite chronology-critical pure tests existing | Chronology index ordering is a primary invariant; missing command reduces visibility in release checks | Yes (`verify:chronology`) |
| Epic book / world-state mapping | No dedicated top-level verification command despite overlap/ambiguity tests existing | Ambiguous or overlapping mapping can silently destabilize spine alignment | Yes (`verify:epic-mapping`) |
| Certification consistency | No direct tests for strict-mode enforcement and skip semantics in certification utilities | Strict mode guarantees can regress silently if utility behavior changes | Yes (`verify:certification-consistency`) |
| Contract coverage completeness | Registry verification did not explicitly enforce that every registered contract has current-version schema parser coverage | Contracts can drift into partially governed state without obvious CI signal | Yes (strengthened `contract-registry.test.ts`) |
| Runtime dependency verification consistency | Runtime dependency classifier behavior had no dedicated test surface; full-system flow did not explicitly validate this consistency layer | Misclassified dependency failures can produce misleading outcomes in harness/certification interpretation | Yes (`verify:runtime-dependency-consistency`) |
| Full-system strict flow completeness | `verify:full-system` omitted contracts/drift/chronology/epic/cert-consistency/runtime-dependency checks | "Full-system strict" could pass while key invariants remained unverified | Yes (added commands to `scripts/verify-full-system.ts`) |

## Task 2 New Verification Commands Added

Added in `package.json`:

- `verify:chronology`
  - Runs `lib/domain/world-state-chronology.test.ts`
- `verify:epic-mapping`
  - Runs:
    - `lib/domain/epic-book.test.ts`
    - `lib/services/world-book-mapper.test.ts`
    - `lib/services/epic-book-service.test.ts`
- `verify:certification-consistency`
  - Runs `lib/certification/certification-consistency.test.ts`
- `verify:runtime-dependency-consistency`
  - Runs `lib/services/runtime-dependency-guard.test.ts`

## Task 3 Existing Verification Strengthened

- `lib/contracts/contract-registry.test.ts`:
  - Added assertion that every registered contract has a schema parser for `currentVersion`.
- `scripts/verify-full-system.ts`:
  - Added explicit commands for:
    - contracts
    - contract drift
    - chronology
    - epic mapping
    - certification consistency
    - runtime dependency consistency
    - interaction truth firewall

This reduces misleading “green” outcomes where major invariants were not part of full-system strict flow.

## Task 4 Inclusion in Full-System Flow

Critical additions are now directly included in full-system verification command execution (`scripts/verify-full-system.ts`), not hidden behind manual-only expectations.

## Remaining Verification Gaps (Intentional / Deferred)

- Contract verification still cannot auto-generate semantic valid payload samples for every contract family; coverage remains a mix of registry invariants + targeted payload family tests.
- Runtime dependency checks are currently focused on classification consistency and migration readiness; deeper end-to-end dependency fault injection is deferred.

## Duplicated/Conflicting Verification Logic Callout

- Migration readiness runs in both `verify:prelaunch` and strict `verify:full-system` (direct + through prelaunch).
- This duplication is currently acceptable as defense-in-depth; a later cleanup could centralize migration-readiness invocation while preserving strict failure semantics.
