import { z } from "zod";

export const CHAPTER_COMPOSITION_SCHEMA_VERSION = "1.0.0" as const;

export const ChapterCompositionModeSchema = z.enum([
  "braided_continuity",
  "signal_clustered",
  "contrast_composition",
  "delayed_convergence",
  "memory_echo",
  "route_braided",
  "relational_spread",
  "layered_pressure",
  "fracture_spread",
  "adaptation_braid",
]);
export type ChapterCompositionMode = z.infer<typeof ChapterCompositionModeSchema>;

export const SceneRoleSchema = z.enum([
  "grounding_scene",
  "route_signal_scene",
  "labor_scene",
  "relational_scene",
  "rumor_scene",
  "warning_scene",
  "memory_echo_scene",
  "setting_presence_scene",
  "philosophy_echo_scene",
  "fracture_scene",
  "convergence_scene",
  "callback_scene",
  "reentry_scene",
  "closure_scene",
  "displacement_prep_scene",
]);
export type SceneRole = z.infer<typeof SceneRoleSchema>;

export const ConnectionLevelSchema = z.enum([
  "apparently_isolated",
  "indirectly_linked",
  "hidden_linked",
  "convergent_later",
]);
export type ConnectionLevel = z.infer<typeof ConnectionLevelSchema>;

export const RouteRequirementStatusSchema = z.object({
  requiredLocationIds: z.array(z.string().min(1)).min(1),
  missingLocationIds: z.array(z.string().min(1)),
  recurrenceSatisfied: z.boolean(),
  enforcementNotes: z.array(z.string()),
});
export type RouteRequirementStatus = z.infer<typeof RouteRequirementStatusSchema>;

export const PhilosophyRequirementStatusSchema = z.object({
  activePhilosophyThreadIds: z.array(z.string().min(1)),
  explicitnessCeiling: z.number().min(0).max(1),
  satisfied: z.boolean(),
  warnings: z.array(z.string()),
});
export type PhilosophyRequirementStatus = z.infer<typeof PhilosophyRequirementStatusSchema>;

export const DelayedConvergenceBindingSchema = z.object({
  delayedConvergenceKey: z.string().min(1),
  hiddenConvergenceBinding: z.array(z.string().min(1)).min(1),
  convergenceWindow: z.string().min(1),
  convergencePayoffTarget: z.string().min(1),
  connectionVisibilityNow: ConnectionLevelSchema,
  connectionVisibilityLater: ConnectionLevelSchema,
});
export type DelayedConvergenceBinding = z.infer<typeof DelayedConvergenceBindingSchema>;

export const CallbackTypeSchema = z.enum([
  "line_memory_fragment",
  "object_signal",
  "warning_pattern",
  "location_reference",
  "relational_gesture",
  "rumor_trade_contact",
  "sensory_marker",
  "route_mention",
]);
export type CallbackType = z.infer<typeof CallbackTypeSchema>;

export const CallbackMarkerSchema = z.object({
  callbackId: z.string().min(1),
  sourceSceneId: z.string().min(1),
  sourceThreadId: z.string().min(1),
  callbackStrength: z.number().min(0).max(1),
  callbackWindow: z.string().min(1),
  callbackType: CallbackTypeSchema,
  laterTargetOptions: z.array(z.string().min(1)).min(1),
});
export type CallbackMarker = z.infer<typeof CallbackMarkerSchema>;

export const ReinterpretationAnchorSchema = z.object({
  reinterpretationAnchorId: z.string().min(1),
  sourceSceneId: z.string().min(1),
  sourceThreadIds: z.array(z.string().min(1)).min(1),
  originalPovId: z.string().min(1),
  alternatePovCandidates: z.array(z.string().min(1)).min(1),
  reinterpretableElements: z.array(z.string().min(1)).min(1),
  likelyMeaningShift: z.string().min(1),
  hiddenInformationDelta: z.string().min(1),
  reentryEligibilityWindow: z.string().min(1),
  validationFlags: z.array(z.string()),
});
export type ReinterpretationAnchor = z.infer<typeof ReinterpretationAnchorSchema>;

