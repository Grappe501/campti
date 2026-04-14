/**
 * World observability — structured author-facing inspection (not raw DB dumps).
 * Contract bumps when snapshot shape changes materially.
 */

import type { DecisionPressureBreakdown } from "@/lib/domain/decision-trace";
import type { SimulationDiff, SimulationRunResult } from "@/lib/domain/simulation-run";
import type { SocialFieldContext } from "@/lib/domain/population-social-field";
import type { NarrativeShapingObserverSummary } from "@/lib/domain/narrative-shaping-defaults";
import type { SceneRepairMode, SceneStalenessReason } from "@/lib/domain/scene-repair";

export const WORLD_OBSERVER_CONTRACT_VERSION = "4" as const;

/** Phase 6.3 — chapter coherence (deterministic score + refinement plan mode). */
export const CHAPTER_OBSERVER_CONTRACT_VERSION = "2" as const;

export type ChapterObserverSnapshot = {
  contractVersion: typeof CHAPTER_OBSERVER_CONTRACT_VERSION;
  chapterId: string;
  bookId: string;
  title: string;
  sequenceInBook: number | null;
  narrativeAssemblyStatus: string;
  continuityState: string;
  sceneCount: number;
  coherenceScore: number;
  majorIssueCount: number;
  refinementMode: string;
  /** When true, stale assembly or ordering issues dominate—reassembly/metadata before LLM. */
  reassemblyLikelyEnough: boolean;
  /** Phase 7.1 — inherited narrative shaping defaults (epic→book→chapter). */
  narrativeShapingSummary: NarrativeShapingObserverSummary | null;
  builtAtIso: string;
};

/** Phase 6.4 — book-level arc summary (deterministic score + phase map). */
export const BOOK_OBSERVER_CONTRACT_VERSION = "2" as const;

export type BookObserverSnapshot = {
  contractVersion: typeof BOOK_OBSERVER_CONTRACT_VERSION;
  bookId: string;
  epicId: string;
  bookTitle: string;
  movementIndex: number;
  chapterCount: number;
  overallCoherenceScore: number;
  arcPhaseDistribution: Record<string, number>;
  majorIssueCount: number;
  refinementMode: string;
  /** Phase 7.1 — inherited narrative shaping defaults (epic→book). */
  narrativeShapingSummary: NarrativeShapingObserverSummary | null;
  builtAtIso: string;
};

/** Query for aggregate world slice + optional social-field anchor. */
export type WorldTickQuery = {
  worldStateReferenceId: string;
  storyYear?: number | null;
  sceneId?: string | null;
  focalPersonId?: string | null;
  focalPlaceId?: string | null;
  parishPlaceId?: string | null;
  maxPlaces?: number;
};

/** Single-place deep snapshot (bounded queries). */
export type PlaceTickQuery = {
  worldStateReferenceId: string;
  placeId: string;
  storyYear?: number | null;
  sceneId?: string | null;
  focalPersonId?: string | null;
  parishPlaceId?: string | null;
};

export type ObserverPressureSummary = {
  witnessRisk: number;
  gossipPressure: number;
  authorityPressure: number;
  kinProximityPressure: number;
  householdVisibility: number;
  tabooAmplification: number;
};

/** Lightweight census row preview (bounded lists). */
export type ObserverEntitySummary = {
  id: string;
  displayName: string;
  recordStatus: string;
  personId: string | null;
  isModeledCharacter: boolean;
};

export type ObserverEventSummary = {
  id: string;
  title: string;
  startYear: number | null;
  endYear: number | null;
  eventType: string;
};

export type ObserverHouseholdClusterSummary = {
  householdId: string;
  label: string;
  censusHouseholdKey: string | null;
  memberCount: number;
};

export type PlaceSnapshot = {
  placeId: string;
  placeLabel: string | null;
  placeType: string | null;
  populationCount: number;
  householdCount: number;
  linkedCharacterCount: number;
  /** Per-place social field (optional; omit when not computed to save N× calls). */
  socialFieldSummary: ObserverPressureSummary | null;
};

