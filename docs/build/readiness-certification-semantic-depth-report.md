# Readiness Certification Semantic Depth (Cluster 7)

## Contract version

`READINESS_CERTIFICATION_DEPTH_CONTRACT_VERSION` is **2** — adds certification truth rule, artifact truth rule, `mayPresentAsExecutionReady`, `mayPresentAsProductionGrade`, and `evidenceDerivedFromCluster7Envelope` (see `lib/domain/certification-truth-rules.ts`).

## Record

`ReadinessCertificationEvidenceRecord` (`lib/domain/readiness-certification-depth.ts`) extends boolean readiness with:

- `canonicalRuntimeAuthorityUsed` — governance merge
- `governanceConvergenceSatisfied` — merge applied (strict convergence can be extended)
- `cluster3GovernorsMaterial` — ENCS/EEGS/narrator/hook signals
- `humanGravityNoResetTruthPreserved` / `proseRealismNotCriticallyFailed`
- `narratorBoundaryRespected` / `continuityEmotionalHookSystemsTruthfullyClassified`
- `artifactTrustClass` — aligned with `ReadinessEvidenceTrustClass`
- `persistedOutputsMatchClaims` — from `PersistenceGovernanceDecision.mayDescribeAsCanonicalReady`
- `advisoryEvidenceUsed` — cockpit observational-only flag when passed
- `blockingReasons` / `qualificationNotes`
- **Gates:** `certificationTruthRuleSatisfied`, `artifactTruthRuleSatisfied`, `saveEligibilityNonDowngraded`, `mayPresentAsExecutionReady`, `mayPresentAsProductionGrade`

## Builder

`evaluateReadinessCertificationDepth` in `lib/services/readiness-certification-depth-service.ts` consumes invariant report + persistence decision + pre-generation bundle.

## Trust rule alignment

Authoritative production tier requires governance merge, no hard invariant failures, and non-failing realism/human-gravity when those layers ran — see `trustClassForArtifact` and Cluster 2 readiness rules in `docs/build/readiness-evidence-trust-rules.md`.
