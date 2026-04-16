import { z } from "zod";

export const NARRATIVE_SEQUENCE_SCHEMA_VERSION = "1.0.0" as const;

export const ChapterFunctionSchema = z.enum([
  "grounding",
  "disturbance",
  "widening",
  "doubling",
  "concealment",
  "relay",
  "fracture",
  "echo",
  "memory_return",
  "reversal",
  "convergence",
  "cost",
  "route_expansion",
  "aftermath",
  "compression",
  "revelation",
]);
export type ChapterFunction = z.infer<typeof ChapterFunctionSchema>;

export const ReaderEnergyRoleSchema = z.enum([
  "pressure_rise",
  "clarity_window",
  "intimacy_deepening",
  "expansion_push",
  "contraction_hold",
  "convergence_acceleration",
  "recovery_breath",
]);
export type ReaderEnergyRole = z.infer<typeof ReaderEnergyRoleSchema>;

export const BookMotionFrameworkSchema = z.object({
  frameworkId: z.string().min(1),
  phaseDefinitions: z.array(
    z.object({
      phaseId: z.string().min(1),
      label: z.string().min(1),
      objective: z.string().min(1),
      pressureTarget: z.number().min(0).max(1),
      clarityTarget: z.number().min(0).max(1),
    }),
  ),
  chapterAssignments: z.array(
    z.object({
      chapterId: z.string().min(1),
      chapterOrder: z.number().int().positive(),
      phaseId: z.string().min(1),
      chapterFunction: ChapterFunctionSchema,
    }),
  ),
  allowedTransitions: z.array(z.string().min(1)),
  forbiddenTransitions: z.array(z.string().min(1)),
  pacingProfile: z.object({
    expansionContractionPattern: z.array(z.enum(["expansion", "contraction", "stabilization"])),
    pressureCurve: z.array(z.number().min(0).max(1)),
    intimacyCurve: z.array(z.number().min(0).max(1)),
    convergenceCurve: z.array(z.number().min(0).max(1)),
  }),
});
export type BookMotionFramework = z.infer<typeof BookMotionFrameworkSchema>;

export const ThreadCadencePlanSchema = z.object({
  threadId: z.string().min(1),
  introWindow: z.array(z.string().min(1)).min(1),
  recurrenceInterval: z.number().int().min(1),
  latentWindows: z.array(z.string().min(1)),
  convergenceWindows: z.array(z.string().min(1)),
  reinterpretationWindows: z.array(z.string().min(1)),
  payoffWindow: z.string().min(1),
  disappearanceAllowance: z.number().int().min(0),
  echoFrequency: z.number().min(0).max(1),
});
export type ThreadCadencePlan = z.infer<typeof ThreadCadencePlanSchema>;

export const RouteCadencePlanSchema = z.object({
  locationId: z.string().min(1),
  requiredPresencePerBook: z.number().int().min(1),
  directPresenceWindows: z.array(z.string().min(1)),
  indirectPresenceWindows: z.array(z.string().min(1)),
  associatedThreads: z.array(z.string().min(1)),
  narrativeRole: z.string().min(1),
  emotionalWeight: z.number().min(0).max(1),
});
export type RouteCadencePlan = z.infer<typeof RouteCadencePlanSchema>;

export const PhilosophyCadencePlanSchema = z.object({
  philosophyThreadId: z.string().min(1),
  recurrenceWindows: z.array(z.string().min(1)).min(1),
  carrierModes: z.array(z.string().min(1)).min(1),
  deepeningRule: z.string().min(1),
  explicitnessCeiling: z.number().min(0).max(1),
});
export type PhilosophyCadencePlan = z.infer<typeof PhilosophyCadencePlanSchema>;

export const SceneOrderRulesSchema = z.object({
  allowedTransitions: z.array(z.string().min(1)),
  contrastRules: z.array(z.string().min(1)),
  escalationRules: z.array(z.string().min(1)),
  interruptionRules: z.array(z.string().min(1)),
  echoPlacementRules: z.array(z.string().min(1)),
});
export type SceneOrderRules = z.infer<typeof SceneOrderRulesSchema>;

