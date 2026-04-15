import type { ArcLifecycleState } from "@/lib/domain/narrative-arc";
import type { NarrativeMemoryPlane } from "@/lib/services/interaction-truth-firewall-service";

export const BRANCH_GOVERNANCE_CONTRACT_VERSION = "1" as const;

export const BRANCH_TYPES = [
  "scene_divergence",
  "path_divergence",
  "chapter_divergence",
  "reader_influenced_interaction_branch",
  "author_exploratory_branch",
] as const;

export const BRANCH_DIVERGENCE_CAUSES = [
  "arc_conflict",
  "continuity_repair",
  "reader_interaction_variation",
  "author_exploration",
  "world_state_constraint_shift",
] as const;

export const BRANCH_CANONICALITY_STATUSES = [
  "canonical_candidate",
  "non_canonical",
  "exploratory_only",
] as const;

export const BRANCH_RISK_RATINGS = ["low", "moderate", "high", "critical"] as const;
export const BRANCH_DEPTH_STATUSES = ["within_limit", "near_limit", "exceeds_limit"] as const;
export const BRANCH_LEGITIMACY_STATUSES = ["allowed", "constrained", "blocked"] as const;
export const BRANCH_RECONVERGENCE_RECOMMENDATIONS = [
  "not_needed",
  "recommended_soon",
  "required_now",
] as const;

export type BranchType = (typeof BRANCH_TYPES)[number];
export type BranchDivergenceCause = (typeof BRANCH_DIVERGENCE_CAUSES)[number];
export type BranchCanonicalityStatus = (typeof BRANCH_CANONICALITY_STATUSES)[number];
export type BranchRiskRating = (typeof BRANCH_RISK_RATINGS)[number];
export type BranchDepthStatus = (typeof BRANCH_DEPTH_STATUSES)[number];
export type BranchLegitimacyStatus = (typeof BRANCH_LEGITIMACY_STATUSES)[number];
export type BranchReconvergenceRecommendation = (typeof BRANCH_RECONVERGENCE_RECOMMENDATIONS)[number];

export type BranchArcDifference = {
  arcId: string;
  fromLifecycleState: ArcLifecycleState;
  toLifecycleState: ArcLifecycleState;
  deltaSeverity: "low" | "moderate" | "high";
};

export type BranchGovernanceRules = {
  maxDivergenceDepth: number;
  maxOpenBranchesPerParent: number;
  maxArcPrerequisiteViolations: number;
  reconvergenceRequiredDepth: number;
  exploratoryOnlyTypes: BranchType[];
};

export type BranchGovernanceExplanation = {
  summaryCode: string;
  reasonCodes: string[];
  sourcePlane: NarrativeMemoryPlane;
  targetPlane: NarrativeMemoryPlane;
};

export type BranchGovernanceState = {
  contractVersion: typeof BRANCH_GOVERNANCE_CONTRACT_VERSION;
  branchId: string;
  parentBranchId: string | null;
  lineagePath: string[];
  branchType: BranchType;
  divergenceCause: BranchDivergenceCause;
  divergenceDepth: number;
  activeArcDifferences: BranchArcDifference[];
  canonicalityStatus: BranchCanonicalityStatus;
  legitimacyStatus: BranchLegitimacyStatus;
  depthStatus: BranchDepthStatus;
  reconvergenceEligibility: boolean;
  reconvergenceRecommendation: BranchReconvergenceRecommendation;
  branchRiskRating: BranchRiskRating;
  arcCompatibilityWarnings: string[];
  manageabilityWarnings: string[];
  lastEvaluatedAtIso: string;
  explanation: BranchGovernanceExplanation;
};

export type BranchGovernanceInput = {
  existingSiblingBranchCount: number;
  unresolvedArcPrerequisites: string[];
  enforceReconvergenceNow?: boolean;
  priorState?: BranchGovernanceState | null;
};

export type BranchGovernanceOutputSurface = {
  branchLegality: {
    status: BranchLegitimacyStatus;
    canonicality: BranchCanonicalityStatus;
    depthStatus: BranchDepthStatus;
  };
  branchPressureModifiers: {
    continuityPressureDelta: number;
    reconvergenceUrgencyDelta: number;
    explorationBudgetDelta: number;
    forceOverride: false;
  };
  reconvergenceNeed: {
    eligibility: boolean;
    recommendation: BranchReconvergenceRecommendation;
  };
  divergenceWarnings: string[];
};

export type BranchGovernanceEvaluationResult = {
  updatedState: BranchGovernanceState;
  outputSurface: BranchGovernanceOutputSurface;
};
