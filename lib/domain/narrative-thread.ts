import { z } from "zod";

import { BeatTypeSchema } from "@/lib/domain/beat-assembly";
import { ChapterStateAxisKeySchema } from "@/lib/domain/chapter-state";

export const NARRATIVE_THREAD_SCHEMA_VERSION = "1.0.0" as const;

export const NarrativeThreadTypeSchema = z.enum([
  "primary_plot_thread",
  "secondary_plot_thread",
  "character_arc_thread",
  "relational_thread",
  "memory_thread",
  "continuity_thread",
  "philosophy_thread",
  "warning_thread",
  "belief_worldview_thread",
  "setting_thread",
  "route_thread",
  "rumor_signal_thread",
  "trade_contact_thread",
  "hidden_history_thread",
  "identity_thread",
  "place_attachment_thread",
  "movement_thread",
  "mystery_thread",
  "revelation_thread",
  "convergence_thread",
]);
export type NarrativeThreadType = z.infer<typeof NarrativeThreadTypeSchema>;

export const NarrativeThreadScaleLevelSchema = z.enum([
  "scene_scale",
  "chapter_scale",
  "book_scale",
  "epic_scale",
  "cross_book_scale",
]);
export type NarrativeThreadScaleLevel = z.infer<typeof NarrativeThreadScaleLevelSchema>;

export const NarrativeThreadStateSchema = z.enum([
  "seeded",
  "active",
  "latent",
  "suppressed",
  "redirected",
  "converging",
  "diverging",
  "recalled",
  "reinterpreted",
  "resolved",
  "transformed",
]);
export type NarrativeThreadState = z.infer<typeof NarrativeThreadStateSchema>;

export const NarrativeThreadVisibilitySchema = z.enum([
  "pov_local",
  "reader_visible",
  "reader_partial",
  "offstage_inferred",
  "hidden",
]);
export type NarrativeThreadVisibility = z.infer<typeof NarrativeThreadVisibilitySchema>;

export const NarrativeThreadContinuityRoleSchema = z.enum([
  "stabilizer",
  "destabilizer",
  "bridge",
  "mask",
  "carrier",
  "callback_anchor",
  "convergence_spine",
]);
export type NarrativeThreadContinuityRole = z.infer<typeof NarrativeThreadContinuityRoleSchema>;

export const NarrativeThreadBindingSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  weight: z.number().min(0).max(1),
});
export type NarrativeThreadBinding = z.infer<typeof NarrativeThreadBindingSchema>;

export const ThreadRuleSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  condition: z.string().min(1),
  effect: z.string().min(1),
});
export type ThreadRule = z.infer<typeof ThreadRuleSchema>;

export const ThreadNodeSchema = z.object({
  threadNodeId: z.string().min(1),
  parentThreadId: z.string().min(1),
  chapterId: z.string().min(1),
  sceneId: z.string().min(1),
  nodeType: z.enum(["seed", "advance", "suppression", "echo", "distortion", "callback", "reentry", "payoff", "reinterpretation"]),
  nodeFunction: z.string().min(1),
  visibleToPov: z.array(z.string()),
  visibleToReader: NarrativeThreadVisibilitySchema,
  interpretiveClarity: z.number().min(0).max(1),
  callbackMarker: z.string().optional(),
  futureLinkHints: z.array(z.string()),
  hiddenConvergenceKey: z.string().optional(),
  delayedConvergenceBinding: z.array(z.string()),
  tensionShift: z.number().min(-1).max(1),
  meaningShift: z.number().min(-1).max(1),
  stateShift: z.object({
    from: NarrativeThreadStateSchema,
    to: NarrativeThreadStateSchema,
  }),
  locationAnchor: z.string().optional(),
  characterAnchor: z.array(z.string()),
  beatBindings: z.array(BeatTypeSchema),
  laterReentryTargets: z.array(
    z.object({
      chapterId: z.string().min(1),
      sceneId: z.string().min(1),
      rationale: z.string().min(1),
    }),
  ),
});
export type ThreadNode = z.infer<typeof ThreadNodeSchema>;

