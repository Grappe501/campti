/**
 * Run Diff + Outcome Analytics — structured comparison and scene-level signals.
 * Facts vs heuristics are explicit; incomplete history stays visible.
 */

import type { SceneRunBoundedOutputDiff } from "@/lib/domain/scene-run-output-linkage";
import type { SceneRunHistoryCompleteness, SceneRunLedgerEntry, SceneRunReplayEligibility } from "@/lib/domain/scene-run-ledger";

export const SCENE_RUN_DIFF_ANALYTICS_VERSION = "1" as const;

export type DiffFactKind = "fact" | "heuristic" | "unavailable";

export type DiffConfidence = "low" | "medium" | "high";

export type SceneRunComparisonCompleteness =
  | "full"
  | "partial_comparison"
  | "insufficient_output_linkage"
  | "legacy_run_history";

/** Single field delta with operator-facing clarity. */
export type SceneRunFieldDelta<T = string | number | boolean | null> = {
  field: string;
  before: T;
  after: T;
  changed: boolean;
  kind: DiffFactKind;
  /** Plain-language significance; empty when unchanged or unavailable. */
  significance: string | null;
};

export type SceneRunGovernanceDelta = {
  completeness: SceneRunComparisonCompleteness;
  fields: SceneRunFieldDelta[];
  summaryLines: string[];
};

export type SceneRunPreflightDelta = {
  /** We only have audit-derived preflight proxies unless future snapshots exist. */
  completeness: SceneRunComparisonCompleteness;
  fields: SceneRunFieldDelta[];
  summaryLines: string[];
};

export type SceneRunExecutionDelta = {
  completeness: SceneRunComparisonCompleteness;
  fields: SceneRunFieldDelta[];
  summaryLines: string[];
};

export type SceneRunOutputDelta = {
  completeness: SceneRunComparisonCompleteness;
  fields: SceneRunFieldDelta[];
  summaryLines: string[];
  /** True when both runs have durable `SceneRunGenerationOutput` rows. */
  proseComparisonAvailable: boolean;
  /** Bounded opening/ending/length/entity deltas when linkage exists. */
  boundedComparison: SceneRunBoundedOutputDiff | null;
};

export type SceneRunQualityHeuristic = {
  id: string;
  label: string;
  basis: string;
  strength: DiffConfidence;
  derivedFrom: "heuristic" | "fact";
};

export type SceneRunOutcomeSignals = {
  heuristics: SceneRunQualityHeuristic[];
  /** Factual notes that are not scores. */
  factualNotes: string[];
};

export type SceneRunStructuredDiffSummary = {
  ledgerRunKeyA: string;
  ledgerRunKeyB: string;
  sceneId: string;
  /** High-level one-liner for cards. */
  headline: string;
  governance: SceneRunGovernanceDelta;
  preflight: SceneRunPreflightDelta;
  execution: SceneRunExecutionDelta;
  output: SceneRunOutputDelta;
  replayEligibilityDelta: SceneRunFieldDelta<SceneRunReplayEligibility>[];
  outcomeSignals: SceneRunOutcomeSignals;
  overallCompleteness: SceneRunComparisonCompleteness;
};

export type SceneRunDiffViewModel = {
  contractVersion: typeof SCENE_RUN_DIFF_ANALYTICS_VERSION;
  diff: SceneRunStructuredDiffSummary;
};

export type SceneRunInstabilitySignal = {
  code: string;
  label: string;
  description: string;
  strength: DiffConfidence;
  kind: "fact" | "heuristic";
  /** Count or magnitude when fact-based. */
  metric?: number;
};

export type SceneRunPressureSourceSummary = {
  sourceId: string;
  label: string;
  description: string;
  kind: "heuristic";
  indicativeCount: number;
};

export type SceneRunTrendSummary = {
  recentRunCount: number;
  cleanLaunchShare: number | null;
  riskyLaunchShare: number | null;
  blockedLaunchShare: number | null;
  trendNote: string | null;
};

export type SceneRunAnalyticsSummary = {
  sceneId: string;
  totalRunsInWindow: number;
  allowanceDistribution: { allowed: number; allowed_with_risk: number; blocked: number; unknown: number };
  launchClassDistribution: Record<string, number>;
  launchSourceDistribution: Record<string, number>;
  machineRunCount: number;
  interactiveRunCount: number;
  rehearsalRunCount: number;
  replayAttemptCount: number;
  repairOrRevisionRunCount: number;
  failedGenerationCount: number;
  incompleteRunCount: number;
  averageBlockerCount: number | null;
  averageRiskCount: number | null;
  averageAdvisoryCount: number | null;
  legacyOrPartialRunCount: number;
};

export type SceneRunOutcomeAnalyticsViewModel = {
  contractVersion: typeof SCENE_RUN_DIFF_ANALYTICS_VERSION;
  summary: SceneRunAnalyticsSummary;
  instabilitySignals: SceneRunInstabilitySignal[];
  pressureSources: SceneRunPressureSourceSummary[];
  trend: SceneRunTrendSummary;
  advisoryNotes: string[];
  /** Current scene prose stats — contextual, not per-run. */
  currentGenerationTextStats: {
    present: boolean;
    characterCount: number | null;
    paragraphCount: number | null;
    kind: "fact";
  } | null;
};

export type SceneRunComparisonSelection = {
  preset: "latest_vs_previous" | "latest_machine_vs_latest_interactive" | "manual";
  ledgerRunKeyA: string;
  ledgerRunKeyB: string;
};

export type SceneRunDiffRequest = {
  sceneId: string;
  ledgerRunKeyA: string;
  ledgerRunKeyB: string;
};
