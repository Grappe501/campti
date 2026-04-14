import {
  buildAuthorVoiceShaping,
  flattenAuthorVoiceShapingToPromptLines,
} from "@/lib/author-workflow/author-voice-helpers";
import type { NarrativeWitnessMode } from "@/lib/domain/author-voice-humanization";
import type { AuthorVoiceProfile } from "@/lib/domain/author-voice-humanization";
import type { SceneGenerationInput } from "@/lib/domain/scene-generation-input";
import type { SceneGenerationPurpose } from "@/lib/domain/scene-generation-output";
import type { SocialFieldContext } from "@/lib/domain/population-social-field";
import { inferApproximateStoryYearFromScene } from "@/lib/inner-voice/framing/age-band";
import { prisma } from "@/lib/prisma";
import { buildSceneSocialGenerationBundle } from "@/lib/scene-generation/social-field-generation-prep";
import {
  cognitionFrameToPromptPayload,
  resolveCharacterCognitionFrame,
} from "@/lib/services/character-cognition-resolver";
import { buildSocialFieldContextFromQuery } from "@/lib/services/social-field-context-service";
import { loadSceneGenerationContract } from "@/lib/services/scene-generation-contract-loader";

function parishPlaceIdFromSceneJson(structuredDataJson: unknown): string | null {
  if (!structuredDataJson || typeof structuredDataJson !== "object") return null;
  const v = (structuredDataJson as Record<string, unknown>).parishPlaceId;
  return typeof v === "string" && v.length ? v : null;
}

/**
 * Builds `SceneGenerationInput` for the generation boundary (contract + voice + goals + Phase 6 routing).
 * Historical anchor terms: from `AnalyzeProseContext` caller or empty (extend to pull from Place/Registry later).
 */
