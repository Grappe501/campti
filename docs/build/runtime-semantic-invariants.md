# Runtime Semantic Invariants (Cluster 7)

## Contract

- **Catalog:** `RUNTIME_SEMANTIC_INVARIANT_CATALOG` in `lib/domain/runtime-semantic-invariant.ts`
- **Evaluation:** `RuntimeSemanticInvariantService` in `lib/services/runtime-semantic-invariant-service.ts`
- **Report:** `RuntimeSemanticInvariantReport` with `hardViolations`, `softViolations`, `suggestedRepairs`

## Invariant classes

| Class | Intent |
|-------|--------|
| `canonical_truth_invariant` | Governance merge applied when canonical prep is on |
| `enforcement_truth_invariant` | Placeholder for registry/cockpit alignment (scene scope deferred) |
| `continuity_integrity_invariant` | Cluster-3 packs vs material influences |
| `narrator_boundary_invariant` | Narrator validity vs material narrator influences |
| `human_gravity_persistence_invariant` | Coherence placeholder when merge on |
| `no_reset_invariant` | Human-gravity no-reset truth |
| `prose_realism_integrity_invariant` | Realism truth rules |
| `artifact_truth_invariant` | `advisoryOnly` envelope on scene output |
| `persistence_truth_invariant` | Saved text vs save-block flags |
| `readiness_evidence_invariant` | Evaluated at readiness/cockpit scope (placeholder on scene runs) |

## Severity

- **hard** — promotion / canonical-ready claims blocked until repaired (e.g. persistence contradiction, governance merge missing when required).
- **soft** — narrative risk, not always blocking save.
- **warning / info** — observability and deferred scope checks.
