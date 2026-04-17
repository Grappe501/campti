import type { CanonicalArtifactRecord } from "@/lib/domain/canonical-artifact-governance";
import { CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION } from "@/lib/domain/canonical-artifact-governance";

export type ArtifactTruthRuleContext = {
  /** Cluster 5 validation ran on this run. */
  proseRealismLayerRan: boolean;
  /** Cluster 6 validation ran on this run. */
  humanGravityLayerRan: boolean;
};

/**
 * Artifact truth rule: records must preserve authority, enforcement, validation outcomes, and save eligibility
 * as coherent canonical evidence. Structural gaps or missing enforcement truth under governance merge fail.
 */
export function evaluateArtifactTruthRule(
  record: CanonicalArtifactRecord,
  ctx: ArtifactTruthRuleContext
): { satisfied: boolean; violations: string[] } {
  const violations: string[] = [];
  if (record.contractVersion !== CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION) {
    violations.push("artifact_contract_version_mismatch");
  }
  if (!record.artifactId?.trim()) violations.push("missing_artifact_id");
  if (!record.runtimeId?.trim()) violations.push("missing_runtime_id");
  if (!record.runtimePathLabel?.trim()) violations.push("missing_runtime_path_label");

  const ts = record.truthStamp;
  if (ts.contractVersion !== CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION) {
    violations.push("truth_stamp_contract_version_mismatch");
  }
  if (!ts.authorityClass) violations.push("missing_authority_class");
  if (!ts.sceneId?.trim()) violations.push("missing_scene_id");

  if (ts.validationSummary.governanceMergeApplied && ts.enforcementClassesRepresented.length === 0) {
    violations.push("enforcement_truth_missing_when_governance_merged");
  }

  if (ctx.proseRealismLayerRan && ts.validationSummary.realismValid === null) {
    violations.push("validation_outcome_missing_for_prose_realism_layer");
  }
  if (ctx.humanGravityLayerRan && ts.validationSummary.humanGravityNoResetValid === null) {
    violations.push("validation_outcome_missing_for_human_gravity_layer");
  }

  if (ts.saveEligibility.contractVersion !== CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION) {
    violations.push("save_eligibility_contract_missing");
  }
  if (typeof ts.saveEligibility.eligibleForCanonicalGenerationTextSave !== "boolean") {
    violations.push("save_eligibility_flag_missing");
  }

  return { satisfied: violations.length === 0, violations };
}
