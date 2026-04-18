import { z } from "zod";

export const HUMAN_GRAVITY_RUNTIME_CONTRACT_VERSION = "1" as const;

/**
 * Cluster 6 — scene/chapter runtime contract for attachment, relational stakes, consequence persistence,
 * and generational burden. Fed into canonical scene generation prompts and post-gen validation.
 *
 * ## HUMAN-GRAVITY TRUTH RULE (normative)
 * A character / relationship / consequence / burden system may **not** be labeled runtime-active unless it
 * **materially changes** canonical scene or chapter **generation behavior** or **canonical runtime validation**
 * outcomes. In this contract, `HumanGravityRuntimeInfluenceTruth` is the only authoritative place for that
 * labeling; per-dimension booleans (`attachmentPromptMaterial`, etc.) must not be read as “full runtime active”
 * on their own.
 *
 * ## NO-RESET RULE (normative)
 * A chapter or scene output is **invalid** if major consequences, threatened bonds, or inherited burdens are
 * modeled in upstream runtime truth but **disappear** from canonical output without **explicit** repair,
 * suppression, or transformation explanation. Enforcement is implemented in `HumanGravityValidationService`
 * (`sceneOutputValidUnderNoResetRules`, continuity flags, optional save block when configured).
 */
export const HumanGravityRuntimeInfluenceTruthSchema = z.object({
  /**
   * Satisfies the **HUMAN-GRAVITY TRUTH RULE** iff true: either CLUSTER6 materially reaches generation
   * (`generationMaterial` in `computeHumanGravityRuntimeInfluenceTruth`) **or** the no-reset gate participates
   * in canonical validity (`noResetValidationParticipatesInCanonicalValidity`).
   */
  humanGravityCanonicalRuntimeActive: z.boolean(),
  /** Attachment-derived lines with substantive weight actually included in CLUSTER6 prompt assembly. */
  attachmentPromptMaterial: z.boolean(),
  relationalStakesPromptMaterial: z.boolean(),
  consequencePersistencePromptMaterial: z.boolean(),
  generationalBurdenPromptMaterial: z.boolean(),
  /** Cluster 5 profile seed uses `humanGravityScore` when this is true. */
  proseRealismSeedInfluencedByHumanGravity: z.boolean(),
  /** When true, no-reset rules may mark output invalid — affects canonical runtime validation outcomes. */
  noResetValidationParticipatesInCanonicalValidity: z.boolean(),
  /** Machine-readable trace of which influence dimensions are active (truth labeling aid). */
  validationFlags: z.array(z.string()),
});
export type HumanGravityRuntimeInfluenceTruth = z.infer<typeof HumanGravityRuntimeInfluenceTruthSchema>;

export const HumanGravityRuntimeProfileSchema = z.object({
  contractVersion: z.literal(HUMAN_GRAVITY_RUNTIME_CONTRACT_VERSION),
  clusterTag: z.literal("cluster6_human_gravity_runtime"),
  chapterId: z.string().min(1),
  sceneId: z.string().min(1),
  chapterSequence: z.number().int().min(1),
  activeCharacterAttachmentIds: z.array(z.string()),
  attachmentWeightMap: z.record(z.string(), z.number().min(0).max(1)),
  activeRelationalStakeIds: z.array(z.string()),
  relationalThreatMap: z.record(z.string(), z.number().min(0).max(1)),
  activeConsequenceMarkers: z.array(z.string().min(1)),
  irreversibilityState: z.string().min(1),
  activeBurdenLines: z.array(z.string().min(1)),
  inheritedWarningLines: z.array(z.string().min(1)),
  repairDifficultySignals: z.array(z.string().min(1)),
  carryForwardResidue: z.array(z.string().min(1)),
  povBiasSummary: z.string().min(1),
  sceneFocusSummary: z.string().min(1),
  closureWeightSummary: z.string().min(1),
  /** Relational stakes foreground (scene-active obligations, shame, dependency). */
  relationalForegroundSummary: z.string().min(1),
  /** Dominant reader-bond modes for weighted characters (attachment governor digest). */
  bondModeSummary: z.string().min(1),
  /** Surface fear/desire/vulnerability ids active for this scene. */
  activeFearDesireVulnerabilityIds: z.array(z.string()),
  validationFlags: z.array(z.string()),
  humanGravityScore: z.number().min(0).max(1),
  runtimeInfluenceTruth: HumanGravityRuntimeInfluenceTruthSchema,
  /** Lines appended to prose-realism / user prompt on the canonical path. */
  promptInstructionLines: z.array(z.string().min(1)),
});
export type HumanGravityRuntimeProfile = z.infer<typeof HumanGravityRuntimeProfileSchema>;

export const HumanGravityDriftReportSchema = z.object({
  sceneId: z.string().min(1),
  weakAttachmentWarnings: z.array(z.string()),
  weakRelationalStakesWarnings: z.array(z.string()),
  consequenceResetWarnings: z.array(z.string()),
  burdenSuppressionWarnings: z.array(z.string()),
  shallowClosureWarnings: z.array(z.string()),
  suggestedHardeningActions: z.array(z.string()),
  humanGravityScore: z.number().min(0).max(1),
  hardWarnings: z.array(z.string()),
  softWarnings: z.array(z.string()),
});
export type HumanGravityDriftReport = z.infer<typeof HumanGravityDriftReportSchema>;

export const HumanGravityTruthResultSchema = z.object({
  /**
   * **NO-RESET RULE**: when `upstreamNoResetPressureActive`, false means modeled consequence / bond / burden
   * pressure vanished from prose without residue or explicit repair, suppression, or transformation accounting.
   */
  sceneOutputValidUnderNoResetRules: z.boolean(),
  /** True when consequence/bond/burden thresholds demand no-reset checks. */
  upstreamNoResetPressureActive: z.boolean(),
  noResetViolations: z.array(z.string()),
});
export type HumanGravityTruthResult = z.infer<typeof HumanGravityTruthResultSchema>;

export const HumanGravityValidationBundleSchema = z.object({
  contractVersion: z.literal("1"),
  clusterTag: z.literal("cluster6_human_gravity_validation"),
  sceneId: z.string().min(1),
  /** Mirrors upstream profile at validation time (runtime truth rule). */
  humanGravityCanonicalRuntimeActive: z.boolean(),
  /** Flattened machine access (duplicates nested truth + drift where noted). */
  sceneOutputValidUnderNoResetRules: z.boolean(),
  upstreamNoResetPressureActive: z.boolean(),
  noResetViolations: z.array(z.string()),
  weakAttachmentWarnings: z.array(z.string()),
  weakRelationalStakesWarnings: z.array(z.string()),
  consequenceResetWarnings: z.array(z.string()),
  burdenSuppressionWarnings: z.array(z.string()),
  suggestedHardeningActions: z.array(z.string()),
  /** Post-validation gravity score (same as driftReport.humanGravityScore). */
  humanGravityScore: z.number().min(0).max(1),
  validationFlags: z.array(z.string()),
  driftReport: HumanGravityDriftReportSchema,
  sceneReadsShallowUnderProfile: z.boolean(),
  humanGravityTruth: HumanGravityTruthResultSchema,
});
export type HumanGravityValidationBundle = z.infer<typeof HumanGravityValidationBundleSchema>;
