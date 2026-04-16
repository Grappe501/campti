import { z } from "zod";

export const ProseGenerationConstraintsSchema = z.object({
  artifact: z.literal("prose_generation_constraints"),
  proseConstraintId: z.string(),
  chapterId: z.string(),
  sceneId: z.string().optional(),
  parentBeatChainId: z.string(),
  parentChapterStateId: z.string(),
  parentNarrativePsychologyId: z.string(),
  povCharacterId: z.string(),
  proseMode: z.string(),
  narrativeDistance: z.enum([
    "close_interior_observational",
    "close_externalized_embodied",
    "selective_reflective",
    "very_limited_interpretive",
  ]),
  cognitionMode: z.array(
    z.enum([
      "native_relational",
      "place_linked",
      "labor_linked",
      "memory_triggered",
      "signal_interpretive",
      "continuity_aware",
    ]),
  ),
  sentencePressureProfile: z.object({
    level: z.enum(["low", "medium", "high"]),
    compressionBias: z.number().min(0).max(1),
  }),
  sensoryDensityProfile: z.object({
    requiredDensity: z.enum(["low", "medium", "high"]),
    requiredChannels: z.array(z.string()).min(1),
  }),
  environmentalGroundingFloor: z.number().min(0).max(1),
  relationalSignalDensity: z.number().min(0).max(1),
  memoryInvocationAllowance: z.number().min(0).max(1),
  expositionAllowance: z.number().min(0).max(1),
  interpretationAllowance: z.number().min(0).max(1),
  ambiguityAllowance: z.number().min(0).max(1),
  revelationAllowance: z.number().min(0).max(1),
  emotionalLabelAllowance: z.number().min(0).max(1),
  meaningReflectionAllowance: z.number().min(0).max(1),
  lineTensionProfile: z.object({
    target: z.enum(["steady", "rising", "cresting"]),
    unresolvedCarryForward: z.number().min(0).max(1),
  }),
  paragraphBreathProfile: z.object({
    averageSentences: z.number().int().positive(),
    allowedLongParagraphRatio: z.number().min(0).max(1),
  }),
  cadenceProfile: z.array(z.string()).min(1),
  dictionGuardrails: z.array(z.string()).min(1),
  syntaxGuardrails: z.array(z.string()).min(1),
  forbiddenPatterns: z.array(z.string()).min(1),
  requiredPatterns: z.array(z.string()).min(1),
  endingMomentumProfile: z.object({
    vector: z.string(),
    carryForwardPressureType: z.string(),
  }),
  literaryDeviceConstraints: z.object({
    activeDeviceIds: z.array(z.string()),
    suppressedDeviceIds: z.array(z.string()),
    soundPatternAllowance: z.enum(["minimal", "bounded"]),
    symbolismAllowance: z.enum(["minimal", "bound_thread_setting_only"]),
    metaphorSimileAllowance: z.enum(["minimal", "guarded"]),
    explicitnessCeiling: z.enum(["implicit", "low", "moderate", "high"]),
    closurePressureStyle: z.enum(["state_pressure_seeded", "callback_seeded"]),
    callbackPhraseAllowance: z.boolean(),
    placeMemoryInsertionOpportunities: z.array(z.string()),
    repetitionAllowance: z.enum(["rare_only", "bounded_patterned"]),
  }),
  continuityEmphasis: z.number().min(0).max(1),
  placeImmersionTarget: z.number().min(0).max(1),
  attachmentTarget: z.number().min(0).max(1),
  driftFlags: z.array(z.string()),
  validationFlags: z.array(z.string()),
});
export type ProseGenerationConstraints = z.infer<typeof ProseGenerationConstraintsSchema>;

export const ProseGenerationValidationIssueSchema = z.object({
  severity: z.enum(["hard", "soft"]),
  category: z.string(),
  message: z.string(),
  segmentIndex: z.number().int().nonnegative().optional(),
  excerpt: z.string().optional(),
  suggestedFix: z.string(),
});
export type ProseGenerationValidationIssue = z.infer<typeof ProseGenerationValidationIssueSchema>;

export const ProseGenerationValidationResultSchema = z.object({
  artifact: z.literal("prose_generation_validation"),
  passed: z.boolean(),
  hardFailureCount: z.number().int().nonnegative(),
  softFailureCount: z.number().int().nonnegative(),
  issues: z.array(ProseGenerationValidationIssueSchema),
  cockpitSummary: z.object({
    compliant: z.boolean(),
    driftWarnings: z.array(z.string()),
  }),
  machineFlags: z.array(z.string()),
});
export type ProseGenerationValidationResult = z.infer<typeof ProseGenerationValidationResultSchema>;

export const ProseGenerationPreflightSchema = z.object({
  artifact: z.literal("prose_generation_preflight"),
  chapterId: z.string(),
  proseMode: z.string(),
  paragraphObjectiveTypes: z.array(z.string()).min(1),
  openingConstraints: z.array(z.string()).min(1),
  middleConstraints: z.array(z.string()).min(1),
  endingVectorTypes: z.array(z.string()).min(1),
  localCarryForwardRules: z.array(z.string()).min(1),
});
export type ProseGenerationPreflight = z.infer<typeof ProseGenerationPreflightSchema>;

export const Chapter1ProseGenerationPacketSchema = z.object({
  artifact: z.literal("book1_chapter1_prose_generation_packet"),
  chapterId: z.string(),
  chapterPsychologyTarget: z.record(z.string(), z.unknown()),
  chapterStateSummary: z.record(z.string(), z.unknown()),
  beatChainSummary: z.record(z.string(), z.unknown()),
  proseConstraints: ProseGenerationConstraintsSchema,
  paragraphRecommendations: z.array(z.string()).min(1),
  validationExpectations: z.array(z.string()).min(1),
  openingEndingVectorRecommendation: z.string(),
});
export type Chapter1ProseGenerationPacket = z.infer<typeof Chapter1ProseGenerationPacketSchema>;

export const ProseGenerationOutputPathReportSchema = z.object({
  artifact: z.literal("prose_generation_output_path_report"),
  chapterId: z.string(),
  appliedConstraints: z.array(z.string()).min(1),
  generatedParagraphs: z.array(z.string()).min(1),
  validation: ProseGenerationValidationResultSchema,
  hardeningNext: z.array(z.string()).min(1),
});
export type ProseGenerationOutputPathReport = z.infer<typeof ProseGenerationOutputPathReportSchema>;
