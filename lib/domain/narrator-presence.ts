import { z } from "zod";

export const NARRATOR_PRESENCE_SCHEMA_VERSION = "1.0.0" as const;

export const NarratorPresenceLevelSchema = z.enum([
  "invisible",
  "subtle",
  "guiding",
  "interpretive",
  "reflective",
  "personal",
  "intimate",
  "first_person",
]);
export type NarratorPresenceLevel = z.infer<typeof NarratorPresenceLevelSchema>;

export const NarratorAuthorityModeSchema = z.enum([
  "archival_inherited",
  "interpretive",
  "witness_bearing",
  "lineage_aware",
  "personal_memory_based",
  "lived_first_person",
]);
export type NarratorAuthorityMode = z.infer<typeof NarratorAuthorityModeSchema>;

export const NarratorKnowledgeModeSchema = z.enum([
  "researched",
  "inherited",
  "reconstructed",
  "remembered",
  "witnessed",
  "lived",
]);
export type NarratorKnowledgeMode = z.infer<typeof NarratorKnowledgeModeSchema>;

export const NarratorCertaintyModeSchema = z.enum(["bounded_certainty", "provisional", "admitted_unknown", "memory_fragment"]);
export type NarratorCertaintyMode = z.infer<typeof NarratorCertaintyModeSchema>;

export const NarratorConvergenceStageNameSchema = z.enum([
  "distant_observer",
  "lineage_aware_guide",
  "emotionally_invested_interpreter",
  "family_near_witness",
  "inherited_memory_carrier",
  "threshold_of_self",
  "first_person_presence",
]);
export type NarratorConvergenceStageName = z.infer<typeof NarratorConvergenceStageNameSchema>;

export const IdentityNearnessBandSchema = z.enum([
  "distant_historical",
  "lineage_adjacent",
  "family_near",
  "self_era_threshold",
  "lived_present",
]);
export type IdentityNearnessBand = z.infer<typeof IdentityNearnessBandSchema>;

export const NarratorIdentityProfileSchema = z.object({
  artifact: z.literal("narrator_identity_profile"),
  schemaVersion: z.literal(NARRATOR_PRESENCE_SCHEMA_VERSION),
  narratorId: z.string().min(1),
  narratorName: z.string().min(1),
  narratorTemporalPosition: z.string().min(1),
  narratorCulturalPosition: z.string().min(1),
  narratorVoiceRoot: z.array(z.string().min(1)).min(1),
  narratorRelationshipToEpic: z.string().min(1),
  narratorRelationshipToLineage: z.string().min(1),
  narratorKnowledgeModes: z.array(NarratorKnowledgeModeSchema).min(1),
  narratorAuthorityModes: z.array(NarratorAuthorityModeSchema).min(1),
  narratorStakeTrajectory: z.array(z.string().min(1)).min(1),
  narratorConvergenceTriggers: z.array(z.string().min(1)).min(1),
  narratorModeTimeline: z.array(z.string().min(1)).min(1),
  validationFlags: z.array(z.string()),
});
export type NarratorIdentityProfile = z.infer<typeof NarratorIdentityProfileSchema>;

export const NarratorModeProfileSchema = z.object({
  modeProfileId: z.string().min(1),
  currentPresenceLevel: NarratorPresenceLevelSchema,
  authorityMode: NarratorAuthorityModeSchema,
  emotionalStakeLevel: z.number().min(0).max(1),
  certaintyMode: NarratorCertaintyModeSchema,
  knowledgeMode: NarratorKnowledgeModeSchema,
  permittedInterventions: z.array(z.string().min(1)).min(1),
  forbiddenInterventions: z.array(z.string().min(1)).min(1),
  proseDistanceEffect: z.string().min(1),
  hookContinuityRole: z.array(z.string().min(1)).min(1),
  validationFlags: z.array(z.string()),
});
export type NarratorModeProfile = z.infer<typeof NarratorModeProfileSchema>;

export const NarratorDistanceProfileSchema = z.object({
  distanceProfileId: z.string().min(1),
  eraId: z.string().min(1),
  identityNearnessBand: IdentityNearnessBandSchema,
  temporalDistanceScore: z.number().min(0).max(1),
  allowedNarratorRange: z.array(NarratorPresenceLevelSchema).min(1),
  disallowedNarratorRange: z.array(NarratorPresenceLevelSchema),
  eraIntegrityGuardrails: z.array(z.string().min(1)).min(1),
});
export type NarratorDistanceProfile = z.infer<typeof NarratorDistanceProfileSchema>;

