import {
  LIVE_SAFETY_OPS_DEPTH_CONTRACT_VERSION,
  type LiveSafetyOpsDepthSummary,
} from "@/lib/domain/live-safety-ops-depth";

function trendFromRatio(ratio: number): "stable" | "rising" | "spiking" {
  if (ratio >= 2) return "spiking";
  if (ratio >= 1.2) return "rising";
  return "stable";
}

export function summarizeLiveSafetyOpsDepth(input: {
  moderationCountCurrent: number;
  moderationCountBaseline: number;
  degradedCountCurrent: number;
  degradedCountBaseline: number;
  providerFailureClusters: number;
  repeatedModerationBlocks: number;
  degradedUxSurfaceConsistency: LiveSafetyOpsDepthSummary["degradedUxSurfaceConsistency"];
}): LiveSafetyOpsDepthSummary {
  const moderationTrend = trendFromRatio(input.moderationCountCurrent / Math.max(input.moderationCountBaseline, 1));
  const degradedTrend = trendFromRatio(input.degradedCountCurrent / Math.max(input.degradedCountBaseline, 1));

  const operatorActionabilitySignals: string[] = [];
  if (moderationTrend !== "stable") operatorActionabilitySignals.push("review moderation queue pressure");
  if (degradedTrend !== "stable") operatorActionabilitySignals.push("inspect provider fallback policies");
  if (input.providerFailureClusters > 0) operatorActionabilitySignals.push("triage provider failure clusters");
  if (input.degradedUxSurfaceConsistency === "inconsistent") {
    operatorActionabilitySignals.push("align degraded UX behavior across surfaces");
  }

  const high =
    moderationTrend === "spiking" ||
    degradedTrend === "spiking" ||
    input.providerFailureClusters > 2 ||
    input.degradedUxSurfaceConsistency === "inconsistent";
  const moderate = !high && (moderationTrend === "rising" || degradedTrend === "rising");

  return {
    contractVersion: LIVE_SAFETY_OPS_DEPTH_CONTRACT_VERSION,
    moderationTrend,
    degradedTrend,
    providerFailureClusters: input.providerFailureClusters,
    repeatedModerationBlocks: input.repeatedModerationBlocks,
    degradedUxSurfaceConsistency: input.degradedUxSurfaceConsistency,
    severitySummary: high ? "high" : moderate ? "moderate" : "low",
    operatorActionabilitySignals,
    operatorSafeExplanation:
      "Summary is based on trend comparisons and does not expose sensitive moderation case details.",
  };
}
