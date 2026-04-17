import { z } from "zod";

/** Machine-usable quality dimensions for prose realism (Cluster 5). */
export const REALISM_QUALITY_DIMENSIONS = [
  "era_truth",
  "cognition_truth",
  "narrator_boundary_integrity",
  "emotional_credibility",
  "sensory_place_embodiment",
  "voice_distinctness",
  "consequence_residue",
  "literary_naturalness",
  "anti_template_variation",
  "anti_system_feel",
] as const;
export type RealismQualityDimension = (typeof REALISM_QUALITY_DIMENSIONS)[number];

export const ProseRealismProfileSchema = z.object({
  artifact: z.literal("prose_realism_profile"),
  contractVersion: z.literal("1"),
  realismId: z.string().min(1),
  sceneId: z.string().min(1),
  chapterId: z.string().min(1).optional(),
  /** Aggregate 0–1 realism score (deterministic blend of dimensions). */
  realismScore: z.number().min(0).max(1),
  eraTruthScore: z.number().min(0).max(1),
  cognitionTruthScore: z.number().min(0).max(1),
  narratorBoundaryScore: z.number().min(0).max(1),
  emotionalCredibilityScore: z.number().min(0).max(1),
  sensoryEmbodimentScore: z.number().min(0).max(1),
  voiceDistinctnessScore: z.number().min(0).max(1),
  consequenceResidueScore: z.number().min(0).max(1),
  literaryNaturalnessScore: z.number().min(0).max(1),
  antiMechanicalScore: z.number().min(0).max(1),
  validationFlags: z.array(z.string()),
  dimensionNotes: z
    .array(
      z.object({
        dimension: z.string(),
        note: z.string(),
      }),
    )
    .optional(),
});
export type ProseRealismProfile = z.infer<typeof ProseRealismProfileSchema>;

export const ProseRealismDriftReportSchema = z.object({
  artifact: z.literal("prose_realism_drift_report"),
  contractVersion: z.literal("1"),
  sceneId: z.string().min(1),
  failureModes: z.array(z.string()),
  warnings: z.array(z.string()),
  hardFailures: z.array(z.string()),
  suggestedCorrections: z.array(z.string()),
  recommendedRefinementTargets: z.array(z.string()),
});
export type ProseRealismDriftReport = z.infer<typeof ProseRealismDriftReportSchema>;

export const ProseRealismLayerArtifactSchema = z.object({
  contractVersion: z.literal("1"),
  clusterTag: z.literal("cluster5_prose_realism"),
  sceneId: z.string().min(1),
  /** Lines appended to the scene-generation user prompt (canonical path). */
  promptInstructionLines: z.array(z.string()),
  /** Pre-generation profile snapshot (before model output). */
  profileSeed: ProseRealismProfileSchema,
});
export type ProseRealismLayerArtifact = z.infer<typeof ProseRealismLayerArtifactSchema>;

/**
 * Realism truth: success is defined only when this object reflects an actual canonical generation pass,
 * not a report-only or advisory-only artifact.
 */
export const RealismTruthResultSchema = z.object({
  contractVersion: z.literal("1"),
  /** Model was invoked on the canonical scene path with the same inputs as the hash. */
  canonicalSceneGenerationObserved: z.literal(true),
  /** Cluster 5 prompt shaping was applied before the model (when enabled on this run). */
  realismLayerAppliedToLivePrompt: z.boolean(),
  /**
   * False when cognition/narrator hard failures fire or anti-mechanical rule marks output template/system-like
   * without enough scene-native variation.
   */
  sceneOutputValidUnderRealismRules: z.boolean(),
  invalidationReasons: z.array(z.string()),
});
export type RealismTruthResult = z.infer<typeof RealismTruthResultSchema>;

export const ProseRealismValidationBundleSchema = z.object({
  artifact: z.literal("prose_realism_validation_bundle"),
  contractVersion: z.literal("1"),
  sceneId: z.string().min(1),
  postValidationProfile: ProseRealismProfileSchema,
  driftReport: ProseRealismDriftReportSchema,
  realismTruth: RealismTruthResultSchema,
});
export type ProseRealismValidationBundle = z.infer<typeof ProseRealismValidationBundleSchema>;
