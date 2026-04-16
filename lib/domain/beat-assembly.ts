import { z } from "zod";

export const BeatTypeSchema = z.enum([
  "salience_lock_beat",
  "memory_comparison_beat",
  "environmental_confirmation_beat",
  "emotional_appraisal_beat",
  "micro_decision_beat",
  "social_signal_beat",
  "relational_interpretation_beat",
  "pressure_escalation_beat",
  "meaning_trace_beat",
  "consequence_seed_beat",
  "state_update_beat",
]);
export type BeatType = z.infer<typeof BeatTypeSchema>;

export const VisibilityScopeSchema = z.object({
  locallyKnown: z.array(z.string()).min(1),
  globallyKnownButHiddenFromPov: z.array(z.string()).default([]),
});
export type VisibilityScope = z.infer<typeof VisibilityScopeSchema>;

export const EmotionVectorSchema = z.object({
  primary: z.string(),
  valence: z.number().min(-1).max(1),
  arousal: z.number().min(0).max(1),
  socialRisk: z.number().min(0).max(1),
  containment: z.number().min(0).max(1),
});
export type EmotionVector = z.infer<typeof EmotionVectorSchema>;

export const BeatValidationFlagsSchema = z.object({
  physicallyGrounded: z.boolean(),
  observerBounded: z.boolean(),
  salienceJustified: z.boolean(),
  modernCognitionLeakFree: z.boolean(),
  hasStateConsequence: z.boolean(),
  chapterOneEscalationSafe: z.boolean(),
  runtimeBoundarySafe: z.boolean(),
  notes: z.array(z.string()),
});
export type BeatValidationFlags = z.infer<typeof BeatValidationFlagsSchema>;

export const BeatAssemblyBeatSchema = z.object({
  beatId: z.string().min(1),
  beatType: BeatTypeSchema,
  beatPurpose: z.string().min(1),
  povCharacterId: z.string().min(1),
  temporalPosition: z.object({
    chapter: z.number().int().positive(),
    sequence: z.number().int().positive(),
    phaseLabel: z.string().min(1),
    timeOfDay: z.string().min(1),
  }),
  locationContext: z.object({
    zone: z.string().min(1),
    environment: z.string().min(1),
  }),
  physicalAction: z.string().min(1),
  environmentalSignal: z.string().min(1),
  sensorySignal: z.string().min(1),
  socialSignal: z.string().min(1),
  interpretedMeaning: z.string().min(1),
  emotionVector: EmotionVectorSchema,
  memoryTriggered: z.string().min(1),
  decisionOrAdjustment: z.string().min(1),
  downstreamRisk: z.string().min(1),
  stateUpdate: z.string().min(1),
  salienceReason: z.string().min(1),
  visibilityScope: VisibilityScopeSchema,
  confidence: z.number().min(0).max(1),
  pressureLoad: z.number().min(0).max(1),
  validationFlags: BeatValidationFlagsSchema,
});
export type BeatAssemblyBeat = z.infer<typeof BeatAssemblyBeatSchema>;

export const BeatAssemblyTransitionRuleSetSchema = z.object({
  allowed: z.record(BeatTypeSchema, z.array(BeatTypeSchema)),
  disallowed: z.record(BeatTypeSchema, z.array(BeatTypeSchema)),
});
export type BeatAssemblyTransitionRuleSet = z.infer<typeof BeatAssemblyTransitionRuleSetSchema>;

export const BEAT_ALLOWED_TRANSITIONS: Record<BeatType, BeatType[]> = {
  salience_lock_beat: ["environmental_confirmation_beat", "social_signal_beat", "memory_comparison_beat"],
  environmental_confirmation_beat: ["memory_comparison_beat", "emotional_appraisal_beat", "social_signal_beat"],
  memory_comparison_beat: [
    "social_signal_beat",
    "emotional_appraisal_beat",
    "relational_interpretation_beat",
    "micro_decision_beat",
  ],
  social_signal_beat: ["relational_interpretation_beat", "micro_decision_beat", "emotional_appraisal_beat"],
  relational_interpretation_beat: ["emotional_appraisal_beat", "micro_decision_beat", "pressure_escalation_beat"],
  emotional_appraisal_beat: ["micro_decision_beat", "pressure_escalation_beat", "meaning_trace_beat"],
  micro_decision_beat: ["pressure_escalation_beat", "consequence_seed_beat", "state_update_beat"],
  pressure_escalation_beat: ["meaning_trace_beat", "consequence_seed_beat", "state_update_beat"],
  meaning_trace_beat: ["consequence_seed_beat", "state_update_beat"],
  consequence_seed_beat: ["state_update_beat", "pressure_escalation_beat"],
  state_update_beat: ["salience_lock_beat", "meaning_trace_beat"],
};

export const BEAT_DISALLOWED_TRANSITIONS: Record<BeatType, BeatType[]> = {
  salience_lock_beat: ["pressure_escalation_beat", "consequence_seed_beat"],
  environmental_confirmation_beat: ["consequence_seed_beat"],
  memory_comparison_beat: ["salience_lock_beat"],
  social_signal_beat: ["salience_lock_beat"],
  relational_interpretation_beat: ["salience_lock_beat"],
  emotional_appraisal_beat: ["salience_lock_beat"],
  micro_decision_beat: ["salience_lock_beat", "environmental_confirmation_beat"],
  pressure_escalation_beat: ["salience_lock_beat", "environmental_confirmation_beat"],
  meaning_trace_beat: ["salience_lock_beat", "environmental_confirmation_beat"],
  consequence_seed_beat: ["salience_lock_beat", "environmental_confirmation_beat"],
  state_update_beat: ["environmental_confirmation_beat", "memory_comparison_beat"],
};

export function isBeatTransitionAllowed(from: BeatType, to: BeatType): boolean {
  if (BEAT_DISALLOWED_TRANSITIONS[from].includes(to)) return false;
  return BEAT_ALLOWED_TRANSITIONS[from].includes(to);
}

export const BeatAssemblyChainSchema = z.object({
  artifact: z.string().min(1),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.number().int().positive(),
  generatedAt: z.string(),
  worldviewFrame: z.object({
    storyLocale: z.string(),
    eraWindow: z.string(),
    cognitionTranslationMode: z.literal("native_cognition_first_translated_to_english"),
    runtimeBoundary: z.literal("metaphysical_and_cosmic_drivers_fenced_off"),
  }),
  transitionRules: BeatAssemblyTransitionRuleSetSchema,
  beats: z.array(BeatAssemblyBeatSchema).min(8).max(12),
  chainValidation: z.object({
    passed: z.boolean(),
    invalidReasons: z.array(z.string()),
  }),
  provenance: z.object({
    sourceArtifacts: z.array(z.string()).min(1),
  }),
});
export type BeatAssemblyChain = z.infer<typeof BeatAssemblyChainSchema>;

export const BeatAssemblyCockpitSummarySchema = z.object({
  chapter: z.number().int().positive(),
  beatCount: z.number().int().positive(),
  validationPassed: z.boolean(),
  highestPressureLoad: z.number().min(0).max(1),
  observerBoundaryIncidents: z.number().int().nonnegative(),
  salienceCoverage: z.number().min(0).max(1),
  memoryLinkedBeats: z.number().int().nonnegative(),
  socialFeedbackBeats: z.number().int().nonnegative(),
  meaningTraceBeats: z.number().int().nonnegative(),
  summaryLine: z.string(),
});
export type BeatAssemblyCockpitSummary = z.infer<typeof BeatAssemblyCockpitSummarySchema>;
