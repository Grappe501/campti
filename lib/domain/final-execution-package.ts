import type { ArtifactAuthorityClass } from "@/lib/domain/canonical-artifact-governance";

export const FINAL_EXECUTION_PACKAGE_CONTRACT_VERSION = "1" as const;

export type FinalExecutionReadinessStatus =
  | "execution_ready"
  | "execution_ready_with_warnings"
  | "blocked"
  | "rehearsal_incomplete";

export type FinalExecutionPackage = {
  contractVersion: typeof FINAL_EXECUTION_PACKAGE_CONTRACT_VERSION;
  executionId: string;
  runtimeId: string;
  sceneId: string;
  chapterId: string | null;
  authorityClass: ArtifactAuthorityClass;
  readinessStatus: FinalExecutionReadinessStatus;
  canonicalArtifactIds: string[];
  sceneRunIds: string[];
  chapterRunIds: string[];
  activeGovernors: string[];
  advisoryGovernors: string[];
  blockedOrDowngradedReasons: string[];
  operatorWorkflowSummary: string;
  authorWorkflowSummary: string;
  exportableOutputs: string[];
  validationSummary: string;
  certificationSummary: string;
  remediationTargets: string[];
  validationFlags: string[];
  characterSimulationProfileTruth: "persisted_author" | "deterministic_seed_only" | "mixed";
  /** Optional — populated when caller evaluates cast workbench state alongside the scene run. */
  characterSimulationWorkbenchSummary?: {
    summaryLine: string;
    validationFlags: string[];
    blockedParticipatingPeople: number;
  };
};

export type FinalExecutionReadinessScorecard = {
  contractVersion: typeof FINAL_EXECUTION_PACKAGE_CONTRACT_VERSION;
  canonicalRuntimeReady: boolean;
  cockpitReady: boolean;
  authorWorkflowReady: boolean;
  persistenceReady: boolean;
  outputTrustReady: boolean;
  demonstrationReady: boolean;
  releaseRiskSummary: string;
  validationFlags: string[];
};

export type FinalDryRunDefect = {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  layer: "runtime" | "cockpit" | "persistence" | "operator" | "llm" | "other";
};

export type FinalDryRunDefectLog = {
  contractVersion: typeof FINAL_EXECUTION_PACKAGE_CONTRACT_VERSION;
  dryRunId: string;
  executedAtIso: string;
  sceneId: string | null;
  defects: FinalDryRunDefect[];
};

export const finalDryRunDefectLog = (input: {
  dryRunId: string;
  sceneId: string | null;
  defects: FinalDryRunDefect[];
}): FinalDryRunDefectLog => ({
  contractVersion: FINAL_EXECUTION_PACKAGE_CONTRACT_VERSION,
  dryRunId: input.dryRunId,
  executedAtIso: new Date().toISOString(),
  sceneId: input.sceneId,
  defects: input.defects,
});
