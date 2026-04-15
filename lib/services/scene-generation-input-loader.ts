import {
  applyNarrativeShapingDefaultsToShaping,
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
import { validateRegisteredContractPayload } from "@/lib/contracts/contract-registry";
import { loadSceneGenerationContract } from "@/lib/services/scene-generation-contract-loader";
import {
  buildNarrativeShapingObserverSummary,
  resolveNarrativeShapingDefaultsForScene,
} from "@/lib/services/narrative-shaping-defaults-service";
import type { NarrativeShapingOverrideSet } from "@/lib/domain/narrative-shaping-defaults";
import { getSourcesForWorldState } from "@/lib/services/narrative-source-service";
import {
  assembleStorylineGuidanceBundle,
  buildStorylineOrchestrationInputsFromSeamContext,
} from "@/lib/services/storyline-orchestrator-integration-service";

function parishPlaceIdFromSceneJson(structuredDataJson: unknown): string | null {
  if (!structuredDataJson || typeof structuredDataJson !== "object") return null;
  const v = (structuredDataJson as Record<string, unknown>).parishPlaceId;
  return typeof v === "string" && v.length ? v : null;
}

function buildSceneStorylineGuidanceSummary(input: {
  sceneId: string;
  povPersonId: string | null;
  narrativeIntent: string | null;
  emotionalTone: string | null;
  socialFieldSummaryForGeneration?: string | null;
}): SceneGenerationInput["storylineGuidanceSummary"] {
  const relationshipSignalCodes = [
    input.narrativeIntent?.trim() ? `scene_intent:${input.narrativeIntent.trim()}` : null,
    input.emotionalTone?.trim() ? `scene_emotional_tone:${input.emotionalTone.trim()}` : null,
    input.socialFieldSummaryForGeneration?.trim()
      ? `social_field_present:${input.socialFieldSummaryForGeneration.trim().slice(0, 48)}`
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  const orchestration = buildStorylineOrchestrationInputsFromSeamContext({
    mode: "scene_mode",
    channel: "canonical_dyad",
    seamId: input.povPersonId ? `scene:${input.sceneId}:pov:${input.povPersonId}` : `scene:${input.sceneId}`,
    relationshipSignalCodes:
      relationshipSignalCodes.length > 0 ? relationshipSignalCodes : [`scene:${input.sceneId}:baseline`],
  });
  const storylineBundle = assembleStorylineGuidanceBundle({
    mode: "scene_mode",
    channel: "canonical_dyad",
    orchestration,
  });

  return {
    storylineBundle,
    allowedSceneTendencies: storylineBundle.sceneTendencyGuidance.allowedSceneTendencies.slice(0, 6),
    discouragedSceneTendencies: storylineBundle.sceneTendencyGuidance.discouragedSceneTendencies.slice(0, 6),
    topTensionWeights: storylineBundle.tensionEmphasisWeights.slice(0, 4),
    reconvergenceRecommendation: storylineBundle.branchConstraints.reconvergenceRecommendation,
  };
}

/**
 * Builds `SceneGenerationInput` for the generation boundary (contract + voice + goals + Phase 6 routing).
 * Historical anchor terms: from `AnalyzeProseContext` caller or empty (extend to pull from Place/Registry later).
 *
 * **P2-E — Temporal truth integrity (approved shape; do not redesign this layer):** narrative sources
 * are attached only as `narrativeSourcesForScene` + `sourceIdsUsed` from `getSourcesForWorldState`.
 * World-state temporal validity is enforced inside that call via `WorldStateReference.chronologyIndex`
 * (shared backbone with P2-C/P2-D), not lexicographic world-state id order. Optional story year is a
 * separate calendar axis on the same rows. Prompt assembly still uses `NARRATIVE_SOURCES_ALLOWED` in
 * `scene-generation-llm-adapter`; hash still includes sorted `sourceIdsUsed`.
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
    /** Phase 7.1 — skip Epic→Book→Chapter→Scene metadata merge (legacy behavior). */
    skipHierarchyShaping?: boolean;
    /** Phase 7.1 — last layer applied on top of hierarchy (e.g. orchestration). */
    narrativeShapingRuntimeOverride?: NarrativeShapingOverrideSet | null;
    /** When true, attach full `HierarchyShapingResolution` to the input (debug). */
    includeNarrativeShapingResolution?: boolean;
  }
): Promise<SceneGenerationInput> {
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

  let narrativeShapingResolution = null as Awaited<
    ReturnType<typeof resolveNarrativeShapingDefaultsForScene>
  > | null;
  if (!options?.skipHierarchyShaping) {
    narrativeShapingResolution = await resolveNarrativeShapingDefaultsForScene(
      sceneId,
      options?.narrativeShapingRuntimeOverride ?? null
    );
  }

  const generationMode =
    options?.generationMode ??
    narrativeShapingResolution?.merged.productionMode?.generationMode ??
    "draft";
  const generationPurpose =
    options?.generationPurpose ??
    narrativeShapingResolution?.merged.productionMode?.generationPurpose ??
    "author_draft";

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

  const worldStateIdForSources = baseContract.effectiveWorldState.worldStateId;
  const approximateStoryYear = inferApproximateStoryYearFromScene(
    scene.structuredDataJson,
    scene.historicalAnchor
  );
  let narrativeSourcesForScene: SceneGenerationInput["narrativeSourcesForScene"] = [];
  if (worldStateIdForSources) {
    narrativeSourcesForScene = await getSourcesForWorldState(
      worldStateIdForSources,
      approximateStoryYear ?? undefined
    );
  }

  const sourceIdsUsed = narrativeSourcesForScene.map((s) => s.id);

  let cognitionFramePayload: Record<string, unknown> | null = null;
  let pinnedDecisionTracePayload: Record<string, unknown> | null = null;

  if (options?.includeCognitionFrame !== false && povPersonId) {
    try {
      const frame = await resolveCharacterCognitionFrame(povPersonId, sceneId, {
        narrativeSourcesForScene,
      });
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

  const mergedVoiceOverrides: Partial<AuthorVoiceProfile> = {
    ...(narrativeShapingResolution?.merged.authorVoiceProfile ?? {}),
    ...(options?.authorVoiceOverrides ?? {}),
  };
  const witnessMode =
    options?.narrativeWitnessMode ?? narrativeShapingResolution?.merged.narrativeWitnessMode;

  let authorVoiceShaping = buildAuthorVoiceShaping({
    narrativeWitnessMode: witnessMode,
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
    overrides: Object.keys(mergedVoiceOverrides).length ? mergedVoiceOverrides : undefined,
  });
  if (narrativeShapingResolution) {
    authorVoiceShaping = applyNarrativeShapingDefaultsToShaping(
      authorVoiceShaping,
      narrativeShapingResolution.merged
    );
  }
  const flat = flattenAuthorVoiceShapingToPromptLines(authorVoiceShaping);
  const narrativeShapingSummary = narrativeShapingResolution
    ? buildNarrativeShapingObserverSummary(narrativeShapingResolution)
    : null;
  const storylineGuidanceSummary = buildSceneStorylineGuidanceSummary({
    sceneId,
    povPersonId: povPersonId ?? null,
    narrativeIntent: scene.narrativeIntent,
    emotionalTone: scene.emotionalTone,
    socialFieldSummaryForGeneration: socialFieldGeneration?.socialFieldSummaryForGeneration ?? null,
  });

  const contract: SceneGenerationInput["contract"] = {
    ...baseContract,
    thoughtLanguageMediation:
      cognitionFramePayload && cognitionFramePayload.thoughtLanguage != null
        ? (cognitionFramePayload.thoughtLanguage as Record<string, unknown>)
        : null,
    socialFieldGeneration,
    authorVoiceShaping,
  };

  validateRegisteredContractPayload("sceneGenerationInput", contract, "read");

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
    storylineGuidanceSummary,
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
    narrativeShapingResolution:
      options?.includeNarrativeShapingResolution && narrativeShapingResolution
        ? narrativeShapingResolution
        : null,
    narrativeShapingSummary,
    narrativeSourcesForScene,
    sourceIdsUsed,
  };
}
