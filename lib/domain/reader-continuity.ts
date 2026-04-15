export type ReaderContinuityPosition = {
  chapterId: string | null;
  sceneId: string | null;
  scrollAnchorY: number | null;
  scrollKey: string | null;
};

export type ReaderContinuityInteractionAnchor = {
  activeCharacterId: string | null;
  activeSessionId: string | null;
  narrativeResumeToken: string | null;
};

export type ReaderContinuitySessionLinkage = {
  readerSessionId: string | null;
  interactionSessionId: string | null;
  interactionSessionStatus: "ACTIVE" | "PAUSED" | "ENDED" | "NONE";
};

export type ReaderContinuity = {
  sourceOfTruth: "reader_state_db";
  position: ReaderContinuityPosition;
  interactionAnchor: ReaderContinuityInteractionAnchor;
  sessionLinkage: ReaderContinuitySessionLinkage;
  lastInteractionAtIso: string | null;
};

export type ReaderContinuityCacheSnapshot = {
  chapterId: string | null;
  sceneId: string | null;
  chapterTitle: string | null;
  sceneLabel: string | null;
  savedAtEpochMs: number | null;
  scrollAnchorY: number | null;
  scrollBySceneId: Record<string, number> | null;
  lastMode: "read" | "feel" | "guided" | "listen" | null;
  continuationHeadline: string | null;
  mood: string | null;
  returnHookLine: string | null;
};

export type ReaderContinuityDivergence = {
  sceneMismatch: boolean;
  chapterMismatch: boolean;
  cacheAheadOfDb: boolean;
};

export type ReaderContinuityReconciliation = {
  continuity: ReaderContinuity;
  divergence: ReaderContinuityDivergence;
  cacheDirective: {
    writeThrough: boolean;
    reason:
      | "already_in_sync"
      | "db_authority_overrode_cache"
      | "bootstrapped_db_from_cache"
      | "cache_empty";
  };
};
