# Cluster 7 — Validation, Contract, Testing, Artifact, and Persistence Hardening

## Purpose

Cluster 7 makes the canonical narrative runtime **operationally trustworthy**: semantic validation (not only JSON shape), explicit artifact authority, auditable persistence, readiness evidence that cannot be silently inflated, and drift detection across runtime output vs cockpit vs persistence claims.

## Normative rules (verbatim)

**CERTIFICATION TRUTH RULE:** A run may not be presented as execution-ready or production-grade unless its readiness/certification evidence is derived from canonical runtime truth, semantically valid artifact records, and non-downgraded save eligibility.

**ARTIFACT TRUTH RULE:** Any scene/chapter/run artifact that does not preserve authority class, enforcement truth, validation outcome, and save eligibility is invalid as canonical evidence.

## Non-negotiables (enforced in code)

1. **Semantic validation** — `RuntimeSemanticInvariantService` evaluates cataloged invariants; hard failures surface in `RuntimeSemanticInvariantReport`.
2. **Contracts reflect truth** — `SceneGenerationRunResult.cluster7RuntimeTruth` carries `Cluster7RuntimeTruthEnvelope` (invariants, artifact record, persistence decision, readiness depth, drift).
3. **Readiness evidence** — `ReadinessCertificationEvidenceRecord` never upgrades trust from enforcement class alone; combines governance merge, validations, persistence, and invariant outcomes.
4. **Canonical artifacts** — `CanonicalArtifactRecord` + `ArtifactTruthStamp` declare authority class, save eligibility, overrides, and trust tier.
5. **Persistence** — `PersistenceGovernanceDecision` labels outcomes (`blocked_invalid_*`, overrides, `mayDescribeAsCanonicalReady`).
6. **Single path** — Hardening extends `runSceneGeneration` and `AuthorCommandCockpitBundle`; no parallel certification system.

## Key modules

| Concern | Location |
|--------|----------|
| Invariant catalog & report types | `lib/domain/runtime-semantic-invariant.ts` |
| Artifact governance types | `lib/domain/canonical-artifact-governance.ts` |
| Persistence labels | `lib/domain/persistence-governance.ts` |
| Readiness depth record | `lib/domain/readiness-certification-depth.ts` |
| Runtime truth envelope | `lib/domain/cluster7-runtime-truth.ts` |
| Orchestration | `lib/services/cluster7-runtime-truth-service.ts` |
| Cockpit summary builder | `buildCockpitCertificationHardeningSummary` |
| Readiness inflation helper | `lib/services/readiness-evidence-semantic-service.ts` |
| Artifact batch report | `lib/services/canonical-artifact-governance-service.ts` |
| Cross-layer drift | `lib/services/cross-system-drift-detection-service.ts` |

## Operator cockpit

Optional `AuthorCommandCockpitBundle.certificationHardening` surfaces save eligibility, trust class, invariant counts, overrides, drift, and remediation targets (see `components/admin/author-command-cockpit.tsx`).
