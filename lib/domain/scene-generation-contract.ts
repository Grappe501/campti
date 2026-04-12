import type { GenealogicalAssertion, Person, WorldStateReference } from "@prisma/client";

/**
 * Serializable snapshot for scene generation / regen. All fields are inputs—never treated as canon.
 * Wire to OpenAI (or other) from a loader that resolves world-state inheritance.
 */
export type SceneGenerationContractV1 = {
  contractVersion: "1";

  epic: {
    id: string;
    title: string;
    summary: string | null;
    metadataJson: unknown;
  };

  book: {
    id: string;
    movementIndex: number;
    title: string;
    readerFacingTitle: string | null;
    summary: string | null;
  };

  chapter: {
    id: string;
    title: string;
    summary: string | null;
    sequenceInBook: number;
    chapterNumber: number | null;
  };

  scene: {
    id: string;
    description: string;
    summary: string | null;
    narrativeIntent: string | null;
    emotionalTone: string | null;
    orderInChapter: number | null;
    writingMode: string;
    historicalAnchor: string | null;
    locationNote: string | null;
    pov: string | null;
    structuredDataJson: unknown;
  };

  /** Resolved era slice id + label for prompts (see world-state resolver). */
  effectiveWorldState: {
    worldStateId: string | null;
    eraId: string | null;
    label: string | null;
  };

  place: {
    id: string;
    name: string;
    description: string | null;
  } | null;

  participatingPeople: Array<
    Pick<Person, "id" | "name" | "description" | "birthYear" | "deathYear">
  >;

  /** Assertions referenced for this generation pass (competing claims preserved in rows). */
  genealogicalAssertions: Array<
    Pick<
      GenealogicalAssertion,
      "id" | "valueJson" | "confidence" | "recordType" | "narrativePreferred"
    > & {
      slot: { predicate: string; subjectType: string; subjectId: string };
    }
  >;

  /** Optional resolved world state row when needed for long prompts. */
  worldStateReference: Pick<
    WorldStateReference,
    "id" | "eraId" | "label" | "description" | "certainty"
  > | null;

  beatPlan: Array<{
    orderIndex: number;
    label: string | null;
    intentSummary: string | null;
    beatPlanJson: unknown;
    microbeatsJson: unknown;
  }>;

  continuityNotes: string[];
  privateNotes: string | null;

  /**
   * Phase 6 — optional pins & mediation summaries (structured truth for prompts).
   * Loader may leave these empty when nothing is PINNED / linked.
   */
  pinnedCognitionSessions?: Array<{
    id: string;
    personId: string;
    mode: string;
    canonicalStatus: string;
    excerptPreview: string;
  }>;
  /** PINNED decision-trace sessions for this scene (excerpts only). */
  pinnedDecisionTraceSessions?: Array<{
    id: string;
    personId: string;
    excerptPreview: string;
  }>;
  /** Simulation scenarios anchored to this scene (for promoted / referenced alternates). */
  linkedSimulationScenarios?: Array<{
    id: string;
    title: string;
    inputHash: string | null;
  }>;
  /**
   * Cognition-frame `thoughtLanguage` slice (JSON-safe) when POV character resolves.
   * Keeps generation aligned with mediation / register rules without dumping full frame.
   */
  thoughtLanguageMediation?: Record<string, unknown> | null;
};
