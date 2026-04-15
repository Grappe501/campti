/**
 * Phase 7 / Chunk 4 — bounded experimentation model.
 */
export const EXPERIMENT_CONTRACT_VERSION = "1" as const;

export type ExperimentVariant = {
  variantId: string;
  allocationPercent: number;
  parameters: Record<string, string | number | boolean>;
};

export type ExperimentDefinition = {
  contractVersion: typeof EXPERIMENT_CONTRACT_VERSION;
  experimentId: string;
  name: string;
  audienceSegment: "new_readers" | "returning_readers" | "all_readers";
  boundedScope: "ui_copy" | "recommendation_ordering" | "mode_default";
  variants: ExperimentVariant[];
};

export type ExperimentGovernanceVerdict = {
  allowed: boolean;
  violations: string[];
};
