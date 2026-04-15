/**
 * Phase 3 / Chunk 4 — Branch Governance Core (deterministic, bounded).
 *
 * Scope:
 * - branch lineage + depth governance
 * - legitimacy + risk + reconvergence evaluation
 * - bounded governance output surface
 *
 * Out of scope:
 * - storyline orchestration
 * - UI branch controls
 * - prose generation
 */
import {
  BRANCH_GOVERNANCE_CONTRACT_VERSION,
  type BranchCanonicalityStatus,
  type BranchGovernanceEvaluationResult,
  type BranchGovernanceInput,
  type BranchGovernanceOutputSurface,
  type BranchGovernanceRules,
  type BranchGovernanceState,
  type BranchLegitimacyStatus,
  type BranchReconvergenceRecommendation,
  type BranchRiskRating,
  type BranchType,
} from "@/lib/domain/branch-governance";
import { assertMemoryBoundary, type NarrativeMemoryPlane } from "@/lib/services/interaction-truth-firewall-service";

function clamp0to100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampInfluence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-20, Math.min(20, Math.round(value)));
}

function uniqueNonEmpty(values: string[]): string[] {
  const cleaned = values.map((value) => value.trim()).filter((value) => value.length > 0);
  return [...new Set(cleaned)];
}

function defaultRules(): BranchGovernanceRules {
  return {
    maxDivergenceDepth: 3,
    maxOpenBranchesPerParent: 3,
    maxArcPrerequisiteViolations: 1,
    reconvergenceRequiredDepth: 2,
    exploratoryOnlyTypes: ["author_exploratory_branch"],
  };
}

function branchTypeRiskWeight(type: BranchType): number {
  switch (type) {
    case "scene_divergence":
      return 8;
    case "path_divergence":
      return 12;
    case "chapter_divergence":
      return 16;
    case "reader_influenced_interaction_branch":
      return 10;
    case "author_exploratory_branch":
      return 14;
  }
}

function riskRatingFromScore(score: number): BranchRiskRating {
  if (score >= 76) return "critical";
  if (score >= 56) return "high";
  if (score >= 31) return "moderate";
  return "low";
}

function assessArcCompatibilityWarnings(state: BranchGovernanceState, unresolvedPrerequisites: string[]): string[] {
  const warnings: string[] = [];
  for (const diff of state.activeArcDifferences) {
    if (
      ["resolved", "transformed"].includes(diff.fromLifecycleState) &&
      ["dormant", "seeded", "failed"].includes(diff.toLifecycleState)
    ) {
      warnings.push(`arc_regression:${diff.arcId}`);
    }
    if (diff.fromLifecycleState === "failed" && ["resolved", "transformed"].includes(diff.toLifecycleState)) {
      warnings.push(`arc_invalid_recovery:${diff.arcId}`);
    }
    if (diff.fromLifecycleState === "dormant" && ["crisis", "escalating"].includes(diff.toLifecycleState)) {
      warnings.push(`arc_abrupt_jump:${diff.arcId}`);
    }
  }
  for (const prerequisite of unresolvedPrerequisites) {
    warnings.push(`arc_prerequisite_missing:${prerequisite}`);
  }
  return uniqueNonEmpty(warnings);
}

function assessDepthStatus(depth: number, rules: BranchGovernanceRules): BranchGovernanceState["depthStatus"] {
  if (depth > rules.maxDivergenceDepth) return "exceeds_limit";
  if (depth >= rules.maxDivergenceDepth - 1) return "near_limit";
  return "within_limit";
}

function canonicalityStatus(input: {
  state: BranchGovernanceState;
  legitimacy: BranchLegitimacyStatus;
  riskRating: BranchRiskRating;
  rules: BranchGovernanceRules;
  unresolvedPrerequisites: string[];
}): BranchCanonicalityStatus {
  if (input.rules.exploratoryOnlyTypes.includes(input.state.branchType)) return "exploratory_only";
  if (input.legitimacy === "blocked") return "non_canonical";
  if (
    input.state.branchType === "chapter_divergence" &&
    input.riskRating !== "high" &&
    input.riskRating !== "critical" &&
    input.state.divergenceDepth <= 1 &&
    input.unresolvedPrerequisites.length === 0
  ) {
    return "canonical_candidate";
  }
  return "non_canonical";
}

