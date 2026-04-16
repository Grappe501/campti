import { z } from "zod";

export const LITERARY_DEVICE_CONTROL_SCHEMA_VERSION = "1.0.0" as const;

export const LiteraryDeviceFamilySchema = z.enum([
  "sound_rhythm",
  "image_meaning",
  "structural",
  "psychological",
  "campti_custom",
]);
export type LiteraryDeviceFamily = z.infer<typeof LiteraryDeviceFamilySchema>;

export const LiteraryDeviceScopeSchema = z.enum([
  "line",
  "paragraph",
  "scene",
  "chapter",
  "thread",
  "pov",
  "character",
  "book",
]);
export type LiteraryDeviceScope = z.infer<typeof LiteraryDeviceScopeSchema>;

export const LiteraryDeviceActivationModeSchema = z.enum(["off", "subtle", "moderate", "strong", "required"]);
export type LiteraryDeviceActivationMode = z.infer<typeof LiteraryDeviceActivationModeSchema>;

export const LiteraryDeviceDensityBandSchema = z.enum(["rare", "occasional", "patterned", "motif_driven"]);
export type LiteraryDeviceDensityBand = z.infer<typeof LiteraryDeviceDensityBandSchema>;

export const LiteraryDeviceExplicitnessBandSchema = z.enum(["implicit", "low", "moderate", "high"]);
export type LiteraryDeviceExplicitnessBand = z.infer<typeof LiteraryDeviceExplicitnessBandSchema>;

export const LiteraryDeviceContextSchema = z.enum([
  "environment",
  "action",
  "dialogue",
  "memory",
  "ritual",
  "transition",
  "closure",
  "warning",
  "route_presence",
  "philosophy_echo",
  "high_tension_decision",
]);
export type LiteraryDeviceContext = z.infer<typeof LiteraryDeviceContextSchema>;

export const LiteraryCarrierModeSchema = z.enum([
  "object",
  "image",
  "place",
  "action",
  "sound_pattern",
  "relational_gesture",
  "repeated_phrase",
  "route_mention",
  "warning_sign",
  "weather",
  "material",
  "memory_fragment",
]);
export type LiteraryCarrierMode = z.infer<typeof LiteraryCarrierModeSchema>;

export const BindingRequirementSchema = z.enum(["none", "preferred", "required"]);
export type BindingRequirement = z.infer<typeof BindingRequirementSchema>;

export const LiteraryDeviceDefinitionSchema = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  deviceFamily: LiteraryDeviceFamilySchema,
  description: z.string().min(1),
  allowedScopes: z.array(LiteraryDeviceScopeSchema).min(1),
  defaultActivationMode: LiteraryDeviceActivationModeSchema,
  defaultDensityBand: LiteraryDeviceDensityBandSchema,
  allowedContexts: z.array(LiteraryDeviceContextSchema).min(1),
  forbiddenContexts: z.array(LiteraryDeviceContextSchema),
  compatiblePsychologyModes: z.array(z.string()).min(1),
  compatibleChapterModes: z.array(z.string()).min(1),
  compatibleThreadTypes: z.array(z.string()).min(1),
  compatibleSceneRoles: z.array(z.string()).min(1),
  compatibleBeatTypes: z.array(z.string()).min(1),
  nativeCognitionRisk: z.enum(["low", "moderate", "high", "critical"]),
  symbolismBindingRequirement: BindingRequirementSchema,
  routeSettingBindingRequirement: BindingRequirementSchema,
  philosophyBindingRequirement: BindingRequirementSchema,
  misuseRiskProfile: z.array(z.string()).min(1),
  validationFlags: z.array(z.string()),
});
export type LiteraryDeviceDefinition = z.infer<typeof LiteraryDeviceDefinitionSchema>;

