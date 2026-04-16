import { z } from "zod";

export const EPIC_NARRATIVE_CONTINUITY_SCHEMA_VERSION = "1.0.0" as const;

export const ContinuityExpressionModeSchema = z.enum([
  "direct_expression",
  "indirect_expression",
  "symbolic_expression",
  "relational_expression",
  "setting_expression",
  "historical_expression",
]);
export type ContinuityExpressionMode = z.infer<typeof ContinuityExpressionModeSchema>;

export const ContinuityScaleSchema = z.enum(["epic", "series", "book", "chapter", "scene", "recall_event"]);
export type ContinuityScale = z.infer<typeof ContinuityScaleSchema>;

export const AnchorFamilySchema = z.enum([
  "place_anchor",
  "river_anchor",
  "route_anchor",
  "family_line_anchor",
  "warning_pattern_anchor",
  "symbol_object_anchor",
  "phrase_image_anchor",
  "gesture_ritual_anchor",
  "identity_pattern_anchor",
  "emotional_echo_anchor",
  "historical_wound_anchor",
  "continuity_echo_anchor",
]);
export type AnchorFamily = z.infer<typeof AnchorFamilySchema>;

export const TemporalVariantSchema = z.object({
  eraId: z.string().min(1),
  periodLabel: z.string().min(1),
  transformedAppearance: z.string().min(1),
  transformedFunction: z.string().min(1),
  continuitySignal: z.string().min(1),
});
export type TemporalVariant = z.infer<typeof TemporalVariantSchema>;

export const QuestionExpressionVariantSchema = z.object({
  variantId: z.string().min(1),
  scale: ContinuityScaleSchema,
  eraId: z.string().min(1),
  expressionMode: ContinuityExpressionModeSchema,
  expressionLine: z.string().min(1),
  emotionalSignature: z.array(z.string()).min(1),
  linkedAnchorIds: z.array(z.string()),
});
export type QuestionExpressionVariant = z.infer<typeof QuestionExpressionVariantSchema>;

export const QuestionEscalationStageSchema = z.object({
  stageId: z.string().min(1),
  stageOrder: z.number().int().positive(),
  scale: ContinuityScaleSchema,
  deepeningRule: z.string().min(1),
  stageQuestionForm: z.string().min(1),
  requiredDifferenceFromPrior: z.string().min(1),
  expectedMeaningGain: z.string().min(1),
});
export type QuestionEscalationStage = z.infer<typeof QuestionEscalationStageSchema>;

export const EpicQuestionProfileSchema = z.object({
  artifact: z.literal("epic_question_profile"),
  schemaVersion: z.literal(EPIC_NARRATIVE_CONTINUITY_SCHEMA_VERSION),
  epicId: z.string().min(1),
  centralHumanQuestion: z.string().min(1),
  questionIntent: z.string().min(1),
  subQuestionsByScale: z.object({
    series: z.array(z.string()).min(1),
    book: z.array(z.string()).min(1),
    chapter: z.array(z.string()).min(1),
    scene: z.array(z.string()).min(1),
  }),
  expressionVariants: z.array(QuestionExpressionVariantSchema).min(1),
  escalationStages: z.array(QuestionEscalationStageSchema).min(1),
  antiRepetitionGuards: z.array(z.string()).min(1),
  validationFlags: z.array(z.string()),
});
export type EpicQuestionProfile = z.infer<typeof EpicQuestionProfileSchema>;

export const NarrativeAnchorSchema = z.object({
  anchorId: z.string().min(1),
  anchorName: z.string().min(1),
  anchorFamily: AnchorFamilySchema,
  anchorType: z.string().min(1),
  firstAppearance: z.object({
    bookId: z.string().min(1),
    chapterId: z.string().min(1),
    sceneId: z.string().min(1),
    eraId: z.string().min(1),
  }),
  recurrenceRules: z.array(z.string()).min(1),
  mutationRules: z.array(z.string()).min(1),
  symbolBindings: z.array(z.string()),
  threadBindings: z.array(z.string()),
  settingBindings: z.array(z.string()),
  identityBindings: z.array(z.string()),
  memoryBindings: z.array(z.string()),
  emotionalBindings: z.array(z.string()),
  temporalVariants: z.array(TemporalVariantSchema).min(1),
  laterRecognitionWindows: z.array(z.string()).min(1),
  payoffWindows: z.array(z.string()).min(1),
  validationFlags: z.array(z.string()),
});
export type NarrativeAnchor = z.infer<typeof NarrativeAnchorSchema>;

