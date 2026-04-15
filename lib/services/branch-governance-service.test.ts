import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createBranchGovernanceState,
  evaluateBranchGovernance,
} from "@/lib/services/branch-governance-service";

describe("branch-governance-service", () => {
  it("creates branch state with valid lineage and identity", () => {
    const state = createBranchGovernanceState({
      branchId: "branch-1",
      parentBranchId: "root-0",
      lineagePath: ["root-0", "branch-1"],
      branchType: "scene_divergence",
      divergenceCause: "arc_conflict",
      divergenceDepth: 1,
      activeArcDifferences: [],
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    assert.equal(state.branchId, "branch-1");
    assert.equal(state.lineagePath.includes("root-0"), true);
    assert.equal(state.lineagePath.includes("branch-1"), true);
  });

  it("rejects invalid lineage when parent is missing from lineage path", () => {
    assert.throws(
      () =>
        createBranchGovernanceState({
          branchId: "branch-2",
          parentBranchId: "root-0",
          lineagePath: ["branch-2"],
          branchType: "scene_divergence",
          divergenceCause: "continuity_repair",
          divergenceDepth: 1,
          activeArcDifferences: [],
          createdAtIso: "2026-04-15T00:00:00.000Z",
        }),
      /lineagePath must include parentBranchId/
    );
  });

  it("blocks divergence when depth exceeds allowed limit", () => {
    const state = createBranchGovernanceState({
      branchId: "branch-depth",
      parentBranchId: "root-0",
      lineagePath: ["root-0", "branch-depth"],
      branchType: "path_divergence",
      divergenceCause: "world_state_constraint_shift",
      divergenceDepth: 5,
      activeArcDifferences: [],
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    const out = evaluateBranchGovernance({
      state,
      evaluatedAtIso: "2026-04-15T01:00:00.000Z",
      governanceInput: {
        existingSiblingBranchCount: 0,
        unresolvedArcPrerequisites: [],
      },
      rules: {
        maxDivergenceDepth: 3,
      },
    });
    assert.equal(out.updatedState.depthStatus, "exceeds_limit");
    assert.equal(out.updatedState.legitimacyStatus, "blocked");
  });

  it("evaluates legitimacy and reconvergence requirement deterministically", () => {
    const state = createBranchGovernanceState({
      branchId: "branch-reconverge",
      parentBranchId: "root-0",
      lineagePath: ["root-0", "branch-reconverge"],
      branchType: "chapter_divergence",
      divergenceCause: "arc_conflict",
      divergenceDepth: 2,
      activeArcDifferences: [
        {
          arcId: "arc-1",
          fromLifecycleState: "active",
          toLifecycleState: "escalating",
          deltaSeverity: "moderate",
        },
      ],
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    const input: Parameters<typeof evaluateBranchGovernance>[0] = {
      state,
      evaluatedAtIso: "2026-04-15T02:00:00.000Z",
      governanceInput: {
        existingSiblingBranchCount: 1,
        unresolvedArcPrerequisites: [],
      },
      rules: {
        reconvergenceRequiredDepth: 2,
      },
    };
    const a = evaluateBranchGovernance(input);
    const b = evaluateBranchGovernance(input);
    assert.deepEqual(a, b);
    assert.equal(a.updatedState.reconvergenceRecommendation, "required_now");
    assert.equal(a.outputSurface.reconvergenceNeed.recommendation, "required_now");
  });

  it("prevents uncontrolled expansion via sibling branch limits", () => {
    const state = createBranchGovernanceState({
      branchId: "branch-sibling-limit",
      parentBranchId: "root-0",
      lineagePath: ["root-0", "branch-sibling-limit"],
      branchType: "scene_divergence",
      divergenceCause: "reader_interaction_variation",
      divergenceDepth: 1,
      activeArcDifferences: [],
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    const out = evaluateBranchGovernance({
      state,
      evaluatedAtIso: "2026-04-15T03:00:00.000Z",
      governanceInput: {
        existingSiblingBranchCount: 4,
        unresolvedArcPrerequisites: [],
      },
      rules: {
        maxOpenBranchesPerParent: 3,
      },
    });
    assert.equal(out.updatedState.legitimacyStatus, "blocked");
    assert.ok(out.updatedState.manageabilityWarnings.includes("sibling_branch_limit_exceeded"));
  });

  it("marks author exploratory branches as exploratory only", () => {
    const state = createBranchGovernanceState({
      branchId: "branch-exploratory",
      parentBranchId: "root-0",
      lineagePath: ["root-0", "branch-exploratory"],
      branchType: "author_exploratory_branch",
      divergenceCause: "author_exploration",
      divergenceDepth: 1,
      activeArcDifferences: [],
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    const out = evaluateBranchGovernance({
      state,
      evaluatedAtIso: "2026-04-15T04:00:00.000Z",
      governanceInput: {
        existingSiblingBranchCount: 0,
        unresolvedArcPrerequisites: [],
      },
    });
    assert.equal(out.updatedState.canonicalityStatus, "exploratory_only");
    assert.equal(out.outputSurface.branchPressureModifiers.forceOverride, false);
  });

  it("blocks truth-plane contamination from reader memory to canonical governance writes", () => {
    const state = createBranchGovernanceState({
      branchId: "branch-boundary",
      parentBranchId: "root-0",
      lineagePath: ["root-0", "branch-boundary"],
      branchType: "path_divergence",
      divergenceCause: "reader_interaction_variation",
      divergenceDepth: 1,
      activeArcDifferences: [],
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    assert.throws(
      () =>
        evaluateBranchGovernance({
          state,
          evaluatedAtIso: "2026-04-15T05:00:00.000Z",
          sourcePlane: "reader_interaction_memory",
          targetPlane: "canonical_truth",
          governanceInput: {
            existingSiblingBranchCount: 0,
            unresolvedArcPrerequisites: [],
          },
        }),
      /interaction_memory_to_canon_blocked/
    );
  });
});
