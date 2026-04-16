import { z } from "zod";

import { BeatTypeSchema } from "@/lib/domain/beat-assembly";

export const CHAPTER_STATE_SCHEMA_VERSION = "1.0.0" as const;

export const ChapterStateAxisKeySchema = z.enum([
  "environmental_stability",
  "food_security",
  "social_cohesion",
  "external_awareness",
  "memory_continuity",
  "identity_stability",
  "labor_pressure",
  "signal_integrity",
  "decision_pressure",
  "movement_pressure",
  "relational_heat",
  "meaning_load",
]);
export type ChapterStateAxisKey = z.infer<typeof ChapterStateAxisKeySchema>;

export const AxisIntensityBandSchema = z.enum(["low", "moderate", "high"]);
export type AxisIntensityBand = z.infer<typeof AxisIntensityBandSchema>;

export const AxisStateBandSchema = z.enum(["stable", "unstable", "volatile"]);
export type AxisStateBand = z.infer<typeof AxisStateBandSchema>;

export const SignalReadabilityBandSchema = z.enum(["clear", "noisy", "contradictory"]);
export type SignalReadabilityBand = z.infer<typeof SignalReadabilityBandSchema>;

export const AxisDirectionSchema = z.enum(["falling", "flat", "rising"]);
export type AxisDirection = z.infer<typeof AxisDirectionSchema>;

export const ChapterModeSchema = z.enum([
  "continuity_chapter",
  "signal_disturbance_chapter",
  "obligation_strain_chapter",
  "fracture_chapter",
  "adaptation_chapter",
  "crossing_preparation_chapter",
  "movement_chapter",
  "reformation_chapter",
]);
export type ChapterMode = z.infer<typeof ChapterModeSchema>;

export const MeaningIntensitySchema = z.enum(["minimal", "guarded", "elevated", "transition_peak"]);
export type MeaningIntensity = z.infer<typeof MeaningIntensitySchema>;

export const ChapterRiskFlagSchema = z.enum([
  "axis_contradiction_without_basis",
  "beat_profile_state_mismatch",
  "historical_phase_mismatch",
  "premature_movement_spike",
  "meaning_overload_for_routine_chapter",
  "pov_misaligned_with_pressure_load",
]);
export type ChapterRiskFlag = z.infer<typeof ChapterRiskFlagSchema>;

export const ChapterStateAxisValueSchema = z.object({
  score: z.number().min(0).max(100),
  intensityBand: AxisIntensityBandSchema,
  stateBand: AxisStateBandSchema.optional(),
  readabilityBand: SignalReadabilityBandSchema.optional(),
  direction: AxisDirectionSchema,
  rationale: z.string().min(1),
});
export type ChapterStateAxisValue = z.infer<typeof ChapterStateAxisValueSchema>;

export const ChapterStateAxesSchema = z.object({
  environmental_stability: ChapterStateAxisValueSchema,
  food_security: ChapterStateAxisValueSchema,
  social_cohesion: ChapterStateAxisValueSchema,
  external_awareness: ChapterStateAxisValueSchema,
  memory_continuity: ChapterStateAxisValueSchema,
  identity_stability: ChapterStateAxisValueSchema,
  labor_pressure: ChapterStateAxisValueSchema,
  signal_integrity: ChapterStateAxisValueSchema,
  decision_pressure: ChapterStateAxisValueSchema,
  movement_pressure: ChapterStateAxisValueSchema,
  relational_heat: ChapterStateAxisValueSchema,
  meaning_load: ChapterStateAxisValueSchema,
});
export type ChapterStateAxes = z.infer<typeof ChapterStateAxesSchema>;

export const ContinuityThreadSchema = z.object({
  threadId: z.string().min(1),
  label: z.string().min(1),
  strength: z.number().min(0).max(100),
  status: z.enum(["active", "threatened", "suppressed"]),
});
export type ContinuityThread = z.infer<typeof ContinuityThreadSchema>;

export const ChapterVisibilityRulesSchema = z.object({
  keepGlobalCausesOffstage: z.boolean(),
  requireEmbodiedEvidenceBeforeInterpretation: z.boolean(),
  allowedRevealScopes: z.array(z.enum(["household", "kinship", "settlement", "regional_edge"])),
  prohibitedNarrationMoves: z.array(z.string()),
});
export type ChapterVisibilityRules = z.infer<typeof ChapterVisibilityRulesSchema>;