function reconvergenceRecommendation(input: {
  state: BranchGovernanceState;
  riskRating: BranchRiskRating;
  rules: BranchGovernanceRules;
  forceNow: boolean;
}): BranchReconvergenceRecommendation {
  if (input.forceNow) return "required_now";
  if (input.state.divergenceDepth >= input.rules.reconvergenceRequiredDepth) return "required_now";
  if (input.riskRating === "critical" || input.riskRating === "high") return "required_now";
  if (input.state.branchType === "author_exploratory_branch") return "recommended_soon";
  if (input.state.divergenceDepth === input.rules.reconvergenceRequiredDepth - 1) return "recommended_soon";
  return "not_needed";
}

export function createBranchGovernanceState(input: {
  branchId: string;
  parentBranchId: string | null;
  lineagePath: string[];
  branchType: BranchGovernanceState["branchType"];
  divergenceCause: BranchGovernanceState["divergenceCause"];
  divergenceDepth: number;
  activeArcDifferences: BranchGovernanceState["activeArcDifferences"];
  createdAtIso: string;
  sourcePlane?: NarrativeMemoryPlane;
  targetPlane?: NarrativeMemoryPlane;
}): BranchGovernanceState {
  const branchId = input.branchId.trim();
  if (!branchId) throw new Error("[branch-governance] branchId is required.");
  const sourcePlane = input.sourcePlane ?? "canonical_truth";
  const targetPlane = input.targetPlane ?? "character_bounded_knowledge";

  assertMemoryBoundary({
    source: sourcePlane,
    target: targetPlane,
    payload: {
      branchId,
      branchType: input.branchType,
      divergenceCause: input.divergenceCause,
      divergenceDepth: input.divergenceDepth,
    },
  });

  const lineagePath = uniqueNonEmpty(input.lineagePath);
  if (input.parentBranchId && !lineagePath.includes(input.parentBranchId)) {
    throw new Error("[branch-governance] lineagePath must include parentBranchId when parent exists.");
  }
  if (!lineagePath.includes(branchId)) {
    throw new Error("[branch-governance] lineagePath must include current branchId.");
  }

  return {
    contractVersion: BRANCH_GOVERNANCE_CONTRACT_VERSION,
    branchId,
    parentBranchId: input.parentBranchId,
    lineagePath,
    branchType: input.branchType,
    divergenceCause: input.divergenceCause,
    divergenceDepth: Math.max(0, Math.round(input.divergenceDepth)),
    activeArcDifferences: input.activeArcDifferences,
    canonicalityStatus: "non_canonical",
    legitimacyStatus: "constrained",
    depthStatus: "within_limit",
    reconvergenceEligibility: true,
    reconvergenceRecommendation: "not_needed",
    branchRiskRating: "moderate",
    arcCompatibilityWarnings: [],
    manageabilityWarnings: [],
    lastEvaluatedAtIso: input.createdAtIso,
    explanation: {
      summaryCode: "branch_governance_initialized",
      reasonCodes: ["initial_state"],
      sourcePlane,
      targetPlane,
    },
  };
}

