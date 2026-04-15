/**
 * Phase 2 / Chunk 7 — Emergence orchestrator verification.
 * Run: npx tsx --test lib/services/narrative-emergence-orchestrator-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { NarrativeEmergenceInputSurface } from "@/lib/domain/narrative-emergence-bundle";
import { buildNarrativeEmergenceBundle } from "@/lib/services/narrative-emergence-orchestrator-service";
import { buildStorylineOrchestrationInputsFromSeamContext } from "@/lib/services/storyline-orchestrator-integration-service";

function surfaces(overrides: Partial<NarrativeEmergenceInputSurface> = {}): NarrativeEmergenceInputSurface {
  return {
    consequenceOutput: {
      activeConsequenceSummary: [
        {
          consequenceId: "c-1",
          category: "social",
          severity: "high",
          lifecycleState: "active",
          triggerEventType: "public_disapproval",
        },
      ],
      relationshipPressureModifiers: [{ target: "social_risk_pressure", totalModifier: 14 }],
      memorySalienceModifiers: [{ consequenceId: "c-1", salienceWeight: 86 }],
      futureConstraintSignals: [
        {
          signalCode: "avoid_public_exposure",
          severity: "high",
          sourceConsequenceId: "c-1",
        },
      ],
    },
    memoryActivation: {
      contractVersion: "1",
      context: "interaction_mode",
      channel: "reader_bond_dyad",
      activatedMemories: [
        {
          memoryRefId: "m-1",
          sourceType: "character_bounded_remembered_event",
          activationReason: ["contextual_relevance_high"],
          activationWeight: 83,
          emotionalColor: "charged",
          disclosureRisk: "high",
          distortionLikelihood: "moderate",
          activationMode: "defensive_avoidance",
          summaryToken: "memory-token",
        },
      ],
      activationCount: 1,
      dominantActivationMode: "defensive_avoidance",
      highestActivationWeight: 83,
      memorySalienceCapApplied: false,
      blockedSourceRefs: [],
    },
    emotionalContinuity: {
      baselineTone: "wary",
      currentConversationTone: "guarded",
      carryoverSignals: ["rel_rupture:high"],
      continuityWarnings: [],
      mode: "interaction_mode",
      channel: "reader_bond_dyad",
      pressureState: {
        currentAffectPressure: 68,
        volatilityPressure: 61,
        guardednessPressure: 72,
        opennessPressure: 32,
        griefFearResentmentCarryover: {
          grief: 24,
          fear: 55,
          resentment: 43,
        },
        conflictReadinessPressure: 58,
        avoidancePressure: 66,
        reasonCodes: ["seeded"],
      },
    },
    temporalEvolution: {
      contractVersion: "1",
      channel: "reader_bond_dyad",
      mode: "interaction_mode",
      triggerKind: "conversation_reentry_elapsed_interval",
      applied: true,
      elapsedIntervalHours: 30,
      griefDurationStage: "latent",
      roleShift: "none",
      repeatedPressureFactors: {
        social: 61,
        scarcity: 48,
        conflict: 72,
        grief: 67,
      },
      relationshipBaselineDrift: {
        trustBaselineDelta: -5,
        fearHardeningDelta: 7,
        dependenceAutonomyDelta: 3,
        dutyBurdenDelta: 2,
        stabilityDelta: -4,
      },
      memorySalienceDrift: [{ sourceConsequenceId: "c-1", salienceDelta: 9 }],
      emotionalContinuityModifiers: {
        affectDelta: 7,
        volatilityDelta: 8,
        guardednessDelta: 5,
        opennessDelta: -4,
        avoidanceDelta: 6,
      },
      behaviorTendencySummary: {
        conflictReadinessDelta: 6,
        conflictAvoidanceDelta: 4,
        dutyRigidityDelta: 3,
        trustApproachDelta: -5,
      },
      reasonCodes: ["elapsed_interval_threshold_met"],
    },
    relationshipTensionSignals: ["rupture_risk_high", "disclosure_decreasing"],
    ...overrides,
  };
}

describe("narrative-emergence-orchestrator-service", () => {
  it("builds deterministic bounded emergence bundle", () => {
    const input = {
      mode: "interaction_mode" as const,
      channel: "reader_bond_dyad" as const,
      surfaces: surfaces(),
    };
    const a = buildNarrativeEmergenceBundle(input);
    const b = buildNarrativeEmergenceBundle(input);
    assert.deepEqual(a, b);
    assert.ok(a.relationshipPressures.length <= 10);
    assert.ok(a.behavioralConstraints.length <= 8);
    assert.equal(a.disclosureTendencies.tendency, "withhold");
  });

  it("enforces scene mode canonical restriction", () => {
    assert.throws(() =>
      buildNarrativeEmergenceBundle({
        mode: "scene_mode",
        channel: "reader_bond_dyad",
        surfaces: surfaces(),
      })
    );
  });

  it("rejects canonical channel reading reader memory activations", () => {
    assert.throws(() =>
      buildNarrativeEmergenceBundle({
        mode: "interaction_mode",
        channel: "canonical_dyad",
        surfaces: surfaces({
          memoryActivation: {
            ...surfaces().memoryActivation!,
            channel: "canonical_dyad",
            activatedMemories: [
              {
                ...surfaces().memoryActivation!.activatedMemories[0]!,
                sourceType: "reader_interaction_memory",
              },
            ],
          },
        }),
      })
    );
  });

  it("includes debug explanation only when explicitly requested", () => {
    const plain = buildNarrativeEmergenceBundle({
      mode: "interaction_mode",
      channel: "reader_bond_dyad",
      surfaces: surfaces(),
    });
    const debug = buildNarrativeEmergenceBundle({
      mode: "interaction_mode",
      channel: "reader_bond_dyad",
      surfaces: surfaces(),
      includeDebugExplanation: true,
    });
    assert.equal("debugExplanation" in plain, false);
    assert.equal(Boolean(debug.debugExplanation), true);
  });

  it("attaches compact storyline guidance when orchestration inputs are provided", () => {
    const out = buildNarrativeEmergenceBundle({
      mode: "interaction_mode",
      channel: "reader_bond_dyad",
      surfaces: {
        ...surfaces(),
        storylineOrchestration: buildStorylineOrchestrationInputsFromSeamContext({
          mode: "interaction_mode",
          channel: "reader_bond_dyad",
          seamId: "test-seam",
          relationshipSignalCodes: ["signal_a", "signal_b", "signal_c"],
          emotionalContinuity: surfaces().emotionalContinuity,
          temporalEvolution: surfaces().temporalEvolution,
        }),
      },
    });
    assert.ok(out.storylineGuidance);
    assert.ok((out.storylineGuidance?.activeArcPriorities.length ?? 0) <= 5);
    assert.ok((out.storylineGuidance?.currentNarrativeQuestions.length ?? 0) <= 8);
  });
});
