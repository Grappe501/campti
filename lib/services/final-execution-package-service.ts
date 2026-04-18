import type { FinalExecutionPackage, FinalExecutionReadinessStatus } from "@/lib/domain/final-execution-package";
import { FINAL_EXECUTION_PACKAGE_CONTRACT_VERSION } from "@/lib/domain/final-execution-package";
import type { SceneGenerationRunResult } from "@/lib/domain/scene-generation-output";
import { buildEnforcementRegistry } from "@/lib/services/enforcement-registry-service";

type RunWithCluster7 = SceneGenerationRunResult & {
  cluster7RuntimeTruth?: import("@/lib/domain/cluster7-runtime-truth").Cluster7RuntimeTruthEnvelope | null;
};

function deriveReadinessStatus(run: RunWithCluster7): FinalExecutionReadinessStatus {
  const c7 = run.cluster7RuntimeTruth;
  if (!c7) return "rehearsal_incomplete";
  const inv = c7.semanticInvariantReport;
  const hard = inv.hardViolations.length > 0;
  const stamp = c7.truthStamp;
  if (hard || stamp.authorityClass === "invalidated" || stamp.authorityClass === "blocked_from_save") {
    return "blocked";
  }
  if (
    stamp.validationSummary.realismValid === false ||
    stamp.validationSummary.humanGravityNoResetValid === false ||
    c7.driftReport.hasError ||
    stamp.invalidationOrDowngradeReasons.length > 0
  ) {
    return "execution_ready_with_warnings";
  }
  return "execution_ready";
}

/**
 * Single operator-facing package for a canonical scene run (Cluster 9 evidence assembly).
 */
export function buildFinalExecutionPackage(input: {
  executionId: string;
  runtimeId: string;
  sceneId: string;
  chapterId: string | null;
  run: RunWithCluster7;
  profileTruth: FinalExecutionPackage["characterSimulationProfileTruth"];
  characterSimulationWorkbenchSummary?: FinalExecutionPackage["characterSimulationWorkbenchSummary"];
}): FinalExecutionPackage {
  const c7 = input.run.cluster7RuntimeTruth;
  const artifactId = c7?.canonicalArtifact.artifactId ?? "";
  const authority = c7?.truthStamp.authorityClass ?? "incomplete";
  const readinessStatus = deriveReadinessStatus(input.run);

  const activeGovernors: string[] = [];
  const advisory: string[] = [];
  if (input.run.canonicalPreGeneration?.governanceMergeApplied) activeGovernors.push("canonical_narrative_governance_merge");
  if (input.run.humanGravityRuntime) activeGovernors.push("human_gravity_runtime_cluster6");
  if (input.run.characterSimulationRuntime) activeGovernors.push("character_simulation_runtime_cluster8");
  if (input.run.proseRealism) activeGovernors.push("prose_realism_cluster5");
  if (input.run.socialFieldGeneration) advisory.push("social_field_advisory");

  const blockedOrDowngradedReasons = [
    ...(c7?.truthStamp.invalidationOrDowngradeReasons ?? []),
    ...(input.run.generationTextSaveBlockedByRealism ? ["save_blocked_realism"] : []),
    ...(input.run.generationTextSaveBlockedByHumanGravity ? ["save_blocked_human_gravity_no_reset"] : []),
  ];

  const remediationTargets: string[] = [...(c7?.semanticInvariantReport.suggestedRepairs ?? [])];
  for (const b of c7?.readinessCertification.blockingReasons ?? []) {
    remediationTargets.push(b);
  }
  for (const f of c7?.semanticInvariantReport.hardViolations ?? []) {
    remediationTargets.push(`invariant:${f.invariantId}:${f.message ?? "fail"}`);
  }

  const validationFlags = [
    ...(c7?.canonicalArtifact.validationFlags ?? []),
    ...(c7?.semanticInvariantReport.validationFlags ?? []),
    ...(c7?.driftReport.validationFlags ?? []),
    ...(c7?.readinessCertification.validationFlags ?? []),
  ];

  return {
    contractVersion: FINAL_EXECUTION_PACKAGE_CONTRACT_VERSION,
    executionId: input.executionId,
    runtimeId: input.runtimeId,
    sceneId: input.sceneId,
    chapterId: input.chapterId,
    authorityClass: authority,
    readinessStatus,
    canonicalArtifactIds: artifactId ? [artifactId] : [],
    sceneRunIds: c7 ? [c7.runId] : [],
    chapterRunIds: [],
    activeGovernors,
    advisoryGovernors: advisory,
    blockedOrDowngradedReasons,
    operatorWorkflowSummary:
      "Canonical path: load scene contract → governance merge → human gravity → character simulation (DB mind/voice when present) → prose realism → model → Cluster 7 truth envelope. Cockpit uses the same loaders without mutating prose.",
    authorWorkflowSummary:
      "Select scope on Author Cockpit → use Character Simulation Workbench under People for validated mind/voice partials → inspect panels (advisory vs enforced labels in enforcement truth) → adjust scene nudges when needed → rerun scene generation from admin scenes → review Cluster 7 save eligibility → export reports under reports/.",
    exportableOutputs: [
      "SceneGenerationRunResult (API/admin actions)",
      "reports/final-execution-package.json",
      "reports/final-readiness-scorecard.json",
      "Cluster 7 envelope on successful canonical runs",
    ],
    validationSummary: c7
      ? `semantic_invariants hard=${c7.semanticInvariantReport.hardViolations.length} soft=${c7.semanticInvariantReport.softViolations.length}`
      : "cluster7 envelope missing",
    certificationSummary: c7
      ? [
          c7.readinessCertification.mayPresentAsExecutionReady ? "may_present_execution_ready" : "not_execution_ready",
          c7.readinessCertification.mayPresentAsProductionGrade ? "may_present_production_grade" : "not_production_grade",
        ].join(" · ")
      : "readiness not evaluated",
    remediationTargets,
    validationFlags,
    characterSimulationProfileTruth: input.profileTruth,
    characterSimulationWorkbenchSummary: input.characterSimulationWorkbenchSummary,
  };
}

