import type { CharacterKnowledgeBoundary } from "@/lib/character-knowledge/knowledge-boundary";
import type { CharacterReaderMemoryDomain } from "@/lib/domain/character-reader-memory";

/**
 * P2-H — Full conversational bundle for live reader↔character interaction (LLM input shape).
 * Built deterministically from DB rows; does not call generative models.
 *
 * **Bounded character conversation mode only:** this snapshot is the canonical in-world,
 * epistemically bounded view for a character speaking as themselves at a story moment.
 * Author / God / omniscient access is a separate future mode (different contracts and pipelines);
 * do not merge those capabilities into this type.
 */

/** Fixed interaction policy for bounded in-world dialogue (always applied in this snapshot). */
export type ConversationalIdentityPolicy = {
  inWorldOnly: boolean;
  noFutureKnowledge: boolean;
  noOutOfWorldTeaching: boolean;
  translationIsPresentationOnly: boolean;
  authorOmniscienceExcluded: boolean;
};

export const BOUNDED_CHARACTER_CONVERSATIONAL_POLICY: ConversationalIdentityPolicy = {
  inWorldOnly: true,
  noFutureKnowledge: true,
  noOutOfWorldTeaching: true,
  translationIsPresentationOnly: true,
  authorOmniscienceExcluded: true,
};

export type ConversationalIdentitySnapshot = {
  contractVersion: "1";
  builtAtIso: string;
  characterId: string;
  readerId: string;
  /** Present when the assembly was scoped to a scene; otherwise null (best-effort global slice). */
  sceneId: string | null;

  policy: ConversationalIdentityPolicy;

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

/** Cognition snapshot + simulation slice for affect / pressure (scene-preferred when `sceneId` was set on build). */
export type ConversationalEmotionalState = {
  /** Scene-scoped cognition snapshot when available, else latest for the character (any scene). */
  latestCognitionSnapshot: CognitionSnapshotEmotionalSlice | null;
  /** Scene-scoped `CharacterState` when available, else latest for the person. */
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
