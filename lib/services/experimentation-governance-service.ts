import type {
  ExperimentDefinition,
  ExperimentGovernanceVerdict,
} from "@/lib/domain/experiment-governance";

const FORBIDDEN_VARIANT_KEYS = [
  "mutateTruth",
  "rewriteArc",
  "overrideContinuity",
  "canonicalOutcome",
  "forceEnding",
] as const;

export function evaluateExperimentGovernance(input: {
  experiment: ExperimentDefinition;
}): ExperimentGovernanceVerdict {
  const violations: string[] = [];
  const totalAllocation = input.experiment.variants.reduce((sum, variant) => sum + variant.allocationPercent, 0);

  if (Math.abs(totalAllocation - 100) > 0.01) {
    violations.push("allocation_must_total_100");
  }

  if (
    input.experiment.boundedScope !== "ui_copy" &&
    input.experiment.boundedScope !== "recommendation_ordering" &&
    input.experiment.boundedScope !== "mode_default"
  ) {
    violations.push("scope_outside_bounded_experience_surface");
  }

  for (const variant of input.experiment.variants) {
    for (const key of Object.keys(variant.parameters)) {
      if (FORBIDDEN_VARIANT_KEYS.includes(key as (typeof FORBIDDEN_VARIANT_KEYS)[number])) {
        violations.push(`forbidden_truth_mutation_key:${key}`);
      }
    }
  }

  return {
    allowed: violations.length === 0,
    violations,
  };
}
