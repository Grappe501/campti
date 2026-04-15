/**
 * Phase 7 / Chunk 6 — live moderation operations summary.
 */
export const MODERATION_OPS_CONTRACT_VERSION = "1" as const;

export type ModerationOpsSummary = {
  contractVersion: typeof MODERATION_OPS_CONTRACT_VERSION;
  windowStartIso: string;
  windowEndIso: string;
  violationsTracked: number;
  escalationsTriggered: number;
  unresolvedEscalations: number;
  degradedFallbackFrequency: number;
  providerFailures: number;
};
