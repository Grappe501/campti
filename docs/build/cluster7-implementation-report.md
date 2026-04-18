# Cluster 7 — implementation report (validation, contract, artifact, persistence, certification)

## Summary

Cluster 7 hardens **operational trust** on the **existing** canonical scene-generation path: semantic invariants (not only JSON shape), truth-stamped canonical artifacts, auditable persistence labels, readiness/certification depth with explicit **certification** and **artifact** truth rules, cross-layer drift detection, and cockpit visibility — without a parallel certification system.

## What changed in this pass

1. **Semantic invariant domain** — `lib/domain/runtime-semantic-invariant.ts` now documents **CERTIFICATION TRUTH RULE** and **ARTIFACT TRUTH RULE**, adds `hook_continuity_invariant` and catalog entry `inv.hook_pressure_consistent_with_continuity`, and exposes **Zod** `InvariantResultSchema` / `RuntimeSemanticInvariantReportSchema`.
2. **Invariant service** — evaluates **human-gravity coherence** when `humanGravityRuntime` is supplied (prompt substance vs score vs influence truth); evaluates **hook vs continuity**; passes `humanGravityRuntime` from `buildCluster7RuntimeTruthEnvelope`.
3. **Drift detection** — warns when human-gravity truth is invalid but the scene output lacks `cluster6_human_gravity_no_reset_invalid`; **errors** when cockpit `certificationHardening` claims production-grade while artifact authority is not `canonical_production`.
4. **Cockpit certification summary** — adds `canonicalArtifactId` and `semanticInvariantHardFailureIds` for provenance and remediation routing (`author-command-cockpit.tsx`).
5. **Services** — `readiness-evidence-semantic-service.ts` (`evaluateReadinessEvidenceInflationRisk` + re-exports), `canonical-artifact-governance-service.ts` (`buildArtifactCanonicalizationReport` + re-exports).
6. **Persistence domain** — comment tying `mayDescribeAsCanonicalReady` to artifact authority downgrades.
7. **Tests** — expanded `lib/services/cluster7-runtime-hardening.test.ts` (schema parse, hook invariant, HG flag drift, inflation risk, canonicalization report, cockpit summary fields).
8. **Docs** — `readiness-certification-semantic-depth-report.md`; updates to `cluster7-validation-certification-hardening-spec.md`, `runtime-semantic-invariants.md`, `canonical-artifact-governance-report.md`.

## Risks / deferred

- `inv.enforcement_truth_scene_scope` and `inv.readiness_evidence_not_inflated` remain **partially** placeholder at pure scene-run scope; full registry/cockpit wiring is a follow-up.
- Hook invariant uses **epic continuity validity** as a proxy; richer hook-pack validation can tighten further.

## Exact next recommended step

Pass `cockpitObservationalOnly` and live `certificationHardening` into `buildCluster7RuntimeTruthEnvelope` / `evaluateReadinessCertificationDepth` from Book 1 regeneration and DB production cockpit builders so readiness depth matches operator context end-to-end.
