/**
 * P3-T — Scene/chapter re-entry continuity service.
 *
 * Determines whether to resume conversation or narrative playback first after interruptions.
 */
import type { CharacterConversationSessionStatus } from "@/lib/domain/character-conversation-session";
import type { ReaderCockpitPayload } from "@/lib/domain/reader-cockpit-payload";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  compareSnapshotToAnchor,
  readConversationAnchorFromMetadata,
} from "@/lib/services/conversation-anchor-service";
import { refreshConversationalIdentitySnapshot } from "@/lib/services/conversational-identity-refresh-service";
import { buildReaderCockpitPayload } from "@/lib/services/reader-cockpit-payload-service";

export type StoryReentryContinuityPayload = {
  readerId: string;
  characterId: string;
  sessionId: string | null;
  sessionStatus: CharacterConversationSessionStatus | "NONE";
  sceneId: string | null;
  sceneMismatch: boolean;
  resumeAvailable: boolean;
  relationshipState: string | null;
  emotionalTone: string | null;
  continuitySummaryHash: string | null;
  driftSignals: string[];
  recommendedFirstAction: "resume_conversation" | "resume_story_playback";
  rationale: string;
};

export function composeStoryReentryContinuityPayload(input: {
  readerId: string;
  characterId: string;
  preferredSceneId: string | null;
  cockpit: ReaderCockpitPayload | null;
  driftSignals: string[];
}): StoryReentryContinuityPayload {
  const session = input.cockpit?.activeSession ?? null;
  const status = session?.status ?? "NONE";
  const sceneId = session?.sceneId ?? null;
  const sceneMismatch = Boolean(input.preferredSceneId && sceneId && input.preferredSceneId !== sceneId);
  const resumeAvailable = status === "ACTIVE" || status === "PAUSED";

  const recommendedFirstAction =
    resumeAvailable && !sceneMismatch ? "resume_conversation" : "resume_story_playback";
  const rationale = resumeAvailable
    ? sceneMismatch
      ? "Session exists but scene context differs; resume story playback first."
      : "Conversation state remains resumable with matching scene context."
    : "No resumable session; continue narrative playback from scene context.";

  return {
    readerId: input.readerId,
    characterId: input.characterId,
    sessionId: session?.sessionId ?? null,
    sessionStatus: status,
    sceneId,
    sceneMismatch,
    resumeAvailable,
    relationshipState: input.cockpit?.readerRelationshipProgression?.relationshipState ?? null,
    emotionalTone: input.cockpit?.emotionalContinuity?.currentConversationTone ?? null,
    continuitySummaryHash: input.cockpit?.sessionMemorySummary?.latestSessionSummaryHash ?? null,
    driftSignals: input.driftSignals,
    recommendedFirstAction,
    rationale,
  };
}

async function resolveLatestSessionForPair(params: {
  readerId: string;
  characterId: string;
}): Promise<{
  id: string;
  status: CharacterConversationSessionStatus;
  sceneId: string | null;
  metadataJson: Prisma.JsonValue | null;
} | null> {
  const sessions = await prisma.characterConversationSession.findMany({
    where: {
      readerId: params.readerId,
      characterId: params.characterId,
    },
    orderBy: [{ lastInteractionAt: "desc" }],
    take: 8,
    select: {
      id: true,
      status: true,
      sceneId: true,
      metadataJson: true,
      lastInteractionAt: true,
    },
  });
  if (sessions.length === 0) return null;
  const paused = sessions.find((s) => s.status === "PAUSED");
  if (paused) return paused;
  const active = sessions.find((s) => s.status === "ACTIVE");
  if (active) return active;
  return sessions[0]!;
}

export async function buildStoryReentryContinuityPayload(params: {
  readerId: string;
  characterId: string;
  preferredSceneId?: string | null;
}): Promise<StoryReentryContinuityPayload> {
  const readerId = params.readerId.trim();
  const characterId = params.characterId.trim();
  const preferredSceneId = params.preferredSceneId?.trim() || null;
  if (!readerId || !characterId) {
    throw new Error("[story-reentry-continuity] readerId and characterId are required.");
  }

  const latest = await resolveLatestSessionForPair({ readerId, characterId });
  if (!latest) {
    return composeStoryReentryContinuityPayload({
      readerId,
      characterId,
      preferredSceneId,
      cockpit: null,
      driftSignals: [],
    });
  }

  const cockpit = await buildReaderCockpitPayload({
    readerId,
    characterId,
    sessionId: latest.id,
  });

  let driftSignals: string[] = [];
  const anchor = readConversationAnchorFromMetadata(latest.metadataJson);
  if (anchor) {
    try {
      const snapshot = await refreshConversationalIdentitySnapshot({
        characterId,
        readerId,
        sceneId: cockpit.activeSession?.sceneId ?? null,
        sessionId: latest.id,
      });
      driftSignals = compareSnapshotToAnchor(snapshot, anchor).driftSignals;
    } catch {
      driftSignals = [];
    }
  }

  return composeStoryReentryContinuityPayload({
    readerId,
    characterId,
    preferredSceneId,
    cockpit,
    driftSignals,
  });
}
