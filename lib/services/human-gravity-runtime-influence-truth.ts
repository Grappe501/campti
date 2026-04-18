import type { HumanGravityRuntimeInfluenceTruth } from "@/lib/domain/human-gravity-runtime";

/**
 * **HUMAN-GRAVITY TRUTH RULE** — `humanGravityCanonicalRuntimeActive` is true only when at least one of:
 * - **Generation**: substantive CLUSTER6 user prompt lines reach the model **and** at least one EEGS dimension
 *   contributed prompt material; or
 * - **Validation**: the no-reset gate is armed (`noResetValidationParticipatesInCanonicalValidity`), so canonical
 *   validity outcomes can change even if a given run skipped prompt reach (must remain honest in cockpit).
 *
 * Per-dimension `*PromptMaterial` flags are **not** alone sufficient to claim full human-gravity runtime activity.
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

  const validationFlags: string[] = [];
  if (attachmentPromptMaterial) validationFlags.push("cluster6_attachment_prompt_material");
  if (relationalStakesPromptMaterial) validationFlags.push("cluster6_relational_stakes_prompt_material");
  if (consequencePersistencePromptMaterial) validationFlags.push("cluster6_consequence_persistence_prompt_material");
  if (generationalBurdenPromptMaterial) validationFlags.push("cluster6_generational_burden_prompt_material");
  if (promptReachModel) validationFlags.push("cluster6_prompt_block_reaches_model");
  if (proseRealismSeedInfluencedByHumanGravity) validationFlags.push("cluster6_prose_realism_seed_influenced");
  if (noResetValidationParticipatesInCanonicalValidity) validationFlags.push("cluster6_no_reset_gate_tracks");

  return {
    humanGravityCanonicalRuntimeActive,
    attachmentPromptMaterial,
    relationalStakesPromptMaterial,
    consequencePersistencePromptMaterial,
    generationalBurdenPromptMaterial,
    proseRealismSeedInfluencedByHumanGravity,
    noResetValidationParticipatesInCanonicalValidity,
    validationFlags,
  };
}