export const LiterarySymbolDefinitionSchema = z.object({
  symbolId: z.string().min(1),
  symbolName: z.string().min(1),
  meaningIntent: z.string().min(1),
  carriers: z.array(LiteraryCarrierModeSchema).min(1),
  threadBindings: z.array(z.string()),
  settingBindings: z.array(z.string()),
  objectBindings: z.array(z.string()),
  characterBindings: z.array(z.string()),
  recurrenceTarget: LiteraryDeviceDensityBandSchema,
  explicitnessCeiling: LiteraryDeviceExplicitnessBandSchema,
  payoffWindow: z.string().min(1),
  callbackWindow: z.string().min(1),
  notes: z.array(z.string()),
});
export type LiterarySymbolDefinition = z.infer<typeof LiterarySymbolDefinitionSchema>;

export const LiteraryDeviceControlSettingSchema = z.object({
  controlId: z.string().min(1),
  deviceId: z.string().min(1),
  targetScope: LiteraryDeviceScopeSchema,
  targetId: z.string().min(1),
  activationMode: LiteraryDeviceActivationModeSchema,
  densityBand: LiteraryDeviceDensityBandSchema,
  explicitnessBand: LiteraryDeviceExplicitnessBandSchema,
  priorityLevel: z.enum(["low", "medium", "high", "critical"]),
  allowedContextsOverride: z.array(LiteraryDeviceContextSchema),
  forbiddenContextsOverride: z.array(LiteraryDeviceContextSchema),
  targetCarrierModes: z.array(LiteraryCarrierModeSchema),
  driftTolerance: z.number().min(0).max(1),
  symbolismBindings: z.array(z.string()),
  motifBindings: z.array(z.string()),
  threadBindings: z.array(z.string()),
  settingBindings: z.array(z.string()),
  objectBindings: z.array(z.string()),
  characterBindings: z.array(z.string()),
  chapterBindings: z.array(z.string()),
  sceneBindings: z.array(z.string()),
  notes: z.array(z.string()),
  validationFlags: z.array(z.string()),
  alliterationPolicy: z
    .object({
      allowedLineZones: z.array(z.enum(["opening_line", "descriptive_line", "ritual_line", "memory_line", "transition_line"])),
      forbiddenLineZones: z.array(
        z.enum(["high_tension_decision_line", "critical_reveal_line", "combat_line", "rapid_command_line"]),
      ),
      consonantClusteringTolerance: z.number().min(0).max(1),
      descriptiveLineAllowance: z.boolean(),
      ritualLineAllowance: z.boolean(),
      memoryLineAllowance: z.boolean(),
      transitionLineAllowance: z.boolean(),
      highTensionDecisionLineAllowance: z.boolean(),
      numericDensityInput: z.number().min(0).max(100).optional(),
    })
    .optional(),
});
export type LiteraryDeviceControlSetting = z.infer<typeof LiteraryDeviceControlSettingSchema>;

export const LiteraryDeviceApplicationPlanSchema = z.object({
  artifact: z.literal("literary_device_application_plan"),
  schemaVersion: z.literal(LITERARY_DEVICE_CONTROL_SCHEMA_VERSION),
  applicationPlanId: z.string().min(1),
  chapterId: z.string().min(1),
  sceneId: z.string().optional(),
  paragraphTargets: z.array(
    z.object({
      paragraphId: z.string().min(1),
      paragraphRole: z.string().min(1),
      recommendedDeviceIds: z.array(z.string()),
    }),
  ),
  activeDeviceIds: z.array(z.string()),
  allowedDeviceSet: z.array(z.string()),
  suppressedDeviceSet: z.array(z.string()),
  requiredBindingSet: z.array(z.string()),
  deviceContextMatrix: z.record(z.string(), z.array(LiteraryDeviceContextSchema)),
  recommendedPlacementZones: z.array(z.string()),
  restrictedPlacementZones: z.array(z.string()),
  densityWarnings: z.array(z.string()),
  misuseWarnings: z.array(z.string()),
  validationFlags: z.array(z.string()),
});
export type LiteraryDeviceApplicationPlan = z.infer<typeof LiteraryDeviceApplicationPlanSchema>;

export const LiteraryDeviceValidationIssueSchema = z.object({
  severity: z.enum(["hard", "soft"]),
  category: z.string().min(1),
  message: z.string().min(1),
  suggestedAction: z.string().min(1),
});
export type LiteraryDeviceValidationIssue = z.infer<typeof LiteraryDeviceValidationIssueSchema>;

