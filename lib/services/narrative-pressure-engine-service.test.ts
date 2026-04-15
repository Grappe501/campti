import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  NARRATIVE_PRESSURE_CATEGORIES,
  NARRATIVE_PRESSURE_EXPRESSION_MODES,
} from "@/lib/domain/narrative-pressure";
import { evaluateNarrativePressure } from "@/lib/services/narrative-pressure-engine-service";

describe("narrative-pressure-engine-service", () => {
  it("produces supported categories and source authorities", () => {
    const out = evaluateNarrativePressure({
      evaluatedAtIso: "2026-04-15T00:00:00.000Z",
      pressureInput: {
        activeArcs: [
          {
            arcId: "arc-1",
            arcType: "forbidden_courtship",
            lifecycleState: "active",
            tensionLevel: 72,
          },
        ],
        chapterFunction: "deepening",
        worldStatePressure: 40,
        unresolvedConsequences: [],
      },
    });

    assert.ok(out.activePressures.length > 0);
    for (const pressure of out.activePressures) {
      assert.equal(NARRATIVE_PRESSURE_CATEGORIES.includes(pressure.category), true);
      assert.ok(pressure.sources.length > 0);
    }
  });

  it("keeps intensity and influence bounded (no override commands)", () => {
    const out = evaluateNarrativePressure({
      evaluatedAtIso: "2026-04-15T01:00:00.000Z",
      pressureInput: {
        activeArcs: [
          { arcId: "arc-2", arcType: "revenge_justice", lifecycleState: "crisis", tensionLevel: 100 },
          { arcId: "arc-3", arcType: "succession", lifecycleState: "escalating", tensionLevel: 95 },
        ],
        chapterFunction: "reversal",
        worldStatePressure: 95,
        unresolvedConsequences: [
          {
            consequenceId: "cons-1",
            category: "social",
            severity: "high",
            lifecycleState: "active",
          },
        ],
      },
    });

    for (const pressure of out.activePressures) {
      assert.equal(pressure.intensity >= 0 && pressure.intensity <= 100, true);
      assert.equal(pressure.explanation.reasonCodes.includes("force_override"), false);
    }
    for (const hint of out.influenceHints) {
      assert.equal(hint.forceOverride, false);
      assert.equal(Math.abs(hint.sceneCandidateWeightDelta) <= 20, true);
      assert.equal(Math.abs(hint.responseTendencyWeightDelta) <= 20, true);
      assert.equal(Math.abs(hint.tensionEmphasisWeightDelta) <= 20, true);
      assert.equal(Math.abs(hint.memoryActivationWeightDelta) <= 20, true);
      assert.equal(Math.abs(hint.opportunitySurfaceWeightDelta) <= 20, true);
    }
  });

  it("marks blocked and reinforcing states deterministically", () => {
    const out = evaluateNarrativePressure({
      evaluatedAtIso: "2026-04-15T02:00:00.000Z",
      pressureInput: {
        activeArcs: [
          { arcId: "arc-4", arcType: "marriage_fracture", lifecycleState: "active", tensionLevel: 70 },
        ],
        chapterFunction: "fracture",
        worldStatePressure: 50,
        unresolvedConsequences: [
          {
            consequenceId: "cons-2",
            category: "relational",
            severity: "high",
            lifecycleState: "active",
          },
        ],
        shapingDefaults: {
          conflict: 8,
        },
        blockedConditionCodes: ["block_conflict"],
      },
    });

    const conflict = out.activePressures.find((pressure) => pressure.category === "conflict");
    assert.ok(conflict);
    assert.ok(conflict!.blockedConditions.some((code) => code.includes("blocked_by_policy_conflict")));
    assert.ok(conflict!.reinforcingConditions.includes("multi_source_alignment"));
  });

  it("prevents shaping defaults from acting as direct pressure without structural support", () => {
    const out = evaluateNarrativePressure({
      evaluatedAtIso: "2026-04-15T03:00:00.000Z",
      pressureInput: {
        activeArcs: [],
        chapterFunction: "setup",
        worldStatePressure: 0,
        unresolvedConsequences: [],
        shapingDefaults: {
          intimacy: 12,
        },
      },
    });

    const intimacy = out.activePressures.find((pressure) => pressure.category === "intimacy");
    if (intimacy) {
      assert.ok(intimacy.blockedConditions.includes("insufficient_structural_support"));
      assert.equal(intimacy.allowedExpressionModes.includes("surface_opportunity_bias"), false);
    } else {
      assert.ok(true, "no pressure emitted is acceptable for unsupported shaping-only input");
    }
  });

  it("returns deterministic output shape and expression modes", () => {
    const input: Parameters<typeof evaluateNarrativePressure>[0] = {
      evaluatedAtIso: "2026-04-15T04:00:00.000Z",
      pressureInput: {
        activeArcs: [
          {
            arcId: "arc-5",
            arcType: "reconciliation_attempt",
            lifecycleState: "resolving",
            tensionLevel: 64,
          },
        ],
        chapterFunction: "recommitment",
        worldStatePressure: 30,
        unresolvedConsequences: [],
      },
    };
    const a = evaluateNarrativePressure(input);
    const b = evaluateNarrativePressure(input);
    assert.deepEqual(a, b);
    for (const pressure of a.activePressures) {
      for (const mode of pressure.allowedExpressionModes) {
        assert.equal(NARRATIVE_PRESSURE_EXPRESSION_MODES.includes(mode), true);
      }
    }
  });

  it("blocks truth-plane contamination from reader memory into canonical pressure path", () => {
    assert.throws(
      () =>
        evaluateNarrativePressure({
          evaluatedAtIso: "2026-04-15T05:00:00.000Z",
          sourcePlane: "reader_interaction_memory",
          targetPlane: "canonical_truth",
          pressureInput: {
            activeArcs: [],
            chapterFunction: "setup",
            worldStatePressure: 20,
            unresolvedConsequences: [],
          },
        }),
      /interaction_memory_to_canon_blocked/
    );
  });
});
