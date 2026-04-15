/**
 * Phase 7 Expansion / Workstream 8 — bounded operations orchestration bundle.
 */
export const OPERATIONS_ORCHESTRATION_DEPTH_CONTRACT_VERSION = "1" as const;

export type OperationsOrchestrationDepthBundle = {
  contractVersion: typeof OPERATIONS_ORCHESTRATION_DEPTH_CONTRACT_VERSION;
  sourceOfTruth: "operational_observation_layer";
  telemetrySummary: string[];
  anomalyState: string[];
  storyHealthSummary: string[];
  experimentStatusSummary: string[];
  recommendationSummary: string[];
  liveSafetySummary: string[];
  operatorActionHints: string[];
  bounded: true;
  explainable: true;
  nonOmniscient: true;
  mutatesCanonicalTruth: false;
};
