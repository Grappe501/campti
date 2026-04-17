import type { CanonicalArtifactRecord } from "@/lib/domain/canonical-artifact-governance";
import type { CanonicalPreGenerationBundle } from "@/lib/domain/canonical-scene-generation-governance";
import type { ReadinessCertificationEvidenceRecord } from "@/lib/domain/readiness-certification-depth";
import { READINESS_CERTIFICATION_DEPTH_CONTRACT_VERSION } from "@/lib/domain/readiness-certification-depth";
import type { ReadinessEvidenceTrustClass } from "@/lib/domain/enforcement-contract";
import type { PersistenceGovernanceDecision } from "@/lib/domain/persistence-governance";
import type { RuntimeSemanticInvariantReport } from "@/lib/domain/runtime-semantic-invariant";
import { evaluateArtifactTruthRule } from "@/lib/services/artifact-canonical-evidence-validation-service";

export type ReadinessDepthInput = {
  evaluationId: string;
  evaluatedAtIso: string;
  canonicalPreGeneration: CanonicalPreGenerationBundle | null | undefined;
  realismValid: boolean | null;
  humanGravityNoResetValid: boolean | null;
  persistence: PersistenceGovernanceDecision;
  invariantReport: RuntimeSemanticInvariantReport;
  cockpitObservationalOnly?: boolean;
  /** Cluster 7 — canonical artifact record for artifact truth rule validation. */
  canonicalArtifactRecord: CanonicalArtifactRecord | null;
  proseRealismLayerRan: boolean;
  humanGravityLayerRan: boolean;
  saveGenerationTextRequested: boolean;
  /** True when this record is assembled from the Cluster 7 runtime truth envelope (not report-only). */
  evidenceDerivedFromCluster7Envelope: boolean;
  /** When true, blocks production-grade presentation (cross-layer drift error). */
  driftHasBlockingErrors?: boolean;
};

function trustClassForArtifact(
  governanceMerge: boolean,
  realismValid: boolean | null,
  hgValid: boolean | null,
  hardInvariantFailures: number
): ReadinessEvidenceTrustClass {
  if (hardInvariantFailures > 0) return "inadmissible_for_runtime_governance";
  if (!governanceMerge) return "observational_only";
  if (realismValid === false || hgValid === false) return "qualified_production";
  return "authoritative_production";
}

/**
 * Deeper readiness semantics than boolean wrappers — combines governance, validation, persistence truth,
 * artifact truth rule, and certification truth rule (execution-ready / production-grade gating).
 */
