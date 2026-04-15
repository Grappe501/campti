/**
 * P3-T story re-entry continuity. Run: npx tsx --test lib/services/story-reentry-continuity-service.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ReaderCockpitPayload } from "@/lib/domain/reader-cockpit-payload";
import { composeStoryReentryContinuityPayload } from "@/lib/services/story-reentry-continuity-service";

function cockpit(status: "ACTIVE" | "PAUSED" | "ENDED"): ReaderCockpitPayload {
  return {
    contractVersion: "1",
    builtAtIso: "2026-04-14T12:00:00.000Z",
    readerId: "reader-1",
    characterId: "char-1",
    activeSession: {
      sessionId: "s1",
      characterId: "char-1",
      readerId: "reader-1",
      sceneId: "scene-1",
      status,
      interactionCount: 4,
      startedAtIso: "2026-04-14T11:00:00.000Z",
      lastInteractionAtIso: "2026-04-14T11:15:00.000Z",
      endedAtIso: status === "ENDED" ? "2026-04-14T11:16:00.000Z" : null,
    },
    sceneInteractionContext: null,
    conversationalIdentitySummary: null,
    readerRelationshipProgression: {
      relationshipState: "trusted",
      directnessLevel: "open",
      vulnerabilityAllowance: "high",
      disclosureComfortBand: "personal",
      greetingStyleHint: "trusted warmth",
      familiarityLevel: 64,
      interactionCount: 9,
      keyDisclosureCount: 3,
    },
    emotionalContinuity: {
      baselineTone: "wary",
      currentConversationTone: "guarded",
      carryoverSignals: [],
      continuityWarnings: [],
      channel: "canonical_dyad",
      mode: "interaction_mode",
      pressureState: {
        currentAffectPressure: 24,
        volatilityPressure: 18,
        guardednessPressure: 44,
        opennessPressure: 38,
        griefFearResentmentCarryover: {
          grief: 8,
          fear: 16,
          resentment: 12,
        },
        conflictReadinessPressure: 22,
        avoidancePressure: 28,
        reasonCodes: ["seeded_test_fixture"],
      },
    },
    latestTranscriptTurns: [],
    voicePresentationReadiness: {
      characterPresentationMode: {
        cognitionLanguageCode: "fr",
        readerPresentationLanguageCode: "en",
        translationApplied: true,
        nativeTongueAvailable: true,
      },
      hasTtsVoiceAssignment: true,
      readyForVoicePlayback: status !== "ENDED",
      preferredAudioEnabled: true,
      preferredVoicePlaybackSpeed: 1,
    },
    costEstimateSummary: {
      narrationMode: "bounded_character_conversation",
      ledgerSessionSummary: null,
    },
    policySummary: null,
    sessionMemorySummary: {
      keyReaderDisclosures: [],
      keyCharacterDisclosures: [],
      unresolvedTopics: [],
      trustMovementSummary: "growing_familiarity",
      emotionalBeatSummary: "guarded",
      latestSessionSummaryHash: "hash-1",
      builtAtIso: "2026-04-14T11:20:00.000Z",
    },
  };
}

describe("composeStoryReentryContinuityPayload", () => {
  it("resumes paused session conversation", () => {
    const out = composeStoryReentryContinuityPayload({
      readerId: "reader-1",
      characterId: "char-1",
      preferredSceneId: "scene-1",
      cockpit: cockpit("PAUSED"),
      driftSignals: [],
    });
    assert.equal(out.resumeAvailable, true);
    assert.equal(out.recommendedFirstAction, "resume_conversation");
  });

  it("avoids resume for ended sessions", () => {
    const out = composeStoryReentryContinuityPayload({
      readerId: "reader-1",
      characterId: "char-1",
      preferredSceneId: "scene-1",
      cockpit: cockpit("ENDED"),
      driftSignals: [],
    });
    assert.equal(out.resumeAvailable, false);
    assert.equal(out.recommendedFirstAction, "resume_story_playback");
  });

  it("flags scene mismatch", () => {
    const out = composeStoryReentryContinuityPayload({
      readerId: "reader-1",
      characterId: "char-1",
      preferredSceneId: "scene-2",
      cockpit: cockpit("PAUSED"),
      driftSignals: [],
    });
    assert.equal(out.sceneMismatch, true);
    assert.equal(out.recommendedFirstAction, "resume_story_playback");
  });

  it("retains relationship continuity in payload", () => {
    const out = composeStoryReentryContinuityPayload({
      readerId: "reader-1",
      characterId: "char-1",
      preferredSceneId: "scene-1",
      cockpit: cockpit("ACTIVE"),
      driftSignals: ["identity_hash_changed"],
    });
    assert.equal(out.relationshipState, "trusted");
    assert.equal(out.continuitySummaryHash, "hash-1");
    assert.ok(out.driftSignals.includes("identity_hash_changed"));
  });
});