export const NarrativeThreadSchema = z.object({
  artifact: z.literal("narrative_thread"),
  schemaVersion: z.literal(NARRATIVE_THREAD_SCHEMA_VERSION),
  threadId: z.string().min(1),
  threadName: z.string().min(1),
  threadType: NarrativeThreadTypeSchema,
  scaleLevel: NarrativeThreadScaleLevelSchema,
  originScope: z.enum(["scene", "chapter", "book", "epic"]),
  originBookId: z.string().min(1),
  originChapterId: z.string().min(1),
  originSceneId: z.string().min(1),
  currentStatus: NarrativeThreadStateSchema,
  currentVisibility: NarrativeThreadVisibilitySchema,
  currentTensionLevel: z.number().min(0).max(1),
  currentMeaningLoad: z.number().min(0).max(1),
  continuityRole: NarrativeThreadContinuityRoleSchema,
  activeCarriers: z.array(z.string().min(1)),
  hiddenFrom: z.array(z.string().min(1)),
  knownBy: z.array(z.string().min(1)),
  locationBindings: z.array(NarrativeThreadBindingSchema),
  philosophyBindings: z.array(NarrativeThreadBindingSchema),
  relationshipBindings: z.array(NarrativeThreadBindingSchema),
  callbackPotential: z.number().min(0).max(1),
  reinterpretationPotential: z.number().min(0).max(1),
  convergencePotential: z.number().min(0).max(1),
  divergencePotential: z.number().min(0).max(1),
  activationConditions: z.array(z.string().min(1)),
  suppressionConditions: z.array(z.string().min(1)),
  escalationRules: z.array(ThreadRuleSchema),
  callbackRules: z.array(ThreadRuleSchema),
  reentryRules: z.array(ThreadRuleSchema),
  resolutionRules: z.array(ThreadRuleSchema),
  handoffRules: z.array(ThreadRuleSchema),
  memoryTraceStrength: z.number().min(0).max(1),
  payoffDelayProfile: z.object({
    earliestChapterOffset: z.number().int().min(0),
    expectedWindow: z.enum(["same_chapter", "next_chapter", "mid_book", "book_end", "next_book"]),
    canCrossBook: z.boolean(),
  }),
  validationFlags: z.array(z.string()),
  nodes: z.array(ThreadNodeSchema),
  provenance: z.object({
    sourceBasis: z.array(z.string()).min(1),
    generatedBy: z.string().min(1),
    generatedAt: z.string(),
  }),
});
export type NarrativeThread = z.infer<typeof NarrativeThreadSchema>;

export const SceneThreadBindingSchema = z.object({
  sceneId: z.string().min(1),
  sceneLabel: z.string().min(1),
  locationId: z.string().min(1),
  activeThreadIds: z.array(z.string()),
  latentThreadIds: z.array(z.string()),
  callbackThreadIds: z.array(z.string()),
  distortedThreadIds: z.array(z.string()),
  seededThreadIds: z.array(z.string()),
  echoNodeIds: z.array(z.string()),
  hiddenConvergenceKeys: z.array(z.string()),
  delayedConvergenceBindings: z.array(z.string()),
  transitionToNextScene: z.string().min(1),
});
export type SceneThreadBinding = z.infer<typeof SceneThreadBindingSchema>;

export const ChapterCompositionSchema = z.object({
  artifact: z.literal("chapter_composition"),
  chapterId: z.string().min(1),
  chapterStateId: z.string().min(1),
  sceneSequence: z.array(SceneThreadBindingSchema).min(1),
  dominantThreads: z.array(z.string()),
  latentThreads: z.array(z.string()),
  callbackThreads: z.array(z.string()),
  convergingThreads: z.array(z.string()),
  sceneTransitions: z.array(z.string()),
  sceneContrastLogic: z.array(z.string()),
  chapterClosureProfile: z.string().min(1),
  chapterCarryForwardProfile: z.string().min(1),
});
export type ChapterComposition = z.infer<typeof ChapterCompositionSchema>;

export const ThreadChapterStateInfluenceSchema = z.object({
  artifact: z.literal("narrative_thread_chapter_state_influence"),
  chapterId: z.string().min(1),
  influencedAxes: z.array(
    z.object({
      axis: ChapterStateAxisKeySchema,
      delta: z.number().min(-20).max(20),
      rationale: z.string().min(1),
    }),
  ),
  recommendedActivations: z.array(
    z.object({
      threadId: z.string().min(1),
      reason: z.string().min(1),
      activationConfidence: z.number().min(0).max(1),
    }),
  ),
});
export type ThreadChapterStateInfluence = z.infer<typeof ThreadChapterStateInfluenceSchema>;

export const ThreadBeatInfluenceSchema = z.object({
  artifact: z.literal("narrative_thread_beat_influence"),
  chapterId: z.string().min(1),
  beatWeightBias: z.record(BeatTypeSchema, z.number().min(-1).max(1)),
  emphasisNotes: z.array(z.string()),
});
export type ThreadBeatInfluence = z.infer<typeof ThreadBeatInfluenceSchema>;

export const ThreadCallbackEventSchema = z.object({
  callbackEventId: z.string().min(1),
  threadId: z.string().min(1),
  sourceNodeId: z.string().min(1),
  reentryChapterId: z.string().min(1),
  reentrySceneId: z.string().min(1),
  addedMeaningLoad: z.number().min(0).max(1),
  marker: z.string().min(1),
});
export type ThreadCallbackEvent = z.infer<typeof ThreadCallbackEventSchema>;