export const NarrativeAnchorRegistrySchema = z.object({
  artifact: z.literal("narrative_anchor_registry"),
  schemaVersion: z.literal(EPIC_NARRATIVE_CONTINUITY_SCHEMA_VERSION),
  epicId: z.string().min(1),
  anchors: z.array(NarrativeAnchorSchema).min(1),
  activeAnchorFamilies: z.array(AnchorFamilySchema).min(1),
  transformedRecurrenceRules: z.array(z.string()).min(1),
  validationFlags: z.array(z.string()),
});
export type NarrativeAnchorRegistry = z.infer<typeof NarrativeAnchorRegistrySchema>;

export const PersistenceTraitSchema = z.object({
  traitId: z.string().min(1),
  traitLabel: z.string().min(1),
  continuityKind: z.enum([
    "cultural_memory",
    "family_memory",
    "relational_pattern",
    "warning_inheritance",
    "place_attachment",
    "route_familiarity",
    "survival_logic",
    "naming_gesture_ritual_continuity",
    "moral_philosophical_continuity",
  ]),
  retainedStrength: z.number().min(0).max(1),
  distortionRisk: z.number().min(0).max(1),
  evidenceAnchors: z.array(z.string()).min(1),
});
export type PersistenceTrait = z.infer<typeof PersistenceTraitSchema>;

export const FractureEventSchema = z.object({
  fractureEventId: z.string().min(1),
  eraId: z.string().min(1),
  trigger: z.string().min(1),
  fracturedTraitIds: z.array(z.string()).min(1),
  downstreamMisreadRisk: z.string().min(1),
  potentialRecoveryPath: z.string().min(1),
});
export type FractureEvent = z.infer<typeof FractureEventSchema>;

const ContinuityLineSchema = z.object({
  lineId: z.string().min(1),
  traitId: z.string().min(1),
  eraWindows: z.array(z.string()).min(1),
  rationale: z.string().min(1),
});

export const IdentityPersistenceProfileSchema = z.object({
  artifact: z.literal("identity_persistence_profile"),
  schemaVersion: z.literal(EPIC_NARRATIVE_CONTINUITY_SCHEMA_VERSION),
  profileId: z.string().min(1),
  epicId: z.string().min(1),
  identityCore: z.string().min(1),
  persistenceTraits: z.array(PersistenceTraitSchema).min(1),
  fractureEvents: z.array(FractureEventSchema),
  retentionLines: z.array(ContinuityLineSchema).min(1),
  forgottenLines: z.array(ContinuityLineSchema),
  recoveredLines: z.array(ContinuityLineSchema),
  validationFlags: z.array(z.string()),
});
export type IdentityPersistenceProfile = z.infer<typeof IdentityPersistenceProfileSchema>;

export const EscalationStageSchema = z.object({
  stageId: z.string().min(1),
  stageOrder: z.number().int().positive(),
  scale: ContinuityScaleSchema,
  stageFunction: z.string().min(1),
  meaningShift: z.string().min(1),
});
export type EscalationStage = z.infer<typeof EscalationStageSchema>;

export const ReframingEventSchema = z.object({
  reframingEventId: z.string().min(1),
  sourceScale: ContinuityScaleSchema,
  triggerWindow: z.string().min(1),
  fromMeaning: z.string().min(1),
  toMeaning: z.string().min(1),
});
export type ReframingEvent = z.infer<typeof ReframingEventSchema>;

export const DeepeningPatternSchema = z.object({
  patternId: z.string().min(1),
  patternLabel: z.string().min(1),
  sequence: z.array(z.string()).min(2),
  expectedReaderGain: z.string().min(1),
});
export type DeepeningPattern = z.infer<typeof DeepeningPatternSchema>;

export const EscalatingElementSchema = z.object({
  elementId: z.string().min(1),
  elementType: z.enum(["warning", "river", "object", "location", "gesture", "phrase", "identity_pattern"]),
  boundAnchorIds: z.array(z.string()).min(1),
  escalationStages: z.array(EscalationStageSchema).min(1),
  reframingEvents: z.array(ReframingEventSchema),
  deepeningPatterns: z.array(DeepeningPatternSchema).min(1),
});
export type EscalatingElement = z.infer<typeof EscalatingElementSchema>;

