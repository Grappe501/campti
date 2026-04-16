import { z } from "zod";

export const NarrativePsychologyAxisSchema = z.enum([
  "attachment_intensity",
  "curiosity_tension",
  "continuity_investment",
  "identity_pressure",
  "place_immersion",
  "relational_heat",
  "interpretive_instability",
  "anticipatory_dread",
  "recovery_breathing_room",
  "revelation_pressure",
  "unresolved_pull",
  "meaning_depth",
]);
export type NarrativePsychologyAxis = z.infer<typeof NarrativePsychologyAxisSchema>;

const AxisMapSchema = z.record(NarrativePsychologyAxisSchema, z.number().min(0).max(1));
export type AxisMap = z.infer<typeof AxisMapSchema>;

export const NarrativePullProfileSchema = z.object({
  artifact: z.literal("narrative_pull_profile"),
  chapterId: z.string(),
  pullScore: z.number().min(0).max(1),
  drivers: z.array(z.string()).min(1),
  unresolvedPressureVectors: z.array(z.string()).min(1),
  carryForwardTensionMarkers: z.array(z.string()).min(1),
  antiCheapCliffhangerGuard: z.string().min(1),
});
export type NarrativePullProfile = z.infer<typeof NarrativePullProfileSchema>;

export const EpicNarrativePsychologySchema = z.object({
  artifact: z.literal("epic_narrative_psychology"),
  epicId: z.string(),
  emotionalNorthStar: z.string(),
  epicEmotionalSpine: z.string(),
  epicContinuityThemes: z.array(z.string()).min(1),
  epicIdentityStakes: z.array(z.string()).min(1),
  primaryReaderBondModes: z.array(z.string()).min(1),
  longArcTensionModes: z.array(z.string()).min(1),
  continuityThreatModes: z.array(z.string()).min(1),
  mysteryLoadProfile: z.array(z.string()).min(1),
  revelationCadence: z.array(z.string()).min(1),
  placeAttachmentStrategy: z.string(),
  identityAttachmentStrategy: z.string(),
  memoryInvestmentStrategy: z.string(),
  immersionProfile: z.array(z.string()).min(1),
  pressureSignature: z.array(z.string()).min(1),
  recoveryRebuildingLogic: z.array(z.string()).min(1),
  readerExperienceGoals: z.array(z.string()).min(1),
  psychologicalRiskFlags: z.array(z.string()),
  axisTargets: AxisMapSchema,
});
export type EpicNarrativePsychology = z.infer<typeof EpicNarrativePsychologySchema>;

export const BookNarrativePsychologySchema = z.object({
  artifact: z.literal("book_narrative_psychology"),
  bookId: z.string(),
  parentEpicId: z.string(),
  emotionalArcProfile: z.string(),
  phaseEmotionBands: z.array(z.object({ phase: z.string(), dominantModes: z.array(z.string()).min(1) })).min(1),
  attachmentGoals: z.array(z.string()).min(1),
  placeImmersionGoals: z.array(z.string()).min(1),
  characterBondGoals: z.array(z.string()).min(1),
  unresolvedPressureDesign: z.array(z.string()).min(1),
  payoffDelayDesign: z.array(z.string()).min(1),
  revelationWindows: z.array(z.string()).min(1),
  uncertaintyStrategy: z.array(z.string()).min(1),
  continuityStakes: z.array(z.string()).min(1),
  endingCarryForwardProfile: z.array(z.string()).min(1),
  axisTargets: AxisMapSchema,
});
export type BookNarrativePsychology = z.infer<typeof BookNarrativePsychologySchema>;

export const ChapterNarrativePsychologySchema = z.object({
  artifact: z.literal("chapter_narrative_psychology"),
  chapterId: z.string(),
  parentBookId: z.string(),
  sequence: z.number().int().positive(),
  chapterPsychologyMode: z.enum([
    "rooted_continuity",
    "signal_disturbance",
    "relational_thickening",
    "obligation_strain",
    "interpretive_instability",
    "continuity_threat",
    "movement_thinkable",
    "adaptation_pressure",
    "crossing",
    "reformation",
  ]),
  chapterEmotionalObjective: z.string(),
  feltTexture: z.array(z.string()).min(1),
  readerBondGoal: z.array(z.string()).min(1),
  uncertaintyLoad: z.array(z.string()).min(1),
  continuityPressure: z.array(z.string()).min(1),
  immersionDensity: z.string(),
  revelationAllowance: z.enum(["minimal", "guarded", "moderate", "elevated"]),
  emotionalRecoveryBalance: z.string(),
  endingVector: z.string(),
  chapterCarryForwardHookType: z.string(),
  chapterPsychologyConstraints: z.array(z.string()).min(1),
  axisTargets: AxisMapSchema,
  pullProfile: NarrativePullProfileSchema,
});
export type ChapterNarrativePsychology = z.infer<typeof ChapterNarrativePsychologySchema>;

export const NarrativePsychologyArchitectureSchema = z.object({
  artifact: z.literal("narrative_psychology_architecture"),
  schemaVersion: z.literal("1.0.0"),
  generatedAt: z.string(),
  epic: EpicNarrativePsychologySchema,
  book: BookNarrativePsychologySchema,
  chapters: z.array(ChapterNarrativePsychologySchema).min(8),
  axisScaleBehavior: z.record(
    NarrativePsychologyAxisSchema,
    z.object({
      epicBehavior: z.string(),
      bookBehavior: z.string(),
      chapterBehavior: z.string(),
    }),
  ),
});
export type NarrativePsychologyArchitecture = z.infer<typeof NarrativePsychologyArchitectureSchema>;

export const NarrativePsychologyChapterStateBiasSchema = z.object({
  artifact: z.literal("narrative_psychology_chapter_state_bias"),
  chapterId: z.string(),
  chapterStateId: z.string(),
  parentNarrativePsychologyId: z.string(),
  axisBias: AxisMapSchema,
  chapterStateBiasRules: z.array(z.string()).min(1),
  endingBiasRecommendations: z.array(z.string()).min(1),
  driftWarnings: z.array(z.string()),
});
export type NarrativePsychologyChapterStateBias = z.infer<typeof NarrativePsychologyChapterStateBiasSchema>;

export const NarrativePsychologyBeatBiasSchema = z.object({
  artifact: z.literal("narrative_psychology_beat_bias"),
  chapterId: z.string(),
  beatWeightBias: z.record(z.string(), z.number().min(-1).max(1)),
  emphasisNotes: z.array(z.string()).min(1),
  historicalIntegrityGuards: z.array(z.string()).min(1),
});
export type NarrativePsychologyBeatBias = z.infer<typeof NarrativePsychologyBeatBiasSchema>;
