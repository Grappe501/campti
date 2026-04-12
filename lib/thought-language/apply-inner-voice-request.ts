import type { CharacterInnerVoiceRequest } from "@/lib/domain/inner-voice";
import type { ThoughtLanguageFrame } from "@/lib/domain/thought-language";

/**
 * Attaches resolved thought-language mediation to the inner voice request (Phase 5C prompts).
 * Does not call LLM.
 */
export function applyThoughtLanguageShapingToInnerVoiceRequest(
  request: CharacterInnerVoiceRequest,
  thoughtLanguageFrame: ThoughtLanguageFrame
): CharacterInnerVoiceRequest {
  return {
    ...request,
    contractVersion: "3",
    thoughtLanguageFrame,
  };
}
