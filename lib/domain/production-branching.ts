export const PRODUCTION_BRANCHING_CONTRACT_VERSION = "1" as const;

export type ProductionBranchType = "exploratory" | "canonical";

export type ProductionBranch = {
  branchId: string;
  type: ProductionBranchType;
  depth: number;
  parentBranchId: string | null;
  reconverged: boolean;
};

export type ProductionBranchRules = {
  maxDepth: number;
  maxSimultaneousBranches: number;
  reconvergenceRequiredForCertification: boolean;
};

export type ProductionBranchGovernanceResult = {
  contractVersion: typeof PRODUCTION_BRANCHING_CONTRACT_VERSION;
  allowed: boolean;
  violations: string[];
  eligibleForCertification: boolean;
};
