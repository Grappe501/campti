import type { CharacterKnowledgeBoundary } from "@/lib/character-knowledge/knowledge-boundary";
import type { CharacterReaderMemoryDomain } from "@/lib/domain/character-reader-memory";

/**
 * P2-H — Full conversational bundle for live reader↔character interaction (LLM input shape).
 * Built deterministically from DB rows; does not call generative models.
 */
export type ConversationalIdentitySnapshot = {
  contractVersion: "1";
  builtAtIso: string;
  characterId: string;
  readerId: string;

  identity: ConversationalIdentityBlock;

  knowledgeBoundary: CharacterKnowledgeBoundary;

  relationships: ConversationalRelationshipEdge[];

  readerMemory: CharacterReaderMemoryDomain | null;

  emotionalState: ConversationalEmotionalState;
};

export type ConversationalIdentityBlock = {
  person: {
    id: string;
    name: string;
    birthYear: number | null;
    deathYear: number | null;
  };
  literaryProfile: {
    socialPosition: string | null;
    roleArchetype: string | null;
    educationLevel: string | null;
    narrativeFunction: string | null;
    worldview: string | null;
    coreBeliefs: unknown;
    fears: unknown;
    desires: unknown;
  } | null;
  coreHighlights: {
    enneagramType: string | null;
    enneagramWing: string | null;
    instinctStacking: string | null;
    worldviewSummary: string | null;
    coreFear: string | null;
    coreDesire: string | null;
  } | null;
};

export type ConversationalRelationshipEdge = {
  counterpartyId: string;
  counterpartyName: string;
  relationshipType: string;
  relationshipSummary: string | null;
};

/** Latest cognition snapshot + simulation slice — whichever exists — for affect / pressure. */
export type ConversationalEmotionalState = {
  /** Most recent `CharacterStateSnapshot` for this character (any scene). */
  latestCognitionSnapshot: CognitionSnapshotEmotionalSlice | null;
  /** Most recent `CharacterState` simulation row for this person. */
  latestLegacyCharacterState: LegacyCharacterEmotionalSlice | null;
};

export type CognitionSnapshotEmotionalSlice = {
  id: string;
  sceneId: string | null;
  label: string | null;
  currentFear: string | null;
  currentDesire: string | null;
  currentObligation: string | null;
  currentShame: string | null;
  currentHope: string | null;
  currentAnger: string | null;
  currentSocialRisk: string | null;
  currentMask: string | null;
  currentContradiction: string | null;
  currentArousal: number | null;
  currentLoneliness: number | null;
};

export type LegacyCharacterEmotionalSlice = {
  id: string;
  sceneId: string | null;
  label: string | null;
  emotionalState: string | null;
  motivation: string | null;
  fearState: string | null;
  fearLevel: number;
  trustLevel: number;
  stabilityLevel: number;
  cognitiveLoad: number;
  emotionalBaseline: string | null;
  socialConstraint: string | null;
};
