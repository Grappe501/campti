import type {
  CharacterProfile,
  CharacterRelationship,
  CharacterState as SimulationCharacterStateRow,
  GenealogicalAssertion,
  Person,
  Scene,
  WorldStateReference,
} from "@prisma/client";
import type { EnneagramGrowthShift, EnneagramInnerVoicePattern, EnneagramProfile, EnneagramStressShift } from "@/lib/domain/enneagram";
import type { CharacterAgeBand, RankedCognitionItem } from "@/lib/domain/inner-voice";
import type {
  ActiveDesireSignals,
  AttachmentLongingProfile,
  CharacterDesireProfile,
  DesirePressureSummary,
  PleasurePattern,
  SexualConstraintProfile,
  WorldStateDesireEnvironment,
} from "@/lib/domain/desire-cognition";
import type { CharacterPhysicalState, EmbodiedCognitionEffects } from "@/lib/domain/embodiment";
import type { ThoughtLanguageFrame } from "@/lib/domain/thought-language";
import type {
  CognitiveDistortionProfile,
  InnerVoiceTextureProfile,
  ThoughtFragmentProfile,
} from "@/lib/domain/thought-realism";

/** DB: `CharacterCoreProfile` (1:1 Person). */
export type CharacterCore = {
  id: string;
  worldviewJson: unknown;
  worldviewSummary: string | null;
  valuesJson: unknown;
  woundsJson: unknown;
  attachmentStyle: string | null;
  socialMaskJson: unknown;
  tabooBoundariesJson: unknown;
  decisionStyleJson: unknown;
  defenseMechanismsJson: unknown;
  privateDesiresJson: unknown;
  identityTensionsJson: unknown;
  notes: string | null;
  enneagramType: string | null;
  enneagramWing: string | null;
  instinctStacking: string | null;
  baselineIntegrationLevel: number | null;
  stressPatternJson: unknown;
  growthPatternJson: unknown;
  egoFixation: string | null;
  coreFear: string | null;
  coreDesire: string | null;
  virtue: string | null;
  vice: string | null;
  harmDefenseStyle: string | null;
  imageStrategy: string | null;
  attachmentPatternOverride: string | null;
  notesEnneagram: string | null;
  mindLanguagePrimary: string | null;
  mindLanguageSecondary: string | null;
  spokenLanguageProfileJson: unknown;
  registerProfileJson: unknown;
  translationRenderMode: string | null;
  codeSwitchTriggersJson: unknown;
  retainedLexiconJson: unknown;
  desireProfileJson: unknown;
  pleasurePatternJson: unknown;
  attachmentLongingJson: unknown;
  sexualConstraintProfileJson: unknown;
  notesDesire: string | null;
};

/** DB: `CharacterStateSnapshot` (scene/chapter-anchored cognitive state). */
export type CharacterState = {
  id: string;
  snapshotKind: string;
  sequenceIndex: number | null;
  currentFear: string | null;
  currentDesire: string | null;
  currentObligation: string | null;
  currentShame: string | null;
  currentHope: string | null;
  currentAnger: string | null;
  currentSocialRisk: string | null;
  currentStatusVulnerability: string | null;
  currentMask: string | null;
  currentContradiction: string | null;
  currentArousal: number | null;
  currentLoneliness: number | null;
  currentWantednessHunger: number | null;
  currentNeedToBeNeeded: number | null;
  currentAttachmentAche: number | null;
  currentPleasureSeeking: number | null;
  currentForbiddenDesirePressure: number | null;
  currentResentmentAtDeprivation: number | null;
  relationshipsSnapshotJson: unknown;
  genealogicalContextRefsJson: unknown;
};

/** Deterministic slice produced by `composeDeterministicCognitionLayer` (no LLM). */
export type ResolvedCognitionLayer = {
  perceivedReality: string;
  activeMotives: string[];
  suppressedMotives: string[];
  fearStack: RankedCognitionItem[];
  obligationStack: RankedCognitionItem[];
  identityConflict: string;
  decisionBiases: string[];
};

