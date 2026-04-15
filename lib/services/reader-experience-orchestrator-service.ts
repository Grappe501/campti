import type { ReaderExperienceBundle } from "@/lib/domain/reader-experience-bundle";
import type { ReaderMode } from "@/lib/domain/reader-mode";
import type { ReaderSession } from "@/lib/domain/reader-session";
import { prisma } from "@/lib/prisma";
import { buildReaderCockpitPayload } from "@/lib/services/reader-cockpit-payload-service";
import { loadReaderContinuity } from "@/lib/services/reader-continuity-service";
import { resolveUnifiedDegradedUxState } from "@/lib/services/reader-degraded-ux-service";
import { resolveReaderModeForSession } from "@/lib/services/reader-mode-service";
import { getReaderSessionSnapshot } from "@/lib/services/reader-session-service";
import { buildStoryReentryContinuityPayload } from "@/lib/services/story-reentry-continuity-service";

function modeLensFor(mode: ReaderMode) {
  if (mode === "feel") return "emotional_atmosphere" as const;
  if (mode === "guided") return "interpretive_whisper" as const;
  if (mode === "listen") return "voice_first_presence" as const;
  return "elegant_focus" as const;
}

function modeTransitionHint(mode: ReaderMode): string {
  if (mode === "feel") return "Atmosphere leans in while the text remains canonical.";
  if (mode === "guided") return "Guidance stays subtle and inside reader-safe boundaries.";
  if (mode === "listen") return "Voice leads the scene while text remains available.";
  return "Read mode keeps the narrative line clear and continuous.";
}

function entryKindFor(input: {
  continuitySceneId: string | null;
  requestedSceneId: string | null;
  hasReentry: boolean;
  hasResume: boolean;
  lastInteractionAtIso: string | null;
}): "fresh_entry" | "return_entry" | "interaction_reentry" | "time_gap_reentry" {
  if (input.hasReentry && input.hasResume) return "interaction_reentry";
  const hasReturn = Boolean(input.continuitySceneId && input.requestedSceneId);
  const mismatch =
    Boolean(input.continuitySceneId && input.requestedSceneId) &&
    input.continuitySceneId !== input.requestedSceneId;
  if (input.lastInteractionAtIso) {
    const elapsed = Date.now() - Date.parse(input.lastInteractionAtIso);
    if (Number.isFinite(elapsed) && elapsed > 1000 * 60 * 60 * 36) {
      return "time_gap_reentry";
    }
  }
  if (hasReturn && !mismatch) return "return_entry";
  return "fresh_entry";
}

export function mapGatedBy(input: {
  entitlementPlan: string | null;
  degradedPolicy:
    | "allow_system_fallback_only"
    | "allow_limited_free_turns"
    | "allow_read_only"
    | "blocked_all"
    | null;
}): "none" | "entitlement" | "degraded_policy" {
  if (input.degradedPolicy === "allow_read_only" || input.degradedPolicy === "blocked_all") {
    return "degraded_policy";
  }
  if (input.entitlementPlan === "free" && input.degradedPolicy != null) {
    return "entitlement";
  }
  return "none";
}

