import type { CognitionCanonicalStatus } from "@prisma/client";

import type { CharacterCognitionFrame, CharacterState } from "@/lib/domain/cognition";
import type {
  AttachmentLongingProfile,
  CharacterDesireProfile,
  WorldStateDesireEnvironment,
} from "@/lib/domain/desire-cognition";
import type { CharacterPhysicalState } from "@/lib/domain/embodiment";
import type { ActionCandidate } from "@/lib/domain/decision-trace";
import type { CharacterInnerVoiceResponse } from "@/lib/domain/inner-voice";
import type { DecisionPressureBreakdown, DecisionTraceResponse } from "@/lib/domain/decision-trace";

/**
 * Phase 5E — controlled cognition / decision reruns. Exploratory by default; canonical scene rows untouched.
 * `SIMULATION_ENGINE_VERSION` bumps when deterministic merge semantics change (reproducibility).
 */
export const SIMULATION_ENGINE_VERSION = "1" as const;
export const SIMULATION_RUN_CONTRACT_VERSION = "1" as const;

/** Dot-notation keys supported by `buildSimulationResolutionPatch` (extend as engine grows). */
export const SimulationOverrideKey = {
  worldStateReferenceId: "worldState.referenceId",
  embodimentPain: "embodiment.painLevel",
  embodimentHunger: "embodiment.hungerLevel",
  embodimentFatigue: "embodiment.fatigueLevel",
  embodimentIllness: "embodiment.illnessLevel",
  embodimentSensory: "embodiment.sensoryDisruptionLevel",
  embodimentMobility: "embodiment.mobilityConstraint",
  embodimentInjury: "embodiment.injuryDescription",
  snapshotCurrentFear: "snapshot.currentFear",
  snapshotCurrentAnger: "snapshot.currentAnger",
  snapshotCurrentSocialRisk: "snapshot.currentSocialRisk",
  snapshotCurrentHope: "snapshot.currentHope",
  snapshotForbiddenDesire: "snapshot.currentForbiddenDesirePressure",
  desireVisibilityRisk: "world.desire.visibilityRiskForDesire",
  desirePunishment: "world.desire.punishmentSeverityForForbiddenDesire",
  tabooSeverity: "world.taboo.eroticTabooSeverity",
  socialRiskScalar: "social.riskScalar",
  lawPunishment: "law.punishmentSeverity",
  attachmentApproval: "attachment.approvalSensitivity",
  attachmentAbandonment: "attachment.abandonmentAche",
  relationshipTrustBias: "relationship.trustBias",
  /** Per counterparty person id: `relationship.pair.<personId>.trustBias` (0–100). */
  relationshipPairTrustBias: "relationship.pair.*.trustBias",
  selectedActionCandidate: "decision.selectedActionCandidate",
  thoughtLanguageRenderMode: "thoughtLanguage.translationRenderMode",
  approximateStoryYear: "meta.approximateStoryYear",
} as const;

export type SimulationOverrideKey =
  (typeof SimulationOverrideKey)[keyof typeof SimulationOverrideKey];

/**
 * Single explicit override (inspectable, auditable). Prior captured at authoring time when available.
 */
export type SimulationVariableOverride = {
  key: string;
  priorValue: unknown;
  overrideValue: unknown;
  unit?: string;
};

export type SimulationOverrideSet = {
  contractVersion: "1";
  overrides: SimulationVariableOverride[];
  /** Optional label for author tooling. */
  label?: string;
};

export type SimulationScenarioInput = {
  sceneId: string;
  title: string;
  baseSnapshotId?: string | null;
  overrideSet: SimulationOverrideSet;
  createdBy?: string | null;
};

