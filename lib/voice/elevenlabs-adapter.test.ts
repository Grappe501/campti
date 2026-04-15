/**
 * P2-U ElevenLabs adapter stub. Run: npx tsx --test lib/voice/elevenlabs-adapter.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import { VOICE_SYNTHESIS_REQUEST_CONTRACT_VERSION } from "@/lib/domain/voice-synthesis-request";
import type { CharacterVoiceProfileAssignment } from "@/lib/domain/character-voice-profile";
import { DEFAULT_READER_PRESENTATION_LANGUAGE_CODE } from "@/lib/domain/translation-presentation";
import { buildCharacterPresentationMode } from "@/lib/services/translation-presentation-service";
import {
  buildElevenLabsSynthesisRequest,
  synthesizeWithElevenLabsOrStub,
  synthesizeWithElevenLabsStub,
} from "@/lib/voice/elevenlabs-adapter";

function elevenLabsAssignment(overrides: Partial<CharacterVoiceProfileAssignment> = {}): CharacterVoiceProfileAssignment {
  const base: CharacterVoiceProfileAssignment = {
    id: "assign-1",
    characterId: "char-1",
    provider: "elevenlabs",
    externalVoiceId: "ext-voice-abc",
    displayLabel: "Southern narrator",
    emotionalRangeJson: null,
    metadataJson: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
  return { ...base, ...overrides };
}

describe("buildElevenLabsSynthesisRequest", () => {
  it("builds a registry-valid request with voice profile, presentation payload, provider, and output format", () => {
    const presentation = buildCharacterPresentationMode({
      characterPrimaryMindLanguage: "fr",
      readerPresentationLanguageCode: "en",
    });
    const req = buildElevenLabsSynthesisRequest({
      text: "Bonjour.",
      voiceProfile: elevenLabsAssignment(),
      voicePresentationPayload: presentation,
      voicePerformanceProfile: {
        pauseStrategy: "measured",
        emphasisHints: ["hold unresolved clause"],
        toneIntensityHint: "medium",
        speakingStyleHints: ["grounded declarative cadence"],
      },
    });

    assert.equal(req.contractVersion, VOICE_SYNTHESIS_REQUEST_CONTRACT_VERSION);
    assert.equal(req.provider, "elevenlabs");
    assert.equal(req.voiceProfile.externalVoiceId, "ext-voice-abc");
    assert.equal(req.voiceProfile.assignmentId, "assign-1");
    assert.equal(req.voicePresentationPayload.translationApplied, true);
    assert.equal(req.outputFormat.format, "mp3");
    assert.equal(req.outputFormat.sampleRateHz, 44_100);
    assert.equal(req.voicePerformanceProfile?.pauseStrategy, "measured");
    assert.equal(req.text, "Bonjour.");

    const validated = validateRegisteredContractPayload("voiceSynthesisRequest", req, "write");
    assert.deepEqual(validated, req);
  });

  it("throws when voice profile is not elevenlabs", () => {
    assert.throws(
      () =>
        buildElevenLabsSynthesisRequest({
          text: "Hi",
          voiceProfile: elevenLabsAssignment({ provider: "other" }),
          voicePresentationPayload: {
            cognitionLanguageCode: null,
            readerPresentationLanguageCode: DEFAULT_READER_PRESENTATION_LANGUAGE_CODE,
            translationApplied: false,
            nativeTongueAvailable: false,
          },
        }),
      /elevenlabs/
    );
  });
});

describe("synthesizeWithElevenLabsStub", () => {
  it("returns stub metadata and re-validates the request", () => {
    const req = buildElevenLabsSynthesisRequest({
      text: "Hello.",
      voiceProfile: elevenLabsAssignment(),
      voicePresentationPayload: buildCharacterPresentationMode({}),
    });
    const out = synthesizeWithElevenLabsStub(req);
    assert.equal(out.stub, true);
    assert.equal(out.audioByteLength, 0);
    assert.equal(out.request.contractVersion, VOICE_SYNTHESIS_REQUEST_CONTRACT_VERSION);
  });

  it("rejects non-elevenlabs provider", () => {
    const bad = {
      ...buildElevenLabsSynthesisRequest({
        text: "x",
        voiceProfile: elevenLabsAssignment(),
        voicePresentationPayload: buildCharacterPresentationMode({}),
      }),
      provider: "other" as const,
    };
    assert.throws(() => synthesizeWithElevenLabsStub(bad), /elevenlabs/);
  });
});

describe("synthesizeWithElevenLabsOrStub", () => {
  it("returns stub fallback when API key is not configured (CI-safe)", async () => {
    if (process.env.ELEVENLABS_API_KEY?.trim()) {
      assert.ok(true, "skip: ELEVENLABS_API_KEY is set");
      return;
    }
    const req = buildElevenLabsSynthesisRequest({
      text: "Hello.",
      voiceProfile: elevenLabsAssignment(),
      voicePresentationPayload: buildCharacterPresentationMode({}),
    });
    const out = await synthesizeWithElevenLabsOrStub(req);
    assert.equal(out.ok, false);
    if (!out.ok) {
      assert.ok(out.reason.includes("ELEVENLABS_API_KEY"));
      assert.equal(out.stubFallback.stub, true);
      assert.equal(out.stubFallback.audioByteLength, 0);
    }
  });
});
