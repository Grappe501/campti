import type { InnerVoiceSessionMode } from "@prisma/client";

import type { CharacterInnerVoiceResponse } from "@/lib/domain/inner-voice";
import type { InnerVoiceMode } from "@/lib/domain/inner-voice";

/**
 * Phase 5C — contract unification (partial).
 *
 * **Prisma `InnerVoiceSessionMode` (v1 persistence)** — narrow enum on `CharacterInnerVoiceSession.mode`:
 * - INNER_VOICE
 * - DECISION_TRACE
 * - ALTERNATE_RUN
 * - GOD_MODE_QA
 *
 * **Domain `InnerVoiceMode` (v2+ request)** — interrogation channel for the inner voice builder:
 * - INNER_MONOLOGUE, TABOO_SURFACING, SELF_JUSTIFICATION, FEAR_STACK, CONTRADICTION_TRACE, GOD_MODE_QA
 *
 * Mapping for storage when persisting a v2/v3 request against the v1 enum:
 * - GOD_MODE_QA → GOD_MODE_QA
 * - DECISION_TRACE / ALTERNATE_RUN are reserved for other flows (Phase 5D+), not inner voice modes
 * - All other `InnerVoiceMode` values → INNER_VOICE (store the precise mode in `inputContextJson.request.mode`)
 */
export function innerVoiceModeToSessionMode(mode: InnerVoiceMode): InnerVoiceSessionMode {
  if (mode === "GOD_MODE_QA") return "GOD_MODE_QA";
  return "INNER_VOICE";
}

/** Versioned envelope for `outputSummaryJson` without migrating Prisma yet. */
export type InnerVoiceResponseEnvelopeV2 = {
  version: "v2";
  data: CharacterInnerVoiceResponse;
};

export function wrapInnerVoiceResponseV2(data: CharacterInnerVoiceResponse): InnerVoiceResponseEnvelopeV2 {
  return { version: "v2", data };
}

export function unwrapInnerVoiceResponseEnvelope(
  json: unknown
): CharacterInnerVoiceResponse | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  if (o.version === "v2" && o.data && typeof o.data === "object") {
    return o.data as CharacterInnerVoiceResponse;
  }
  return null;
}