/** Ground-truth rows + resolved cognition for a character at a scene. */
export type CharacterCognitionFrame = {
  characterId: string;
  sceneId: string;
  resolvedAtIso: string;
  person: Pick<Person, "id" | "name">;
  literaryProfile: CharacterProfile | null;
  coreProfile: CharacterCore | null;
  /** Latest planned snapshot for this scene when present. */
  stateSnapshot: CharacterState | null;
  /** Broader simulation `CharacterState` row when present. */
  legacyCharacterState: SimulationCharacterStateRow | null;
  effectiveWorldState: WorldStateReference | null;
  scene: Pick<
    Scene,
    | "id"
    | "description"
    | "summary"
    | "narrativeIntent"
    | "emotionalTone"
    | "structuredDataJson"
    | "historicalAnchor"
  >;
  relationships: CharacterRelationship[];
  relevantAssertions: Array<
    Pick<GenealogicalAssertion, "id" | "valueJson" | "narrativePreferred"> & {
      slot?: { label?: string | null } | null;
    }
  >;
  enneagramProfile: EnneagramProfile;
  effectiveStressState: EnneagramStressShift;
  effectiveGrowthState: EnneagramGrowthShift;
  enneagramVoicePattern: EnneagramInnerVoicePattern | null;
  selfDeceptionPattern: string;
  tabooThoughtPattern: string;
  /** Deterministic age band for cognition (from birth year + scene story year when available). */
  cognitionAgeBand: CharacterAgeBand | null;
  cognitionAgeYears: number | null;
  thoughtLanguageFrame: ThoughtLanguageFrame;
  /** Deterministic body load (simulation JSON + scene hints). */
  characterPhysicalState: CharacterPhysicalState;
  /** Normalized embodiment pressures applied to resolved cognition. */
  embodiedCognitionEffects: EmbodiedCognitionEffects;
  /** Slow-changing desire scalars from `desireProfileJson`. */
  characterDesireProfile: CharacterDesireProfile;
  pleasurePattern: PleasurePattern;
  attachmentLongingProfile: AttachmentLongingProfile;
  sexualConstraintProfile: SexualConstraintProfile;
  /** Normalized pulls after age/world/snapshot gating (also in `desirePressureSummary.vectors`). */
  activeDesireSignals: ActiveDesireSignals;
  /** World-era gates on desire visibility and punishment. */
  worldDesireEnvironment: WorldStateDesireEnvironment;
  /** Deterministic summary for prompts (includes vectors + conflict snapshot). */
  desirePressureSummary: DesirePressureSummary;
  /** Phase 5C.2 — how thought should fragment and interrupt (not essay-shaped). */
  thoughtFragmentProfile: ThoughtFragmentProfile;
  /** Phase 5C.2 — dominant cognitive warps (historically situated, not clinical output). */
  cognitiveDistortionProfile: CognitiveDistortionProfile;
  /** Phase 5C.2 — rhythm and bleed-through for inner voice. */
  innerVoiceTextureProfile: InnerVoiceTextureProfile;
} & ResolvedCognitionLayer;

export type { RankedCognitionItem };

export type PressureRankingEntry = {
  label: string;
  weight: number;
};

export type GodModeQuestion = {
  question: string;
  sceneId?: string;
  characterId: string;
};

/** @deprecated Legacy session JSON shape; prefer Phase 5B `CharacterInnerVoiceResponse` in `lib/domain/inner-voice.ts`. */
export type { InnerVoiceSessionStructuredV1 as CharacterInnerVoiceStructured } from "@/lib/cognition/inner-voice-contract";

export type {
  CharacterInnerVoiceRequest,
  CharacterInnerVoiceResponse,
  InnerVoiceMode,
} from "@/lib/domain/inner-voice";

/** God-mode answers use the same structured response contract as other inner voice modes (v2). */
export type GodModeAnswer = import("@/lib/domain/inner-voice").CharacterInnerVoiceResponse;

export type {
  ResolveCognitionFrameSimulationOptions,
  SimulationCanonicalStatus,
  SimulationComparisonSummary,
  SimulationDiff,
  SimulationOverrideSet,
  SimulationResolutionPatch,
  SimulationRunInput,
  SimulationRunResult,
  SimulationScenarioRecord,
  SimulationScenarioInput,
  SimulationVariableOverride,
} from "@/lib/domain/simulation-run";

export {
  SIMULATION_ENGINE_VERSION,
  SIMULATION_RUN_CONTRACT_VERSION,
  SimulationOverrideKey,
} from "@/lib/domain/simulation-run";

/** Minimal row shape from `recordSimulationRun` (legacy persist helper). */
export type PersistedSimulationRunStub = {
  runId: string;
  scenarioId: string;
  output: Record<string, unknown>;
  prosePreview?: string | null;
  diffFromBase?: Record<string, unknown> | null;
};

/** @deprecated Use `DecisionTraceResponse` from `@/lib/domain/decision-trace`. */
export type CharacterDecisionFrame = {
  characterId: string;
  sceneId: string;
  chosenAction: string;
  whyThisAction: string;
  dominantPressures: PressureRankingEntry[];
  worldStateFactors: string[];
  relationshipFactors: string[];
  whatWouldChangeDecision: string[];
};

export type {
  ActionCandidate,
  ActionConstraint,
  AlternateOutcomeHypothesis,
  DecisionPressureBreakdown,
  DecisionTraceRequest,
  DecisionTraceResponse,
  DecisionTraceSimulationBridge,
} from "@/lib/domain/decision-trace";
