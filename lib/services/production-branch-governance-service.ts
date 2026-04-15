import {
  PRODUCTION_BRANCHING_CONTRACT_VERSION,
  type ProductionBranch,
  type ProductionBranchGovernanceResult,
  type ProductionBranchRules,
} from "@/lib/domain/production-branching";

export function evaluateProductionBranchGovernance(input: {
  branches: ProductionBranch[];
  rules?: Partial<ProductionBranchRules>;
}): ProductionBranchGovernanceResult {
  const rules: ProductionBranchRules = {
    maxDepth: 2,
    maxSimultaneousBranches: 3,
    reconvergenceRequiredForCertification: true,
    ...input.rules,
  };

  const violations: string[] = [];
  if (input.branches.length > rules.maxSimultaneousBranches) {
    violations.push("simultaneous_branch_limit_exceeded");
  }
  if (input.branches.some((branch) => branch.depth > rules.maxDepth)) {
    violations.push("branch_depth_limit_exceeded");
  }
  if (input.branches.filter((branch) => branch.type === "canonical").length > 1) {
    violations.push("multiple_canonical_branches_active");
  }

  const unreconverged = input.branches.filter((branch) => !branch.reconverged);
  if (rules.reconvergenceRequiredForCertification && unreconverged.length > 0) {
    violations.push("reconvergence_required_before_certification");
  }

  return {
    contractVersion: PRODUCTION_BRANCHING_CONTRACT_VERSION,
    allowed: violations.length === 0,
    violations,
    eligibleForCertification: !violations.includes("reconvergence_required_before_certification"),
  };
}
