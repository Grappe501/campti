import type { CharacterAgeBand } from "@/lib/domain/inner-voice";

/**
 * Phase 5D — Author-facing decision explanation (not reader prose).
 * Advisory until PINNED; simulation branching consumes the same structured shape in Phase 5E.
 */

/** Practical action representation (author-supplied or later AI-inferred). */
export type ActionCandidate = {
  actionId: string;
  label: string;
  actionType: string;
  targetPersonId?: string | null;
  targetObject?: string | null;
  /** 0–100 */
  socialRisk: number;
  /** 0–100 */
  bodilyCost: number;
  /** 0–100 */
  desireReward: number;
  /** 0–100 */
  dutyAlignment: number;
  /** 0–100 */
  tabooSeverity: number;
};

export type ActionConstraint = {
  constraintId: string;
  label: string;
  /** 0–100 */
  severity: number;
  source: "world" | "kin" | "law" | "honor" | "body" | "taboo" | "desire";
};

export type PressureEntry = { label: string; weight: number };

export type DecisionPressureBreakdown = {
  /** Ranked motive pressures (deterministic). */
  motiveActive: PressureEntry[];
  motiveSuppressed: PressureEntry[];
  /** Immediate scene / affect spikes that trip the choice (distinct from chronic fears). */
  triggerPressures: PressureEntry[];
  fearDrivers: PressureEntry[];
  desireDrivers: PressureEntry[];
  embodimentDrivers: PressureEntry[];
  worldStateConstraints: ActionConstraint[];
  selfDeceptionFactors: string[];
};

export type AlternateOutcomeHypothesis = {
  alternateLabel: string;
  whyNotChosen: string;
  whatWouldNeedToChange: string[];
};

export type DecisionTraceRequest = {
  contractVersion: "2";
  characterId: string;
  sceneId: string;
  selectedAction: ActionCandidate;
  alternateAction: ActionCandidate | null;
  cognitionFramePayload: Record<string, unknown>;
  pressureBreakdown: DecisionPressureBreakdown;
  /** Deterministic prose scaffolding (LLM expands, does not replace facts). */
  deterministicScaffolding: {
    summarySkeleton: string;
    alternateCompareSkeleton: string | null;
  };
  worldStateStyleSummary: string;
  ageBand: CharacterAgeBand;
  builtAtIso: string;
};

export type DecisionTraceResponse = {
  selectedAction: string;
  statedMotive: string;
  underlyingMotive: string;
  blockedMotive: string;
  /** What tripped the move (scene-time triggers, not the whole fear stack). */
  triggerPressures: PressureEntry[];
  dominantPressures: PressureEntry[];
  suppressedPressures: PressureEntry[];
  fearDrivers: PressureEntry[];
  desireDrivers: PressureEntry[];
  embodimentDrivers: PressureEntry[];
  worldStateConstraints: ActionConstraint[];
  selfDeceptionFactors: string[];
  contradictionSummary: string;
  whyThisWon: string;
  whatCouldChangeIt: string[];
  confidence: number;
  advisoryOnly: boolean;
};

/**
 * Phase 5E bridge: attach `decisionTrace` + `variableOverrides` on `SimulationRunResult`
 * or store `DecisionTraceResponse` + `DecisionPressureBreakdown` on scenario base snapshot metadata
 * to diff “why” when overrides shift pressure weights (same request, alternate simulation input).
 */
export type DecisionTraceSimulationBridge = {
  traceContractVersion: "2";
  /** Keys that would move the choice if relaxed/tightened (for scenario designers). */
  suggestedVariableKeys: string[];
  /** Same shape as `SimulationVariableOverride` targets where possible. */
  notes: string;
};
