import type { ExperimentDefinition } from "@/lib/domain/experiment-governance";
import { evaluateExperimentGovernance } from "@/lib/services/experimentation-governance-service";
import {
  EXPERIMENT_GOVERNANCE_DEPTH_CONTRACT_VERSION,
  type ExperimentGovernanceDepthReport,
  type ExperimentVariantOutcome,
} from "@/lib/domain/experiment-governance-depth";

export function evaluateExperimentGovernanceDepth(input: {
  experiment: ExperimentDefinition;
  outcomes: ExperimentVariantOutcome[];
}): ExperimentGovernanceDepthReport {
  const base = evaluateExperimentGovernance({ experiment: input.experiment });
  const guardrailFindings = [...base.violations];

  if (input.outcomes.length > 6) {
    guardrailFindings.push("over_fragmented_variant_matrix");
  }

  const completionSpread =
    input.outcomes.length > 1
      ? Math.max(...input.outcomes.map((outcome) => outcome.interactionCompletionRate)) -
        Math.min(...input.outcomes.map((outcome) => outcome.interactionCompletionRate))
      : 0;
  if (completionSpread > 0.35) {
    guardrailFindings.push("possible_hidden_product_fork");
  }

  if (input.outcomes.some((outcome) => outcome.readingFlowScore < 0.4 && outcome.abandonmentRate > 0.45)) {
    guardrailFindings.push("continuity_or_flow_confusion_risk");
  }

  const variantComparisonSummary = input.outcomes.map(
    (outcome) =>
      `${outcome.variantId}: reentry=${outcome.reentryRate.toFixed(3)}, completion=${outcome.interactionCompletionRate.toFixed(3)}, abandonment=${outcome.abandonmentRate.toFixed(3)}`
  );

  const declaredScopeIntegrity = guardrailFindings.some((finding) => finding.includes("scope")) ? "fail" : "pass";

  return {
    contractVersion: EXPERIMENT_GOVERNANCE_DEPTH_CONTRACT_VERSION,
    experimentId: input.experiment.experimentId,
    safeToContinue: guardrailFindings.length === 0,
    guardrailFindings,
    variantComparisonSummary,
    declaredScopeIntegrity,
  };
}
