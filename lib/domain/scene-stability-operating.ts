/**
 * Scene-level stability memory, bounded forecasts, and operating-mode summary (advisory only).
 * Traceable to ledger, preflight, research, simulation, and durable output signals — not launch policy.
 */

export const SCENE_STABILITY_OPERATING_CONTRACT_VERSION = "1" as const;

/** Compact, scene-scoped behavioral memory derived from existing subsystems (no separate DB table in v1). */
export type SceneStabilityMemorySummary = {
  contractVersion: typeof SCENE_STABILITY_OPERATING_CONTRACT_VERSION;
  evaluatedAtIso: string;
  windowRunCount: number;
  riskyLaunchCount: number;
  blockedLaunchCount: number;
  replayAuditCount: number;
  repairOrRevisionCount: number;
  failedGenerationCount: number;
  legacyOrPartialRunCount: number;
  researchBlockingContradictions: number | null;
  simulationBlockedPersons: number | null;
  preflightPrimaryBlockers: number;
  preflightPrimaryRisks: number;
  /** From durable linked outputs: recent length swing between last two snapshots. */
  outputLengthOscillation: boolean;
  /** Opening or ending fingerprint moved between last two linked snapshots. */
  outputOpeningEndingShift: boolean;
  /** Linked outputs repeatedly blocked from saving to scene. */
  repeatedBlockedSaveOutputs: boolean;
  /** Multiple consecutive linked snapshots show material length/fingerprint movement (durable rows only). */
  outputChurnPersistentDrift: boolean;
  /** Material drift transitions among recent consecutive snapshot pairs. */
  linkedOutputMaterialPairCount: number;
  linkedOutputPairsCompared: number;
  /** Honest caveat when any input is partial or missing. */
  completenessNotes: string[];
};

export type SceneStabilityForecastDerivation = "fact" | "heuristic" | "low_confidence";

/** Early warning — advisory, conservative, not causal prediction. */
export type SceneStabilityForecast = {
  code: string;
  label: string;
  description: string;
  derivation: SceneStabilityForecastDerivation;
  /** Why this fired — inspectable bullet points. */
  basis: string[];
};

export type SceneOperatingMode =
  | "stable"
  | "caution"
  | "churn_risk"
  | "blocked_by_truth_pressure"
  | "replay_unlikely_to_help";

export type SceneOperatingModeSummary = {
  mode: SceneOperatingMode;
  headline: string;
  /** Facts/heuristics that justify the mode label (traceability). */
  trace: string[];
  uncertaintyNote: string | null;
};