export const SceneContrastProfileSchema = z.object({
  tonalContrast: z.number().min(0).max(1),
  pressureContrast: z.number().min(0).max(1),
  threadMixContrast: z.number().min(0).max(1),
  settingContrast: z.number().min(0).max(1),
  notes: z.array(z.string()),
});
export type SceneContrastProfile = z.infer<typeof SceneContrastProfileSchema>;

export const ComposedScenePlanSchema = z.object({
  scenePlanId: z.string().min(1),
  chapterId: z.string().min(1),
  sceneOrder: z.number().int().positive(),
  sceneRole: SceneRoleSchema,
  povCandidateWeights: z.array(z.object({ povId: z.string().min(1), weight: z.number().min(0).max(1) })).min(1),
  dominantThreadIds: z.array(z.string().min(1)),
  secondaryThreadIds: z.array(z.string().min(1)),
  latentThreadIds: z.array(z.string().min(1)),
  settingBindings: z.array(z.string().min(1)),
  routeBindings: z.array(z.string().min(1)),
  philosophyBindings: z.array(z.string().min(1)),
  callbackSeeds: z.array(z.string().min(1)),
  delayedConvergenceKeys: z.array(z.string().min(1)),
  requiredBeatBiases: z.record(z.string(), z.number().min(-1).max(1)),
  requiredStateBiases: z.record(z.string(), z.number().min(-1).max(1)),
  apparentConnectionLevel: ConnectionLevelSchema,
  actualConnectionLevel: ConnectionLevelSchema,
  transitionStrategy: z.string().min(1),
  carryForwardPressureType: z.string().min(1),
  sceneClosureType: z.string().min(1),
  validationFlags: z.array(z.string()),
});
export type ComposedScenePlan = z.infer<typeof ComposedScenePlanSchema>;

export const ChapterClosureProfileSchema = z.enum([
  "active_unresolved",
  "local_settlement_global_unsettlement",
  "recalled_pressure",
  "route_expansion",
  "relational_uncertainty",
  "warning_deepened",
  "convergence_teased",
  "continuity_fragility",
]);
export type ChapterClosureProfile = z.infer<typeof ChapterClosureProfileSchema>;

export const ChapterCompositionDensitySchema = z.object({
  densityScore: z.number().min(0).max(1),
  densityWarnings: z.array(z.string()),
  hardThinChapterFlag: z.boolean(),
});
export type ChapterCompositionDensity = z.infer<typeof ChapterCompositionDensitySchema>;

export const ChapterCompositionPlanSchema = z.object({
  artifact: z.literal("chapter_composition_plan"),
  schemaVersion: z.literal(CHAPTER_COMPOSITION_SCHEMA_VERSION),
  compositionPlanId: z.string().min(1),
  chapterId: z.string().min(1),
  parentBookId: z.string().min(1),
  parentNarrativePsychologyId: z.string().min(1),
  parentChapterStateId: z.string().min(1),
  activeThreadIds: z.array(z.string().min(1)),
  latentThreadIds: z.array(z.string().min(1)),
  callbackThreadIds: z.array(z.string().min(1)),
  routeRequirementStatus: RouteRequirementStatusSchema,
  philosophyRequirementStatus: PhilosophyRequirementStatusSchema,
  compositionMode: ChapterCompositionModeSchema,
  sceneCountTarget: z.number().int().min(2).max(6),
  sceneSequence: z.array(ComposedScenePlanSchema).min(2).max(6),
  sceneContrastProfile: SceneContrastProfileSchema,
  delayedConvergenceBindings: z.array(DelayedConvergenceBindingSchema),
  callbackMarkers: z.array(CallbackMarkerSchema),
  reinterpretationAnchors: z.array(ReinterpretationAnchorSchema),
  densityScore: z.number().min(0).max(1),
  densityWarnings: z.array(z.string()),
  routeCoverageNotes: z.array(z.string()),
  continuityCarryForwardPlan: z.array(z.string().min(1)).min(1),
  unresolvedPressurePlan: z.array(z.string().min(1)).min(1),
  chapterClosureProfile: ChapterClosureProfileSchema,
  validationFlags: z.array(z.string()),
});
export type ChapterCompositionPlan = z.infer<typeof ChapterCompositionPlanSchema>;