export type WorldSnapshot = {
  contractVersion: typeof WORLD_OBSERVER_CONTRACT_VERSION;
  worldStateReferenceId: string;
  storyYear: number | null;
  /** Echo of query / anchor used for social-field slice. */
  parishPlaceId: string | null;
  worldLabel: string | null;
  eraId: string | null;
  placeSummaries: PlaceSnapshot[];
  populationTotals: {
    entitiesInWorldSlice: number;
    households: number;
    /** Population rows flagged as modeled / full character track. */
    linkedModeledPopulationEntities: number;
    /** Persons with a linked population row (optional cross-check). */
    populationEntitiesLinkedToPerson: number;
  };
  socialFieldSummary: ObserverPressureSummary | null;
  authorityComponents: {
    church: number;
    military: number;
    civil: number;
    elite: number;
  } | null;
  gossipKinWitness: {
    gossipSpreadFactor: number | null;
    gossipReachEstimate: number | null;
    kinClusterCount: number | null;
    proximityWitnessPressure: number | null;
  } | null;
  /** Hotspot = top places by population count (already ordered in service). */
  witnessGossipHotspots: Array<{
    placeId: string;
    placeLabel: string | null;
    populationCount: number;
  }>;
  notableHouseholdClusters: ObserverHouseholdClusterSummary[];
  notablePopulationSample: ObserverEntitySummary[];
  observerEvents: ObserverEventSummary[];
  builtAtIso: string;
};

/** Rich single-place observer (one `buildSocialFieldContextFromQuery`). */
export type SinglePlaceSnapshot = {
  contractVersion: typeof WORLD_OBSERVER_CONTRACT_VERSION;
  query: PlaceTickQuery;
  placeLabel: string | null;
  placeType: string | null;
  populationCount: number;
  householdCount: number;
  linkedCharacterCount: number;
  socialField: SocialFieldContext | null;
  socialFieldSummary: ObserverPressureSummary | null;
  builtAtIso: string;
};

export type CognitionFrameSummary = {
  perceivedReality: string;
  topFears: string[];
  activeMotives: string[];
  suppressedMotives: string[];
  identityConflict: string;
  tabooThoughtPattern: string;
  selfDeceptionPattern: string;
};

export type InnerVoiceSessionSummary = {
  sessionId: string;
  mode: string;
  createdAt: string;
  excerpt: string;
  canonicalStatus: string;
};

export type DecisionTraceSummary = {
  statedMotive: string | null;
  underlyingMotive: string | null;
  triggerPressureLabels: string[];
  dominantPressureLabels: string[];
  worldConstraintLabels: string[];
  deterministicPressureOnly?: boolean;
};

export type CharacterKeyPressures = {
  topActiveMotiveLabels: string[];
  topFearLabels: string[];
  topTriggerLabels: string[];
};

export type CharacterLocationYearContext = {
  approximateStoryYear: number | null;
  worldStateId: string | null;
  worldStateLabel: string | null;
  primaryScenePlaceId: string | null;
};

export type CharacterObserverSnapshot = {
  contractVersion: typeof WORLD_OBSERVER_CONTRACT_VERSION;
  characterId: string;
  characterName: string | null;
  sceneId: string | null;
  cognition: CognitionFrameSummary | null;
  innerVoice: InnerVoiceSessionSummary | null;
  decisionTrace: DecisionTraceSummary | null;
  /** Concise scalar copy of social field (always preferred for UI). */
  socialFieldSummary: ObserverPressureSummary | null;
  /** Full structured context when `includeSocialFieldDetails` was true. */
  socialFieldDetails: SocialFieldContext | null;
  body: {
    painLevel: number;
    fatigueLevel: number;
    hungerLevel: number;
  } | null;
  desire: {
    visibilityRiskForDesire: number;
    punishmentSeverityForForbiddenDesire: number;
    currentForbiddenDesirePressure: number | null;
  } | null;
  keyPressures: CharacterKeyPressures | null;
  locationYear: CharacterLocationYearContext | null;
  builtAtIso: string;
};

export type SceneParticipantSummary = {
  personId: string;
  name: string;
};

export type SceneDependencySummary = {
  id: string;
  producerKind: string;
  producerId: string;
  strength: string;
};

export type SceneDependencyRollup = {
  byProducerKind: Record<string, number>;
  hardCount: number;
  softCount: number;
  total: number;
};

export type ProseQualitySummary = {
  reportId: string;
  createdAt: string;
  wordCount: number;
  criticalIssueCount: number;
  warningIssueCount: number;
};

export type SceneTextPresence = {
  hasAuthoringText: boolean;
  hasGenerationText: boolean;
  hasPublishedReaderText: boolean;
  hasDraftText: boolean;
};

