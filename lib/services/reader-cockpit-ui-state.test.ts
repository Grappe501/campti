/**
 * P3-Q cockpit UI state helpers. Run: npx tsx --test lib/services/reader-cockpit-ui-state.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ReaderCockpitPayload } from "@/lib/domain/reader-cockpit-payload";
import {
  deriveCockpitUiIndicators,
  reduceCockpitFlowState,
} from "@/lib/services/reader-cockpit-ui-state";

function payload(overrides: Partial<ReaderCockpitPayload> = {}): ReaderCockpitPayload {
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
      status: "ACTIVE",
      interactionCount: 3,
      startedAtIso: "2026-04-14T11:00:00.000Z",
      lastInteractionAtIso: "2026-04-14T11:10:00.000Z",
      endedAtIso: null,
    },
    sceneInteractionContext: null,
    conversationalIdentitySummary: null,
    latestTranscriptTurns: [],
    voicePresentationReadiness: {
      characterPresentationMode: {
        cognitionLanguageCode: "fr",
        readerPresentationLanguageCode: "en",
        translationApplied: true,
        nativeTongueAvailable: true,
      },
      hasTtsVoiceAssignment: true,
      readyForVoicePlayback: true,
      preferredAudioEnabled: true,
      preferredVoicePlaybackSpeed: 1,
    },
    costEstimateSummary: {
      narrationMode: "bounded_character_conversation",
      ledgerSessionSummary: null,
    },
    policySummary: null,
    presentationPlaybackPreference: "translated_default",
    ...overrides,
  };
}

describe("reduceCockpitFlowState", () => {
  it("handles start/pause/resume/end transitions", () => {
    let state = reduceCockpitFlowState("idle", "start_requested");
    state = reduceCockpitFlowState(state, "start_succeeded");
    state = reduceCockpitFlowState(state, "pause_requested");
    state = reduceCockpitFlowState(state, "resume_requested");
    state = reduceCockpitFlowState(state, "resume_succeeded");
    state = reduceCockpitFlowState(state, "end_succeeded");
    assert.equal(state, "ended");
  });
});

describe("deriveCockpitUiIndicators", () => {
  it("flags session reuse when active session exists", () => {
    const out = deriveCockpitUiIndicators(payload());
    assert.equal(out.sessionReusable, true);
  });

  it("detects missing voice availability", () => {
    const out = deriveCockpitUiIndicators(
      payload({
        voicePresentationReadiness: {
          ...payload().voicePresentationReadiness,
          hasTtsVoiceAssignment: false,
          readyForVoicePlayback: false,
        },
      })
    );
    assert.equal(out.voiceAvailability, "missing_assignment");
  });

  it("shows native-unavailable translation indicator when preference requests native", () => {
    const out = deriveCockpitUiIndicators(
      payload({
        presentationPlaybackPreference: "native_when_available",
        voicePresentationReadiness: {
          ...payload().voicePresentationReadiness,
          characterPresentationMode: {
            ...payload().voicePresentationReadiness.characterPresentationMode,
            nativeTongueAvailable: false,
          },
        },
      })
    );
    assert.equal(out.translationIndicator, "native_unavailable");
  });
});
