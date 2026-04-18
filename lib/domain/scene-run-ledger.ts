/**
 * Run Ledger + Replay — read models for scene generation execution history.
 * Assembled from `SceneLaunchAuditLog` and honest about gaps (legacy / partial).
 */

import type { SceneLaunchAllowance, SceneLaunchIntent } from "@/lib/domain/scene-launch-guard";
import type { SceneRunOutputLinkageStatus } from "@/lib/domain/scene-run-output-linkage";

export const SCENE_RUN_LEDGER_CONTRACT_VERSION = "1" as const;

/** How complete the historical record is for this row. */
export type SceneRunHistoryCompleteness = "full" | "partial" | "legacy" | "insufficient";

export type SceneRunReplayEligibility =
  | "replay_allowed"
  | "replay_allowed_with_risk"
  | "replay_blocked"
  | "historical_only"
  | "insufficient_history";

export type SceneRunHistoricalGuardSummary = {
  launchAllowance: SceneLaunchAllowance | null;
  confirmationRequired: boolean | null;
  riskAcknowledged: boolean | null;
  blockerCount: number | null;
  riskCount: number | null;
  advisoryCount: number | null;
  freshnessDigestPrefix: string | null;
  inputHashPreview: string | null;
  guardEvaluatedAtIso: string | null;
  intent: SceneLaunchIntent | null;
};

export type SceneRunAuditSummary = {
  startAuditId: string | null;
  endAuditId: string | null;
  eventTypesObserved: string[];
  launchClass: string | null;
  launchSource: string | null;
  policyMode: string | null;
  confirmationMode: string | null;
};

export type SceneRunOutputSummary = {
  generationStarted: boolean;
  generationFinished: boolean;
  generationFailed: boolean;
  /** From completion audit meta when present. */
  cluster7RunId: string | null;
  /** True when a `SceneRunGenerationOutput` row exists for this ledger run. */
  persistedOutputKnown: boolean;
  errorMessagePreview: string | null;
  linkageStatus: SceneRunOutputLinkageStatus;
  outputArtifactId: string | null;
  storedCharacterCount: number | null;
  storedParagraphCount: number | null;
  outputCompleteness: string | null;
  sceneGenerationTextSynced: boolean | null;
  openingFingerprint: string | null;
  endingFingerprint: string | null;
};

export type SceneRunHistoricalPreflightSummary = {
  /** Best-effort from audit only — not a full preflight VM snapshot unless stored in meta (future). */
  headlineNote: string | null;
  hashPreview: string | null;
};

export type SceneRunLedgerEntry = {
  ledgerRunKey: string;
  sceneId: string;
  startedAtIso: string;
  endedAtIso: string | null;
  historyCompleteness: SceneRunHistoryCompleteness;
  historicalGuard: SceneRunHistoricalGuardSummary;
  historicalPreflight: SceneRunHistoricalPreflightSummary;
  audit: SceneRunAuditSummary;
  output: SceneRunOutputSummary;
  replayEligibility: SceneRunReplayEligibility;
  replayNotes: string[];
};

export type SceneRunLedgerSummary = {
  sceneId: string;
  totalEntries: number;
  entriesWithFullHistory: number;
  legacyOrPartialCount: number;
  contractVersion: typeof SCENE_RUN_LEDGER_CONTRACT_VERSION;
};

export type SceneRunLedgerViewModel = {
  summary: SceneRunLedgerSummary;
  entries: SceneRunLedgerEntry[];
};

export type SceneRunReplayFeasibilityNote = {
  code: "current_preflight_blocked" | "current_preflight_risky" | "digest_divergence_expected" | "replay_not_deterministic";
  message: string;
};

export type SceneRunDetailViewModel = {
  entry: SceneRunLedgerEntry;
  /** Current preflight/guard headline for contrast (live). */
  currentPreflightHeadline: string | null;
  currentLaunchAllowance: SceneLaunchAllowance | null;
  currentFreshnessDigestPrefix: string | null;
  feasibilityNotes: SceneRunReplayFeasibilityNote[];
};

/** Flat field list from legacy compare helper — use structured diff for operator UI. */
export type SceneRunFlatDiffSummary = {
  ledgerRunKeyA: string;
  ledgerRunKeyB: string;
  changedFields: string[];
  summaryLine: string;
};

export type SceneRunReplayRequest = {
  sceneId: string;
  sourceLedgerRunKey: string;
  freshnessDigest: string;
  riskAcknowledged: boolean;
};

export type SceneRunReplayPlan = {
  sceneId: string;
  sourceLedgerRunKey: string;
  intent: SceneLaunchIntent;
  /** Replay uses interactive guard + current digest; does not persist generation text by default. */
  saveGenerationText: false;
  launchSource: "run_ledger_replay";
};

export type SceneRunReplayDecision =
  | { proceed: true; plan: SceneRunReplayPlan }
  | { proceed: false; code: string; message: string };

export type SceneRunReplayAuditSummary = {
  requestedAtIso: string;
  outcome: "completed" | "blocked" | "failed" | "denied";
  sourceLedgerRunKey: string;
};
