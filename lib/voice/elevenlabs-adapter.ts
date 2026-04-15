/**
 * P2-U / P3-E — ElevenLabs synthesis: builds {@link VoiceSynthesisRequest}, validates, then either
 * calls the ElevenLabs HTTP API (when `ELEVENLABS_API_KEY` is set) or returns a deterministic stub.
 * Provider logic stays in this module; **spoken `text` only** — never `internalThought`.
 */

import type { CharacterVoiceProfileAssignment } from "@/lib/domain/character-voice-profile";
import type { CharacterPresentationMode } from "@/lib/domain/translation-presentation";
import type { VoicePerformanceProfile } from "@/lib/domain/voice-performance-profile";
import {
  VOICE_SYNTHESIS_REQUEST_CONTRACT_VERSION,
  type VoiceSynthesisOutputFormatPreferences,
  type VoiceSynthesisRequest,
} from "@/lib/domain/voice-synthesis-request";
import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import { executeWithProviderResilience, markProviderFailure } from "@/lib/services/provider-resilience-service";

const DEFAULT_OUTPUT: VoiceSynthesisOutputFormatPreferences = {
  format: "mp3",
  sampleRateHz: 44_100,
  bitrateKbps: 128,
  channels: "mono",
};

export type BuildElevenLabsSynthesisRequestParams = {
  /** Line to speak (e.g. P2-J `buildVoicePresentationPayload` → `cleanedSpokenText`, legacy `toVoiceReadyText` → `cleanedSpeech`, or raw dialogue). */
  text: string;
  voiceProfile: CharacterVoiceProfileAssignment;
  voicePresentationPayload: CharacterPresentationMode;
  voicePerformanceProfile?: VoicePerformanceProfile;
  outputFormat?: VoiceSynthesisOutputFormatPreferences;
};

/**
 * Assembles a registry-valid **ElevenLabs** synthesis request. Requires an ElevenLabs-bound
 * {@link CharacterVoiceProfileAssignment}.
 */
export function buildElevenLabsSynthesisRequest(
  params: BuildElevenLabsSynthesisRequestParams
): VoiceSynthesisRequest {
  const { voiceProfile } = params;
  if (voiceProfile.provider !== "elevenlabs") {
    throw new Error(
      `[elevenlabs-adapter] Expected voiceProfile.provider "elevenlabs", got "${voiceProfile.provider}".`
    );
  }

  const req: VoiceSynthesisRequest = {
    contractVersion: VOICE_SYNTHESIS_REQUEST_CONTRACT_VERSION,
    voiceProfile: {
      assignmentId: voiceProfile.id,
      characterId: voiceProfile.characterId,
      provider: "elevenlabs",
      externalVoiceId: voiceProfile.externalVoiceId,
      displayLabel: voiceProfile.displayLabel,
      emotionalRangeJson: voiceProfile.emotionalRangeJson ?? undefined,
    },
    voicePresentationPayload: params.voicePresentationPayload,
    provider: "elevenlabs",
    outputFormat: params.outputFormat ?? DEFAULT_OUTPUT,
    ...(params.voicePerformanceProfile
      ? { voicePerformanceProfile: params.voicePerformanceProfile }
      : {}),
    text: params.text,
  };

  return validateRegisteredContractPayload("voiceSynthesisRequest", req, "write");
}

export type ElevenLabsSynthesisStubResult = {
  stub: true;
  /** Echo of the validated request for tests and logging. */
  request: VoiceSynthesisRequest;
  /** Placeholder — no audio bytes in stub mode. */
  audioByteLength: 0;
};

/**
 * Deterministic no-op “synthesis”: validates the request and returns an empty result shape.
 */
export function synthesizeWithElevenLabsStub(request: VoiceSynthesisRequest): ElevenLabsSynthesisStubResult {
  const validated = validateRegisteredContractPayload("voiceSynthesisRequest", request, "read");
  if (validated.provider !== "elevenlabs") {
    throw new Error(`[elevenlabs-adapter] Stub accepts provider "elevenlabs" only, got "${validated.provider}".`);
  }
  return {
    stub: true,
    request: validated,
    audioByteLength: 0,
  };
}

export function isElevenLabsApiKeyConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

export type ElevenLabsLiveSynthesisSuccess = {
  ok: true;
  audioBytes: Uint8Array;
  contentType: string;
  request: VoiceSynthesisRequest;
};

export type ElevenLabsLiveSynthesisFailure = {
  ok: false;
  reason: string;
  stubFallback: ElevenLabsSynthesisStubResult;
};

export type ElevenLabsLiveSynthesisResult = ElevenLabsLiveSynthesisSuccess | ElevenLabsLiveSynthesisFailure;

const ELEVENLABS_TTS_BASE = "https://api.elevenlabs.io/v1/text-to-speech";

/**
 * Calls ElevenLabs text-to-speech when {@link isElevenLabsApiKeyConfigured}; on missing key or HTTP error,
 * returns a registry-valid stub (zero bytes) so callers can still complete flows in CI.
 *
 * **Metering:** successful live synthesis should be paired with `debitVoiceRenderInteractionUnits`
 * (`reader-interaction-balance-service`) at the orchestration layer — not inside this adapter.
 */
export async function synthesizeWithElevenLabsOrStub(request: VoiceSynthesisRequest): Promise<ElevenLabsLiveSynthesisResult> {
  const validated = validateRegisteredContractPayload("voiceSynthesisRequest", request, "read");
  if (validated.provider !== "elevenlabs") {
    throw new Error(
      `[elevenlabs-adapter] synthesizeWithElevenLabsOrStub accepts provider "elevenlabs" only, got "${validated.provider}".`
    );
  }

  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) {
    return {
      ok: false,
      reason: "ELEVENLABS_API_KEY not configured",
      stubFallback: synthesizeWithElevenLabsStub(validated),
    };
  }

  const voiceId = encodeURIComponent(validated.voiceProfile.externalVoiceId);
  const modelId = process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2";
  const url = `${ELEVENLABS_TTS_BASE}/${voiceId}`;

  try {
    const resilient = await executeWithProviderResilience<ElevenLabsLiveSynthesisResult>({
      kind: "voice",
      operation: async () => {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "xi-api-key": key,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: validated.text,
            model_id: modelId,
          }),
        });
        if (!res.ok) {
          const errBody = (await res.text().catch(() => "")).slice(0, 400);
          throw new Error(`elevenlabs_http_${res.status}:${errBody}`);
        }
        const buf = new Uint8Array(await res.arrayBuffer());
        const contentType = res.headers.get("content-type") ?? "audio/mpeg";
        return { ok: true, audioBytes: buf, contentType, request: validated };
      },
      fallback: async () => {
        const reason = "voice_provider_fallback_stub";
        return {
          ok: false,
          reason,
          stubFallback: synthesizeWithElevenLabsStub(validated),
        };
      },
    });
    return resilient.value;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch_failed";
    markProviderFailure("voice", msg);
    return {
      ok: false,
      reason: msg,
      stubFallback: synthesizeWithElevenLabsStub(validated),
    };
  }
}
