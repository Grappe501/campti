/**
 * Phase 7 / Chunk 2 — aggregate reader behavior summary.
 * Contains bounded aggregate metrics only; no reader identity leakage.
 */
export const READER_BEHAVIOR_SUMMARY_CONTRACT_VERSION = "1" as const;

export type ReaderBehaviorSummary = {
  contractVersion: typeof READER_BEHAVIOR_SUMMARY_CONTRACT_VERSION;
  dateKey: string;
  sessionsObserved: number;
  averageSessionDurationSeconds: number;
  dropOffRate: number;
  modeUsage: Record<string, number>;
  interactionsPerSession: number;
  reentryRate: number;
  containsSensitiveInference: false;
};
