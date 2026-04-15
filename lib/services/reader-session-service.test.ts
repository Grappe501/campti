import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { composeReaderSession } from "@/lib/services/reader-session-service";

describe("reader-session-service", () => {
  it("maps cockpit session and continuity linkage", () => {
    const session = composeReaderSession({
      readerId: "reader-1",
      characterId: "char-1",
      readerState: { sessionId: "reader-1", lastSceneId: "scene-1" },
      cockpit: {
        activeSession: {
          sessionId: "conversation-1",
          characterId: "char-1",
          readerId: "reader-1",
          sceneId: "scene-1",
          status: "ACTIVE",
          interactionCount: 5,
          startedAtIso: "2026-04-15T10:00:00.000Z",
          lastInteractionAtIso: "2026-04-15T10:15:00.000Z",
          endedAtIso: null,
        },
        degradedInteraction: {
          currentPolicy: "allow_system_fallback_only",
          unavailableReason: "provider_failure",
          freeTurnCount: 0,
          lastTurnUsedDegradedFallback: false,
        },
        readerContextPreferences: {
          preferredPresentationLanguageCode: "en",
          preferredAudioEnabled: true,
          preferredNativeTongueToggleDefault: false,
          preferredVoicePlaybackSpeed: 1,
        },
      } as never,
    });
    assert.equal(session.state, "ACTIVE");
    assert.equal(session.sessionId, "conversation-1");
    assert.equal(session.degradedState.policy, "allow_system_fallback_only");
    assert.equal(session.continuityLink.lastSceneId, "scene-1");
  });
});
