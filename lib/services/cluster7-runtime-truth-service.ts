import type { CockpitCertificationHardeningSummary } from "@/lib/domain/author-command-cockpit";
import type { Cluster7RuntimeTruthEnvelope } from "@/lib/domain/cluster7-runtime-truth";
import type { SceneGenerationRunResult } from "@/lib/domain/scene-generation-output";
import { buildSceneGenerationCanonicalArtifactRecord } from "@/lib/services/canonical-artifact-record-service";
import { CrossSystemDriftDetectionService } from "@/lib/services/cross-system-drift-detection-service";
import { decidePersistenceGovernance } from "@/lib/services/persistence-governance-service";
import { evaluateReadinessCertificationDepth } from "@/lib/services/readiness-certification-depth-service";
import { RuntimeSemanticInvariantService } from "@/lib/services/runtime-semantic-invariant-service";

export type BuildCluster7TruthParams = {
  runId: string;
  sceneId: string;
  sceneGenerationInputHash: string | null;
  applyCanonicalNarrativeGovernance: boolean;
  saveGenerationTextRequested: boolean;
  allowSaveOnInvalidRealism: boolean;
  allowSaveOnInvalidHumanGravity: boolean;
  run: SceneGenerationRunResult;
  /** When set, drift detection compares runtime output to cockpit summaries (human gravity, prose realism, convergence). */
  cockpitDriftContext?: import("@/lib/services/cross-system-drift-detection-service").DriftDetectionInput["cockpitBundle"];
};

/**
 * Assembles Cluster 7 semantic truth for a scene generation run (invariants, artifact stamp, persistence audit, readiness depth, drift).
 */
export function buildCluster7RuntimeTruthEnvelope(params: BuildCluster7TruthParams): Cluster7RuntimeTruthEnvelope {
  const run = params.run;
  const realismInvalid = Boolean(run.proseRealism?.realismTruth && !run.proseRealism.realismTruth.sceneOutputValidUnderRealismRules);
  const hgInvalid = Boolean(
    run.humanGravityValidation?.humanGravityTruth && !run.humanGravityValidation.humanGravityTruth.sceneOutputValidUnderNoResetRules
  );

  const persistence = decidePersistenceGovernance({
    saveGenerationTextRequested: params.saveGenerationTextRequested,
    savedGenerationText: run.savedGenerationText,
    generationTextSaveBlockedByRealism: Boolean(run.generationTextSaveBlockedByRealism),
    generationTextSaveBlockedByHumanGravity: Boolean(run.generationTextSaveBlockedByHumanGravity),
    allowSaveOnInvalidRealism: params.allowSaveOnInvalidRealism,
    allowSaveOnInvalidHumanGravity: params.allowSaveOnInvalidHumanGravity,
    realismInvalid,
    humanGravityInvalid: hgInvalid,
  });

  const invariantReport = new RuntimeSemanticInvariantService().evaluate({
    runId: params.runId,
    sceneId: params.sceneId,
    applyCanonicalNarrativeGovernance: params.applyCanonicalNarrativeGovernance,
    canonicalPreGeneration: run.canonicalPreGeneration,
    output: run.output,
    saveGenerationTextRequested: params.saveGenerationTextRequested,
    savedGenerationText: run.savedGenerationText,
    generationTextSaveBlockedByRealism: Boolean(run.generationTextSaveBlockedByRealism),
    generationTextSaveBlockedByHumanGravity: Boolean(run.generationTextSaveBlockedByHumanGravity),
    proseRealism: run.proseRealism,
    humanGravityValidation: run.humanGravityValidation,
  });

  const canonicalArtifact = buildSceneGenerationCanonicalArtifactRecord({
    runId: params.runId,
    sceneId: params.sceneId,
    sceneGenerationInputHash: params.sceneGenerationInputHash,
    saveGenerationTextRequested: params.saveGenerationTextRequested,
    run,
    persistence,
  });

  const driftReport = new CrossSystemDriftDetectionService().detect({
    runId: params.runId,
    sceneId: params.sceneId,
    run,
    cockpitBundle: params.cockpitDriftContext,
  });

  const proseRealismLayerRan = run.proseRealism != null;
  const humanGravityLayerRan = run.humanGravityRuntime != null || run.humanGravityValidation != null;

  const readinessCertification = evaluateReadinessCertificationDepth({
    evaluationId: params.runId,
    evaluatedAtIso: new Date().toISOString(),
    canonicalPreGeneration: run.canonicalPreGeneration,
    realismValid: run.proseRealism?.realismTruth.sceneOutputValidUnderRealismRules ?? null,
    humanGravityNoResetValid: run.humanGravityValidation?.humanGravityTruth.sceneOutputValidUnderNoResetRules ?? null,
    persistence,
    invariantReport,
    canonicalArtifactRecord: canonicalArtifact,
    proseRealismLayerRan,
    humanGravityLayerRan,
    saveGenerationTextRequested: params.saveGenerationTextRequested,
    evidenceDerivedFromCluster7Envelope: true,
    driftHasBlockingErrors: driftReport.hasError,
  });

  return {
    contractVersion: "1",
    runId: params.runId,
    semanticInvariantReport: invariantReport,
    canonicalArtifact,
    truthStamp: canonicalArtifact.truthStamp,
    persistenceGovernance: persistence,
    readinessCertification,
    driftReport,
  };
}