export const RecallReframingPlanSchema = z.object({
  eventId: z.string().min(1),
  originalChapter: z.string().min(1),
  recallWindow: z.array(z.string().min(1)).min(1),
  reinterpretationWindow: z.array(z.string().min(1)).min(1),
  povShiftOptions: z.array(z.string().min(1)).min(1),
  meaningShiftRules: z.array(z.string().min(1)).min(1),
  memoryDistortionAllowance: z.number().min(0).max(1),
});
export type RecallReframingPlan = z.infer<typeof RecallReframingPlanSchema>;

export const EpicSequencePlanSchema = z.object({
  artifact: z.literal("epic_sequence_plan"),
  schemaVersion: z.literal(NARRATIVE_SEQUENCE_SCHEMA_VERSION),
  epicId: z.string().min(1),
  emotionalNorthStar: z.string().min(1),
  longArcPhases: z.array(z.string().min(1)).min(1),
  continuityThemes: z.array(z.string().min(1)).min(1),
  identityPressureTrajectory: z.array(z.number().min(0).max(1)).min(1),
  routeExpansionTrajectory: z.array(z.number().min(0).max(1)).min(1),
  generationalPatternRules: z.array(z.string().min(1)).min(1),
  convergenceStrategy: z.string().min(1),
  finalTransformationLogic: z.string().min(1),
});
export type EpicSequencePlan = z.infer<typeof EpicSequencePlanSchema>;

export const BookSequencePlanSchema = z.object({
  artifact: z.literal("book_sequence_plan"),
  schemaVersion: z.literal(NARRATIVE_SEQUENCE_SCHEMA_VERSION),
  bookId: z.string().min(1),
  parentEpicId: z.string().min(1),
  motionFramework: BookMotionFrameworkSchema,
  chapterFunctionSequence: z.array(
    z.object({
      chapterId: z.string().min(1),
      chapterOrder: z.number().int().positive(),
      dominantFunction: ChapterFunctionSchema,
      secondaryFunctions: z.array(ChapterFunctionSchema).max(3),
    }),
  ),
  threadCadencePlans: z.array(ThreadCadencePlanSchema),
  routeCadencePlan: z.array(RouteCadencePlanSchema),
  philosophyCadencePlan: z.array(PhilosophyCadencePlanSchema),
  expansionContractionPattern: z.array(z.enum(["expansion", "contraction", "stabilization"])),
  fracturePoints: z.array(z.string().min(1)),
  convergenceWindows: z.array(z.string().min(1)),
  recallWindows: z.array(z.string().min(1)),
  endingCarryForwardProfile: z.array(z.string().min(1)).min(1),
});
export type BookSequencePlan = z.infer<typeof BookSequencePlanSchema>;

export const ChapterSequencePlanSchema = z.object({
  artifact: z.literal("chapter_sequence_plan"),
  schemaVersion: z.literal(NARRATIVE_SEQUENCE_SCHEMA_VERSION),
  chapterId: z.string().min(1),
  dominantFunction: ChapterFunctionSchema,
  secondaryFunctions: z.array(ChapterFunctionSchema).max(3),
  readerEnergyRole: ReaderEnergyRoleSchema,
  threadRole: z.string().min(1),
  routeRole: z.string().min(1),
  philosophyRole: z.string().min(1),
  recallRole: z.string().min(1),
  convergenceRole: z.string().min(1),
  closureRole: z.string().min(1),
  nextChapterSetup: z.array(z.string().min(1)),
  delayBindings: z.array(z.string().min(1)),
  validationFlags: z.array(z.string()),
});
export type ChapterSequencePlan = z.infer<typeof ChapterSequencePlanSchema>;

export const SequenceValidationReportSchema = z.object({
  artifact: z.literal("sequence_validation_report"),
  schemaVersion: z.literal(NARRATIVE_SEQUENCE_SCHEMA_VERSION),
  sequenceScore: z.number().min(0).max(1),
  sequenceWarnings: z.array(z.string()),
  structuralWeaknessFlags: z.array(
    z.enum([
      "repeated_function_cluster",
      "thread_overexposure",
      "missing_route_presence",
      "no_delayed_convergence",
      "no_recall_events",
      "flat_reader_energy",
      "flat_expansion_contraction",
      "over_linear_structure",
    ]),
  ),
});
export type SequenceValidationReport = z.infer<typeof SequenceValidationReportSchema>;

