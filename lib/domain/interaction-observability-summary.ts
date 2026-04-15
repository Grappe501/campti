import type { CharacterConversationSession } from "@/lib/domain/character-conversation-session";

export const INTERACTION_OBSERVABILITY_SUMMARY_CONTRACT_VERSION = "1" as const;

export type InteractionObservabilitySummary = {
  contractVersion: typeof INTERACTION_OBSERVABILITY_SUMMARY_CONTRACT_VERSION;
  sessionId: string;
  characterId: string;
  readerId: string;
  sceneId: string | null;
  interactionCount: number;
  status: CharacterConversationSession["status"];
  /** Explicit: observational only — not canon prose. */
  nonCanonical: true;
};