export type SimulationScenarioRecord = {
  id: string;
  sceneId: string;
  title: string;
  baseSnapshotId: string | null;
  variableOverridesJson: unknown;
  outcomeSummaryJson: unknown | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

/**
 * Deterministic patches applied in-memory during `resolveCharacterCognitionFrame` — never persisted as canonical truth.
 */
export type SimulationResolutionPatch = {
  stateSnapshot?: Partial<CharacterState>;
  /** When set, replaces effective world-state row for norms / language / desire environment resolution. */
  worldStateReferenceId?: string;
  embodiment?: Partial<CharacterPhysicalState>;
  worldDesireEnvironment?: Partial<WorldStateDesireEnvironment>;
  attachmentLonging?: Partial<AttachmentLongingProfile>;
  characterDesireProfile?: Partial<CharacterDesireProfile>;
  approximateStoryYear?: number | null;
  /** Overrides `CharacterCore.translationRenderMode` for thought-language testing. */
  translationRenderMode?: string | null;
  /** Nudge relationship trust for narrative overlay (optional future wiring to dyad synthesis). */
  relationshipTrustBias?: number | null;
  /** Per–counterparty-id trust bias injected into relationship context (simulation-only notes). */
  relationshipPairTrust?: Record<string, number>;
  /** When set, decision trace / diff uses this candidate instead of run-input only. */
  selectedActionCandidate?: ActionCandidate | null;
};

export type ResolveCognitionFrameSimulationOptions = {
  patch?: SimulationResolutionPatch;
};

export type SimulationRunInput = {
  scenarioId: string;
  /** Primary character for this run. Use `characterIds` instead for ensemble-oriented callers (first id runs pipeline until multi-character is implemented). */
  characterId?: string;
  /** When set, first id is used as focus if `characterId` is omitted. */
  characterIds?: string[];
  /** When set, runs decision trace for this action (label or full candidate). */
  selectedAction?: string | ActionCandidate | null;
  alternateAction?: string | ActionCandidate | null;
  /** When true, calls inner voice LLM (advisory). */
  includeInnerVoice?: boolean;
  innerVoiceMode?: import("@/lib/domain/inner-voice").InnerVoiceMode;
  /** Persist row to DB when true. */
  persist?: boolean;
  canonicalStatus?: CognitionCanonicalStatus;
};

export type SimulationPressureDelta = {
  label: string;
  priorWeight: number;
  nextWeight: number;
};

export type SimulationDiff = {
  contractVersion: typeof SIMULATION_RUN_CONTRACT_VERSION;
  cognition: {
    fearStackHeadlineShift: { prior: string | null; next: string | null };
    obligationHeadlineShift: { prior: string | null; next: string | null };
    identityConflictChanged: boolean;
    activeMotiveAddedOrRemoved: string[];
  };
  pressures: {
    motiveActiveOrderChanged: boolean;
    motiveActiveDeltas: SimulationPressureDelta[];
    fearDriverDeltas: SimulationPressureDelta[];
    /** From deterministic `DecisionPressureBreakdown.triggerPressures` (scene-time spikes). */
    triggerPressureDeltas: SimulationPressureDelta[];
  };
  embodiment: {
    changedKeys: string[];
    scalars: Record<string, { prior: number; next: number }>;
  };
  desireWorld: {
    visibilityRiskDelta: number | null;
    punishmentDelta: number | null;
    tabooDelta: number | null;
  };
  decisionTrace: {
    statedMotiveChanged: boolean;
    underlyingMotiveChanged: boolean;
    whyThisWonLevenshteinBucket: "none" | "light" | "heavy";
    selectedActionLabelChanged: boolean;
    contradictionSummaryBucket: "none" | "light" | "heavy";
    /** LLM trace output: trigger pressure entries vs base trace. */
    triggerPressureDeltasFromTrace: SimulationPressureDelta[];
  } | null;
  innerVoice: {
    modeContractChanged: boolean;
    textureSummaryShift: string[];
  } | null;
};

export type SimulationComparisonSummary = {
  headline: string;
  bulletWhyShifted: string[];
  /** Human-readable mapping override key → effect class. */
  dominantOverrideEffects: string[];
};

export type SimulationCanonicalStatus = CognitionCanonicalStatus;

/**
 * Full result from `executeSimulationRun` (API + optional persistence).
 * `cognitionFramePayload` is JSON-safe; use for branching / diff / audit.
 */
export type SimulationRunResult = {
  contractVersion: typeof SIMULATION_RUN_CONTRACT_VERSION;
  engineVersion: typeof SIMULATION_ENGINE_VERSION;
  runId?: string;
  scenarioId: string;
  sceneId: string;
  /** Focus character for this run (ensemble: same scenario may store multiple runs per person later). */
  characterId?: string;
  characterIds?: string[];
  createdAt: string;
  effectiveOverrides: SimulationVariableOverride[];
  /** Resolved patch actually applied (after key → patch mapping). */
  appliedPatch: SimulationResolutionPatch;
  inputHash: string;
  baseCognitionFramePayload: Record<string, unknown>;
  cognitionFramePayload: Record<string, unknown>;
  pressureBreakdownBase: DecisionPressureBreakdown;
  pressureBreakdown: DecisionPressureBreakdown;
  decisionTraceResponse: DecisionTraceResponse | null;
  innerVoiceResponse: CharacterInnerVoiceResponse | null;
  diffFromBase: SimulationDiff;
  summary: SimulationComparisonSummary;
  canonicalStatus: SimulationCanonicalStatus;
  advisoryOnly: true;
  /** Overrides that did not map to the deterministic patch engine (still auditable). */
  unparsedOverrides: SimulationVariableOverride[];
  /**
   * Populated only on fresh `executeSimulationRun` (not after DB round-trip).
   * Enables `compareSimulationRuns` to reuse full deterministic diff without re-resolving.
   */
  retainedFrames?: {
    base: CharacterCognitionFrame;
    alternate: CharacterCognitionFrame;
  };
};