export const MeaningEscalationProfileSchema = z.object({
  artifact: z.literal("meaning_escalation_profile"),
  schemaVersion: z.literal(EPIC_NARRATIVE_CONTINUITY_SCHEMA_VERSION),
  profileId: z.string().min(1),
  epicId: z.string().min(1),
  escalatingElements: z.array(EscalatingElementSchema).min(1),
  globalEscalationLaws: z.array(z.string()).min(1),
  validationFlags: z.array(z.string()),
});
export type MeaningEscalationProfile = z.infer<typeof MeaningEscalationProfileSchema>;

export const MemoryTargetSchema = z.object({
  targetId: z.string().min(1),
  targetType: z.enum([
    "phrase_image_memory",
    "object_memory",
    "route_location_memory",
    "relational_memory",
    "warning_memory",
    "symbol_memory",
    "scene_shape_memory",
  ]),
  markingStrategy: z.string().min(1),
  overSignalingGuard: z.string().min(1),
  linkedAnchorIds: z.array(z.string()).min(1),
});
export type MemoryTarget = z.infer<typeof MemoryTargetSchema>;

export const RecallWindowSchema = z.object({
  recallWindowId: z.string().min(1),
  sourceTargetId: z.string().min(1),
  earliestScale: ContinuityScaleSchema,
  latestScale: ContinuityScaleSchema,
  rewardMode: z.enum(["recognition_reward", "reinterpretation_reward", "emotional_reward"]),
  payoffCondition: z.string().min(1),
});
export type RecallWindow = z.infer<typeof RecallWindowSchema>;

export const RecognitionRewardPlanSchema = z.object({
  planId: z.string().min(1),
  targetId: z.string().min(1),
  rewardType: z.string().min(1),
  emotionalOutcome: z.string().min(1),
});
export type RecognitionRewardPlan = z.infer<typeof RecognitionRewardPlanSchema>;

export const ReinterpretationRewardPlanSchema = z.object({
  planId: z.string().min(1),
  targetId: z.string().min(1),
  reinterpretationTrigger: z.string().min(1),
  revisedMeaning: z.string().min(1),
  emotionalCost: z.string().min(1),
});
export type ReinterpretationRewardPlan = z.infer<typeof ReinterpretationRewardPlanSchema>;

export const ReaderMemoryStrategySchema = z.object({
  artifact: z.literal("reader_memory_strategy"),
  schemaVersion: z.literal(EPIC_NARRATIVE_CONTINUITY_SCHEMA_VERSION),
  strategyId: z.string().min(1),
  epicId: z.string().min(1),
  memoryTargets: z.array(MemoryTargetSchema).min(1),
  recognitionRewardPlans: z.array(RecognitionRewardPlanSchema).min(1),
  recallWindows: z.array(RecallWindowSchema).min(1),
  reinterpretationRewardPlans: z.array(ReinterpretationRewardPlanSchema).min(1),
  callbackIntegrationRules: z.array(z.string()).min(1),
  validationFlags: z.array(z.string()),
});
export type ReaderMemoryStrategy = z.infer<typeof ReaderMemoryStrategySchema>;

export const HookLayerSchema = z.object({
  layerId: z.string().min(1),
  layerType: z.enum([
    "line_scene_curiosity",
    "thread_curiosity",
    "character_attachment",
    "structural_connection_curiosity",
    "philosophical_curiosity",
    "epic_question_curiosity",
  ]),
  activationLogic: z.array(z.string()).min(1),
  antiCheapCliffhangerRule: z.string().min(1),
});
export type HookLayer = z.infer<typeof HookLayerSchema>;

export const HookCadencePlanSchema = z.object({
  cadencePlanId: z.string().min(1),
  scale: ContinuityScaleSchema,
  targetDensity: z.number().min(0).max(1),
  carryForwardModes: z.array(z.string()).min(1),
});
export type HookCadencePlan = z.infer<typeof HookCadencePlanSchema>;

export const HookCarryForwardPlanSchema = z.object({
  carryForwardPlanId: z.string().min(1),
  fromScale: ContinuityScaleSchema,
  toScale: ContinuityScaleSchema,
  continuityUnderThreatSignals: z.array(z.string()).min(1),
  anticipatedRevelationSignals: z.array(z.string()).min(1),
});
export type HookCarryForwardPlan = z.infer<typeof HookCarryForwardPlanSchema>;

