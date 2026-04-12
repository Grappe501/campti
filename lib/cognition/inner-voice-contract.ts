import { z } from "zod";

/** Input to an inner-voice / god-mode generator (OpenAI-ready JSON). */
export const innerVoiceRequestSchema = z.object({
  contractVersion: z.literal("1"),
  characterId: z.string(),
  sceneId: z.string().optional(),
  mode: z.enum([
    "INNER_VOICE",
    "DECISION_TRACE",
    "ALTERNATE_RUN",
    "GOD_MODE_QA",
  ]),
  /** Author question for GOD_MODE_QA */
  prompt: z.string(),
  /** Serialized `CharacterCognitionFrame`-shaped payload from resolver */
  cognitionFrameJson: z.unknown(),
});

export type InnerVoiceRequestV1 = z.infer<typeof innerVoiceRequestSchema>;

export const innerVoiceStructuredSchema = z.object({
  innerMonologue: z.string(),
  hiddenMotive: z.string(),
  statedMotive: z.string(),
  blockedDesire: z.string(),
  fear: z.string(),
  selfDeception: z.string(),
  pressureRanking: z.array(
    z.object({ label: z.string(), weight: z.number() })
  ),
  confidence: z.number().min(0).max(1),
});

export type InnerVoiceStructuredV1 = z.infer<typeof innerVoiceStructuredSchema>;

/** Alias for session storage naming (same schema as `innerVoiceStructuredSchema`). */
export const innerVoiceSessionStructuredSchemaV1 = innerVoiceStructuredSchema;
export type InnerVoiceSessionStructuredV1 = InnerVoiceStructuredV1;

const rankedCognitionItemSchema = z.object({
  rank: z.number(),
  label: z.string(),
});

const innerVoiceModeSchema = z.enum([
  "INNER_MONOLOGUE",
  "TABOO_SURFACING",
  "SELF_JUSTIFICATION",
  "FEAR_STACK",
  "CONTRADICTION_TRACE",
  "GOD_MODE_QA",
]);

const worldStateThoughtStyleSchema = z.object({
  worldStateId: z.string().nullable(),
  eraId: z.string().nullable(),
  label: z.string().nullable(),
  honorShameSalience: z.number(),
  supernaturalSalience: z.number(),
  lawPunishmentSalience: z.number(),
  kinDutySalience: z.number(),
  classStatusSalience: z.number(),
  bodilySensorySalience: z.number(),
  publicMoralAbstraction: z.number(),
  dominantMoralCategories: z.array(z.string()),
  forbiddenThoughtZones: z.array(z.string()),
  acceptableSelfConcepts: z.array(z.string()),
  avoidModernPsychLabels: z.boolean(),
  summaryForModel: z.string(),
});

const ageMaturityThoughtStyleSchema = z.object({
  ageBand: z.enum([
    "EARLY_CHILD",
    "LATE_CHILD",
    "ADOLESCENT",
    "YOUNG_ADULT",
    "ADULT",
    "ELDER",
  ]),
  assumedBand: z.boolean(),
  abstractionCeiling: z.number(),
  memoryGranularity: z.number(),
  emotionalVolatility: z.number(),
  selfObservationCapacity: z.number(),
  impulseDominance: z.number(),
  futurePlanningDepth: z.number(),
  symbolicThinkingLevel: z.number(),
  shameSensitivity: z.number(),
  authorityInternalization: z.number(),
  summaryForModel: z.string(),
});

const innerVoiceConstraintFrameSchema = z.object({
  allowUnfilteredPrivateMind: z.literal(true),
  worldStateTruth: z.literal(true),
  ageTruth: z.literal(true),
  channels: z.object({
    feltEmotion: z.boolean(),
    consciousBelief: z.boolean(),
    suppressedDesire: z.boolean(),
    selfJustification: z.boolean(),
    fear: z.boolean(),
    contradiction: z.boolean(),
    misperception: z.boolean(),
  }),
  modeEmphasis: z.record(z.string(), z.boolean()),
  tabooAndForbiddenIndex: z.array(z.string()),
  requireRawForbiddenBucketWhenPresent: z.boolean(),
});

