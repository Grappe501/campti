/**
 * Phase 7 Expansion / Workstream 2 — bounded anomaly detection.
 */
export const ANOMALY_DETECTION_CONTRACT_VERSION = "1" as const;

export type AnomalySeverity = "info" | "warning" | "critical";

export type OperationalAnomaly = {
  contractVersion: typeof ANOMALY_DETECTION_CONTRACT_VERSION;
  anomalyId: string;
  category:
    | "drop_off_spike"
    | "degraded_rate_spike"
    | "reentry_failure_pattern"
    | "interaction_failure_cluster"
    | "moderation_spike"
    | "story_health_regression"
    | "continuity_mismatch_spike"
    | "recommendation_instability";
  severity: AnomalySeverity;
  metricValue: number;
  baselineValue: number;
  likelyCauseHints: string[];
  operatorExplanation: string;
  explainableRule: string;
  nonOmniscient: true;
};