export const NarratorInterventionRuleSchema = z.object({
  ruleId: z.string().min(1),
  condition: z.string().min(1),
  interventionMode: z.enum(["restrained", "active", "bridge", "first_person_threshold"]),
  requiredBounds: z.array(z.string().min(1)).min(1),
  forbiddenBounds: z.array(z.string().min(1)).min(1),
});
export type NarratorInterventionRule = z.infer<typeof NarratorInterventionRuleSchema>;

export const NarratorVisibilityWindowSchema = z.object({
  windowId: z.string().min(1),
  scope: z.enum(["chapter", "scene"]),
  targetId: z.string().min(1),
  plannedPresenceLevel: NarratorPresenceLevelSchema,
  rationale: z.string().min(1),
  continuityAnchorIntent: z.array(z.string().min(1)).min(1),
});
export type NarratorVisibilityWindow = z.infer<typeof NarratorVisibilityWindowSchema>;

export const NarratorPresencePlanSchema = z.object({
  artifact: z.literal("narrator_presence_plan"),
  schemaVersion: z.literal(NARRATOR_PRESENCE_SCHEMA_VERSION),
  planId: z.string().min(1),
  chapterId: z.string().min(1),
  eraId: z.string().min(1),
  modeProfile: NarratorModeProfileSchema,
  distanceProfile: NarratorDistanceProfileSchema,
  chapterVisibilityWindow: NarratorVisibilityWindowSchema,
  sceneVisibilityWindows: z.array(NarratorVisibilityWindowSchema).min(1),
  interventionRules: z.array(NarratorInterventionRuleSchema).min(1),
  continuityAnchorUse: z.array(z.string().min(1)).min(1),
  validationFlags: z.array(z.string()),
});
export type NarratorPresencePlan = z.infer<typeof NarratorPresencePlanSchema>;

export const ConvergenceTriggerSchema = z.object({
  triggerId: z.string().min(1),
  triggerType: z.enum([
    "approaching_grandfather_line",
    "approaching_father_line",
    "approaching_self_line",
    "direct_memory_threshold",
    "direct_witness_threshold",
    "identity_lineage_recognition_threshold",
  ]),
  triggerStrength: z.number().min(0).max(1),
  chapterWindow: z.string().min(1),
  triggerEvidence: z.array(z.string().min(1)).min(1),
});
export type ConvergenceTrigger = z.infer<typeof ConvergenceTriggerSchema>;

export const VoiceShiftMarkerSchema = z.object({
  markerId: z.string().min(1),
  fromPresenceLevel: NarratorPresenceLevelSchema,
  toPresenceLevel: NarratorPresenceLevelSchema,
  shiftType: z.enum(["cadence", "authority", "distance", "memory", "first_person_threshold"]),
  allowedAbruptness: z.number().min(0).max(1),
  continuityRequirement: z.array(z.string().min(1)).min(1),
});
export type VoiceShiftMarker = z.infer<typeof VoiceShiftMarkerSchema>;

export const ConvergenceStageSchema = z.object({
  stageId: z.string().min(1),
  stageOrder: z.number().int().positive(),
  stageName: NarratorConvergenceStageNameSchema,
  identityNearnessBand: IdentityNearnessBandSchema,
  expectedPresenceFloor: NarratorPresenceLevelSchema,
  expectedPresenceCeiling: NarratorPresenceLevelSchema,
  authorityShift: z.string().min(1),
  emotionalStakeFloor: z.number().min(0).max(1),
  distanceReduction: z.number().min(0).max(1),
});
export type ConvergenceStage = z.infer<typeof ConvergenceStageSchema>;

export const NarratorConvergenceProfileSchema = z.object({
  artifact: z.literal("narrator_convergence_profile"),
  schemaVersion: z.literal(NARRATOR_PRESENCE_SCHEMA_VERSION),
  profileId: z.string().min(1),
  chapterId: z.string().min(1),
  eraId: z.string().min(1),
  currentStage: NarratorConvergenceStageNameSchema,
  currentIdentityNearnessBand: IdentityNearnessBandSchema,
  convergenceProgressScore: z.number().min(0).max(1),
  stages: z.array(ConvergenceStageSchema).min(1),
  activeTriggers: z.array(ConvergenceTriggerSchema).min(1),
  upcomingTriggers: z.array(ConvergenceTriggerSchema),
  voiceShiftMarkers: z.array(VoiceShiftMarkerSchema).min(1),
  firstPersonReadiness: z.object({
    ready: z.boolean(),
    readinessScore: z.number().min(0).max(1),
    blockers: z.array(z.string()),
  }),
  validationFlags: z.array(z.string()),
});
export type NarratorConvergenceProfile = z.infer<typeof NarratorConvergenceProfileSchema>;