/** When LLM or DB rehearsal cannot complete, still emit a truthful operator package. */
export function buildRehearsalStubFinalExecutionPackage(input: {
  executionId: string;
  sceneId: string;
  chapterId: string | null;
  profileTruth: FinalExecutionPackage["characterSimulationProfileTruth"];
  rehearsalNotes: string[];
  characterSimulationWorkbenchSummary?: FinalExecutionPackage["characterSimulationWorkbenchSummary"];
}): FinalExecutionPackage {
  const registry = buildEnforcementRegistry();
  return {
    contractVersion: FINAL_EXECUTION_PACKAGE_CONTRACT_VERSION,
    executionId: input.executionId,
    runtimeId: registry.canonicalRuntimeId,
    sceneId: input.sceneId,
    chapterId: input.chapterId,
    authorityClass: "incomplete",
    readinessStatus: "rehearsal_incomplete",
    canonicalArtifactIds: [],
    sceneRunIds: [],
    chapterRunIds: [],
    activeGovernors: [],
    advisoryGovernors: [],
    blockedOrDowngradedReasons: input.rehearsalNotes,
    operatorWorkflowSummary:
      "Rehearsal did not complete a full canonical generation; no Cluster 7 envelope. Fix noted defects and rerun.",
    authorWorkflowSummary:
      "Same as full workflow, but generation step did not finish — inspect defects before presenting readiness.",
    exportableOutputs: ["reports/final-dry-run-defect-log.json"],
    validationSummary: "rehearsal_incomplete",
    certificationSummary: "not_evaluated",
    remediationTargets: input.rehearsalNotes,
    validationFlags: ["cluster9_rehearsal_stub"],
    characterSimulationProfileTruth: input.profileTruth,
    characterSimulationWorkbenchSummary: input.characterSimulationWorkbenchSummary,
  };
}