export type SceneTextSource = "authoring" | "generation" | "published" | "draft";

export type SceneNarrativePlacement = {
  chapterId: string;
  bookId: string | null;
  bookTitle: string | null;
  epicId: string | null;
  epicTitle: string | null;
  sequenceInBook: number | null;
  orderInChapter: number | null;
};

/** Phase 6.2 — repair / staleness (debuggable, no human text). */
export type SceneRepairObserverSummary = {
  stalenessReasons: SceneStalenessReason[];
  suggestedRepairMode: SceneRepairMode | null;
  pendingRevisionJobs: number;
  lastRepairMode: SceneRepairMode | null;
  lastRepairCompletedAtIso: string | null;
};

export type SceneObserverSnapshot = {
  contractVersion: typeof WORLD_OBSERVER_CONTRACT_VERSION;
  sceneId: string;
  placement: SceneNarrativePlacement | null;
  metadata: {
    description: string;
    summary: string | null;
    narrativeIntent: string | null;
    emotionalTone: string | null;
    historicalAnchor: string | null;
    narrativeAssemblyStatus: string;
    continuityState: string;
    assemblyInvalidatedAt: string | null;
    worldStateOverrideId: string | null;
  };
  participants: SceneParticipantSummary[];
  hiddenPressureSummary: string | null;
  socialFieldSummary: ObserverPressureSummary | null;
  socialFieldDetails: SocialFieldContext | null;
  dependencyEdges: SceneDependencySummary[];
  dependencyRollup: SceneDependencyRollup;
  proseQuality: ProseQualitySummary | null;
  latestText: {
    source: SceneTextSource;
    charCount: number;
    excerpt: string;
  };
  textPresence: SceneTextPresence;
  repairSummary: SceneRepairObserverSummary | null;
  /** Phase 7.1 — full hierarchy resolution summary (epic→book→chapter→scene). */
  narrativeShapingSummary: NarrativeShapingObserverSummary | null;
  builtAtIso: string;
};

export type SimulationOverrideSummary = {
  keys: string[];
  count: number;
};

export type SimulationDiffConcise = {
  cognition: {
    fearHeadlinePrior: string | null;
    fearHeadlineNext: string | null;
    obligationHeadlinePrior: string | null;
    obligationHeadlineNext: string | null;
    identityConflictChanged: boolean;
    motiveAddsOrRemovals: string[];
  };
  pressures: {
    motiveOrderChanged: boolean;
    motiveDeltaCount: number;
    fearDeltaCount: number;
    triggerDeltaCount: number;
  };
  embodiment: {
    changedKeys: string[];
  };
  desireWorld: SimulationDiff["desireWorld"];
  decisionTrace: SimulationDiff["decisionTrace"];
  innerVoice: SimulationDiff["innerVoice"];
};

export type SimulationComparisonSummarySnapshot = {
  headline: string;
  bulletWhyShifted: string[];
  dominantOverrideEffects: string[];
};

export type SimulationObserverSnapshot = {
  contractVersion: typeof WORLD_OBSERVER_CONTRACT_VERSION;
  runId: string;
  scenarioId: string;
  sceneId: string | null;
  personId: string | null;
  canonicalStatus: string;
  createdAt: string;
  inputHash: string | null;
  inputSummary: {
    characterId: string | null;
    selectedAction: unknown;
    includeInnerVoice: boolean;
  };
  overrideSummary: SimulationOverrideSummary | null;
  comparisonSummary: SimulationComparisonSummarySnapshot | null;
  diffSummary: SimulationDiffConcise | null;
  /** Full deterministic diff when persisted. */
  diffFromBase: SimulationDiff | null;
  pressureCompare: {
    base: DecisionPressureBreakdown | null;
    alternate: DecisionPressureBreakdown | null;
  } | null;
  /** Parsed from persisted `outputJson` when structurally valid (for re-run tooling). */
  resultPreview: Partial<SimulationRunResult> | null;
  prosePreview: string | null;
  builtAtIso: string;
};

export type SimulationPairObserverSnapshot = {
  contractVersion: typeof WORLD_OBSERVER_CONTRACT_VERSION;
  leftRunId: string;
  rightRunId: string;
  compareSummary: string;
  pressureDiffSummary: string;
  fullDiffAvailable: boolean;
  builtAtIso: string;
};