export const HookContinuityDeclarationSchema = z.object({
  hookContinuityScore: z.number().min(0).max(1),
  emotionalAttachmentDrivers: z.array(z.string()).min(1),
  attachmentContinuitySignals: z.array(z.string()).min(1),
  readerCarryDeclaration: z.object({
    emotionalCarry: z.array(z.string()).min(1),
    understandingQuestion: z.array(z.string()).min(1),
    waitingForResolution: z.array(z.string()).min(1),
    continuityReassuranceSignals: z.array(z.string()).min(1),
  }),
  structuralCuriosityDrivers: z.array(z.string()).min(1),
  philosophicalEngagementDrivers: z.array(z.string()).min(1),
  unresolvedContinuityPressureCarryForward: z.array(z.string()).min(1),
});
export type HookContinuityDeclaration = z.infer<typeof HookContinuityDeclarationSchema>;

export const HookOrchestrationProfileSchema = z.object({
  artifact: z.literal("hook_orchestration_profile"),
  schemaVersion: z.literal(EPIC_NARRATIVE_CONTINUITY_SCHEMA_VERSION),
  profileId: z.string().min(1),
  epicId: z.string().min(1),
  hookLayers: z.array(HookLayerSchema).min(1),
  hookCadencePlan: z.array(HookCadencePlanSchema).min(1),
  hookCarryForwardPlan: z.array(HookCarryForwardPlanSchema).min(1),
  tonalShiftGuardrails: z.array(z.string()).min(1),
  validationFlags: z.array(z.string()),
});
export type HookOrchestrationProfile = z.infer<typeof HookOrchestrationProfileSchema>;

export const TemporalTransitionContinuityProfileSchema = z.object({
  artifact: z.literal("temporal_transition_continuity_profile"),
  schemaVersion: z.literal(EPIC_NARRATIVE_CONTINUITY_SCHEMA_VERSION),
  profileId: z.string().min(1),
  fromEraId: z.string().min(1),
  toEraId: z.string().min(1),
  continuityMustHold: z.array(z.string()).min(1),
  allowedDifferenceZones: z.array(z.string()).min(1),
  bridgeAnchorIds: z.array(z.string()).min(1),
  persistentIdentityTraitIds: z.array(z.string()).min(1),
  persistentEmotionalSignature: z.array(z.string()).min(1),
  persistentQuestionExpressionIds: z.array(z.string()).min(1),
  routePlaceContinuityRules: z.array(z.string()).min(1),
  readerMemoryAntiDislocationPlan: z.array(z.string()).min(1),
  hookContinuityDeclaration: HookContinuityDeclarationSchema,
  validationFlags: z.array(z.string()),
});
export type TemporalTransitionContinuityProfile = z.infer<typeof TemporalTransitionContinuityProfileSchema>;

export const SeriesContinuityPlanSchema = z.object({
  seriesId: z.string().min(1),
  parentEpicId: z.string().min(1),
  seriesQuestionRole: z.string().min(1),
  seriesIdentityRole: z.string().min(1),
  seriesAnchorPlan: z.array(z.string()).min(1),
  seriesMeaningEscalationBand: z.string().min(1),
  seriesEmotionalSignature: z.array(z.string()).min(1),
  seriesTransitionStrategy: z.array(z.string()).min(1),
  seriesHookProfile: z.array(z.string()).min(1),
  validationFlags: z.array(z.string()),
});
export type SeriesContinuityPlan = z.infer<typeof SeriesContinuityPlanSchema>;

export const BookContinuityPlanSchema = z.object({
  bookId: z.string().min(1),
  parentEpicId: z.string().min(1),
  parentSeriesId: z.string().optional(),
  bookRoleInEpic: z.string().min(1),
  bookQuestionExpression: z.string().min(1),
  bookAnchorRequirements: z.array(z.string()).min(1),
  bookIdentityPersistenceGoals: z.array(z.string()).min(1),
  bookMeaningEscalationGoals: z.array(z.string()).min(1),
  bookMemoryRewardPlan: z.array(z.string()).min(1),
  bookHookProfile: z.array(z.string()).min(1),
  hookContinuityDeclaration: HookContinuityDeclarationSchema,
  bookTemporalFeelProfile: z.array(z.string()).min(1),
  bookTransitionInProfile: z.array(z.string()).min(1),
  bookTransitionOutProfile: z.array(z.string()).min(1),
  validationFlags: z.array(z.string()),
});
export type BookContinuityPlan = z.infer<typeof BookContinuityPlanSchema>;

