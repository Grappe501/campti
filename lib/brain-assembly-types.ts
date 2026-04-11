export type ScalarBand =
  | "none"
  | "very_low"
  | "low"
  | "guarded"
  | "mixed"
  | "present"
  | "high"
  | "acute";

export type BrainAssemblyListItem = {
  label: string;
  source?: string;
  weight?: ScalarBand;
};

export type PerceptionEnvelope = {
  noticeBandwidth: ScalarBand;
  likelyMisses: string[];
  likelyMisreads: string[];
  sensoryBiases: string[];
  reactionSpeed: ScalarBand;
};

export type MeaningEnvelope = {
  explanatoryFrame: string[];
  idiomPressure: string[];
  dangerFrame: string[];
  shameFrame: string[];
  hopeFrame: string[];
};

export type RegulationEnvelope = {
  baselineRegulation: ScalarBand;
  overloadRisk: ScalarBand;
  freezeRisk: ScalarBand;
  floodRisk: ScalarBand;
  likelySelfManagement: string[];
};

/** Focal × counterpart disclosure semantics from `RelationshipDisclosureProfile` (dyad-specific thresholds). */
export type DyadDisclosureBlend = {
  witnessSensitivity: "low" | "moderate" | "high";
  namingVsHinting: "hint_favored" | "balanced" | "naming_costly";
  reciprocityExpectation: "low" | "moderate" | "high";
};

export type RelationalSafetyEnvelope = {
  safePeople: string[];
  unsafePeople: string[];
  disclosureCost: ScalarBand;
  intimacyPermission: ScalarBand;
  likelyMaskingNeed: ScalarBand;
  /** Present when a `RelationshipDisclosureProfile` exists for focal × counterpart in this world slice. */
  dyadDisclosure?: DyadDisclosureBlend;
};

export type DecisionEnvelope = {
  availableActions: string[];
  forbiddenActions: string[];
  speechBandwidth: ScalarBand;
  defianceCost: ScalarBand;
  mostLikelyMove: string | null;
};

export type CharacterBrainState = {
  personId: string;
  worldStateId: string;
  sceneId?: string | null;
  perception: PerceptionEnvelope;
  meaning: MeaningEnvelope;
  regulation: RegulationEnvelope;
  relationalSafety: RelationalSafetyEnvelope;
  decision: DecisionEnvelope;
  assemblyNotes: string[];
};

/** Optional scene-time cues derived in the bundle loader (no new DB tables). */
export type SceneConstraintSummary = {
  revealBudgetScore?: number | null;
  pressureTags?: string[] | null;
  blockedActions?: string[] | null;
  forcedStillness?: boolean | null;
  immediateSignals?: string[] | null;
  objective?: string | null;
  socialExposureScore?: number | null;
  violenceProximityScore?: number | null;
};

/** Numeric dyad slice when a RelationshipProfile exists for focal person × counterpart in this world. */
export type CounterpartDyadSummary = {
  trustLevel: number;
  fearLevel: number;
  shameLeverage: number;
  readsAsUnsafe: boolean;
  readsAsSafe: boolean;
};

/** How `counterpartContext` was chosen in the bundle loader (strict fallback order). */
export type CounterpartResolutionSource =
  | "explicit_arg"
  | "scene_json"
  | "character_state_json"
  | "scene_heuristic";

/** Resolved optional focal “other person” for scene-time evaluation (no reciprocal sim). */
export type CounterpartContext = {
  counterpartPersonId: string;
  displayName: string;
  dyad: CounterpartDyadSummary | null;
  resolutionSource?: CounterpartResolutionSource;
};

/** Other in-scene people with dyad rows, ranked for admin override (excludes current focal counterpart). */
export type CounterpartAlternateCandidate = {
  counterpartPersonId: string;
  displayName: string;
  salienceScore: number;
};

export type CharacterBrainBundle = {
  personId: string;
  worldStateId: string;
  sceneId?: string | null;
  /** Normalized scene constraints for Stage 7.5 runner; set when scene-linked. */
  sceneConstraintSummary?: SceneConstraintSummary | null;
  /** When loader was given a counterpart id: name + optional dyad from RelationshipProfile. */
  counterpartContext?: CounterpartContext | null;
  /** In-scene alternates (2–5) for pinning a different focal other; empty when not scene-linked. */
  counterpartAlternates?: CounterpartAlternateCandidate[];
  intelligence?: {
    cognitiveStyle?: string[];
    noticeBandwidth?: ScalarBand;
    abstractionTolerance?: ScalarBand;
    reactionSpeed?: ScalarBand;
  } | null;
  pressure?: {
    dangerSources?: string[];
    defianceCost?: ScalarBand;
    speechRestriction?: ScalarBand;
    survivalMode?: ScalarBand;
  } | null;
  relationships?: {
    safePeople?: string[];
    unsafePeople?: string[];
    maskingNeed?: ScalarBand;
    disclosureCost?: ScalarBand;
    /** Dyad disclosure profile blend for the resolved counterpart (same world state). */
    dyadDisclosure?: DyadDisclosureBlend | null;
  } | null;
  continuity?: {
    traumaTriggers?: string[];
    learnedRules?: string[];
    consequenceMemory?: string[];
  } | null;
  health?: {
    physicalLoad?: ScalarBand;
    mentalLoad?: ScalarBand;
    emotionalLoad?: ScalarBand;
    likelySelfManagement?: string[];
  } | null;
  environment?: {
    sensoryBiases?: string[];
    immediateRisks?: string[];
    movementLimits?: string[];
  } | null;
  /** Era drivers / power / knobs from `WorldStateEraProfile` (prompt + assembly). */
  worldEraContext?: {
    coreEconomicDrivers: string[];
    powerSummary: string | null;
    meaningOfWork: string | null;
    /** Optional: why knobs match sources / structure (not prompt fluff). */
    evidenceRationale: string | null;
    knobs: {
      economicPressure: number;
      relationalInterdependence: number;
      autonomyBaseline: number;
      systemicExtraction: number;
      collectiveCohesion: number;
    };
    effectivePressureWeights: {
      governanceWeight: number;
      economicWeight: number;
      demographicWeight: number;
      familyWeight: number;
    } | null;
  } | null;
  sourceSummary?: {
    intelligenceLoaded: boolean;
    pressureLoaded: boolean;
    relationshipsLoaded: boolean;
    continuityLoaded: boolean;
    healthLoaded: boolean;
    environmentLoaded: boolean;
    /** Set when `WorldStateEraProfile` exists for this world slice. */
    eraProfileLoaded?: boolean;
  };
};
