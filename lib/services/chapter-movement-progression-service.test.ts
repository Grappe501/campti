import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CHAPTER_FUNCTIONS } from "@/lib/domain/chapter-movement-progression";
import {
  createChapterMovementProgressionState,
  evaluateChapterMovementProgression,
} from "@/lib/services/chapter-movement-progression-service";

describe("chapter-movement-progression-service", () => {
  it("creates state with supported chapter function and bounded defaults", () => {
    const state = createChapterMovementProgressionState({
      chapterId: "chapter-1",
      movementId: "movement-1",
      orderIndex: 1,
      chapterFunction: "setup",
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    assert.ok(CHAPTER_FUNCTIONS.includes(state.chapterFunction));
    assert.equal(state.progressionState, "not_started");
    assert.equal(state.entryConditions.minActiveArcs >= 1, true);
  });

  it("rejects unsupported chapter function", () => {
    assert.throws(
      () =>
        createChapterMovementProgressionState({
          chapterId: "chapter-1",
          movementId: "movement-1",
          orderIndex: 1,
          chapterFunction: "unsupported_function",
          createdAtIso: "2026-04-15T00:00:00.000Z",
        }),
      /unsupported chapter function/
    );
  });

  it("evaluates entry/completion and marks ready_to_transition when structurally satisfied", () => {
    const initial = createChapterMovementProgressionState({
      chapterId: "chapter-2",
      movementId: "movement-2",
      orderIndex: 2,
      chapterFunction: "convergence",
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });

    const evaluated = evaluateChapterMovementProgression({
      state: initial,
      evaluatedAtIso: "2026-04-15T01:00:00.000Z",
      progressionInput: {
        activeArcs: [
          { arcId: "a1", lifecycleState: "escalating" },
          { arcId: "a2", lifecycleState: "resolved" },
          { arcId: "a3", lifecycleState: "resolving" },
        ],
        consequences: [{ consequenceId: "c1", severity: "moderate", lifecycleState: "active" }],
        relationshipThresholds: {
          ruptureRiskHigh: false,
          trustFloorBreached: false,
          reconciliationOpen: true,
        },
        unresolvedQuestions: ["who witnessed the break?"],
        priorState: initial,
      },
    });

    assert.equal(evaluated.updatedState.progressionState, "ready_to_transition");
    assert.equal(evaluated.outputSurface.progressionReadiness.eligibleForNextMovement, true);
    assert.equal(evaluated.updatedState.transitionReadiness.blockers.length, 0);
  });

  it("stays blocked when no structural state is present (not template-only progression)", () => {
    const initial = createChapterMovementProgressionState({
      chapterId: "chapter-3",
      movementId: "movement-3",
      orderIndex: 3,
      chapterFunction: "reversal",
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });

    const evaluated = evaluateChapterMovementProgression({
      state: initial,
      evaluatedAtIso: "2026-04-15T02:00:00.000Z",
      progressionInput: {
        activeArcs: [],
        consequences: [],
        relationshipThresholds: {
          ruptureRiskHigh: false,
          trustFloorBreached: false,
          reconciliationOpen: false,
        },
        unresolvedQuestions: [],
        priorState: initial,
      },
    });

    assert.equal(evaluated.updatedState.progressionState, "blocked");
    assert.ok(evaluated.updatedState.transitionReadiness.blockers.includes("insufficient_active_arcs"));
    assert.equal(evaluated.outputSurface.progressionReadiness.eligibleForNextMovement, false);
  });

  it("is deterministic for identical inputs", () => {
    const initial = createChapterMovementProgressionState({
      chapterId: "chapter-4",
      movementId: "movement-4",
      orderIndex: 4,
      chapterFunction: "threshold",
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    const input: Parameters<typeof evaluateChapterMovementProgression>[0] = {
      state: initial,
      evaluatedAtIso: "2026-04-15T03:00:00.000Z",
      progressionInput: {
        activeArcs: [
          { arcId: "a1", lifecycleState: "active" },
          { arcId: "a2", lifecycleState: "turning" },
        ],
        consequences: [
          { consequenceId: "c1", severity: "high", lifecycleState: "active" },
          { consequenceId: "c2", severity: "moderate", lifecycleState: "decaying" },
        ],
        relationshipThresholds: {
          ruptureRiskHigh: true,
          trustFloorBreached: false,
          reconciliationOpen: false,
        },
        unresolvedQuestions: ["is loyalty repairable?"],
        priorState: initial,
      },
    };

    const outA = evaluateChapterMovementProgression(input);
    const outB = evaluateChapterMovementProgression(input);
    assert.deepEqual(outA, outB);
  });

  it("returns bounded output surface with expected recommendation set only", () => {
    const initial = createChapterMovementProgressionState({
      chapterId: "chapter-5",
      movementId: "movement-5",
      orderIndex: 5,
      chapterFunction: "fracture",
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });

    const out = evaluateChapterMovementProgression({
      state: initial,
      evaluatedAtIso: "2026-04-15T04:00:00.000Z",
      progressionInput: {
        activeArcs: [{ arcId: "a1", lifecycleState: "active" }],
        consequences: [{ consequenceId: "c1", severity: "high", lifecycleState: "active" }],
        relationshipThresholds: {
          ruptureRiskHigh: true,
          trustFloorBreached: true,
          reconciliationOpen: false,
        },
        unresolvedQuestions: ["what broke first?", "who can intervene?"],
        priorState: initial,
      },
    });

    const allowed = new Set([
      "relational_tension",
      "social_visibility",
      "temporal_urgency",
      "resource_strain",
      "moral_conflict",
    ]);
    for (const recommendation of out.outputSurface.recommendedScenePressureTypes) {
      assert.equal(allowed.has(recommendation), true);
    }
    assert.ok(Array.isArray(out.outputSurface.unresolvedNeeds));
    assert.equal(typeof out.outputSurface.progressionReadiness.score, "number");
  });

  it("blocks truth-plane contamination from reader memory to canonical progression writes", () => {
    const initial = createChapterMovementProgressionState({
      chapterId: "chapter-6",
      movementId: "movement-6",
      orderIndex: 6,
      chapterFunction: "deepening",
      createdAtIso: "2026-04-15T00:00:00.000Z",
    });
    assert.throws(
      () =>
        evaluateChapterMovementProgression({
          state: initial,
          evaluatedAtIso: "2026-04-15T05:00:00.000Z",
          sourcePlane: "reader_interaction_memory",
          targetPlane: "canonical_truth",
          progressionInput: {
            activeArcs: [{ arcId: "a1", lifecycleState: "active" }],
            consequences: [],
            relationshipThresholds: {
              ruptureRiskHigh: false,
              trustFloorBreached: false,
              reconciliationOpen: true,
            },
            unresolvedQuestions: [],
            priorState: initial,
          },
        }),
      /interaction_memory_to_canon_blocked/
    );
  });
});