export const LiteraryDeviceValidationResultSchema = z.object({
  artifact: z.literal("literary_device_validation_result"),
  passesHardValidation: z.boolean(),
  hardFailures: z.array(LiteraryDeviceValidationIssueSchema),
  softWarnings: z.array(LiteraryDeviceValidationIssueSchema),
  suggestedSuppressionActions: z.array(z.string()),
  driftDiagnostics: z.array(z.string()),
  validationFlags: z.array(z.string()),
});
export type LiteraryDeviceValidationResult = z.infer<typeof LiteraryDeviceValidationResultSchema>;

export const LiteraryDeviceCockpitSummarySchema = z.object({
  artifact: z.literal("literary_device_cockpit_summary"),
  chapterId: z.string().min(1),
  activeDevices: z.array(
    z.object({
      deviceId: z.string().min(1),
      activationMode: LiteraryDeviceActivationModeSchema,
      densityBand: LiteraryDeviceDensityBandSchema,
      scope: LiteraryDeviceScopeSchema,
      contexts: z.array(LiteraryDeviceContextSchema),
      misuseRisk: z.enum(["low", "moderate", "high", "critical"]),
      chapterApplicationStatus: z.enum(["suppressed", "allowed", "active", "required"]),
    }),
  ),
  symbolRegistry: z.array(LiterarySymbolDefinitionSchema),
  motifRegistry: z.array(
    z.object({
      motifId: z.string().min(1),
      motifName: z.string().min(1),
      boundThreadIds: z.array(z.string()),
      recurrenceTarget: LiteraryDeviceDensityBandSchema,
    }),
  ),
  alliterationControl: z.object({
    activationMode: LiteraryDeviceActivationModeSchema,
    densityBand: LiteraryDeviceDensityBandSchema,
    numericInput: z.number().min(0).max(100),
    mappedDensityBand: LiteraryDeviceDensityBandSchema,
    allowedLineZones: z.array(z.string()),
    forbiddenLineZones: z.array(z.string()),
    consonantClusteringTolerance: z.number().min(0).max(1),
  }),
  densityWarnings: z.array(z.string()),
  misuseWarnings: z.array(z.string()),
  chapterProfileSummary: z.string().min(1),
  sceneDistributionSummary: z.array(
    z.object({
      sceneId: z.string().min(1),
      activeDeviceCount: z.number().int().nonnegative(),
      overloadRisk: z.enum(["low", "moderate", "high"]),
    }),
  ),
  driftWarnings: z.array(z.string()),
});
export type LiteraryDeviceCockpitSummary = z.infer<typeof LiteraryDeviceCockpitSummarySchema>;

export const Book1LiteraryDevicePackSchema = z.object({
  artifact: z.literal("book1_literary_device_pack"),
  schemaVersion: z.literal(LITERARY_DEVICE_CONTROL_SCHEMA_VERSION),
  generatedAt: z.string(),
  definitions: z.array(LiteraryDeviceDefinitionSchema).min(20),
  controlSettings: z.array(LiteraryDeviceControlSettingSchema).min(8),
  symbolRegistry: z.array(LiterarySymbolDefinitionSchema).min(3),
  motifRegistry: z.array(
    z.object({
      motifId: z.string().min(1),
      motifName: z.string().min(1),
      boundThreadIds: z.array(z.string()),
      chapterBindings: z.array(z.string()),
      recurrenceTarget: LiteraryDeviceDensityBandSchema,
    }),
  ),
  chapterProfiles: z.array(
    z.object({
      chapterId: z.string().min(1),
      activationProfile: z.array(z.string()).min(1),
      explicitnessCeiling: LiteraryDeviceExplicitnessBandSchema,
      dominantCarrierModes: z.array(LiteraryCarrierModeSchema).min(1),
      notes: z.array(z.string()),
    }),
  ),
  scenePlans: z.array(LiteraryDeviceApplicationPlanSchema).min(1),
  validationExamples: z.object({
    acceptableUse: LiteraryDeviceValidationResultSchema,
    overloadUse: LiteraryDeviceValidationResultSchema,
  }),
});
export type Book1LiteraryDevicePack = z.infer<typeof Book1LiteraryDevicePackSchema>;
