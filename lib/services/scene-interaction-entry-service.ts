/**
 * P2-Y — Enter bounded reader ↔ character dialogue **in the context of a Scene** (sources + snapshot + session).
 *
 * No UI and no text generation — persistence validation and deterministic assembly only.
 */

import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";
import type { ConversationalIdentitySnapshot } from "@/lib/domain/conversational-identity-snapshot";
import type { NarrativeEmergenceBundle } from "@/lib/domain/narrative-emergence-bundle";
import type { NarrativeSource } from "@/lib/domain/narrative-source";
import { inferApproximateStoryYearFromScene } from "@/lib/inner-voice/framing/age-band";
import {
  createConversationSession,
  getActiveConversationSession,
} from "@/lib/services/character-conversation-session-service";
import { deriveConversationEmotionalContinuity } from "@/lib/services/conversation-emotional-continuity-service";
import { refreshConversationalIdentitySnapshot } from "@/lib/services/conversational-identity-refresh-service";
import { buildNarrativeEmergenceBundle } from "@/lib/services/narrative-emergence-orchestrator-service";
import { getSourcesForWorldState } from "@/lib/services/narrative-source-service";
import { buildStorylineOrchestrationInputsFromSeamContext } from "@/lib/services/storyline-orchestrator-integration-service";
import { deriveTemporalEvolutionSummary } from "@/lib/services/temporal-evolution-layer-service";
import { resolveEffectiveWorldStateForScene } from "@/lib/services/world-state-resolution";
import { prisma } from "@/lib/prisma";

export type OpenSceneCharacterInteractionParams = {
  sceneId: string;
  characterId: string;
  readerId: string;
};

/** Ready for {@link assembleCharacterResponse} / reply adapters: identity bundle + session + P2-E sources. */
export type OpenSceneCharacterInteractionResult = {
  conversationalIdentitySnapshot: ConversationalIdentitySnapshot;
  characterConversationSession: CharacterConversationSession;
  narrativeSourcesForScene: NarrativeSource[];
  narrativeEmergenceBundle: NarrativeEmergenceBundle;
  sourceIdsUsed: string[];
  effectiveWorldStateId: string | null;
  approximateStoryYear: number | null;
  /** When the scene has linked `Person` rows, the character must be one of them; otherwise unchecked. */
  sceneCastValidation: {
    sceneHasPersonLinks: boolean;
    characterPresentInSceneCast: boolean;
  };
};

function requireNonEmpty(label: string, value: string): string {
  const t = value.trim();
  if (!t) throw new Error(`[scene-interaction-entry] ${label} is required.`);
  return t;
}

/**
 * Validates scene ↔ character when the scene has a non-empty cast; loads P2-E sources; builds a
 * session-scoped {@link ConversationalIdentitySnapshot}; reuses an ACTIVE session for the same scene
 * or creates a new one.
 */
