export type ReaderSessionLifecycle = "start" | "resume" | "pause" | "end";

export type ReaderSessionState = "ACTIVE" | "PAUSED" | "ENDED" | "NONE";

export type ReaderSession = {
  sessionId: string | null;
  readerId: string;
  characterId: string | null;
  sceneId: string | null;
  state: ReaderSessionState;
  interactionCount: number;
  startedAtIso: string | null;
  lastInteractionAtIso: string | null;
  endedAtIso: string | null;
  personalizationState: {
    preferredPresentationLanguageCode: string | null;
    preferredAudioEnabled: boolean | null;
    preferredVoicePlaybackSpeed: number | null;
  };
  degradedState: {
    policy:
      | "allow_system_fallback_only"
      | "allow_limited_free_turns"
      | "allow_read_only"
      | "blocked_all"
      | null;
    reason: "provider_failure" | "moderation_block" | "entitlement_limit" | "none";
  };
  continuityLink: {
    readerStateSessionId: string | null;
    lastSceneId: string | null;
  };
};