export function buildCockpitCertificationHardeningSummary(
  envelope: Cluster7RuntimeTruthEnvelope
): CockpitCertificationHardeningSummary {
  const hard = envelope.semanticInvariantReport.hardViolations.length;
  const soft = envelope.semanticInvariantReport.softViolations.length;
  const driftWarnings = envelope.driftReport.findings.filter((f) => f.severity === "warning").map((f) => f.message);
  const driftErrors = envelope.driftReport.findings.filter((f) => f.severity === "error").map((f) => f.message);
  const eligible = envelope.truthStamp.saveEligibility.eligibleForCanonicalGenerationTextSave;
  const rc = envelope.readinessCertification;

  const certLine = rc.mayPresentAsProductionGrade
    ? "Certification truth: production-grade presentation allowed (canonical runtime, valid artifact evidence, non-downgraded save eligibility)."
    : rc.mayPresentAsExecutionReady
      ? "Certification truth: execution-ready only — not production-grade until all certification gates pass."
      : "Certification truth: do not present as execution-ready or production-grade — evidence fails certification truth or artifact truth rules.";

  return {
    contractVersion: "1",
    canonicalArtifactAuthority: envelope.canonicalArtifact.truthStamp.authorityClass,
    saveEligible: eligible,
    saveBlockedReasons: envelope.truthStamp.saveEligibility.blockedReasons,
    readinessEvidenceTrustClass: envelope.truthStamp.readinessEvidenceTrustClass,
    semanticHardViolations: hard,
    semanticSoftViolations: soft,
    overrideUsage: {
      allowSaveOnInvalidRealism: envelope.truthStamp.saveEligibility.saveOverrideLabels.includes("allowSaveOnInvalidRealism"),
      allowSaveOnInvalidHumanGravity: envelope.truthStamp.saveEligibility.saveOverrideLabels.includes(
        "allowSaveOnInvalidHumanGravity"
      ),
    },
    driftWarnings,
    driftErrors,
    certificationReadinessLine: certLine,
    remediationTargets: envelope.semanticInvariantReport.suggestedRepairs.slice(0, 12),
    certificationTruthRuleSatisfied: rc.certificationTruthRuleSatisfied,
    artifactTruthRuleSatisfied: rc.artifactTruthRuleSatisfied,
    mayPresentAsExecutionReady: rc.mayPresentAsExecutionReady,
    mayPresentAsProductionGrade: rc.mayPresentAsProductionGrade,
    validationFlags: [
      "cluster7_cockpit_certification",
      ...(rc.mayPresentAsProductionGrade ? ["may_present_production_grade"] : []),
      ...(rc.mayPresentAsExecutionReady && !rc.mayPresentAsProductionGrade ? ["may_present_execution_ready_only"] : []),
    ],
  };
}
