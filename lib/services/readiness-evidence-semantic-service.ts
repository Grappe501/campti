import type { ArtifactAuthorityClass } from "@/lib/domain/canonical-artifact-governance";

export { evaluateReadinessCertificationDepth } from "@/lib/services/readiness-certification-depth-service";
export { evaluateArtifactTruthRule } from "@/lib/services/artifact-canonical-evidence-validation-service";

/**
 * Detects **readiness evidence inflation**: presentation claims that outrun artifact authority or certification truth.
 * Complements the invariant catalog’s `inv.readiness_evidence_not_inflated` for cockpit-vs-runtime checks.
 */
export function evaluateReadinessEvidenceInflationRisk(input: {
  /** Cockpit or operator UI claims production-grade is allowed. */
  cockpitMayPresentAsProductionGrade: boolean;
  /** Artifact authority from Cluster 7 truth stamp. */
  artifactAuthorityClass: ArtifactAuthorityClass;
  certificationTruthRuleSatisfied: boolean;
}): { inflated: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (input.cockpitMayPresentAsProductionGrade && !input.certificationTruthRuleSatisfied) {
    reasons.push("cockpit_production_grade_without_certification_truth");
  }
  if (input.cockpitMayPresentAsProductionGrade && input.artifactAuthorityClass !== "canonical_production") {
    reasons.push("cockpit_production_grade_vs_non_canonical_artifact_authority");
  }
  return { inflated: reasons.length > 0, reasons };
}