export function evaluateBranchGovernance(input: {
  state: BranchGovernanceState;
  governanceInput: BranchGovernanceInput;
  evaluatedAtIso: string;
  rules?: Partial<BranchGovernanceRules>;
  sourcePlane?: NarrativeMemoryPlane;
  targetPlane?: NarrativeMemoryPlane;
}): BranchGovernanceEvaluationResult {
  const sourcePlane = input.sourcePlane ?? "canonical_truth";
  const targetPlane = input.targetPlane ?? "character_bounded_knowledge";
  assertMemoryBoundary({
    source: sourcePlane,
    target: targetPlane,
    payload: {
      branchId: input.state.branchId,
      parentBranchId: input.state.parentBranchId,
      divergenceDepth: input.state.divergenceDepth,
      siblingCount: input.governanceInput.existingSiblingBranchCount,
      unresolvedPrerequisites: input.governanceInput.unresolvedArcPrerequisites.length,
    },
  });

  const rules: BranchGovernanceRules = {
    ...defaultRules(),
    ...input.rules,
    exploratoryOnlyTypes: input.rules?.exploratoryOnlyTypes ?? defaultRules().exploratoryOnlyTypes,
  };
  const unresolvedPrerequisites = uniqueNonEmpty(input.governanceInput.unresolvedArcPrerequisites);
  const arcWarnings = assessArcCompatibilityWarnings(input.state, unresolvedPrerequisites);
  const depthStatus = assessDepthStatus(input.state.divergenceDepth, rules);

  const rawRiskScore =
    input.state.divergenceDepth * 12 +
    input.state.activeArcDifferences.length * 10 +
    unresolvedPrerequisites.length * 15 +
    input.governanceInput.existingSiblingBranchCount * 8 +
    branchTypeRiskWeight(input.state.branchType) +
    arcWarnings.length * 6;
  const boundedRiskScore = clamp0to100(rawRiskScore);
  const riskRating = riskRatingFromScore(boundedRiskScore);

  const manageabilityWarnings: string[] = [];
  if (input.governanceInput.existingSiblingBranchCount >= rules.maxOpenBranchesPerParent) {
    manageabilityWarnings.push("sibling_branch_limit_exceeded");
  } else if (input.governanceInput.existingSiblingBranchCount === rules.maxOpenBranchesPerParent - 1) {
    manageabilityWarnings.push("sibling_branch_limit_near");
  }
  if (depthStatus === "near_limit") manageabilityWarnings.push("divergence_depth_near_limit");
  if (depthStatus === "exceeds_limit") manageabilityWarnings.push("divergence_depth_exceeded");
  if (unresolvedPrerequisites.length > rules.maxArcPrerequisiteViolations) {
    manageabilityWarnings.push("arc_prerequisite_violation_over_limit");
  }

  const legitimacyStatus: BranchLegitimacyStatus =
    depthStatus === "exceeds_limit" ||
    input.governanceInput.existingSiblingBranchCount >= rules.maxOpenBranchesPerParent ||
    unresolvedPrerequisites.length > rules.maxArcPrerequisiteViolations
      ? "blocked"
      : arcWarnings.length > 0 || riskRating === "high" || riskRating === "critical"
        ? "constrained"
        : "allowed";

  const reconvergenceRec = reconvergenceRecommendation({
    state: input.state,
    riskRating,
    rules,
    forceNow: Boolean(input.governanceInput.enforceReconvergenceNow),
  });
  const reconvergenceEligibility = legitimacyStatus !== "blocked";
  const canonicality = canonicalityStatus({
    state: input.state,
    legitimacy: legitimacyStatus,
    riskRating,
    rules,
    unresolvedPrerequisites,
  });

  const branchPressureModifiers: BranchGovernanceOutputSurface["branchPressureModifiers"] = {
    continuityPressureDelta: clampInfluence(
      (legitimacyStatus === "blocked" ? 18 : legitimacyStatus === "constrained" ? 10 : 4) +
        (input.state.divergenceDepth >= rules.reconvergenceRequiredDepth ? 4 : 0)
    ),
    reconvergenceUrgencyDelta: clampInfluence(
      reconvergenceRec === "required_now" ? 18 : reconvergenceRec === "recommended_soon" ? 10 : 2
    ),
    explorationBudgetDelta: clampInfluence(
      input.state.branchType === "author_exploratory_branch"
        ? legitimacyStatus === "blocked"
          ? -10
          : 8
        : legitimacyStatus === "blocked"
          ? -8
          : -2
    ),
    forceOverride: false,
  };

  const updatedState: BranchGovernanceState = {
    ...input.state,
    canonicalityStatus: canonicality,
    legitimacyStatus,
    depthStatus,
    reconvergenceEligibility,
    reconvergenceRecommendation: reconvergenceRec,
    branchRiskRating: riskRating,
    arcCompatibilityWarnings: arcWarnings,
    manageabilityWarnings: uniqueNonEmpty(manageabilityWarnings),
    lastEvaluatedAtIso: input.evaluatedAtIso,
    explanation: {
      summaryCode: `branch_governance_${input.state.legitimacyStatus}_to_${legitimacyStatus}`,
      reasonCodes: [
        `risk_${riskRating}`,
        `depth_${depthStatus}`,
        ...arcWarnings,
        ...manageabilityWarnings,
      ],
      sourcePlane,
      targetPlane,
    },
  };

  const outputSurface: BranchGovernanceOutputSurface = {
    branchLegality: {
      status: updatedState.legitimacyStatus,
      canonicality: updatedState.canonicalityStatus,
      depthStatus: updatedState.depthStatus,
    },
    branchPressureModifiers,
    reconvergenceNeed: {
      eligibility: updatedState.reconvergenceEligibility,
      recommendation: updatedState.reconvergenceRecommendation,
    },
    divergenceWarnings: uniqueNonEmpty([
      ...updatedState.arcCompatibilityWarnings,
      ...updatedState.manageabilityWarnings,
    ]),
  };

  return {
    updatedState,
    outputSurface,
  };
}
