import {
  OPERATOR_INSIGHT_DEPTH_CONTRACT_VERSION,
  type OperatorInsightDepthBundle,
} from "@/lib/domain/operator-insight-depth";

export function buildOperatorInsightDepthBundle(input: {
  telemetrySummary: string[];
  anomalySummary: string[];
  safetySummary: string[];
  storyDiagnosticsSummary: string[];
  recommendationRationaleSummary: string[];
  experimentSummary: string[];
  releaseImpactSignals: string[];
  orchestrationSignals: string[];
}): OperatorInsightDepthBundle {
  return {
    contractVersion: OPERATOR_INSIGHT_DEPTH_CONTRACT_VERSION,
    operatorSurface: {
      telemetrySummary: [...input.telemetrySummary],
      anomalySummary: [...input.anomalySummary],
      safetySummary: [...input.safetySummary],
    },
    authorSurface: {
      storyDiagnosticsSummary: [...input.storyDiagnosticsSummary],
      recommendationRationaleSummary: [...input.recommendationRationaleSummary],
      experimentSummary: [...input.experimentSummary],
    },
    internalDebugSurface: {
      releaseImpactSignals: [...input.releaseImpactSignals],
      orchestrationSignals: [...input.orchestrationSignals],
    },
    ownershipBoundariesClear: true,
  };
}
