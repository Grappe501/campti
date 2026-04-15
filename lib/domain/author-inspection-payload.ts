/**
 * P3-R — Author / God inspection payload (admin-only surface).
 *
 * Must remain separate from bounded reader-facing conversation payloads.
 */
import type { StorylineExplainabilitySummary } from "@/lib/domain/storyline-explainability";
export const AUTHOR_INSPECTION_PAYLOAD_CONTRACT_VERSION = "1" as const;

export type AuthorInspectionPayload = {
  contractVersion: typeof AUTHOR_INSPECTION_PAYLOAD_CONTRACT_VERSION;
  mode: "authorial_omniscient_interior_inspection" | "authorial_scene_truth_audit";
  characterId: string;
  sceneId: string | null;
  readerId: string | null;
  sessionId: string | null;
  modeSeparation: {
    boundedReaderCharacterMode: "bounded_character_conversation";
    authorGodInspectionMode: "future_author_god_mode";
    separationEnforced: true;
  };
  characterKnowledgeBoundary: {
    knownFacts: string[];
    believedFacts: string[];
    unknownDomains: string[];
  };
  canonicalTruthRelevantToCharacter: {
    relevantKnownFacts: string[];
  };
  readerInteractionMemory: {
    familiarityLevel: number;
    interactionCount: number;
    knownFactsKeys: string[];
  } | null;
  currentEmotionalState: {
    baselineTone: string;
    latestCharacterEmotionalTone: string | null;
  };
  driftAnchorComparison: {
    anchorPresent: boolean;
    driftDetected: boolean;
    driftSignals: string[];
  };
  internalThoughtVisibility: {
    allowed: boolean;
    latestInternalThought: string | null;
  };
  storylineExplainability: StorylineExplainabilitySummary | null;
};
