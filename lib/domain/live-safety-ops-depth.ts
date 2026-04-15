/**
 * Phase 7 Expansion / Workstream 6 — live safety/degraded ops depth.
 */
export const LIVE_SAFETY_OPS_DEPTH_CONTRACT_VERSION = "1" as const;

export type LiveSafetyOpsDepthSummary = {
  contractVersion: typeof LIVE_SAFETY_OPS_DEPTH_CONTRACT_VERSION;
  moderationTrend: "stable" | "rising" | "spiking";
  degradedTrend: "stable" | "rising" | "spiking";
  providerFailureClusters: number;
  repeatedModerationBlocks: number;
  degradedUxSurfaceConsistency: "consistent" | "inconsistent";
  severitySummary: "low" | "moderate" | "high";
  operatorActionabilitySignals: string[];
  operatorSafeExplanation: string;
};