/** Shared fields for Phase 5B inner voice requests (v2 and v3). */
export const characterInnerVoiceRequestSharedSchema = z.object({
  characterId: z.string(),
  sceneId: z.string(),
  mode: innerVoiceModeSchema,
  authorQuestion: z.string().nullable(),
  ageBand: z.enum([
    "EARLY_CHILD",
    "LATE_CHILD",
    "ADOLESCENT",
    "YOUNG_ADULT",
    "ADULT",
    "ELDER",
  ]),
  ageYears: z.number().nullable(),
  ageBandAssumed: z.boolean(),
  worldStateThoughtStyle: worldStateThoughtStyleSchema,
  ageMaturityThoughtStyle: ageMaturityThoughtStyleSchema,
  innerVoiceConstraintFrame: innerVoiceConstraintFrameSchema,
  cognitionFramePayload: z.record(z.string(), z.unknown()),
  builtAtIso: z.string(),
});

const accentPresenceLevelSchema = z.enum(["none", "light", "medium"]);
const translationRenderModeSchema = z.enum([
  "TRANSPARENT_ENGLISH",
  "MEDIATED_ENGLISH",
  "HIGH_TEXTURE_ENGLISH",
]);

const worldStateLanguageEnvironmentSchema = z.object({
  worldStateId: z.string().nullable(),
  eraId: z.string().nullable(),
  dominantLanguages: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
      notes: z.string().optional(),
    })
  ),
  prestigeLanguage: z.string().nullable(),
  sacredLanguage: z.string().nullable(),
  legalLanguage: z.string().nullable(),
  tradeLanguage: z.string().nullable(),
  householdLanguage: z.string().nullable(),
  literacyNorm: z.object({
    clericalLiteracy: z.enum(["rare", "minority", "common", "widespread"]),
    vernacularPrint: z.boolean(),
    notes: z.string().optional(),
  }),
  languageHierarchy: z.array(z.string()),
  translationPressure: z.number(),
});

const spokenLanguageProfileSchema = z.object({
  languages: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
      fluency: z.enum(["native", "fluent", "working", "minimal"]),
      contexts: z.array(z.string()).optional(),
    })
  ),
  publicRegisterLanguage: z.string().nullable().optional(),
});

const registerProfileSchema = z.object({
  socialStance: z.array(z.string()),
  hierarchyAwareness: z.enum(["high", "medium", "low"]),
  indirectness: z.enum(["high", "medium", "low"]),
});

const codeSwitchTriggerSchema = z.object({
  id: z.string(),
  condition: z.string(),
  kind: z.string(),
  toward: z.string(),
});

export const thoughtLanguageFrameSchema = z.object({
  primaryMindLanguage: z.string(),
  secondaryMindLanguage: z.string().nullable(),
  spoken: spokenLanguageProfileSchema,
  register: registerProfileSchema,
  world: worldStateLanguageEnvironmentSchema,
  renderMode: translationRenderModeSchema,
  accentTextureLevel: accentPresenceLevelSchema,
  retainedLexiconWeight: z.number(),
  syntaxInfluenceLevel: z.number(),
  codeSwitchTriggers: z.array(codeSwitchTriggerSchema),
  renderInstructions: z.array(z.string()),
});

export type ThoughtLanguageFrameValidated = z.infer<typeof thoughtLanguageFrameSchema>;

/** Phase 5B — deterministic framing + cognition payload; ready for LLM adapter. */
export const characterInnerVoiceRequestSchemaV2 = z
  .object({
    contractVersion: z.literal("2"),
  })
  .merge(characterInnerVoiceRequestSharedSchema);

export type CharacterInnerVoiceRequestV2 = z.infer<typeof characterInnerVoiceRequestSchemaV2>;

/** Phase 5B.3 — adds resolved thought-language mediation for English render constraints. */
export const characterInnerVoiceRequestSchemaV3 = z
  .object({
    contractVersion: z.literal("3"),
    thoughtLanguageFrame: thoughtLanguageFrameSchema,
  })
  .merge(characterInnerVoiceRequestSharedSchema);

export type CharacterInnerVoiceRequestV3 = z.infer<typeof characterInnerVoiceRequestSchemaV3>;

export const characterInnerVoiceRequestSchemaPhase5B = z.discriminatedUnion("contractVersion", [
  characterInnerVoiceRequestSchemaV2,
  characterInnerVoiceRequestSchemaV3,
]);

export const characterInnerVoiceResponseSchemaV2 = z.object({
  innerMonologue: z.string(),
  surfaceThought: z.string(),
  suppressedThought: z.string(),
  forbiddenThought: z.string(),
  selfJustification: z.string(),
  fearStack: z.array(rankedCognitionItemSchema),
  desireStack: z.array(rankedCognitionItemSchema),
  contradiction: z.string(),
  misbeliefs: z.string(),
  moralFrame: z.string(),
  ageBand: z.enum([
    "EARLY_CHILD",
    "LATE_CHILD",
    "ADOLESCENT",
    "YOUNG_ADULT",
    "ADULT",
    "ELDER",
  ]),
  worldStateStyleSummary: z.string(),
  confidence: z.number().min(0).max(1),
  advisoryOnly: z.boolean(),
});

