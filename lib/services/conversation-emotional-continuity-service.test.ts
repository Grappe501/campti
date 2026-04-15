/**
 * P3-O emotional continuity. Run: npx tsx --test lib/services/conversation-emotional-continuity-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
  type ConversationalIdentitySnapshot,
} from "@/lib/domain/conversational-identity-snapshot";
import type { EmotionalContinuityStructuralInputs } from "@/lib/domain/conversation-emotional-continuity";
import type { SessionMemorySummary } from "@/lib/domain/session-memory-summary";
import { deriveConversationEmotionalContinuity } from "@/lib/services/conversation-emotional-continuity-service";

function snapshot(overrides: Partial<ConversationalIdentitySnapshot> = {}): ConversationalIdentitySnapshot {
  return {
    contractVersion: "1",
    builtAtIso: "2026-04-14T12:00:00.000Z",
    characterId: "char-1",
    readerId: "reader-1",
    sceneId: "scene-1",
    policy: BOUNDED_CHARACTER_CONVERSATIONAL_POLICY,
    identity: {
      person: { id: "char-1", name: "A", birthYear: 1800, deathYear: null },
      literaryProfile: null,
      coreHighlights: null,
    },
    knowledgeBoundary: { knownFacts: [], believedFacts: [], unknownDomains: [] },
    relationships: [],
    readerMemory: null,
    readerRelationshipProgression: {
      relationshipState: "recognized",
      directnessLevel: "measured",
      vulnerabilityAllowance: "limited",
      disclosureComfortBand: "basic",
      greetingStyleHint: "cautious recognition",
      familiarityLevel: 15,
      interactionCount: 2,
      keyDisclosureCount: 0,
    },
    emotionalState: {
      latestCognitionSnapshot: null,
      latestLegacyCharacterState: null,
    },
    sessionContext: null,
    ...overrides,
  };
}

function summary(overrides: Partial<SessionMemorySummary> = {}): SessionMemorySummary {
  return {
    keyReaderDisclosures: [],
    keyCharacterDisclosures: [],
    unresolvedTopics: [],
    trustMovementSummary: "cautious_building",
    emotionalBeatSummary: "guarded",
    latestSessionSummaryHash: "hash",
    builtAtIso: "2026-04-14T12:00:00.000Z",
    ...overrides,
  };
}

function structuralInputs(
  overrides: Partial<EmotionalContinuityStructuralInputs> = {}
): EmotionalContinuityStructuralInputs {
  return {
    relationshipProgression: {
      channel: "canonical_dyad",
      signals: {
        trend: "unstable",
        ruptureRisk: "high",
        disclosureLikelihoodShift: "decreasing",
        attachmentPressure: "high",
        reconciliationAvailability: "closed",
      },
      posture: "fearful_attachment",
      axes: {
        trust: 34,
        fear: 78,
        resentment: 72,
        stability: 29,
      },
    },
    consequenceOutput: {
      channel: "canonical_dyad",
      output: {
        activeConsequenceSummary: [
          {
            consequenceId: "c-1",
            category: "social",
            severity: "high",
            lifecycleState: "active",
            triggerEventType: "public_disapproval",
          },
          {
            consequenceId: "c-2",
            category: "relational",
            severity: "moderate",
            lifecycleState: "active",
            triggerEventType: "betrayal",
          },
        ],
        relationshipPressureModifiers: [
          { target: "social_risk_pressure", totalModifier: 10 },
        ],
        memorySalienceModifiers: [{ consequenceId: "c-1", salienceWeight: 90 }],
        futureConstraintSignals: [
          {
            signalCode: "avoid_public_exposure",
            severity: "high",
            sourceConsequenceId: "c-1",
          },
          {
            signalCode: "trust_repair_needed",
            severity: "moderate",
            sourceConsequenceId: "c-2",
          },
        ],
      },
    },
    memoryActivation: {
      contractVersion: "1",
      context: "interaction_mode",
      channel: "canonical_dyad",
      activatedMemories: [
        {
          memoryRefId: "m-1",
          sourceType: "character_bounded_remembered_event",
          activationReason: ["contextual_relevance_high"],
          activationWeight: 86,
          emotionalColor: "charged",
          disclosureRisk: "high",
          distortionLikelihood: "moderate",
          activationMode: "defensive_avoidance",
          summaryToken: "fractured promise memory",
        },
      ],
      activationCount: 1,
      dominantActivationMode: "defensive_avoidance",
      highestActivationWeight: 86,
      memorySalienceCapApplied: false,
      blockedSourceRefs: [],
    },
    ...overrides,
  };
}

describe("deriveConversationEmotionalContinuity", () => {
  it("stays stable under similar turn tones", () => {
    const outA = deriveConversationEmotionalContinuity({
      snapshot: snapshot(),
      sessionMemorySummary: summary(),
      recentCharacterTones: ["guarded", "guarded"],
    });
    const outB = deriveConversationEmotionalContinuity({
      snapshot: snapshot(),
      sessionMemorySummary: summary(),
      recentCharacterTones: ["guarded", "guarded"],
    });
    assert.deepEqual(outA, outB);
    assert.equal(outA.currentConversationTone, "guarded");
    assert.equal(outA.mode, "interaction_mode");
    assert.equal(outA.channel, "canonical_dyad");
  });

  it("carries over tense/fearful exchange signals", () => {
    const out = deriveConversationEmotionalContinuity({
      snapshot: snapshot({
        emotionalState: {
          latestCognitionSnapshot: {
            id: "c1",
            sceneId: "scene-1",
            label: "fear",
            currentFear: "ambush",
            currentDesire: null,
            currentObligation: null,
            currentShame: null,
            currentHope: null,
            currentAnger: null,
            currentSocialRisk: null,
            currentMask: null,
            currentContradiction: null,
            currentArousal: 80,
            currentLoneliness: null,
          },
          latestLegacyCharacterState: null,
        },
      }),
      sessionMemorySummary: summary({ unresolvedTopics: ["Can we escape?"], emotionalBeatSummary: "wary" }),
      recentCharacterTones: ["wary", "wary"],
    });
    assert.ok(out.carryoverSignals.some((s) => s.startsWith("fear:")));
    assert.ok(out.carryoverSignals.some((s) => s.includes("unresolved_topics")));
    assert.equal(out.currentConversationTone, "wary");
    assert.ok(out.pressureState.griefFearResentmentCarryover.fear >= 6);
  });

  it("warns on abrupt tone reset without resolution", () => {
    const out = deriveConversationEmotionalContinuity({
      snapshot: snapshot({
        emotionalState: {
          latestCognitionSnapshot: {
            id: "c1",
            sceneId: "scene-1",
            label: "charged",
            currentFear: "raid",
            currentDesire: null,
            currentObligation: null,
            currentShame: null,
            currentHope: null,
            currentAnger: null,
            currentSocialRisk: null,
            currentMask: null,
            currentContradiction: null,
            currentArousal: 90,
            currentLoneliness: null,
          },
          latestLegacyCharacterState: null,
        },
      }),
      sessionMemorySummary: summary({ unresolvedTopics: ["Why now?"] }),
      recentCharacterTones: ["wary", "joyful"],
    });
    assert.ok(out.continuityWarnings.includes("tone_shift_with_unresolved_topics"));
    assert.ok(out.continuityWarnings.includes("abrupt_reset_against_baseline"));
  });

  it("integrates relationship, consequence, and activation signals into bounded pressure state", () => {
    const out = deriveConversationEmotionalContinuity({
      snapshot: snapshot(),
      sessionMemorySummary: summary(),
      recentCharacterTones: ["guarded", "guarded"],
      structuralInputs: structuralInputs(),
      mode: "interaction_mode",
      channel: "canonical_dyad",
    });

    assert.ok(out.pressureState.currentAffectPressure > 45);
    assert.ok(out.pressureState.volatilityPressure > 40);
    assert.ok(out.pressureState.guardednessPressure > 50);
    assert.ok(out.pressureState.avoidancePressure > 35);
    assert.ok(out.pressureState.reasonCodes.includes("relationship_rupture_high"));
    assert.ok(out.pressureState.reasonCodes.includes("active_consequence_pressure"));
    assert.ok(out.pressureState.reasonCodes.includes("memory_defensive_avoidance"));
  });

  it("rejects canonical continuity consumption of reader-memory activations", () => {
    assert.throws(() =>
      deriveConversationEmotionalContinuity({
        snapshot: snapshot(),
        structuralInputs: structuralInputs({
          memoryActivation: {
            ...structuralInputs().memoryActivation!,
            activatedMemories: [
              {
                ...structuralInputs().memoryActivation!.activatedMemories[0]!,
                sourceType: "reader_interaction_memory",
              },
            ],
          },
        }),
        mode: "interaction_mode",
        channel: "canonical_dyad",
      })
    );
  });

  it("rejects structural channel mismatch", () => {
    assert.throws(() =>
      deriveConversationEmotionalContinuity({
        snapshot: snapshot(),
        structuralInputs: structuralInputs({
          consequenceOutput: {
            ...structuralInputs().consequenceOutput!,
            channel: "reader_bond_dyad",
          },
        }),
        mode: "interaction_mode",
        channel: "canonical_dyad",
      })
    );
  });
});
