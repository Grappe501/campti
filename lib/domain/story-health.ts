/**
 * Phase 7 / Chunk 3 — live story health monitoring model.
 */
export const STORY_HEALTH_CONTRACT_VERSION = "1" as const;

export type StoryHealth = {
  contractVersion: typeof STORY_HEALTH_CONTRACT_VERSION;
  manuscriptId: string;
  chapterCompletionRate: number;
  reentryAnomalyScore: number;
  interactionAbandonmentRate: number;
  coherenceWarnings: string[];
  healthStatus: "healthy" | "watch" | "critical";
};