export const PovReinterpretationSchema = z.object({
  reinterpretationId: z.string().min(1),
  threadId: z.string().min(1),
  eventAnchorId: z.string().min(1),
  sourcePov: z.string().min(1),
  targetPov: z.string().min(1),
  reinterpretationDelta: z.string().min(1),
  memoryDistortionFactor: z.number().min(0).max(1),
  explicitness: z.enum(["low", "medium", "high"]),
});
export type PovReinterpretation = z.infer<typeof PovReinterpretationSchema>;

export const DelayedConvergenceEventSchema = z.object({
  convergenceId: z.string().min(1),
  hiddenConvergenceKey: z.string().min(1),
  sourceNodeIds: z.array(z.string()).min(2),
  revealedInChapterId: z.string().min(1),
  revealedInSceneId: z.string().min(1),
  mode: z.enum([
    "location_reveal",
    "network_link",
    "philosophy_echo",
    "warning_pattern",
    "trade_disturbance",
    "relationship_bridge",
  ]),
  meaningGain: z.number().min(0).max(1),
});
export type DelayedConvergenceEvent = z.infer<typeof DelayedConvergenceEventSchema>;

export const LocationAppearanceModeSchema = z.enum([
  "direct_scene",
  "report",
  "rumor",
  "messenger_arrival",
  "memory",
  "heard_event",
  "expected_danger",
  "route_mention",
  "trade_origin_destination",
  "kin_tie",
  "ceremonial_tie",
  "resource_tie",
]);
export type LocationAppearanceMode = z.infer<typeof LocationAppearanceModeSchema>;

export const SettingThreadSchema = NarrativeThreadSchema.extend({
  threadType: z.literal("setting_thread"),
  locationId: z.string().min(1),
  routeRole: z.enum(["source", "corridor", "junction", "destination", "risk_zone", "memory_anchor"]),
});
export type SettingThread = z.infer<typeof SettingThreadSchema>;

export const RouteThreadSchema = NarrativeThreadSchema.extend({
  threadType: z.literal("route_thread"),
  routeId: z.string().min(1),
  locationPath: z.array(z.string().min(1)).min(2),
});
export type RouteThread = z.infer<typeof RouteThreadSchema>;

export const LocationPresenceRecordSchema = z.object({
  locationId: z.string().min(1),
  locationName: z.string().min(1),
  routeRole: z.string().min(1),
  appearanceMode: LocationAppearanceModeSchema,
  appearanceCount: z.number().int().min(0),
  directSceneCount: z.number().int().min(0),
  indirectMentionCount: z.number().int().min(0),
  associatedThreads: z.array(z.string().min(1)),
  associatedCharacters: z.array(z.string().min(1)),
  currentMeaning: z.string().min(1),
  callbackLinks: z.array(z.string().min(1)),
  nextRecommendedAppearanceWindow: z.string().min(1),
});
export type LocationPresenceRecord = z.infer<typeof LocationPresenceRecordSchema>;

export const SettingCoverageReportSchema = z.object({
  artifact: z.literal("red_river_setting_coverage_report"),
  bookId: z.string().min(1),
  requiredLocationIds: z.array(z.string()).min(1),
  records: z.array(LocationPresenceRecordSchema),
  missingLocationIds: z.array(z.string()),
  underrepresentedLocationIds: z.array(z.string()),
  coverageRatio: z.number().min(0).max(1),
  recommendations: z.array(z.string()),
});
export type SettingCoverageReport = z.infer<typeof SettingCoverageReportSchema>;

export const NarrativeThreadInspectionSchema = z.object({
  artifact: z.literal("narrative_thread_inspection"),
  chapterId: z.string().min(1),
  activeThreadIds: z.array(z.string()),
  latentThreadIds: z.array(z.string()),
  callbackMarkers: z.array(z.string()),
  delayedConvergenceMarkers: z.array(z.string()),
  reinterpretationCandidates: z.array(z.string()),
  philosophyThreadIds: z.array(z.string()),
  unresolvedThreadCount: z.number().int().min(0),
  resolvedThreadCount: z.number().int().min(0),
  sceneDensity: z.array(
    z.object({
      sceneId: z.string().min(1),
      activeThreadCount: z.number().int().min(0),
      latentThreadCount: z.number().int().min(0),
      densityScore: z.number().min(0).max(1),
    }),
  ),
  warnings: z.array(z.string()),
});
export type NarrativeThreadInspection = z.infer<typeof NarrativeThreadInspectionSchema>;

export const NarrativeThreadPackSchema = z.object({
  artifact: z.literal("book_narrative_thread_pack"),
  schemaVersion: z.literal(NARRATIVE_THREAD_SCHEMA_VERSION),
  bookId: z.string().min(1),
  threads: z.array(NarrativeThreadSchema).min(1),
  chapterCompositions: z.array(ChapterCompositionSchema),
  reinterpretations: z.array(PovReinterpretationSchema),
  delayedConvergenceEvents: z.array(DelayedConvergenceEventSchema),
});
export type NarrativeThreadPack = z.infer<typeof NarrativeThreadPackSchema>;