export const EpicNarrativeContinuityProfileSchema = z.object({
  artifact: z.literal("epic_narrative_continuity_profile"),
  schemaVersion: z.literal(EPIC_NARRATIVE_CONTINUITY_SCHEMA_VERSION),
  epicId: z.string().min(1),
  epicTitle: z.string().min(1),
  epicQuestion: z.string().min(1),
  epicQuestionVariants: z.array(z.string()).min(1),
  emotionalNorthStar: z.string().min(1),
  identityCore: z.string().min(1),
  continuityLaws: z.array(z.string()).min(1),
  continuityAnchorIds: z.array(z.string()).min(1),
  activeAnchorFamilies: z.array(AnchorFamilySchema).min(1),
  identityPersistenceProfileId: z.string().min(1),
  meaningEscalationProfileId: z.string().min(1),
  readerMemoryStrategyId: z.string().min(1),
  hookOrchestrationProfileId: z.string().min(1),
  temporalTransitionProfiles: z.array(z.string().min(1)).min(1),
  seriesBookContinuityPlans: z.array(z.string().min(1)).min(1),
  routeContinuityProfile: z.array(z.string()).min(1),
  validationFlags: z.array(z.string()),
});
export type EpicNarrativeContinuityProfile = z.infer<typeof EpicNarrativeContinuityProfileSchema>;

export const EpicContinuityDownstreamBiasSchema = z.object({
  artifact: z.literal("epic_continuity_downstream_bias"),
  chapterId: z.string().min(1),
  narrativePsychologyBias: z.array(z.string()).min(1),
  chapterStateBias: z.array(z.string()).min(1),
  narrativeThreadPriorityBias: z.array(z.string()).min(1),
  chapterCompositionRequirements: z.array(z.string()).min(1),
  sequenceArchitectureBias: z.array(z.string()).min(1),
  routeRecurrenceBias: z.array(z.string()).min(1),
  literaryDeviceAllowanceBias: z.array(z.string()).min(1),
  hookClosureCarryForwardBias: z.array(z.string()).min(1),
});
export type EpicContinuityDownstreamBias = z.infer<typeof EpicContinuityDownstreamBiasSchema>;

export const EpicContinuityCockpitSummarySchema = z.object({
  artifact: z.literal("epic_continuity_cockpit_summary"),
  epicId: z.string().min(1),
  chapterId: z.string().min(1),
  currentQuestionExpression: z.string().min(1),
  activeAnchorIds: z.array(z.string()).min(1),
  anchorRecurrenceHealth: z.number().min(0).max(1),
  identityPersistenceStatus: z.string().min(1),
  meaningEscalationStatus: z.string().min(1),
  readerMemoryTargets: z.array(z.string()).min(1),
  hookLayerStatus: z.array(z.string()).min(1),
  temporalTransitionHealth: z.string().min(1),
  disconnectionWarnings: z.array(z.string()),
  unresolvedEpicContinuityRisks: z.array(z.string()),
});
export type EpicContinuityCockpitSummary = z.infer<typeof EpicContinuityCockpitSummarySchema>;

export const EpicContinuityDiagnosticsSchema = z.object({
  artifact: z.literal("epic_continuity_diagnostics"),
  epicId: z.string().min(1),
  continuityStrengthScore: z.number().min(0).max(1),
  risks: z.array(z.string()),
  protections: z.array(z.string()).min(1),
  unresolvedItems: z.array(z.string()),
});
export type EpicContinuityDiagnostics = z.infer<typeof EpicContinuityDiagnosticsSchema>;

export const CamptiEpicContinuityPackSchema = z.object({
  artifact: z.literal("campti_epic_continuity_pack"),
  schemaVersion: z.literal(EPIC_NARRATIVE_CONTINUITY_SCHEMA_VERSION),
  generatedAt: z.string(),
  epicContinuityProfile: EpicNarrativeContinuityProfileSchema,
  epicQuestionProfile: EpicQuestionProfileSchema,
  seriesContinuityPlans: z.array(SeriesContinuityPlanSchema).min(1),
  bookContinuityPlans: z.array(BookContinuityPlanSchema).min(2),
  anchorRegistry: NarrativeAnchorRegistrySchema,
  identityPersistenceProfile: IdentityPersistenceProfileSchema,
  meaningEscalationProfile: MeaningEscalationProfileSchema,
  readerMemoryStrategy: ReaderMemoryStrategySchema,
  hookOrchestrationProfile: HookOrchestrationProfileSchema,
  temporalTransitionProfiles: z.array(TemporalTransitionContinuityProfileSchema).min(1),
  downstreamBias: EpicContinuityDownstreamBiasSchema,
  cockpitSummary: EpicContinuityCockpitSummarySchema,
  diagnostics: EpicContinuityDiagnosticsSchema,
});
export type CamptiEpicContinuityPack = z.infer<typeof CamptiEpicContinuityPackSchema>;
