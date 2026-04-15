/**
 * Phase 7 Expansion / Workstream 7 — expanded operator/author/internal surfaces.
 */
export const OPERATOR_INSIGHT_DEPTH_CONTRACT_VERSION = "1" as const;

export type OperatorInsightDepthBundle = {
  contractVersion: typeof OPERATOR_INSIGHT_DEPTH_CONTRACT_VERSION;
  operatorSurface: {
    telemetrySummary: string[];
    anomalySummary: string[];
    safetySummary: string[];
  };
  authorSurface: {
    storyDiagnosticsSummary: string[];
    recommendationRationaleSummary: string[];
    experimentSummary: string[];
  };
  internalDebugSurface: {
    releaseImpactSignals: string[];
    orchestrationSignals: string[];
  };
  ownershipBoundariesClear: true;
};
