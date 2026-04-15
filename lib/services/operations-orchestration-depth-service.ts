import {
  OPERATIONS_ORCHESTRATION_DEPTH_CONTRACT_VERSION,
  type OperationsOrchestrationDepthBundle,
} from "@/lib/domain/operations-orchestration-depth";

export function buildOperationsOrchestrationDepthBundle(input: {
  telemetrySummary: string[];
  anomalyState: string[];
  storyHealthSummary: string[];
  experimentStatusSummary: string[];
  recommendationSummary: string[];
  liveSafetySummary: string[];
  operatorActionHints: string[];
}): OperationsOrchestrationDepthBundle {
  return {
    contractVersion: OPERATIONS_ORCHESTRATION_DEPTH_CONTRACT_VERSION,
    sourceOfTruth: "operational_observation_layer",
    telemetrySummary: [...input.telemetrySummary].slice(0, 10),
    anomalyState: [...input.anomalyState].slice(0, 10),
    storyHealthSummary: [...input.storyHealthSummary].slice(0, 10),
    experimentStatusSummary: [...input.experimentStatusSummary].slice(0, 10),
    recommendationSummary: [...input.recommendationSummary].slice(0, 10),
    liveSafetySummary: [...input.liveSafetySummary].slice(0, 10),
    operatorActionHints: [...input.operatorActionHints].slice(0, 10),
    bounded: true,
    explainable: true,
    nonOmniscient: true,
    mutatesCanonicalTruth: false,
  };
}
