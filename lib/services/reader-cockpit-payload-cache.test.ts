/**
 * P4-H cockpit payload cache tests.
 * Run: npx tsx --test lib/services/reader-cockpit-payload-cache.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ReaderCockpitPayload } from "@/lib/domain/reader-cockpit-payload";
import {
  getReaderCockpitPayloadCacheSizeForTests,
  invalidateReaderCockpitPayloadCache,
  primeReaderCockpitPayloadCacheForTests,
} from "@/lib/services/reader-cockpit-payload-service";

function fakePayload(readerId: string, characterId: string): ReaderCockpitPayload {
  return {
    contractVersion: "1",
    builtAtIso: new Date().toISOString(),
    readerId,
    characterId,
    activeSession: null,
    sceneInteractionContext: null,
    conversationalIdentitySummary: null,
    latestTranscriptTurns: [],
    voicePresentationReadiness: {
      characterPresentationMode: {
        cognitionLanguageCode: null,
        readerPresentationLanguageCode: "en",
        translationApplied: false,
        nativeTongueAvailable: false,
      },
      hasTtsVoiceAssignment: false,
      readyForVoicePlayback: false,
      preferredAudioEnabled: false,
      preferredVoicePlaybackSpeed: 1,
    },
    costEstimateSummary: {
      narrationMode: "bounded_character_conversation",
      ledgerSessionSummary: null,
    },
    policySummary: null,
  };
}

describe("reader-cockpit payload cache", () => {
  it("invalidates only matching cache slices", () => {
    invalidateReaderCockpitPayloadCache();
    primeReaderCockpitPayloadCacheForTests(
      "reader-1::char-1::session-1::12",
      fakePayload("reader-1", "char-1")
    );
    primeReaderCockpitPayloadCacheForTests(
      "reader-2::char-2::session-2::12",
      fakePayload("reader-2", "char-2")
    );
    assert.equal(getReaderCockpitPayloadCacheSizeForTests(), 2);
    invalidateReaderCockpitPayloadCache({
      readerId: "reader-1",
      sessionId: "session-1",
    });
    assert.equal(getReaderCockpitPayloadCacheSizeForTests(), 1);
    invalidateReaderCockpitPayloadCache();
    assert.equal(getReaderCockpitPayloadCacheSizeForTests(), 0);
  });
});

