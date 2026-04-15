/**
 * Phase 7 Expansion / Workstream 4 — deep experiment analysis and guardrails.
 */
export const EXPERIMENT_GOVERNANCE_DEPTH_CONTRACT_VERSION = "1" as const;

export type ExperimentVariantOutcome = {
  variantId: string;
  reentryRate: number;
  interactionCompletionRate: number;
  abandonmentRate: number;
  degradedRate: number;
  readingFlowScore: number;
};

export type ExperimentGovernanceDepthReport = {
  contractVersion: typeof EXPERIMENT_GOVERNANCE_DEPTH_CONTRACT_VERSION;
  experimentId: string;
  safeToContinue: boolean;
  guardrailFindings: string[];
  variantComparisonSummary: string[];
  declaredScopeIntegrity: "pass" | "fail";
};