export const EraNarrationShiftRuleSchema = z.object({
  ruleId: z.string().min(1),
  fromEraId: z.string().min(1),
  toEraId: z.string().min(1),
  narratorContinuitySignal: z.array(z.string().min(1)).min(1),
  modeThatMustRemain: z.array(z.string().min(1)).min(1),
  allowedToneShift: z.array(z.string().min(1)).min(1),
  prohibitedToneShift: z.array(z.string().min(1)).min(1),
});
export type EraNarrationShiftRule = z.infer<typeof EraNarrationShiftRuleSchema>;

export const DistanceWithoutDislocationRuleSchema = z.object({
  ruleId: z.string().min(1),
  dislocationRiskSignal: z.string().min(1),
  continuityRepairAction: z.array(z.string().min(1)).min(1),
  requiredAnchorIds: z.array(z.string().min(1)).min(1),
});
export type DistanceWithoutDislocationRule = z.infer<typeof DistanceWithoutDislocationRuleSchema>;

export const NarratorEraBridgeProfileSchema = z.object({
  artifact: z.literal("narrator_era_bridge_profile"),
  schemaVersion: z.literal(NARRATOR_PRESENCE_SCHEMA_VERSION),
  profileId: z.string().min(1),
  fromEraId: z.string().min(1),
  toEraId: z.string().min(1),
  reassuranceSignals: z.array(z.string().min(1)).min(1),
  activeNarratorMode: NarratorModeProfileSchema,
  eraNarrationShiftRules: z.array(EraNarrationShiftRuleSchema).min(1),
  distanceWithoutDislocationRules: z.array(DistanceWithoutDislocationRuleSchema).min(1),
  epicQuestionContinuityPlan: z.array(z.string().min(1)).min(1),
  hookContinuityPreservationPlan: z.array(z.string().min(1)).min(1),
  validationFlags: z.array(z.string()),
});
export type NarratorEraBridgeProfile = z.infer<typeof NarratorEraBridgeProfileSchema>;

export const NarratorModeTransitionSchema = z.object({
  artifact: z.literal("narrator_mode_transition"),
  transitionId: z.string().min(1),
  fromChapterId: z.string().min(1),
  toChapterId: z.string().min(1),
  fromPresenceLevel: NarratorPresenceLevelSchema,
  toPresenceLevel: NarratorPresenceLevelSchema,
  requiredTriggerIds: z.array(z.string().min(1)).min(1),
  transitionRationale: z.string().min(1),
  smoothnessScore: z.number().min(0).max(1),
});
export type NarratorModeTransition = z.infer<typeof NarratorModeTransitionSchema>;

export const NarratorHookContinuityAdapterSchema = z.object({
  artifact: z.literal("narrator_hook_continuity_adapter"),
  chapterId: z.string().min(1),
  emotionalAttachmentPreserved: z.boolean(),
  structuralCuriosityPreserved: z.boolean(),
  philosophicalEngagementPreserved: z.boolean(),
  unresolvedContinuityPressurePreserved: z.boolean(),
  anchorContinuityReinforced: z.boolean(),
  narratorHookContinuityContribution: z.number().min(0).max(1),
  bridgeSignals: z.array(z.string().min(1)).min(1),
});
export type NarratorHookContinuityAdapter = z.infer<typeof NarratorHookContinuityAdapterSchema>;

export const NarratorProseConstraintAdapterSchema = z.object({
  artifact: z.literal("narrator_prose_constraint_adapter"),
  chapterId: z.string().min(1),
  narrativeDistanceDirective: z.string().min(1),
  reflectionAllowance: z.number().min(0).max(1),
  certaintyStyleDirective: z.string().min(1),
  cadenceShiftDirective: z.array(z.string().min(1)).min(1),
  dictionShiftDirective: z.array(z.string().min(1)).min(1),
  allowedInterpretiveCommentary: z.array(z.string().min(1)).min(1),
  forbiddenOmniscientOverreach: z.array(z.string().min(1)).min(1),
  narratorCharacterBoundaryRules: z.array(z.string().min(1)).min(1),
});
export type NarratorProseConstraintAdapter = z.infer<typeof NarratorProseConstraintAdapterSchema>;

