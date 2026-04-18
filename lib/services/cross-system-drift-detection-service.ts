import type { CrossSystemDriftFinding, CrossSystemDriftReport } from "@/lib/domain/cluster7-runtime-truth";
import { CLUSTER7_RUNTIME_TRUTH_CONTRACT_VERSION } from "@/lib/domain/cluster7-runtime-truth";
import type { AuthorCommandCockpitBundle } from "@/lib/domain/author-command-cockpit";
import type { SceneGenerationRunResult } from "@/lib/domain/scene-generation-output";

export type DriftDetectionInput = {
  runId: string;
  sceneId: string;
  run: SceneGenerationRunResult;
  cockpitBundle?:
    | Pick<
        AuthorCommandCockpitBundle,
        "humanGravityRuntime" | "proseRealism" | "runtimeConvergenceTruth" | "certificationHardening"
      >
    | null;
};

/**
 * Detects semantic drift between runtime outputs, persistence flags, and optional cockpit summaries.
 */
export class CrossSystemDriftDetectionService {
  detect(input: DriftDetectionInput): CrossSystemDriftReport {
    const findings: CrossSystemDriftFinding[] = [];
    const { run, cockpitBundle } = input;

    const realismInvalid = run.realismTruth && !run.realismTruth.sceneOutputValidUnderRealismRules;
    if (realismInvalid && !run.output.continuityFlags.includes("cluster5_realism_scene_output_invalid")) {
      findings.push({
        code: "realism_invalid_without_cluster5_flag",
        severity: "warning",
        message: "Realism invalid but continuity flags do not include cluster5_realism_scene_output_invalid.",
        layers: ["runtime", "artifact"],
      });
    }

    const hgTruthInvalid =
      run.humanGravityTruth && !run.humanGravityTruth.sceneOutputValidUnderNoResetRules;
    if (hgTruthInvalid && !run.output.continuityFlags.includes("cluster6_human_gravity_no_reset_invalid")) {
      findings.push({
        code: "human_gravity_invalid_without_cluster6_flag",
        severity: "warning",
        message:
          "Human-gravity no-reset invalid but continuity flags do not include cluster6_human_gravity_no_reset_invalid.",
        layers: ["runtime", "artifact"],
      });
    }

    const ch = cockpitBundle?.certificationHardening;
    if (ch?.mayPresentAsProductionGrade && ch.canonicalArtifactAuthority !== "canonical_production") {
      findings.push({
        code: "cockpit_production_grade_vs_artifact_authority",
        severity: "error",
        message: "Cockpit allows production-grade presentation while artifact authority is not canonical_production.",
        layers: ["cockpit", "readiness"],
      });
    }

    if (run.savedGenerationText && (run.generationTextSaveBlockedByRealism || run.generationTextSaveBlockedByHumanGravity)) {
      findings.push({
        code: "persisted_while_blocked_flags",
        severity: "error",
        message: "Generation text saved while save-block flags are set.",
        layers: ["runtime", "persistence"],
      });
    }

    if (cockpitBundle?.humanGravityRuntime && run.humanGravityRuntime) {
      const cActive = cockpitBundle.humanGravityRuntime.humanGravityCanonicalRuntimeActive;
      const rActive = run.humanGravityRuntime.runtimeInfluenceTruth.humanGravityCanonicalRuntimeActive;
      if (cActive !== rActive) {
        findings.push({
          code: "cockpit_vs_runtime_human_gravity_active",
          severity: "warning",
          message: "Cockpit humanGravityCanonicalRuntimeActive differs from runtime profile influence truth.",
          layers: ["cockpit", "runtime"],
        });
      }
    }

    if (cockpitBundle?.runtimeConvergenceTruth && run.canonicalPreGeneration) {
      const cg = run.canonicalPreGeneration.governanceMergeApplied;
      const conv = cockpitBundle.runtimeConvergenceTruth.canonicalGovernanceMergeApplied;
      if (cg !== conv) {
        findings.push({
          code: "cockpit_vs_runtime_governance_merge",
          severity: "warning",
          message: "Runtime convergence truth canonicalGovernanceMergeApplied differs from bundle governanceMergeApplied.",
          layers: ["cockpit", "runtime"],
        });
      }
    }

    if (cockpitBundle?.proseRealism && run.proseRealism) {
      const cg = cockpitBundle.proseRealism.governanceLinked;
      const layer = Boolean(run.canonicalPreGeneration?.governanceMergeApplied);
      if (cg && !layer) {
        findings.push({
          code: "cockpit_prose_realism_governance_mismatch",
          severity: "warning",
          message: "Cockpit marks prose realism governance-linked but canonical pre-generation merge is absent.",
          layers: ["cockpit", "runtime"],
        });
      }
    }

    return {
      contractVersion: CLUSTER7_RUNTIME_TRUTH_CONTRACT_VERSION,
      runId: input.runId,
      sceneId: input.sceneId,
      findings,
      hasError: findings.some((f) => f.severity === "error"),
      validationFlags: ["cluster7_drift_detection"],
    };
  }
}
