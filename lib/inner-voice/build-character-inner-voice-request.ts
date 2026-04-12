import type { CharacterCognitionFrame } from "@/lib/domain/cognition";
import type { CharacterInnerVoiceRequest, InnerVoiceMode } from "@/lib/domain/inner-voice";
import { cognitionFrameToPromptPayload } from "@/lib/services/character-cognition-resolver";
import { prisma } from "@/lib/prisma";

import { buildAgeMaturityThoughtStyle } from "@/lib/inner-voice/framing/age-maturity-thought-style";
import { buildInnerVoiceConstraintFrame } from "@/lib/inner-voice/framing/constraint-frame";
import {
  computeCharacterAgeYears,
  inferApproximateStoryYearFromScene,
  resolveCharacterAgeBand,
} from "@/lib/inner-voice/framing/age-band";
import { buildWorldStateThoughtStyle } from "@/lib/inner-voice/framing/world-state-thought-style";
import { loadWorldStateThoughtStyleSource } from "@/lib/inner-voice/load-world-state-thought-style-source";

export type BuildCharacterInnerVoiceRequestOptions = {
  frame: CharacterCognitionFrame;
  mode: InnerVoiceMode;
  /** GOD_MODE_QA or targeted follow-up; use "" to omit. */
  authorQuestion?: string | null;
  /** When set, overrides scene-derived story year for age. */
  approximateStoryYearOverride?: number | null;
  /** Optional override for JSON payload (defaults to cognitionFrameToPromptPayload). */
  cognitionFramePayload?: Record<string, unknown>;
};

/**
 * Assembles the Phase 5B inner voice request: deterministic framing only, no LLM.
 *
 * `cognitionFramePayload` defaults to `cognitionFrameToPromptPayload` (`cognition-frame-v6`), which includes
 * `thoughtLanguage`, `enneagram.voicePattern`, `selfDeceptionPattern`, and `tabooThoughtPattern`. Phase 5C adapters should map:
 * inner monologue → `voicePattern.selfNarrationStyle` + age/world styles; forbidden thought → `tabooThoughtPattern`;
 * self-justification → `selfDeceptionPattern` + `enneagram.profile.viceEffective`; fear ranking → `resolved.fearStack`
 * plus `effectiveStressState`; contradiction tracing → `resolved.identityConflict` + Enneagram contradiction lens.
 */
export async function buildCharacterInnerVoiceRequest(
  options: BuildCharacterInnerVoiceRequestOptions
): Promise<CharacterInnerVoiceRequest> {
  const { frame, mode } = options;
  const authorQuestion =
    options.authorQuestion === undefined || options.authorQuestion === ""
      ? null
      : options.authorQuestion;

  const personRow = await prisma.person.findUnique({
    where: { id: frame.characterId },
    select: { birthYear: true, deathYear: true },
  });

  const storyYear =
    options.approximateStoryYearOverride ??
    inferApproximateStoryYearFromScene(
      frame.scene.structuredDataJson,
      frame.scene.historicalAnchor
    );

  const ageYears = computeCharacterAgeYears({
    birthYear: personRow?.birthYear,
    deathYear: personRow?.deathYear,
    approximateStoryYear: storyYear,
  });

  const { band, assumed } = resolveCharacterAgeBand(ageYears);
  const ageStyle = buildAgeMaturityThoughtStyle(band, assumed);

  const wsSource = await loadWorldStateThoughtStyleSource(
    frame.effectiveWorldState?.id ?? null
  );
  const worldStyle = buildWorldStateThoughtStyle(wsSource);

  const constraint = buildInnerVoiceConstraintFrame({
    mode,
    coreProfile: frame.coreProfile,
    worldStyle,
  });

  const cognitionFramePayload =
    options.cognitionFramePayload ?? cognitionFrameToPromptPayload(frame);

  return {
    contractVersion: "3",
    thoughtLanguageFrame: frame.thoughtLanguageFrame,
    characterId: frame.characterId,
    sceneId: frame.sceneId,
    mode,
    authorQuestion,
    ageBand: band,
    ageYears,
    ageBandAssumed: assumed,
    worldStateThoughtStyle: worldStyle,
    ageMaturityThoughtStyle: ageStyle,
    innerVoiceConstraintFrame: constraint,
    cognitionFramePayload,
    builtAtIso: new Date().toISOString(),
  };
}