export const NarratorDownstreamIntegrationMapSchema = z.object({
  artifact: z.literal("narrator_downstream_integration_map"),
  chapterId: z.string().min(1),
  encs: z.array(z.string().min(1)).min(1),
  eegs: z.array(z.string().min(1)).min(1),
  hcel: z.array(z.string().min(1)).min(1),
  narrativePsychology: z.array(z.string().min(1)).min(1),
  chapterComposition: z.array(z.string().min(1)).min(1),
  sequenceArchitecture: z.array(z.string().min(1)).min(1),
  sceneGeneration: z.array(z.string().min(1)).min(1),
  proseConstraints: z.array(z.string().min(1)).min(1),
  literaryDeviceAllowances: z.array(z.string().min(1)).min(1),
  povBoundaryRules: z.array(z.string().min(1)).min(1),
});
export type NarratorDownstreamIntegrationMap = z.infer<typeof NarratorDownstreamIntegrationMapSchema>;

export const NarratorValidationIssueSchema = z.object({
  severity: z.enum(["hard_failure", "soft_warning"]),
  category: z.string().min(1),
  message: z.string().min(1),
  suggestedRepair: z.string().min(1),
});
export type NarratorValidationIssue = z.infer<typeof NarratorValidationIssueSchema>;

export const NarratorPresenceValidationResultSchema = z.object({
  artifact: z.literal("narrator_presence_validation_result"),
  valid: z.boolean(),
  hardFailures: z.array(NarratorValidationIssueSchema),
  softWarnings: z.array(NarratorValidationIssueSchema),
  narratorConvergenceScore: z.number().min(0).max(1),
  suggestedRepairs: z.array(z.string().min(1)).min(1),
});
export type NarratorPresenceValidationResult = z.infer<typeof NarratorPresenceValidationResultSchema>;

export const NarratorCockpitSummarySchema = z.object({
  artifact: z.literal("narrator_cockpit_summary"),
  chapterId: z.string().min(1),
  currentNarratorPresenceLevel: NarratorPresenceLevelSchema,
  narratorAuthorityMode: NarratorAuthorityModeSchema,
  narratorKnowledgeMode: NarratorKnowledgeModeSchema,
  convergenceStage: NarratorConvergenceStageNameSchema,
  upcomingConvergenceTriggers: z.array(z.string().min(1)).min(1),
  narratorHookContinuityContribution: z.number().min(0).max(1),
  narratorCharacterBoundaryWarnings: z.array(z.string()),
  temporalBridgeStatus: z.string().min(1),
  firstPersonReadinessStatus: z.string().min(1),
  voiceShiftRisks: z.array(z.string()),
});
export type NarratorCockpitSummary = z.infer<typeof NarratorCockpitSummarySchema>;

export const CamptiNarratorPresencePackSchema = z.object({
  artifact: z.literal("campti_narrator_presence_pack"),
  schemaVersion: z.literal(NARRATOR_PRESENCE_SCHEMA_VERSION),
  generatedAt: z.string(),
  narratorIdentityProfile: NarratorIdentityProfileSchema,
  chapterPresencePlan: NarratorPresencePlanSchema,
  scenePresencePlans: z.array(NarratorPresencePlanSchema).min(1),
  convergenceProfile: NarratorConvergenceProfileSchema,
  eraBridgeProfiles: z.array(NarratorEraBridgeProfileSchema).min(1),
  modeTransitions: z.array(NarratorModeTransitionSchema).min(1),
  hookContinuityAdapter: NarratorHookContinuityAdapterSchema,
  proseConstraintAdapter: NarratorProseConstraintAdapterSchema,
  downstreamIntegration: NarratorDownstreamIntegrationMapSchema,
  cockpitSummary: NarratorCockpitSummarySchema,
  diagnostics: z.object({
    narratorContinuityStrength: z.number().min(0).max(1),
    risks: z.array(z.string()),
    protections: z.array(z.string().min(1)).min(1),
    deferredItems: z.array(z.string()),
  }),
});
export type CamptiNarratorPresencePack = z.infer<typeof CamptiNarratorPresencePackSchema>;
