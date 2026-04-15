/**
 * Phase 2 / Chunk 6 — Temporal evolution layer verification.
 * Run: npx tsx --test lib/services/temporal-evolution-layer-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { TemporalEvolutionInput } from "@/lib/domain/temporal-evolution";
import {
  deriveTemporalEvolutionSummary,
  shouldApplyTemporalEvolution,
} from "@/lib/services/temporal-evolution-layer-service";

function baseInput(overrides: Partial<TemporalEvolutionInput> = {}): TemporalEvolutionInput {
  return {
    channel: "canonical_dyad",
    mode: "interaction_mode",
    trigger: {
      triggerKind: "conversation_reentry_elapsed_interval",
      occurredAtIso: "2026-04-15T12:00:00.000Z",
      elapsedIntervalHours: 24,
    },
    relationship: {
      trustBaseline: 48,
      fearBaseline: 58,
      dependenceBaseline: 51,
      autonomyBaseline: 44,
      dutyBaseline: 57,
      stabilityBaseline: 42,
    },
    pressure: {
      repeatedSocialPressure: 62,
      repeatedScarcityPressure: 54,
      repeatedConflictPressure: 66,
      repeatedGriefPressure: 70,
    },
    unresolvedDurations: {
      unresolvedGriefDays: 48,
      unresolvedConsequenceDays: 24,
      unresolvedBreachDays: 16,
    },
    memory: {
      highestActivationWeight: 78,
      activationCount: 3,
      dominantActivationMode: "defensive_avoidance",
    },
    consequenceMemorySalience: [
      { consequenceId: "cons-1", salienceWeight: 90 },
      { consequenceId: "cons-2", salienceWeight: 65 },
    ],
    roleShift: {
      lifeStageShift: "none",
      roleBurdenShift: "none",
    },
    ...overrides,
  };
}

describe("temporal-evolution-layer-service", () => {
  it("applies only for elapsed-interval trigger thresholds", () => {
    const blocked = shouldApplyTemporalEvolution({
      triggerKind: "conversation_reentry_elapsed_interval",
      occurredAtIso: "2026-04-15T12:00:00.000Z",
      elapsedIntervalHours: 2,
    });
    assert.equal(blocked.apply, false);

    const allowed = shouldApplyTemporalEvolution({
      triggerKind: "conversation_reentry_elapsed_interval",
      occurredAtIso: "2026-04-15T12:00:00.000Z",
      elapsedIntervalHours: 8,
    });
    assert.equal(allowed.apply, true);
  });

  it("does not run as continuous simulation when elapsed threshold is not met", () => {
    const out = deriveTemporalEvolutionSummary(
      baseInput({
        trigger: {
          triggerKind: "scene_generation_elapsed_interval",
          occurredAtIso: "2026-04-15T12:00:00.000Z",
          elapsedIntervalHours: 1,
        },
      })
    );
    assert.equal(out.applied, false);
    assert.equal(out.relationshipBaselineDrift.trustBaselineDelta, 0);
    assert.equal(out.emotionalContinuityModifiers.volatilityDelta, 0);
    assert.ok(out.reasonCodes.includes("elapsed_interval_below_threshold"));
  });

  it("produces bounded deterministic drift summaries", () => {
    const input = baseInput();
    const outA = deriveTemporalEvolutionSummary(input);
    const outB = deriveTemporalEvolutionSummary(input);
    assert.deepEqual(outA, outB);
    assert.equal(outA.applied, true);
    assert.ok(outA.relationshipBaselineDrift.trustBaselineDelta >= -12);
    assert.ok(outA.relationshipBaselineDrift.trustBaselineDelta <= 4);
    assert.ok(outA.relationshipBaselineDrift.fearHardeningDelta >= -4);
    assert.ok(outA.relationshipBaselineDrift.fearHardeningDelta <= 12);
    assert.ok(outA.memorySalienceDrift.length <= 12);
  });

  it("supports minimal life-stage / role shift pressure", () => {
    const out = deriveTemporalEvolutionSummary(
      baseInput({
        roleShift: {
          lifeStageShift: "youth_to_elder_authority",
          roleBurdenShift: "none",
        },
      })
    );
    assert.equal(out.roleShift, "youth_to_elder_authority");
    assert.ok(out.behaviorTendencySummary.dutyRigidityDelta >= 1);
    assert.ok(out.reasonCodes.some((code) => code.includes("role_shift:youth_to_elder_authority")));
  });

  it("rejects invalid channel/mode runtime inputs to prevent prohibited crossings", () => {
    const invalidChannel = {
      ...baseInput(),
      channel: "invalid_cross_plane_channel",
    } as unknown as TemporalEvolutionInput;
    const invalidMode = {
      ...baseInput(),
      mode: "invalid_mode",
    } as unknown as TemporalEvolutionInput;
    assert.throws(() =>
      deriveTemporalEvolutionSummary(invalidChannel)
    );
    assert.throws(() =>
      deriveTemporalEvolutionSummary(invalidMode)
    );
  });
});