export async function loadSceneGenerationInput(
  sceneId: string,
  proseQaContext: SceneGenerationInput["proseQaContext"],
  options?: {
    generationMode?: SceneGenerationInput["generationMode"];
    generationPurpose?: SceneGenerationPurpose;
    proseBasis?: SceneGenerationInput["proseBasis"];
    basisProseOverride?: string | null;
    includeCognitionFrame?: boolean;
    includePinnedDecisionTracePayload?: boolean;
    /** Phase 6.1 — resolve live social field + compact generation bundle (default true). */
    includeSocialFieldGeneration?: boolean;
    /** Phase 7 — narrative witness / humanization shaping. */
    narrativeWitnessMode?: NarrativeWitnessMode;
    authorVoiceOverrides?: Partial<AuthorVoiceProfile>;
  }
): Promise<SceneGenerationInput> {
  const generationMode = options?.generationMode ?? "draft";
  const generationPurpose = options?.generationPurpose ?? "author_draft";

  const baseContract = await loadSceneGenerationContract(sceneId, {
    includePhase6Augmentations: true,
  });

  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    include: {
      chapter: {
        include: {
          book: true,
        },
      },
      persons: { take: 1 },
      places: { take: 2 },
    },
  });

  const povPersonId = scene.persons[0]?.id;
  const [narrativeVoiceProfile, characterVoiceProfile] = await Promise.all([
    prisma.narrativeVoiceProfile.findFirst({
      where: {
        scopeType: "scene_mode",
        scopeId: scene.chapter.bookId,
      },
    }),
    povPersonId
      ? prisma.characterVoiceProfile.findUnique({
          where: { personId: povPersonId },
        })
      : Promise.resolve(null),
  ]);

  const historicalAnchorTerms = proseQaContext.historicalAnchorTerms ?? [];

  let cognitionFramePayload: Record<string, unknown> | null = null;
  let pinnedDecisionTracePayload: Record<string, unknown> | null = null;

  if (options?.includeCognitionFrame !== false && povPersonId) {
    try {
      const frame = await resolveCharacterCognitionFrame(povPersonId, sceneId);
      cognitionFramePayload = cognitionFrameToPromptPayload(frame);
    } catch {
      cognitionFramePayload = null;
    }
  }

  let socialFieldGeneration: SceneGenerationInput["contract"]["socialFieldGeneration"] = null;
  let sfResolved: SocialFieldContext | null = null;
  if (options?.includeSocialFieldGeneration !== false) {
    const worldStateId = baseContract.effectiveWorldState.worldStateId;
    const placeId = scene.places[0]?.id ?? baseContract.place?.id ?? null;
    if (worldStateId && placeId) {
      try {
        const storyYear = inferApproximateStoryYearFromScene(scene.structuredDataJson, scene.historicalAnchor);
        const sf = await buildSocialFieldContextFromQuery({
          sceneId,
          worldStateId,
          storyYear,
          focalPersonIds: povPersonId ? [povPersonId] : [],
          placeId,
          householdId: null,
          parishPlaceId: parishPlaceIdFromSceneJson(scene.structuredDataJson),
        });
        sfResolved = sf;
        socialFieldGeneration = buildSceneSocialGenerationBundle(sf);
      } catch {
        socialFieldGeneration = null;
      }
    }
  }

  const authorVoiceShaping = buildAuthorVoiceShaping({
    narrativeWitnessMode: options?.narrativeWitnessMode,
    narrativeVoice: narrativeVoiceProfile
      ? {
          sentenceRhythm: narrativeVoiceProfile.sentenceRhythm,
          dictionStyle: narrativeVoiceProfile.dictionStyle,
          sensoryBias: narrativeVoiceProfile.sensoryBias,
          silenceStyle: narrativeVoiceProfile.silenceStyle,
          memoryStyle: narrativeVoiceProfile.memoryStyle,
          interiorityStyle: narrativeVoiceProfile.interiorityStyle,
        }
      : null,
    characterVoice: characterVoiceProfile
      ? {
          rhythmStyle: characterVoiceProfile.rhythmStyle,
          metaphorStyle: characterVoiceProfile.metaphorStyle,
          emotionalExpressionStyle: characterVoiceProfile.emotionalExpressionStyle,
          silencePatterns: characterVoiceProfile.silencePatterns,
        }
      : null,
    overrides: options?.authorVoiceOverrides,
  });
  const flat = flattenAuthorVoiceShapingToPromptLines(authorVoiceShaping);

  const contract: SceneGenerationInput["contract"] = {
    ...baseContract,
    thoughtLanguageMediation:
      cognitionFramePayload && cognitionFramePayload.thoughtLanguage != null
        ? (cognitionFramePayload.thoughtLanguage as Record<string, unknown>)
        : null,
    socialFieldGeneration,
    authorVoiceShaping,
  };

  if (options?.includePinnedDecisionTracePayload !== false && povPersonId) {
    const dt = await prisma.characterInnerVoiceSession.findFirst({
      where: {
        sceneId,
        personId: povPersonId,
        mode: "DECISION_TRACE",
        canonicalStatus: "PINNED",
      },
      orderBy: { createdAt: "desc" },
    });
    if (dt?.outputSummaryJson && typeof dt.outputSummaryJson === "object") {
      pinnedDecisionTracePayload = dt.outputSummaryJson as Record<string, unknown>;
    }
  }

  return {
    contract,
    generationMode,
    generationPurpose,
    cognitionFramePayload,
    pinnedDecisionTracePayload,
    socialFieldSummaryForGeneration: socialFieldGeneration?.socialFieldSummaryForGeneration ?? null,
    invisiblePressureSummary: socialFieldGeneration?.invisiblePressureSummary ?? null,
    authorityAtmosphereSummary: socialFieldGeneration?.authorityAtmosphereSummary ?? null,
    kinVisibilitySummary: socialFieldGeneration?.kinVisibilitySummary ?? null,
    populationDensityHint: socialFieldGeneration?.nearbyPopulationHint ?? null,
    socialFieldQaScalars: sfResolved
      ? {
          witnessRisk01: sfResolved.witnessRisk,
          gossipRisk01: sfResolved.gossipPressure,
          authorityPressure01: sfResolved.authorityPressure,
        }
      : null,
    proseBasis: options?.proseBasis,
    basisProseOverride: options?.basisProseOverride ?? null,
    narrativeVoiceProfile,
    characterVoiceProfile,
    authorSceneGoals: proseQaContext.authorGoals,
    historicalAnchorTerms,
    proseQaContext: {
      ...proseQaContext,
      historicalAnchorTerms,
      narrativeVoiceProfile: proseQaContext.narrativeVoiceProfile ?? narrativeVoiceProfile,
      characterVoiceProfile: proseQaContext.characterVoiceProfile ?? characterVoiceProfile,
    },
    authorVoiceShaping,
    narrativeWitnessMode: authorVoiceShaping.narrativeWitnessMode,
    humanizationHints: flat.humanizationHints,
    prosePresenceHints: flat.prosePresenceHints,
    witnessFrameLines: flat.witnessLines,
    voiceSummaryLines: flat.voiceSummaryLines,
  };
}