export const ChapterMemoryAccessProfileSchema = z.object({
  recallBias: z.enum(["lineage_memory", "recent_events", "mixed"]),
  memoryComparisonIntensity: z.number().min(0).max(1),
  confidenceInPrecedent: z.number().min(0).max(1),
  allowContradictoryMemories: z.boolean(),
});
export type ChapterMemoryAccessProfile = z.infer<typeof ChapterMemoryAccessProfileSchema>;

export const ChapterDecisionUrgencyProfileSchema = z.object({
  urgencyScore: z.number().min(0).max(1),
  reversibility: z.enum(["high", "medium", "low"]),
  ambiguityCost: z.number().min(0).max(1),
  delayRisk: z.number().min(0).max(1),
});
export type ChapterDecisionUrgencyProfile = z.infer<typeof ChapterDecisionUrgencyProfileSchema>;

export const BeatTransitionBiasSchema = z.object({
  from: BeatTypeSchema,
  to: BeatTypeSchema,
  bias: z.number().min(-1).max(1),
  rationale: z.string().min(1),
});
export type BeatTransitionBias = z.infer<typeof BeatTransitionBiasSchema>;

export const ChapterStateValidationFlagsSchema = z.object({
  passesAll: z.boolean(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  riskFlags: z.array(ChapterRiskFlagSchema),
});
export type ChapterStateValidationFlags = z.infer<typeof ChapterStateValidationFlagsSchema>;

export const ChapterStateSchema = z.object({
  artifact: z.literal("chapter_state_model"),
  schemaVersion: z.literal(CHAPTER_STATE_SCHEMA_VERSION),
  chapterId: z.string().min(1),
  bookId: z.string().min(1),
  sequenceNumber: z.number().int().positive(),
  chapterMode: ChapterModeSchema,
  era: z.string().min(1),
  timePosition: z.string().min(1),
  locationProfile: z.string().min(1),
  seasonPhase: z.string().min(1),
  progressionPhase: z.enum(["phase_a", "phase_b", "phase_c", "phase_d", "phase_e", "phase_f"]),
  povWeightingCandidates: z.array(z.object({ characterId: z.string(), weight: z.number().min(0).max(1), rationale: z.string() })).min(1),
  stateAxes: ChapterStateAxesSchema,
  dominantPressures: z.array(ChapterStateAxisKeySchema).min(1),
  suppressedPressures: z.array(ChapterStateAxisKeySchema),
  activeContinuityThreads: z.array(ContinuityThreadSchema),
  threatenedContinuityThreads: z.array(ContinuityThreadSchema),
  chapterStateSummary: z.string().min(1),
  recommendedBeatWeights: z.record(BeatTypeSchema, z.number().min(0).max(1)),
  beatTransitionBiases: z.array(BeatTransitionBiasSchema),
  allowedMeaningIntensity: MeaningIntensitySchema,
  visibilityRules: ChapterVisibilityRulesSchema,
  memoryAccessProfile: ChapterMemoryAccessProfileSchema,
  decisionUrgencyProfile: ChapterDecisionUrgencyProfileSchema,
  chapterRiskFlags: z.array(ChapterRiskFlagSchema),
  validationFlags: ChapterStateValidationFlagsSchema,
  provenance: z.object({
    sourceBasis: z.array(z.string()).min(1),
    generatedBy: z.string().min(1),
    generatedAt: z.string(),
  }),
});
export type ChapterState = z.infer<typeof ChapterStateSchema>;

export const ChapterBeatProfileRecommendationSchema = z.object({
  artifact: z.literal("chapter_state_beat_profile_recommendation"),
  chapterId: z.string().min(1),
  chapterMode: ChapterModeSchema,
  topWeightedBeatTypes: z.array(z.object({ beatType: BeatTypeSchema, weight: z.number().min(0).max(1) })).min(3),
  deEmphasizedBeatTypes: z.array(z.object({ beatType: BeatTypeSchema, weight: z.number().min(0).max(1) })).min(2),
  transitionBiasNotes: z.array(z.string()).min(1),
  chapterDifferentiationNote: z.string().min(1),
  sharedSystemContinuity: z.array(z.string()).min(1),
});
export type ChapterBeatProfileRecommendation = z.infer<typeof ChapterBeatProfileRecommendationSchema>;

export const ChapterStateSamplePackSchema = z.object({
  artifact: z.literal("book1_chapter_state_sample_pack"),
  schemaVersion: z.literal(CHAPTER_STATE_SCHEMA_VERSION),
  generatedAt: z.string(),
  bookId: z.literal("book1"),
  states: z.array(ChapterStateSchema).length(8),
  beatProfiles: z.array(ChapterBeatProfileRecommendationSchema).length(8),
});
export type ChapterStateSamplePack = z.infer<typeof ChapterStateSamplePackSchema>;