export type CharacterInnerVoiceResponseV2 = z.infer<typeof characterInnerVoiceResponseSchemaV2>;

export const decisionTraceRequestSchema = z.object({
  contractVersion: z.literal("1"),
  characterId: z.string(),
  sceneId: z.string(),
  chosenAction: z.string(),
  alternateAction: z.string().optional(),
  cognitionFrameJson: z.unknown(),
});

export const decisionTraceResponseSchema = z.object({
  whyThisAction: z.string(),
  dominantPressures: z.array(
    z.object({ label: z.string(), weight: z.number() })
  ),
  worldStateFactors: z.array(z.string()),
  relationshipFactors: z.array(z.string()),
  whatWouldChangeDecision: z.array(z.string()),
});

export type DecisionTraceResponseV1 = z.infer<typeof decisionTraceResponseSchema>;

const pressureEntrySchema = z.object({ label: z.string(), weight: z.number() });

const actionConstraintSchema = z.object({
  constraintId: z.string(),
  label: z.string(),
  severity: z.number(),
  source: z.enum(["world", "kin", "law", "honor", "body", "taboo", "desire"]),
});

/** Phase 5D — structured author-facing decision explanation. */
export const decisionTraceResponseSchemaV2 = z.object({
  selectedAction: z.string(),
  statedMotive: z.string(),
  underlyingMotive: z.string(),
  blockedMotive: z.string(),
  triggerPressures: z.array(pressureEntrySchema),
  dominantPressures: z.array(pressureEntrySchema),
  suppressedPressures: z.array(pressureEntrySchema),
  fearDrivers: z.array(pressureEntrySchema),
  desireDrivers: z.array(pressureEntrySchema),
  embodimentDrivers: z.array(pressureEntrySchema),
  worldStateConstraints: z.array(actionConstraintSchema),
  selfDeceptionFactors: z.array(z.string()),
  contradictionSummary: z.string(),
  whyThisWon: z.string(),
  whatCouldChangeIt: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  advisoryOnly: z.boolean(),
});

export type DecisionTraceResponseV2 = z.infer<typeof decisionTraceResponseSchemaV2>;

const actionCandidateSchema = z.object({
  actionId: z.string(),
  label: z.string(),
  actionType: z.string(),
  targetPersonId: z.string().nullable().optional(),
  targetObject: z.string().nullable().optional(),
  socialRisk: z.number(),
  bodilyCost: z.number(),
  desireReward: z.number(),
  dutyAlignment: z.number(),
  tabooSeverity: z.number(),
});

export const decisionTraceRequestSchemaV2 = z.object({
  contractVersion: z.literal("2"),
  characterId: z.string(),
  sceneId: z.string(),
  selectedAction: actionCandidateSchema,
  alternateAction: actionCandidateSchema.nullable(),
  cognitionFramePayload: z.record(z.string(), z.unknown()),
  pressureBreakdown: z.object({
    motiveActive: z.array(pressureEntrySchema),
    motiveSuppressed: z.array(pressureEntrySchema),
    triggerPressures: z.array(pressureEntrySchema),
    fearDrivers: z.array(pressureEntrySchema),
    desireDrivers: z.array(pressureEntrySchema),
    embodimentDrivers: z.array(pressureEntrySchema),
    worldStateConstraints: z.array(actionConstraintSchema),
    selfDeceptionFactors: z.array(z.string()),
  }),
  deterministicScaffolding: z.object({
    summarySkeleton: z.string(),
    alternateCompareSkeleton: z.string().nullable(),
  }),
  worldStateStyleSummary: z.string(),
  ageBand: z.enum([
    "EARLY_CHILD",
    "LATE_CHILD",
    "ADOLESCENT",
    "YOUNG_ADULT",
    "ADULT",
    "ELDER",
  ]),
  builtAtIso: z.string(),
});

export type DecisionTraceRequestV2 = z.infer<typeof decisionTraceRequestSchemaV2>;

export const simulationRerunContractSchema = z.object({
  contractVersion: z.literal("1"),
  scenarioId: z.string(),
  sceneId: z.string(),
  baseSnapshotId: z.string().nullable(),
  overrides: z.array(
    z.object({
      key: z.string(),
      priorValue: z.unknown(),
      overrideValue: z.unknown(),
    })
  ),
});

export type SimulationRerunContractV1 = z.infer<typeof simulationRerunContractSchema>;
