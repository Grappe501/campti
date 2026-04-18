import type { ArtifactCanonicalizationReport, CanonicalArtifactRecord } from "@/lib/domain/canonical-artifact-governance";
import { CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION } from "@/lib/domain/canonical-artifact-governance";
import { buildArtifactTruthStamp, buildSceneGenerationCanonicalArtifactRecord } from "@/lib/services/canonical-artifact-record-service";

export { buildArtifactTruthStamp, buildSceneGenerationCanonicalArtifactRecord } from "@/lib/services/canonical-artifact-record-service";
export { evaluateArtifactTruthRule } from "@/lib/services/artifact-canonical-evidence-validation-service";

/**
 * Aggregates one or more canonical artifact records for operator / certification views.
 * Flags **ambiguous** combinations (e.g. authority vs trust class) for drift triage.
 */
export function buildArtifactCanonicalizationReport(input: {
  runId: string;
  records: CanonicalArtifactRecord[];
}): ArtifactCanonicalizationReport {
  const ambiguous: string[] = [];
  for (const r of input.records) {
    const ts = r.truthStamp;
    if (ts.authorityClass === "blocked_from_save" && ts.saveEligibility.eligibleForCanonicalGenerationTextSave) {
      ambiguous.push(`${r.artifactId}:blocked_authority_but_save_eligible_true`);
    }
    if (ts.authorityClass === "canonical_production" && ts.readinessEvidenceTrustClass === "inadmissible_for_runtime_governance") {
      ambiguous.push(`${r.artifactId}:canonical_authority_vs_inadmissible_trust`);
    }
  }
  return {
    contractVersion: CANONICAL_ARTIFACT_GOVERNANCE_CONTRACT_VERSION,
    runId: input.runId,
    records: input.records,
    ambiguousArtifacts: ambiguous,
    validationFlags: ["cluster7_artifact_canonicalization_report"],
  };
}
