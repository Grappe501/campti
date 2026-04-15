import type { ReaderContinuity } from "@/lib/domain/reader-continuity";
import type { ReaderMode } from "@/lib/domain/reader-mode";
import type { ReaderSession } from "@/lib/domain/reader-session";

export type ReaderExperienceEntryState = {
  entryKind: "fresh_entry" | "return_entry" | "interaction_reentry" | "time_gap_reentry";
  worldLine: string;
  emotionallyNear: string | null;
  unresolvedThread: string | null;
  enteringMode: ReaderMode;
};

export type ReaderExperienceCanvasState = {
  primaryLayer: "narrative_presence";
  optionalLayers: {
    voice: boolean;
    guidance: boolean;
    memoryContext: boolean;
    interactionAccess: boolean;
  };
};

export type ReaderExperienceModeState = {
  currentMode: ReaderMode;
  availableModes: ReaderMode[];
  transitionHint: string;
  modeLens: "elegant_focus" | "emotional_atmosphere" | "interpretive_whisper" | "voice_first_presence";
};

export type ReaderExperienceVoiceState = {
  voiceFirstReady: boolean;
  resumeCue: "continue_listening" | "listen_available" | "listen_not_available";
  transitionCue: string;
};

export type ReaderExperienceOverlayState = {
  relationshipTension: string | null;
  memoryEcho: string | null;
  emotionalClimate: string | null;
  sceneSignificance: string | null;
  unresolvedPressure: string | null;
};

export type ReaderExperienceInteractionState = {
  entryLine: string;
  canEnter: boolean;
  resumeAvailable: boolean;
  returnLine: string;
};

export type ReaderExperienceTransitionState = {
  sceneBridge: string | null;
  ambientCue: string | null;
  pauseResumeCue: string;
  continuityCue: string | null;
};

export type ReaderExperienceBundleV2 = {
  contractVersion: "1";
  experienceVersion: "v2";
  builtAtIso: string;
  readerId: string | null;
  deliveryState: {
    activeSceneId: string | null;
    chapterId: string | null;
    source: "public_scene" | "reader_continuity";
  };
  interactionPermissions: {
    canStartInteraction: boolean;
    canResumeInteraction: boolean;
    gatedBy: "none" | "entitlement" | "degraded_policy";
  };
  personalizationState: {
    mode: ReaderMode;
    preferredPresentationLanguageCode: string | null;
    preferredAudioEnabled: boolean | null;
    preferredVoicePlaybackSpeed: number | null;
  };
  continuityState: ReaderContinuity;
  sessionState: ReaderSession;
  degradedState: {
    isDegraded: boolean;
    policy:
      | "allow_system_fallback_only"
      | "allow_limited_free_turns"
      | "allow_read_only"
      | "blocked_all"
      | null;
    messageCode:
      | "none"
      | "provider_failure"
      | "moderation_block"
      | "entitlement_limit"
      | "read_only_fallback";
  };
  storyReentry: {
    available: boolean;
    recommendedFirstAction: "resume_conversation" | "resume_story_playback";
    rationale: string;
  } | null;
  entryState: ReaderExperienceEntryState;
  canvasState: ReaderExperienceCanvasState;
  modeState: ReaderExperienceModeState;
  voiceState: ReaderExperienceVoiceState;
  overlayState: ReaderExperienceOverlayState;
  interactionState: ReaderExperienceInteractionState;
  transitionState: ReaderExperienceTransitionState;
};

export type ReaderExperienceBundle = ReaderExperienceBundleV2;