export function evaluateReadinessCertificationDepth(input: ReadinessDepthInput): ReadinessCertificationEvidenceRecord {
  const governanceMerge = Boolean(input.canonicalPreGeneration?.governanceMergeApplied);
  const hardInvariantFailures = input.invariantReport.hardViolations.length;
  const artifactTrust = trustClassForArtifact(
    governanceMerge,
    input.realismValid,
    input.humanGravityNoResetValid,
    hardInvariantFailures
  );

  const artifactRule = input.canonicalArtifactRecord
    ? evaluateArtifactTruthRule(input.canonicalArtifactRecord, {
        proseRealismLayerRan: input.proseRealismLayerRan,
        humanGravityLayerRan: input.humanGravityLayerRan,
      })
    : { satisfied: false, violations: ["missing_canonical_artifact_record"] };

  const saveEligibilityNonDowngraded =
    !input.persistence.overridesApplied.allowSaveOnInvalidRealism &&
    !input.persistence.overridesApplied.allowSaveOnInvalidHumanGravity;

  const persistedOutputsMatchClaims =
    !input.saveGenerationTextRequested || input.persistence.mayDescribeAsCanonicalReady;

  const blockingReasons: string[] = [];
  if (hardInvariantFailures) blockingReasons.push("semantic_invariant_hard_failures");
  if (input.persistence.persistedTruthLabel.startsWith("blocked_")) blockingReasons.push("persistence_blocked");
  if (input.persistence.overridesApplied.allowSaveOnInvalidRealism) blockingReasons.push("save_override_realism");
  if (input.persistence.overridesApplied.allowSaveOnInvalidHumanGravity) blockingReasons.push("save_override_human_gravity");
  if (!artifactRule.satisfied) blockingReasons.push(...artifactRule.violations.map((v) => `artifact_truth:${v}`));
  if (input.driftHasBlockingErrors) blockingReasons.push("cross_system_drift_error");

  const certificationTruthRuleSatisfied =
    input.evidenceDerivedFromCluster7Envelope &&
    governanceMerge &&
    hardInvariantFailures === 0 &&
    artifactRule.satisfied &&
    saveEligibilityNonDowngraded &&
    !input.driftHasBlockingErrors;

  const trustAdmissible =
    artifactTrust !== "inadmissible_for_runtime_governance" && artifactTrust !== "disallowed_non_production";

  const mayPresentAsExecutionReady =
    certificationTruthRuleSatisfied && trustAdmissible && persistedOutputsMatchClaims;

  const mayPresentAsProductionGrade =
    mayPresentAsExecutionReady &&
    artifactTrust === "authoritative_production" &&
    !input.cockpitObservationalOnly &&
    input.realismValid !== false &&
    input.humanGravityNoResetValid !== false;

  const pack = input.canonicalPreGeneration?.packValidations;
  const cluster3 = input.canonicalPreGeneration?.cluster3RuntimeActivationTruth;
  const cluster3GovernorsMaterial = Boolean(
    cluster3 &&
      (cluster3.encsMaterialInfluences.length > 0 ||
        cluster3.eegsMaterialInfluences.length > 0 ||
        cluster3.narratorMaterialInfluences.length > 0 ||
        cluster3.hcelHookHardSignalsActive)
  );

  const narratorBoundaryRespected =
    pack && cluster3
      ? !(pack.narratorPresence.valid === false && cluster3.narratorMaterialInfluences.length > 0)
      : null;

  const continuityEmotionalOk =
    pack && cluster3
      ? !(
          (!pack.epicContinuity.valid && cluster3.encsMaterialInfluences.length > 0) ||
          (!pack.epicEmotionalGravity.valid && cluster3.eegsMaterialInfluences.length > 0)
        )
      : null;

  return {
    contractVersion: READINESS_CERTIFICATION_DEPTH_CONTRACT_VERSION,
    evaluationId: input.evaluationId,
    evaluatedAtIso: input.evaluatedAtIso,
    canonicalRuntimeAuthorityUsed: governanceMerge,
    governanceConvergenceSatisfied: governanceMerge,
    cluster3GovernorsMaterial,
    humanGravityNoResetTruthPreserved: input.humanGravityNoResetValid,
    proseRealismNotCriticallyFailed: input.realismValid !== false,
    narratorBoundaryRespected,
    continuityEmotionalHookSystemsTruthfullyClassified: continuityEmotionalOk,
    artifactTrustClass: artifactTrust,
    persistedOutputsMatchClaims,
    advisoryEvidenceUsed: input.cockpitObservationalOnly === true,
    evidenceDerivedFromCluster7Envelope: input.evidenceDerivedFromCluster7Envelope,
    artifactTruthRuleSatisfied: artifactRule.satisfied,
    saveEligibilityNonDowngraded,
    certificationTruthRuleSatisfied,
    mayPresentAsExecutionReady,
    mayPresentAsProductionGrade,
    blockingReasons,
    qualificationNotes: [
      !mayPresentAsProductionGrade
        ? "Production-grade presentation is disallowed until certification truth rule, artifact truth rule, and non-downgraded save eligibility are satisfied."
        : "Production-grade presentation allowed under certification truth rules.",
    ],
    validationFlags: [
      "cluster7_readiness_depth",
      "certification_truth_rule",
      "artifact_truth_rule",
    ],
  };
}
