/** Client-only localStorage keys for read progress (read in browser via hooks / client components). */

export const READING_PROGRESS_STORAGE_KEY = "campti-continue-reading";
export const IMMERSIVE_MODE_STORAGE_KEY = "campti-immersive-mode";
export const EXPERIENCE_MODE_STORAGE_KEY = "campti-experience-mode";
export const READER_RHYTHM_STORAGE_KEY = "campti-reader-rhythm-auto";

/** Public scene experience mode (reading / immersive / guided / listen). */
export type PublicExperienceMode = "reading" | "immersive" | "guided" | "listen";

export type ContinueReadingPayload = {
  chapterId: string;
  sceneId: string;
  chapterTitle: string;
  sceneLabel: string;
  savedAt: number;
  /** Emotionally resonant continuation line (server-derived when available). */
  continuationHeadline?: string;
  mood?: string | null;
  /** Last experience mode for resume (Read / Feel / Guided / Listen). */
  lastMode?: PublicExperienceMode;
  /** Vertical scroll positions keyed by scene id (best-effort resume). */
  scrollBySceneId?: Record<string, number>;
  /** Whether guided/immersive rhythm follows perception cadence when available. */
  rhythmAuto?: boolean;
  /** Optional return hook line mirrored from server emotional layer. */
  returnHookLine?: string;
};

export type ImmersiveModePreference = "reading" | "immersive";
