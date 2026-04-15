import type { ReaderState } from "@prisma/client";

import type { ReaderSession } from "@/lib/domain/reader-session";
import { prisma } from "@/lib/prisma";
import { buildReaderCockpitPayload } from "@/lib/services/reader-cockpit-payload-service";
import {
  endInteractivePauseSession,
  pauseNarrativeForConversation,
  resumeNarrativeAfterConversation,
  startInteractivePauseSession,
} from "@/lib/services/interaction-session-orchestration-service";

function mapPolicyReason(policy: ReaderSession["degradedState"]["policy"]): ReaderSession["degradedState"]["reason"] {
  if (policy === "allow_read_only" || policy === "blocked_all") return "entitlement_limit";
  if (policy === "allow_system_fallback_only" || policy === "allow_limited_free_turns") return "provider_failure";
  return "none";
}

export function composeReaderSession(input: {
  readerId: string;
  characterId: string | null;
  readerState: Pick<ReaderState, "sessionId" | "lastSceneId"> | null;
  cockpit: Awaited<ReturnType<typeof buildReaderCockpitPayload>> | null;
}): ReaderSession {
  const active = input.cockpit?.activeSession ?? null;
  const degradedPolicy = input.cockpit?.degradedInteraction?.currentPolicy ?? null;
  return {
    sessionId: active?.sessionId ?? null,
    readerId: input.readerId,
    characterId: input.characterId,
    sceneId: active?.sceneId ?? input.readerState?.lastSceneId ?? null,
    state: active?.status ?? "NONE",
    interactionCount: active?.interactionCount ?? 0,
    startedAtIso: active?.startedAtIso ?? null,
    lastInteractionAtIso: active?.lastInteractionAtIso ?? null,
    endedAtIso: active?.endedAtIso ?? null,
    personalizationState: {
      preferredPresentationLanguageCode:
        input.cockpit?.readerContextPreferences?.preferredPresentationLanguageCode ?? null,
      preferredAudioEnabled: input.cockpit?.readerContextPreferences?.preferredAudioEnabled ?? null,
      preferredVoicePlaybackSpeed:
        input.cockpit?.readerContextPreferences?.preferredVoicePlaybackSpeed ?? null,
    },
    degradedState: {
      policy: degradedPolicy,
      reason: mapPolicyReason(degradedPolicy),
    },
    continuityLink: {
      readerStateSessionId: input.readerState?.sessionId ?? null,
      lastSceneId: input.readerState?.lastSceneId ?? null,
    },
  };
}

export async function getReaderSessionSnapshot(params: {
  readerId: string;
  characterId: string;
  sessionId?: string | null;
}): Promise<ReaderSession> {
  const readerId = params.readerId.trim();
  const characterId = params.characterId.trim();
  if (!readerId || !characterId) {
    throw new Error("[reader-session] readerId and characterId are required.");
  }
  const readerState = await prisma.readerState.findUnique({
    where: { sessionId: readerId },
    select: { sessionId: true, lastSceneId: true },
  });
  const cockpit = await buildReaderCockpitPayload({
    readerId,
    characterId,
    sessionId: params.sessionId ?? undefined,
  });
  return composeReaderSession({
    readerId,
    characterId,
    readerState,
    cockpit,
  });
}

export async function startReaderSession(params: {
  readerId: string;
  characterId: string;
  sceneId: string;
}): Promise<ReaderSession> {
  const started = await startInteractivePauseSession({
    readerId: params.readerId,
    characterId: params.characterId,
    sceneId: params.sceneId,
    narrativeAnchor: {
      sceneId: params.sceneId,
      label: "reader_session_start",
    },
  });
  const cockpit = await buildReaderCockpitPayload({
    readerId: params.readerId,
    characterId: params.characterId,
    sessionId: started.session.id,
  });
  const readerState = await prisma.readerState.findUnique({
    where: { sessionId: params.readerId },
    select: { sessionId: true, lastSceneId: true },
  });
  return composeReaderSession({
    readerId: params.readerId,
    characterId: params.characterId,
    readerState,
    cockpit,
  });
}

export async function pauseReaderSession(params: {
  readerId: string;
  characterId: string;
  sessionId: string;
}): Promise<ReaderSession> {
  await pauseNarrativeForConversation(params);
  return getReaderSessionSnapshot(params);
}

export async function resumeReaderSession(params: {
  readerId: string;
  characterId: string;
  sessionId: string;
}): Promise<ReaderSession> {
  await resumeNarrativeAfterConversation(params);
  return getReaderSessionSnapshot(params);
}

export async function endReaderSession(params: {
  readerId: string;
  characterId: string;
  sessionId: string;
}): Promise<ReaderSession> {
  await endInteractivePauseSession(params);
  return getReaderSessionSnapshot(params);
}