export async function openSceneCharacterInteraction(
  params: OpenSceneCharacterInteractionParams
): Promise<OpenSceneCharacterInteractionResult> {
  const sceneId = requireNonEmpty("sceneId", params.sceneId);
  const characterId = requireNonEmpty("characterId", params.characterId);
  const readerId = requireNonEmpty("readerId", params.readerId);

  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    select: {
      id: true,
      structuredDataJson: true,
      historicalAnchor: true,
      persons: { select: { id: true } },
    },
  });

  if (!scene) {
    throw new Error(`[scene-interaction-entry] Scene not found: ${sceneId}`);
  }

  const castIds = scene.persons.map((p) => p.id);
  const sceneHasPersonLinks = castIds.length > 0;
  const characterPresentInSceneCast = !sceneHasPersonLinks || castIds.includes(characterId);

  if (sceneHasPersonLinks && !characterPresentInSceneCast) {
    throw new Error(
      `[scene-interaction-entry] Character "${characterId}" is not linked to scene "${sceneId}" (scene cast is non-empty).`
    );
  }

  const resolved = await resolveEffectiveWorldStateForScene(sceneId);
  const effectiveWorldStateId = resolved.worldStateId;

  const approximateStoryYear = inferApproximateStoryYearFromScene(
    scene.structuredDataJson,
    scene.historicalAnchor
  );

  let narrativeSourcesForScene: NarrativeSource[] = [];
  if (effectiveWorldStateId) {
    narrativeSourcesForScene = await getSourcesForWorldState(
      effectiveWorldStateId,
      approximateStoryYear ?? undefined
    );
  }

  const active = await getActiveConversationSession(characterId, readerId);
  const sameScene = active != null && (active.sceneId ?? null) === sceneId;

  const characterConversationSession = sameScene
    ? active!
    : await createConversationSession({
        characterId,
        readerId,
        sceneId,
        metadataJson: { source: "scene-interaction-entry" },
      });

  const conversationalIdentitySnapshot = await refreshConversationalIdentitySnapshot({
    characterId,
    readerId,
    sceneId,
    narrativeSourcesForScene,
    sessionId: characterConversationSession.id,
  });
  const emotionalContinuity = deriveConversationEmotionalContinuity({
    snapshot: conversationalIdentitySnapshot,
    mode: "scene_mode",
    channel: "canonical_dyad",
  });
  const elapsedHours = Math.max(
    0,
    (Date.now() - characterConversationSession.lastInteractionAt.getTime()) / (1000 * 60 * 60)
  );
  const temporalEvolution = deriveTemporalEvolutionSummary({
    channel: "canonical_dyad",
    mode: "scene_mode",
    trigger: {
      triggerKind: "scene_generation_elapsed_interval",
      occurredAtIso: new Date().toISOString(),
      lastAppliedAtIso: characterConversationSession.lastInteractionAt.toISOString(),
      elapsedIntervalHours: elapsedHours,
    },
    relationship: {
      trustBaseline: conversationalIdentitySnapshot.emotionalState.latestLegacyCharacterState?.trustLevel ?? 50,
      fearBaseline: conversationalIdentitySnapshot.emotionalState.latestLegacyCharacterState?.fearLevel ?? 50,
      dependenceBaseline: 50,
      autonomyBaseline: 50,
      dutyBaseline: 50,
      stabilityBaseline: conversationalIdentitySnapshot.emotionalState.latestLegacyCharacterState?.stabilityLevel ?? 50,
    },
    pressure: {
      repeatedSocialPressure: conversationalIdentitySnapshot.emotionalState.latestLegacyCharacterState?.cognitiveLoad ?? 30,
      repeatedScarcityPressure: conversationalIdentitySnapshot.knowledgeBoundary.believedFacts.length > 12 ? 55 : 30,
      repeatedConflictPressure: emotionalContinuity.pressureState.conflictReadinessPressure,
      repeatedGriefPressure: emotionalContinuity.pressureState.griefFearResentmentCarryover.grief,
    },
    unresolvedDurations: {
      unresolvedGriefDays: 0,
      unresolvedConsequenceDays: 0,
      unresolvedBreachDays: 0,
    },
    memory: {
      highestActivationWeight: 0,
      activationCount: 0,
      dominantActivationMode: null,
    },
    consequenceMemorySalience: [],
    roleShift: {
      lifeStageShift: "none",
      roleBurdenShift: "none",
    },
  });
  const narrativeEmergenceBundle = buildNarrativeEmergenceBundle({
    mode: "scene_mode",
    channel: "canonical_dyad",
    surfaces: {
      emotionalContinuity,
      temporalEvolution,
      relationshipTensionSignals: [
        `knowledge_unknown_domains:${conversationalIdentitySnapshot.knowledgeBoundary.unknownDomains.length}`,
      ],
      storylineOrchestration: buildStorylineOrchestrationInputsFromSeamContext({
        mode: "scene_mode",
        channel: "canonical_dyad",
        seamId: `scene:${sceneId}:character:${characterId}`,
        relationshipSignalCodes: [
          `knowledge_unknown_domains:${conversationalIdentitySnapshot.knowledgeBoundary.unknownDomains.length}`,
        ],
        emotionalContinuity,
        temporalEvolution,
      }),
    },
  });

  const sourceIdsUsed = narrativeSourcesForScene.map((s) => s.id);

  return {
    conversationalIdentitySnapshot,
    characterConversationSession,
    narrativeSourcesForScene,
    narrativeEmergenceBundle,
    sourceIdsUsed,
    effectiveWorldStateId,
    approximateStoryYear,
    sceneCastValidation: {
      sceneHasPersonLinks,
      characterPresentInSceneCast,
    },
  };
}
