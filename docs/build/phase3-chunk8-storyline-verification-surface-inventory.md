# Phase 3 - Chunk 8 - Storyline Verification Surface Inventory

## Scope executed

Verification-surface hardening only:

- defined a storyline umbrella verification command in `package.json`
- normalized command naming with explicit `verify:chapter-progression` alias
- integrated storyline umbrella verification into strict full-system flow (`scripts/verify-full-system.ts`)
- captured explicit gap inventory and traceability map below

Out of scope (preserved):

- feature logic expansion
- UI work
- final certification decision/run

## Verification gap inventory (post-Chunk-7 baseline)

| Gap id | Behavior area | Gap before this chunk | Risk if unaddressed | Action in Chunk 8 | Status |
| --- | --- | --- | --- | --- | --- |
| G1 | Storyline proof centralization | No single storyline verify umbrella | Partial/manual proof execution | Added `verify:storyline` command | Closed |
| G2 | Chapter command discoverability | `verify:chapter-movement-progression` only (no expected alias) | Missed execution in scripted runs | Added `verify:chapter-progression` alias | Closed |
| G3 | Strict full-system storyline coverage | Full-system runner did not explicitly call storyline umbrella | Storyline regressions could bypass release runner | Added `npm run verify:storyline` to `verify-full-system` command list | Closed |
| G4 | Traceability from command to subsystem | Proof commands existed but not consolidated in a chunk-level inventory | Audit friction / hidden proof surfaces | Added command-to-subsystem map below | Reduced |

## Storyline verification command map

| Command | Primary subsystem proof target |
| --- | --- |
| `npm run verify:arc-engine` | Arc lifecycle determinism and structural legitimacy |
| `npm run verify:chapter-progression` | Chapter/movement progression legitimacy and bounded transition readiness |
| `npm run verify:narrative-pressure` | Pressure boundedness, blocked/reinforced logic, non-override behavior |
| `npm run verify:branch-governance` | Divergence legitimacy, depth/risk/reconvergence governance |
| `npm run verify:storyline-orchestrator` | Storyline bundle assembly determinism, mode restrictions, bounded output |
| `npm run verify:storyline-wiring` | Scene/interaction storyline consumption boundedness and non-forcing behavior |
| `npm run verify:storyline-explainability` | Author/debug explainability correctness, boundedness, non-reader leakage |
| `npm run verify:interaction-truth-firewall` | Truth-plane contamination prevention across storyline paths |
| `npm run verify:storyline` | Aggregated execution of all storyline proof points above |

## Full-system verification integration

- `scripts/verify-full-system.ts` now includes:
  - `npm run verify:storyline`
- Result:
  - strict full-system verification now executes storyline proof coverage explicitly
  - no hidden/manual-only storyline proof path is required for strict runs

## Evidence snapshot

- Commands executed:
  - `npm run verify:storyline`
  - `npm run verify:prelaunch:strict`
  - `npm run verify:full-system:strict`
- Updated files:
  - `package.json`
  - `scripts/verify-full-system.ts`
  - `docs/build/phase3-chunk8-storyline-verification-surface-inventory.md`
- Residual risk:
  - Storyline proof quality remains dependent on per-subsystem test depth; Chunk 9 certification run is still required for final release sign-off.

## DoD gate outcome

Chunk 8 DoD gate: **PASS**  
Storyline verification is centralized, strict full-system flow includes storyline proof execution, and verification traceability is explicit and auditable.