export async function buildReaderExperienceBundle(params: {
  sessionId: string;
  sceneId: string;
  readerId?: string | null;
  userId?: string | null;
  characterId?: string | null;
  requestedMode?: ReaderMode | null;
  cacheSnapshot?: Parameters<typeof loadReaderContinuity>[0]["cacheSnapshot"];
}): Promise<ReaderExperienceBundle> {
  const continuitySnapshot = await loadReaderContinuity({
    sessionId: params.sessionId,
    readerId: params.readerId,
    userId: params.userId,
    cacheSnapshot: params.cacheSnapshot ?? null,
  });
  const continuity = continuitySnapshot.continuity;
  const activeCharacterId = params.characterId ?? continuity.interactionAnchor.activeCharacterId;
  const sessionState: ReaderSession =
    params.readerId?.trim() && activeCharacterId?.trim()
      ? await getReaderSessionSnapshot({
          readerId: params.readerId.trim(),
          characterId: activeCharacterId.trim(),
          sessionId: continuity.sessionLinkage.interactionSessionId,
        })
      : {
          sessionId: null,
          readerId: params.readerId?.trim() ?? "anonymous_reader",
          characterId: null,
          sceneId: continuity.position.sceneId,
          state: "NONE",
          interactionCount: 0,
          startedAtIso: null,
          lastInteractionAtIso: null,
          endedAtIso: null,
          personalizationState: {
            preferredPresentationLanguageCode: null,
            preferredAudioEnabled: null,
            preferredVoicePlaybackSpeed: null,
          },
          degradedState: {
            policy: null,
            reason: "none",
          },
          continuityLink: {
            readerStateSessionId: params.sessionId,
            lastSceneId: continuity.position.sceneId,
          },
        };

  const readerState = await prisma.readerState.findUnique({
    where: { sessionId: params.sessionId },
    select: { lastMode: true },
  });
  const mode = resolveReaderModeForSession({
    persistedMode: readerState?.lastMode,
    requestedMode: params.requestedMode ?? null,
  });

  const cockpit =
    params.readerId?.trim() && activeCharacterId?.trim()
      ? await buildReaderCockpitPayload({
          readerId: params.readerId.trim(),
          characterId: activeCharacterId.trim(),
          sessionId: continuity.sessionLinkage.interactionSessionId,
        })
      : null;
  const degradedUx = resolveUnifiedDegradedUxState({ cockpit });
  const reentry =
    params.readerId?.trim() && activeCharacterId?.trim()
      ? await buildStoryReentryContinuityPayload({
          readerId: params.readerId.trim(),
          characterId: activeCharacterId.trim(),
          preferredSceneId: params.sceneId,
        })
      : null;

  const canResumeInteraction = Boolean(reentry?.resumeAvailable);
  const canStartInteraction =
    degradedUx.state !== "read_only_fallback" &&
    degradedUx.state !== "entitlement_limit" &&
    degradedUx.state !== "moderation_block";

  const gatedBy = mapGatedBy({
    entitlementPlan: cockpit?.entitlement?.planType ?? null,
    degradedPolicy: cockpit?.degradedInteraction?.currentPolicy ?? null,
  });
  const entryKind = entryKindFor({
    continuitySceneId: continuity.position.sceneId,
    requestedSceneId: params.sceneId ?? null,
    hasReentry: Boolean(reentry),
    hasResume: Boolean(reentry?.resumeAvailable),
    lastInteractionAtIso: continuity.lastInteractionAtIso,
  });
  const entryWorldLine =
    entryKind === "interaction_reentry"
      ? "The conversation thread is still warm in this world."
      : entryKind === "time_gap_reentry"
        ? "The world kept moving; this thread is ready when you are."
        : entryKind === "return_entry"
          ? "You are back inside the same narrative weather."
          : "Step into the story space and let the scene find you.";
  const modeTransition = modeTransitionHint(mode);
  const voiceResumeCue =
    mode === "listen" && sessionState.personalizationState.preferredAudioEnabled
      ? "continue_listening"
      : mode === "listen" || sessionState.personalizationState.preferredAudioEnabled
        ? "listen_available"
        : "listen_not_available";

  return {
    contractVersion: "1",
    experienceVersion: "v2",
    builtAtIso: new Date().toISOString(),
    readerId: params.readerId?.trim() ?? null,
    deliveryState: {
      activeSceneId: params.sceneId || continuity.position.sceneId,
      chapterId: continuity.position.chapterId,
      source: params.sceneId ? "public_scene" : "reader_continuity",
    },
    interactionPermissions: {
      canStartInteraction,
      canResumeInteraction,
      gatedBy,
    },
    personalizationState: {
      mode,
      preferredPresentationLanguageCode: sessionState.personalizationState.preferredPresentationLanguageCode,
      preferredAudioEnabled: sessionState.personalizationState.preferredAudioEnabled,
      preferredVoicePlaybackSpeed: sessionState.personalizationState.preferredVoicePlaybackSpeed,
    },
    continuityState: continuity,
    sessionState,
    degradedState: {
      isDegraded: degradedUx.state !== "healthy",
      policy: cockpit?.degradedInteraction?.currentPolicy ?? null,
      messageCode: degradedUx.state === "healthy" ? "none" : degradedUx.state,
    },
    storyReentry: reentry
      ? {
          available: reentry.resumeAvailable,
          recommendedFirstAction: reentry.recommendedFirstAction,
          rationale: reentry.rationale,
        }
      : null,
    entryState: {
      entryKind,
      worldLine: entryWorldLine,
      emotionallyNear:
        reentry?.emotionalTone?.trim() ??
        params.cacheSnapshot?.mood?.trim() ??
        null,
      unresolvedThread:
        reentry?.driftSignals[0] ??
        reentry?.rationale?.trim() ??
        params.cacheSnapshot?.continuationHeadline?.trim() ??
        null,
      enteringMode: mode,
    },
    canvasState: {
      primaryLayer: "narrative_presence",
      optionalLayers: {
        voice: Boolean(sessionState.personalizationState.preferredAudioEnabled),
        guidance: mode === "guided",
        memoryContext: Boolean(continuity.lastInteractionAtIso || reentry?.resumeAvailable),
        interactionAccess: canStartInteraction || canResumeInteraction,
      },
    },
    modeState: {
      currentMode: mode,
      availableModes: ["read", "feel", "guided", "listen"],
      transitionHint: modeTransition,
      modeLens: modeLensFor(mode),
    },
    voiceState: {
      voiceFirstReady:
        Boolean(sessionState.personalizationState.preferredAudioEnabled) || mode === "listen",
      resumeCue: voiceResumeCue,
      transitionCue:
        mode === "listen"
          ? "Listening is primary; reading remains one touch away."
          : "Switch to listening when you want voice to lead the pace.",
    },
    overlayState: {
      relationshipTension: reentry?.relationshipState?.trim() ?? null,
      memoryEcho: params.cacheSnapshot?.returnHookLine?.trim() ?? null,
      emotionalClimate:
        reentry?.emotionalTone?.trim() ??
        params.cacheSnapshot?.mood?.trim() ??
        null,
      sceneSignificance: params.cacheSnapshot?.continuationHeadline?.trim() ?? null,
      unresolvedPressure:
        reentry?.driftSignals[0] ??
        (reentry?.sceneMismatch ? "Scene context shifted since your last interaction." : null),
    },
    interactionState: {
      entryLine: canResumeInteraction
        ? "Re-enter conversation from the current narrative edge."
        : "Open a situated interaction from this scene anchor.",
      canEnter: canStartInteraction,
      resumeAvailable: canResumeInteraction,
      returnLine: "Return to the passage without losing continuity state.",
    },
    transitionState: {
      sceneBridge:
        params.cacheSnapshot?.continuationHeadline?.trim() ??
        null,
      ambientCue:
        params.cacheSnapshot?.mood?.trim() ??
        reentry?.emotionalTone?.trim() ??
        null,
      pauseResumeCue:
        reentry?.resumeAvailable
          ? "Pause and resume remain continuity-safe."
          : "Session transitions are bounded to story continuity.",
      continuityCue:
        continuity.lastInteractionAtIso != null
          ? `Last anchored ${new Date(continuity.lastInteractionAtIso).toLocaleString("en-US")}.`
          : null,
    },
  };
}
