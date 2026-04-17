import type { HumanGravityRuntimeInfluenceTruth } from "@/lib/domain/human-gravity-runtime";

/**
 * Computes honest runtime-active labeling for human gravity (Cluster 6 truth rule).
 * A dimension is prompt-material only if its derived strings are included in the CLUSTER6 block with substance.
 */
export function computeHumanGravityRuntimeInfluenceTruth(input: {
  promptInstructionLines: string[];
  humanGravityScore: number;
  attachment: {
    povBiasSummary: string;
    activeFearDesireVulnerabilityIds: string[];
  };
  relational: {
    foregroundSummary: string;
    relationalThreatMap: Record<string, number>;
  };
  consequence: { activeConsequenceMarkers: string[] };
  burden: { activeBurdenLines: string[]; inheritedWarningLines: string[] };
}): HumanGravityRuntimeInfluenceTruth {
  const substantiveLines = input.promptInstructionLines.filter(
    (l) =>
      l.trim().length > 0 &&
      !l.trim().startsWith("CLUSTER6_HUMAN_GRAVITY") &&
      !l.startsWith("— Prefer implication"),
  );
  const promptReachModel = substantiveLines.length >= 3;

  const attachmentPromptMaterial =
    input.attachment.povBiasSummary.length >= 28 || input.attachment.activeFearDesireVulnerabilityIds.length >= 1;

  const relationalStakesPromptMaterial =
    input.relational.foregroundSummary.length >= 36 || Object.keys(input.relational.relationalThreatMap).length > 0;

  const consequencePersistencePromptMaterial =
    input.consequence.activeConsequenceMarkers.length >= 1 &&
    !input.consequence.activeConsequenceMarkers.every((m) => /^\s*none\b/i.test(m));

  const generationalBurdenPromptMaterial =
    input.burden.activeBurdenLines.length >= 1 || input.burden.inheritedWarningLines.length >= 1;

  const maxRel = Math.max(0, ...Object.values(input.relational.relationalThreatMap));
  const noResetValidationParticipatesInCanonicalValidity =
    input.consequence.activeConsequenceMarkers.length >= 2 ||
    (maxRel >= 0.6 && Object.keys(input.relational.relationalThreatMap).length > 0) ||
    generationalBurdenPromptMaterial;

  const subsystemMaterial =
    attachmentPromptMaterial ||
    relationalStakesPromptMaterial ||
    consequencePersistencePromptMaterial ||
    generationalBurdenPromptMaterial;

  const generationMaterial = promptReachModel && subsystemMaterial;

  const proseRealismSeedInfluencedByHumanGravity =
    generationMaterial && input.humanGravityScore > 0.01;

  const humanGravityCanonicalRuntimeActive = generationMaterial || noResetValidationParticipatesInCanonicalValidity;

  return {
    humanGravityCanonicalRuntimeActive,
    attachmentPromptMaterial,
    relationalStakesPromptMaterial,
    consequencePersistencePromptMaterial,
    generationalBurdenPromptMaterial,
    proseRealismSeedInfluencedByHumanGravity,
    noResetValidationParticipatesInCanonicalValidity,
  };
}
