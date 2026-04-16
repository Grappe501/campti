import { z } from "zod";

import { RUNTIME_AUTHORITY_CLASSES } from "@/lib/domain/runtime-authority";

export const SCENE_GENERATION_ENGINE_SCHEMA_VERSION = "1.0.0" as const;

const RuntimeAuthorityStampSchema = z.object({
  runtimeId: z.string().min(1),
  runtimeName: z.string().min(1),
  authorityClass: z.enum(RUNTIME_AUTHORITY_CLASSES),
  isCanonicalProduction: z.boolean(),
  machineTag: z.string().min(1),
  operatorLabel: z.string().min(1),
  warningPrefix: z.string().min(1),
  canAffectCanonicalOutput: z.boolean(),
  canGateReadiness: z.boolean(),
});

export const SceneTransitionStrategySchema = z.enum([
  "hard_cut",
  "soft_echo",
  "sensory_carry",
  "object_carry",
  "route_carry",
  "memory_carry",
  "warning_carry",
  "contrast_cut",
  "delayed_bind_cut",
  "closure_open_cut",
]);
export type SceneTransitionStrategy = z.infer<typeof SceneTransitionStrategySchema>;

export const SceneTransitionPlanSchema = z.object({
  transitionId: z.string().min(1),
  chapterId: z.string().min(1),
  fromScenePlanId: z.string().min(1),
  toScenePlanId: z.string().min(1),
  strategy: SceneTransitionStrategySchema,
  carrySignals: z.array(z.string().min(1)),
  withheldSignals: z.array(z.string().min(1)),
  visibleNow: z.boolean(),
  visibleLaterByConvergence: z.boolean(),
  rationale: z.string().min(1),
});
export type SceneTransitionPlan = z.infer<typeof SceneTransitionPlanSchema>;

export const SceneGenerationRequestSchema = z.object({
  artifact: z.literal("scene_generation_request"),
  schemaVersion: z.literal(SCENE_GENERATION_ENGINE_SCHEMA_VERSION),
  requestId: z.string().min(1),
  chapterId: z.string().min(1),
  parentBookId: z.string().min(1),
  parentChapterStateId: z.string().min(1),
  parentNarrativePsychologyId: z.string().min(1),
  parentChapterCompositionPlanId: z.string().min(1),
  parentSequencePlanId: z.string().optional(),
  activeThreadPackId: z.string().min(1),
  scenePlanSequence: z.array(z.string().min(1)).min(1),
  routeLedgerSnapshot: z.record(z.string(), z.unknown()),
  philosophyPropagationPlanId: z.string().min(1),
  callbackPlanId: z.string().min(1),
  reinterpretationAnchorSetId: z.string().min(1),
  chapterLevelProseConstraints: z.record(z.string(), z.unknown()),
  chapterLevelLiteraryDevicePlan: z.record(z.string(), z.unknown()),
  validationFlags: z.array(z.string()),
});
export type SceneGenerationRequest = z.infer<typeof SceneGenerationRequestSchema>;

export const GeneratedSceneArtifactSchema = z.object({
  artifact: z.literal("generated_scene_artifact"),
  schemaVersion: z.literal(SCENE_GENERATION_ENGINE_SCHEMA_VERSION),
  generatedSceneId: z.string().min(1),
  chapterId: z.string().min(1),
  scenePlanId: z.string().min(1),
  sceneOrder: z.number().int().positive(),
  sceneRole: z.string().min(1),
  povResolved: z.string().min(1),
  activeThreads: z.array(z.string().min(1)),
  latentThreads: z.array(z.string().min(1)),
  settingBindings: z.array(z.string().min(1)),
  routeBindings: z.array(z.string().min(1)),
  philosophyBindings: z.array(z.string().min(1)),
  appliedBeatChainId: z.string().min(1),
  appliedProseConstraintsId: z.string().min(1),
  appliedLiteraryDevicePlanId: z.string().min(1),
  sceneTransitionIn: SceneTransitionPlanSchema.nullable(),
  sceneTransitionOut: SceneTransitionPlanSchema.nullable(),
  callbackSeedsTriggered: z.array(z.string().min(1)),
  delayedConvergenceKeysPresent: z.array(z.string().min(1)),
  reinterpretationAnchorsPresent: z.array(z.string().min(1)),
  unresolvedPressureOutput: z.array(z.string().min(1)),
  generatedText: z.string(),
  generationWarnings: z.array(z.string()),
  runtimeAuthority: RuntimeAuthorityStampSchema,
  validationFlags: z.array(z.string()),
});
export type GeneratedSceneArtifact = z.infer<typeof GeneratedSceneArtifactSchema>;

export const GeneratedChapterSceneBundleSchema = z.object({
  artifact: z.literal("generated_chapter_scene_bundle"),
  schemaVersion: z.literal(SCENE_GENERATION_ENGINE_SCHEMA_VERSION),
  chapterId: z.string().min(1),
  compositionPlanId: z.string().min(1),
  generatedScenes: z.array(GeneratedSceneArtifactSchema).min(1),
  sceneOrderSummary: z.array(z.string().min(1)),
  threadCoverageSummary: z.array(z.string().min(1)),
  routePresenceSummary: z.array(z.string().min(1)),
  philosophyEchoSummary: z.array(z.string().min(1)),
  callbackSummary: z.array(z.string().min(1)),
  delayedConvergenceSummary: z.array(z.string().min(1)),
  reinterpretationSummary: z.array(z.string().min(1)),
  adjacencySummary: z.array(z.string().min(1)),
  densitySummary: z.object({
    averageThreadDensity: z.number().min(0).max(1),
    averageRouteDensity: z.number().min(0).max(1),
    sceneCount: z.number().int().positive(),
    flatteningRisk: z.number().min(0).max(1),
  }),
  proseComplianceSummary: z.object({
    compliantScenes: z.number().int().nonnegative(),
    driftWarnings: z.array(z.string()),
    literaryWarnings: z.array(z.string()),
  }),
  runtimeAuthority: RuntimeAuthorityStampSchema,
  generationWarnings: z.array(z.string()),
  validationFlags: z.array(z.string()),
});
export type GeneratedChapterSceneBundle = z.infer<typeof GeneratedChapterSceneBundleSchema>;

export const SceneGenerationValidationReportSchema = z.object({
  artifact: z.literal("scene_generation_validation_report"),
  schemaVersion: z.literal(SCENE_GENERATION_ENGINE_SCHEMA_VERSION),
  chapterId: z.string().min(1),
  hardFailures: z.array(z.string()),
  softWarnings: z.array(z.string()),
  sceneLevelDiagnostics: z.array(
    z.object({
      scenePlanId: z.string().min(1),
      warnings: z.array(z.string()),
    }),
  ),
  chapterBundleDiagnostics: z.array(z.string()),
  runtimeAuthority: RuntimeAuthorityStampSchema,
});
export type SceneGenerationValidationReport = z.infer<typeof SceneGenerationValidationReportSchema>;