export const LocationPresenceModeSchema = z.enum([
  "direct_scene_setting",
  "rumor_report",
  "messenger_trader_origin",
  "trade_goods_origin_destination",
  "kinship_connection",
  "remembered_place",
  "expected_danger",
  "ceremonial_tie",
  "route_linkage",
  "environmental_downstream_upstream_signal",
  "warning_associated_with_place",
]);
export type LocationPresenceMode = z.infer<typeof LocationPresenceModeSchema>;

export const RouteRecurrenceLedgerRowSchema = z.object({
  locationId: z.string().min(1),
  locationName: z.string().min(1),
  currentBookId: z.string().min(1),
  directPresenceCount: z.number().int().nonnegative(),
  indirectPresenceCount: z.number().int().nonnegative(),
  lastAppearanceChapter: z.string().nullable(),
  appearanceModesUsed: z.array(LocationPresenceModeSchema),
  associatedThreads: z.array(z.string().min(1)),
  recurrenceSatisfied: z.boolean(),
  nextRecommendedAppearanceWindow: z.string().min(1),
});
export type RouteRecurrenceLedgerRow = z.infer<typeof RouteRecurrenceLedgerRowSchema>;

export const RouteRecurrenceLedgerSchema = z.object({
  artifact: z.literal("book_route_recurrence_ledger"),
  currentBookId: z.string().min(1),
  rows: z.array(RouteRecurrenceLedgerRowSchema).min(1),
  enforcementWarnings: z.array(z.string()),
});
export type RouteRecurrenceLedger = z.infer<typeof RouteRecurrenceLedgerSchema>;

export const PhilosophyCarrierModeSchema = z.enum([
  "action_pattern",
  "consequence_pattern",
  "warning_pattern",
  "memory_comparison",
  "scene_contrast",
  "place_signal",
  "character_embodiment_variation",
]);
export type PhilosophyCarrierMode = z.infer<typeof PhilosophyCarrierModeSchema>;

export const PhilosophyPropagationPlanSchema = z.object({
  artifact: z.literal("philosophy_propagation_plan"),
  chapterId: z.string().min(1),
  activePhilosophyThreadIds: z.array(z.string().min(1)),
  explicitnessCeiling: z.number().min(0).max(1),
  preferredCarrierModes: z.array(PhilosophyCarrierModeSchema),
  nextEchoOpportunities: z.array(z.string().min(1)),
  sceneLevelPlacementSuggestions: z.array(z.object({ scenePlanId: z.string().min(1), suggestion: z.string().min(1) })),
  delayedPayoffPotential: z.number().min(0).max(1),
});
export type PhilosophyPropagationPlan = z.infer<typeof PhilosophyPropagationPlanSchema>;

export const ChapterCompositionCockpitSummarySchema = z.object({
  chapterId: z.string().min(1),
  compositionMode: ChapterCompositionModeSchema,
  sceneCount: z.number().int().positive(),
  sceneRoleSpread: z.array(SceneRoleSchema),
  dominantThreadFamilies: z.array(z.string().min(1)),
  latentThreadFamilies: z.array(z.string().min(1)),
  delayedConvergenceMarkers: z.array(z.string().min(1)),
  callbackMarkers: z.array(z.string().min(1)),
  reinterpretationAnchorIds: z.array(z.string().min(1)),
  routeCoverageStatus: z.string().min(1),
  philosophyPropagationStatus: z.string().min(1),
  densityScore: z.number().min(0).max(1),
  thinnessWarnings: z.array(z.string()),
  chapterClosureProfile: ChapterClosureProfileSchema,
  carryForwardUnresolvedPressureSummary: z.array(z.string().min(1)),
});
export type ChapterCompositionCockpitSummary = z.infer<typeof ChapterCompositionCockpitSummarySchema>;
