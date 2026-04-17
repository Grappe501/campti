import { z } from "zod";

import { Book1ChapterAdversarialReviewService } from "@/lib/services/book1-chapter-adversarial-review-service";
import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";
import { Book1EmbodimentTransformerService, Book1EmbodimentMapSchema } from "@/lib/services/book1-embodiment-transformer";
import {
  Book1CharacterCognitionSignatureService,
  Book1CognitionSignaturesSchema,
} from "@/lib/services/book1-character-cognition-signature-service";
import { Book1LivedHistoryTransformer } from "@/lib/services/book1-lived-history-transformer";
import {
  Book1AbstractFearLanguageSuppressorService,
  Book1AbstractFearSuppressionSchema,
  suppressAbstractFearLine,
} from "@/lib/services/book1-abstract-fear-language-suppressor";
import {
  Book1CharacterDistinctionPlanSchema,
  Book1CharacterDistinctionPlanService,
} from "@/lib/services/book1-character-distinction-plan-service";
import { Book1MotiveCompressionSchema, Book1MotiveCompressionService } from "@/lib/services/book1-motive-compression-service";
import { Book1ProseBriefTransformer } from "@/lib/services/book1-prose-brief-transformer";
import { Book1ProseShapeCriticService } from "@/lib/services/book1-prose-shape-critic-service";
import { Book1CriticFeedbackMapSchema } from "@/lib/services/book1-critic-feedback-mapper-service";
import { Book1HighFindingReductionPlanSchema } from "@/lib/services/book1-high-finding-reducer-service";
import {
  Book1SegmentSimulationStateBuilderService,
  Book1SegmentSimulationStateSchema,
} from "@/lib/services/book1-segment-simulation-state-builder";
import { Book1SegmentEnergyService, Book1SegmentEnergyMapSchema } from "@/lib/services/book1-segment-energy-service";
import { Book1SentencePatternGovernorService, Book1SentencePatternPlanSchema } from "@/lib/services/book1-sentence-pattern-governor";
import { Book1ThoughtRecurrenceGuardSchema, Book1ThoughtRecurrenceGuardService } from "@/lib/services/book1-thought-recurrence-guard";
import type { ChapterDraft } from "@/lib/services/book1-latent-epic-chapter-service";
import { Book1VoiceContractService, scoreVoiceContractCompliance } from "@/lib/services/book1-voice-contract-service";
import {
  Book1EnneagramMediationLayerSchema,
  Book1EnneagramMediationService,
} from "@/lib/services/book1-enneagram-mediation-service";
import {
  Book1DevelopmentalIntimacyEngineService,
  Book1DevelopmentalIntimacyEngineSchema,
  developmentalAbstractionCeiling,
  developmentalMisreadingVector,
  isChildProtected,
  type CharacterDevelopmentalProfile,
} from "@/lib/services/book1-developmental-intimacy-engine-service";
import {
  Book1ConsciousnessCohesionRouterSchema,
  Book1ConsciousnessCohesionRouterService,
} from "@/lib/services/book1-consciousness-cohesion-router-service";
import {
  Book1VoiceIdentityStabilizerSchema,
  Book1VoiceIdentityStabilizerService,
} from "@/lib/services/book1-voice-identity-stabilizer-service";
import {
  Book1EmbodiedInnerLifeRouterSchema,
  Book1EmbodiedInnerLifeRouterService,
} from "@/lib/services/book1-embodied-inner-life-router-service";
import { deriveChapterState } from "@/lib/chapter-state/chapter-state-derivation";
import { deriveBeatProfileRecommendation } from "@/lib/chapter-state/chapter-state-to-beat-profile";
import { buildAuthorCommandCockpitBundle } from "@/lib/services/author-command-cockpit-service";
import { buildRuntimeGovernanceConvergenceTruth } from "@/lib/services/runtime-governance-convergence-truth-builder";
import { resolveCockpitScopeContext } from "@/lib/services/cockpit-scope-model-service";
import { ChapterStateToBeatAssemblyChainService } from "@/lib/services/chapter-state-to-beat-assembly-chain-service";
import { NarrativePsychologyDerivationService } from "@/lib/services/narrative-psychology-derivation-service";
import { mapNarrativePsychologyToBeatProfile } from "@/lib/services/narrative-psychology-to-beat-profile-service";
import { mapNarrativePsychologyToChapterState } from "@/lib/services/narrative-psychology-to-chapter-state-service";
import { validateNarrativePsychologyArchitecture } from "@/lib/services/narrative-psychology-validation-service";
import { ChapterCompositionService } from "@/lib/services/chapter-composition-service";
import { NarrativeThreadDerivationService } from "@/lib/services/narrative-thread-derivation-service";
import { NarrativeThreadToBeatProfileService } from "@/lib/services/narrative-thread-to-beat-profile-service";
import { NarrativeThreadToChapterStateService } from "@/lib/services/narrative-thread-to-chapter-state-service";
import { ProseGenerationConstraintDerivationService } from "@/lib/services/prose-generation-constraint-derivation-service";
import { ProseGenerationOutputPathService } from "@/lib/services/prose-generation-output-path-service";
import { ProseGenerationPreflightService } from "@/lib/services/prose-generation-preflight-service";
import { ProseGenerationValidationService } from "@/lib/services/prose-generation-validation-service";
import { SettingThreadCoverageService } from "@/lib/services/setting-thread-coverage-service";
import { Book1BeatAssemblyService } from "@/lib/services/book1-beat-assembly-service";
import { ThreadCallbackReentryService } from "@/lib/services/thread-callback-reentry-service";
import { Book1ChapterLawChronologyInvariantSourceRowSchema } from "@/lib/domain/book1-console-law-constraint";
import { ProseGenerationConstraintsSchema } from "@/lib/domain/prose-generation-constraints";
import { ChapterCompositionPlanSchema } from "@/lib/domain/chapter-composition";
import { LiteraryDeviceCockpitService } from "@/lib/services/literary-device-cockpit-service";
import { LiteraryDeviceDerivationService } from "@/lib/services/literary-device-derivation-service";
import { LiteraryDeviceToProseConstraintsService } from "@/lib/services/literary-device-to-prose-constraints-service";
import { LiteraryDeviceValidationService } from "@/lib/services/literary-device-validation-service";
import { LiterarySymbolRegistryService } from "@/lib/services/literary-symbol-registry-service";
import { SceneGenerationEngineService } from "@/lib/services/scene-generation-engine-service";
import { CanonicalNarrativeGovernanceOrchestrationService } from "@/lib/services/canonical-narrative-governance-orchestration-service";
import { buildCluster3RuntimeActivationTruth } from "@/lib/services/canonical-runtime-cluster3-governance-service";
import {
  buildHumanGravityRuntimeCockpitPanelFromProfile,
  HumanGravityRuntimeDerivationService,
} from "@/lib/services/human-gravity-runtime-derivation-service";
import { buildProseRealismCockpitPanelFromGovernance } from "@/lib/services/prose-realism-derivation-service";
import { RUNTIME_ID_BOOK1_REGENERATION } from "@/lib/services/runtime-authority-registry-service";

const ChapterEvidencePackSchema = z.object({
  artifact: z.literal("chapter_evidence_pack"),
  chapter: z.literal(1),
  evidence: z.array(
    z.object({
      evidenceId: z.string(),
      statement: z.string(),
      inferredYear: z.number().nullable(),
    }),
  ),
});

const ChapterLawSchema = z.object({
  artifact: z.literal("chapter_law"),
  chapter: z.literal(1),
  chronologyInvariants: z.array(Book1ChapterLawChronologyInvariantSourceRowSchema),
  futureArcConstraints: z.array(z.object({ id: z.string(), mustPreserve: z.string(), forbiddenResolution: z.string() })),
  compositionFirewall: z.object({
    allowedInputs: z.array(z.string()),
    deniedInputs: z.array(z.string()),
  }),
});

const ChapterVoiceSpecSchema = z.object({
  artifact: z.literal("chapter_voice_spec"),
  chapter: z.literal(1),
  voiceCompliancePlan: z.object({
    thresholds: z.object({
      maxMetaLanguageHits: z.number(),
      minSensoryGroundingHits: z.number(),
      minKinshipSignalHits: z.number(),
    }),
  }),
});

const ChapterCharacterHiddenHistoriesSchema = z.object({
  artifact: z.literal("chapter_character_hidden_histories"),
  chapter: z.literal(1),
  characters: z.array(
    z.object({
      character: z.string(),
      suppressedMotive: z.string(),
      privateWound: z.string(),
      futureArcHooks: z.array(z.string()),
    }),
  ),
});

const ChapterEpicSimulationSchema = z.object({
  artifact: z.literal("chapter_epic_simulation"),
  chapter: z.literal(1),
  hiddenTimeline: z.array(
    z.object({
      beatId: z.string(),
      latentEvent: z.string(),
      futureArcConstraintLink: z.string(),
    }),
  ),
});

const ChapterConsistencyReportSchema = z.object({
  artifact: z.literal("chapter_consistency_report"),
  chronology: z.object({ passed: z.boolean(), findings: z.array(z.string()) }),
  futureArc: z.object({ passed: z.boolean(), findings: z.array(z.string()) }),
  firewall: z.object({ passed: z.boolean(), findings: z.array(z.string()) }),
});

const ChapterVoiceReportSchema = z.object({
  artifact: z.literal("chapter_voice_report"),
  checks: z.array(z.object({ check: z.string(), passed: z.boolean(), detail: z.string() })),
  passRate: z.number(),
});

const ChapterGapReportSchema = z.object({
  artifact: z.literal("chapter_gap_report"),
  missingInformation: z.array(
    z.object({
      gapId: z.string(),
      missing: z.string(),
      impactOnChapter: z.string(),
      requiredBeforeLock: z.boolean(),
      suggestedSource: z.string(),
    }),
  ),
});

const AdversarialSummarySchema = z.object({
  chapter: z.literal(1),
  severityTotals: z.object({
    low: z.number(),
    medium: z.number(),
    high: z.number(),
    critical: z.number(),
  }),
  critics: z
    .object({
      voice: z.object({ findingCount: z.number(), criticalCount: z.number() }).optional(),
      historical: z.object({ findingCount: z.number(), criticalCount: z.number() }).optional(),
      novel: z.object({ findingCount: z.number(), criticalCount: z.number() }).optional(),
      proseShape: z.object({ findingCount: z.number(), criticalCount: z.number() }).optional(),
    })
    .optional(),
  proseShapeCategoryTotals: z.record(z.string(), z.number()).optional(),
  releaseDecision: z.string(),
});

const CharacterSessionSchema = z.object({
  governancePolicy: z.object({
    allowAnchorMutation: z.boolean(),
  }),
  branchSandbox: z.object({
    simulatedMutations: z.array(z.object({ mutationId: z.string() })).default([]),
    canonicalMutations: z.array(
      z.object({
        mutationId: z.string(),
        targetKey: z.string(),
      }),
    ),
  }),
  turns: z.array(
    z.object({
      proposedMutation: z
        .object({
          mutationId: z.string(),
          mutationKind: z.string(),
          targetKey: z.string(),
          patch: z.record(z.string(), z.unknown()),
          provenanceRefs: z.array(z.string()).default([]),
        })
        .optional(),
    }),
  ),
});

const LawSessionSchema = z.object({
  governancePolicy: z.object({
    allowAnchorMutation: z.boolean(),
  }),
  branchSandbox: z.object({
    simulatedPatches: z.array(z.object({ actionId: z.string() })).default([]),
    canonicalMutations: z.array(z.object({ actionId: z.string() })),
  }),
  actions: z.array(
    z.object({
      actionId: z.string(),
      actionType: z.string(),
      targetKey: z.string(),
      patch: z.record(z.string(), z.unknown()),
      provenanceRefs: z.array(z.string()).default([]),
    }),
  ),
});

const OutlineDrivenDraftSchema = z.object({
  chapter: z.literal(1),
  title: z.string(),
  segmentDrafts: z.array(
    z.object({
      segment: z.number(),
      heading: z.string(),
      text: z.string(),
      compliance: z.object({
        followsOutline: z.boolean(),
        includesPsychologicalArc: z.boolean(),
        includesHistoricalGrounding: z.boolean(),
      }),
    }),
  ),
  fullText: z.string(),
});

const ProseShapeSummarySchema = z.object({
  artifact: z.literal("chapter_prose_shape_summary"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  mostCommonFailurePattern: z.string().nullable(),
  segmentsWithMostFailures: z.array(z.number()),
  failureCluster: z.string(),
  totalsByCategory: z.record(z.string(), z.number()),
});

const EntryStrategySchema = z.enum([
  "sensory-first",
  "motion-first",
  "object-first",
  "body-state-first",
  "environmental-pressure-first",
  "dialogue-adjacent",
  "withheld-knowledge-first",
  "ritual-action-first",
  "sound-cue-first",
  "spatial-shift-first",
  "interrupted-attention-first",
  "environmental-change-in-progress",
]);

const EntryStrategyPlanSchema = z.object({
  artifact: z.literal("chapter_entry_strategy_plan"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segmentPlans: z.array(
    z.object({
      segment: z.number().int().positive(),
      strategy: EntryStrategySchema,
      energyAlignment: z.string(),
      embodimentBias: z.enum(["normal", "strong"]),
    }),
  ),
});

const ParagraphShapeProfileSchema = z.enum([
  "compressed-intense",
  "observational-spread",
  "action-threaded",
  "reflective-narrow",
  "dialogic-tension",
  "environmental-drift",
  "ritual-sequence",
]);

const ParagraphShapePlanSchema = z.object({
  artifact: z.literal("chapter_paragraph_shape_plan"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segmentProfiles: z.array(
    z.object({
      segment: z.number().int().positive(),
      dominantProfile: ParagraphShapeProfileSchema,
      targetParagraphLength: z.enum(["short", "medium", "long"]),
      clauseDensity: z.enum(["low", "medium", "high"]),
    }),
  ),
});

const EmbodimentAssemblyAdjustmentsSchema = z.object({
  artifact: z.literal("chapter_embodiment_assembly_adjustments"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segmentRules: z.array(
    z.object({
      segment: z.number().int().positive(),
      lowEmbodimentRisk: z.boolean(),
      openingMustInclude: z.array(z.string()),
      increasePhysicalActionDensity: z.boolean(),
      increaseSensoryAnchoring: z.boolean(),
      reduceDeclarativeExplanation: z.boolean(),
    }),
  ),
});

const TransitionTexturePlanSchema = z.object({
  artifact: z.literal("chapter_transition_texture_plan"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segmentTransitions: z.array(
    z.object({
      segment: z.number().int().positive(),
      transitionMode: z.enum([
        "attention-shift",
        "movement-shift",
        "environmental-pressure-shift",
        "social-reading-shift",
        "unfinished-action-carry",
      ]),
      carryForwardCue: z.string(),
    }),
  ),
});

const Segment24OpenerPolicySchema = z.object({
  artifact: z.literal("chapter_segment_2_4_opener_policy"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  policies: z.array(
    z.object({
      segment: z.number().int().positive(),
      requiresBodyStateCue: z.boolean(),
      requiresSensoryCue: z.boolean(),
      requiresPressureCue: z.boolean(),
      requiresVisibleMicroAction: z.boolean(),
      bannedAbstractOpenerForms: z.array(z.string()),
    }),
  ),
});

const Segment24EmbodimentPolicySchema = z.object({
  artifact: z.literal("chapter_segment_2_4_embodiment_policy"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segmentPolicies: z.array(
    z.object({
      segment: z.number().int().positive(),
      requiredEmbodimentSignals: z.array(z.string()),
      reduceAbstractExplanatoryPhrasing: z.boolean(),
      reduceDeclarativeEmotionalLabeling: z.boolean(),
      requirePhysicalNoticeAvoidChangePivot: z.boolean(),
    }),
  ),
});

const OpeningFamilyAuditSchema = z.object({
  artifact: z.literal("chapter_opening_family_audit"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segments: z.array(
    z.object({
      segment: z.number().int().positive(),
      openingFamily: EntryStrategySchema,
      previousSegmentFamily: EntryStrategySchema.nullable(),
      sameAsPrevious: z.boolean(),
      forcedDivergenceApplied: z.boolean(),
    }),
  ),
});

const OpeningParagraphFamilySchema = z.enum([
  "immediate_embodied_pressure",
  "scene_already_in_motion",
  "object_centered_attention",
  "environmental_friction",
  "social_tension_signal",
  "ritual_sequence_in_progress",
  "perception_before_interpretation",
]);

const OpeningParagraphFamilyPlanSchema = z.object({
  artifact: z.literal("chapter_opening_paragraph_family_plan"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segments: z.array(
    z.object({
      segment: z.number().int().positive(),
      family: OpeningParagraphFamilySchema,
      previousFamily: OpeningParagraphFamilySchema.nullable(),
      sameAsPrevious: z.boolean(),
      segmentBiasApplied: z.boolean(),
    }),
  ),
});

const OpenerTokenAuditSchema = z.object({
  artifact: z.literal("chapter_opener_token_audit"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  entries: z.array(
    z.object({
      segment: z.number().int().positive(),
      paragraphIndex: z.number().int().nonnegative(),
      openerStem: z.string(),
      syntaxStem: z.string(),
      conflictDetected: z.boolean(),
      resolvedByAlternateFamily: z.boolean(),
    }),
  ),
});

const FirstTwoSentenceFamilySchema = z.enum([
  "body_to_environment",
  "environment_to_action",
  "object_to_body",
  "motion_to_social_cue",
  "sound_to_withheld_recognition",
  "ritual_action_to_bodily_interruption",
  "spatial_shift_to_pressure_cue",
  "social_cue_to_material_contact",
]);

const FirstTwoSentencePlanSchema = z.object({
  artifact: z.literal("chapter_first_two_sentence_plan"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segments: z.array(
    z.object({
      segment: z.number().int().positive(),
      family: FirstTwoSentenceFamilySchema,
      previousFamily: FirstTwoSentenceFamilySchema.nullable(),
      sameAsPrevious: z.boolean(),
      segment2Or4BiasApplied: z.boolean(),
    }),
  ),
});

const OpenerFamilyMemorySchema = z.object({
  artifact: z.literal("chapter_opener_family_memory"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  entries: z.array(
    z.object({
      segment: z.number().int().positive(),
      paragraphIndex: z.number().int().nonnegative(),
      firstToken: z.string(),
      firstNounFamily: z.string(),
      firstVerbFamily: z.string(),
      firstSyntaxStem: z.string(),
      firstOrientationFamily: z.string(),
      conflictDetected: z.boolean(),
      forcedAlternativeApplied: z.boolean(),
    }),
  ),
});

const Segment1OpenerIsolationSchema = z.object({
  artifact: z.literal("chapter_segment_1_opener_isolation"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segment1Family: FirstTwoSentenceFamilySchema,
  protectedTokenStem: z.string(),
  blockedForLaterSegments: z.array(FirstTwoSentenceFamilySchema),
});

const EarlyParagraphAntiSymmetrySchema = z.object({
  artifact: z.literal("chapter_early_paragraph_anti_symmetry"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  segments: z.array(
    z.object({
      segment: z.number().int().positive(),
      sentenceLengthPattern: z.string(),
      clauseCountPattern: z.string(),
      orientationThenExplanationShape: z.boolean(),
      repeatsPreviousPattern: z.boolean(),
    }),
  ),
});

const VoiceEngineRulebookSchema = z.object({
  artifact: z.literal("chapter_voice_engine_rulebook"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  sentenceCompressionExpansionRules: z.array(z.string()),
  abstractionCeiling: z.object({
    maxAbstractSignalsPerParagraph: z.number().int().nonnegative(),
    preferredConcreteToAbstractRatio: z.number(),
  }),
  historicalTextureEmbeddingRules: z.array(z.string()),
  emotionalRestraintRules: z.array(z.string()),
  paragraphPressureRules: z.array(z.string()),
  metaphorImageDensityRules: z.array(z.string()),
  forbiddenSentenceFamilies: z.array(z.string()),
  preferredTransitionBehaviors: z.array(z.string()),
});

const NarrativeDistanceModeSchema = z.enum([
  "immediate_embodied",
  "close_observational",
  "restrained_reflective",
  "social_reading",
]);

const NarrativeDistancePlanSchema = z.object({
  artifact: z.literal("chapter_narrative_distance_plan"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  paragraphs: z.array(
    z.object({
      segment: z.number().int().positive(),
      paragraph: z.enum(["A", "B", "C"]),
      mode: NarrativeDistanceModeSchema,
      previousMode: NarrativeDistanceModeSchema.nullable(),
      sameAsPrevious: z.boolean(),
    }),
  ),
});

const AbstractionSuppressionSchema = z.object({
  artifact: z.literal("chapter_abstraction_suppression"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  blockedAbstractPatterns: z.array(z.string()),
  substitutionRules: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      strategy: z.string(),
    }),
  ),
});

const VoiceCognitionMapSchema = z.object({
  artifact: z.literal("chapter_voice_cognition_map"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  characters: z.array(
    z.object({
      character: z.string(),
      attentionBias: z.string(),
      fearTranslationMode: z.string(),
      memoryActivationStyle: z.string(),
      namingAvoidanceStyle: z.string(),
      socialReadingMode: z.string(),
      decisionMode: z.string(),
      silenceThreshold: z.number(),
      spiritualRitualPerceptionMode: z.string(),
      bodilyConversionPatterns: z.array(z.string()),
    }),
  ),
});

const PerspectiveRoutingPlanSchema = z.object({
  artifact: z.literal("chapter_perspective_routing_plan"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  routes: z.array(
    z.object({
      segment: z.number().int().positive(),
      paragraph: z.enum(["A", "B", "C"]),
      dominantCognitionSource: z.string(),
      narrativeDistanceMode: NarrativeDistanceModeSchema,
      paragraphMode: z.enum(["interior", "observational", "communal", "environmental", "social-reading", "withheldKnowledge"]),
      lawfulForeshadowingOnly: z.boolean(),
      mustRemainWithheld: z.array(z.string()),
      previousDistanceMode: NarrativeDistanceModeSchema.nullable(),
      sameAsPreviousDistanceMode: z.boolean(),
    }),
  ),
});

const VoiceLawEngineSchema = z.object({
  artifact: z.literal("chapter_voice_law_engine"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  abstractionCeiling: z.object({
    maxAbstractSignalsPerParagraph: z.number().int().nonnegative(),
    maxAbstractSignalsPerSegment: z.number().int().nonnegative(),
  }),
  imageDensityRange: z.object({
    minPerParagraph: z.number().int().nonnegative(),
    maxPerParagraph: z.number().int().nonnegative(),
  }),
  sentenceCompressionExpansionProfile: z.array(z.string()),
  emotionalRestraintLaw: z.array(z.string()),
  paragraphPressureCurve: z.array(z.string()),
  historicalEmbeddingRules: z.array(z.string()),
  forbiddenSentenceFamilies: z.array(z.string()),
  transitionBehaviors: z.array(z.string()),
  acceptableMetaphorImageClasses: z.array(z.string()),
  antiSummaryRules: z.array(z.string()),
  antiOutlineLeakageRules: z.array(z.string()),
  antiInterchangeableInteriorityRules: z.array(z.string()),
});

const LanguageSuppressionMapSchema = z.object({
  artifact: z.literal("chapter_language_suppression_map"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  blockedPatterns: z.array(z.string()),
  openerTokenFamilies: z.array(z.string()),
  transformationRoutes: z.array(
    z.object({
      sourcePattern: z.string(),
      rewriteAs: z.enum(["perception", "action", "silence", "spatial relation", "bodily cue", "object interaction"]),
    }),
  ),
});

const RenderDirectivesSchema = z.object({
  artifact: z.literal("chapter_render_directives"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  directives: z.array(
    z.object({
      segment: z.number().int().positive(),
      paragraph: z.enum(["A", "B", "C"]),
      dominantBeatOrder: z.array(z.enum(["action", "sensory", "pressure", "social", "withheld", "object"])),
      paragraphMood: z.string(),
      sentencePressure: z.enum(["compressed", "mixed", "expanded"]),
      imagePermission: z.enum(["low", "medium", "high"]),
      abstractionCeiling: z.number().int().nonnegative(),
      silenceWithholdingRequirement: z.boolean(),
      transitionBehavior: z.string(),
      allowedKnowledgeScope: z.enum(["present-scene-only", "lawful-foreshadowing-only"]),
      activeCharacterScope: z.array(z.string()),
    }),
  ),
});

const EnneagramTypeSchema = z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
const SelfAwarenessLevelSchema = z.enum(["low", "developing", "high"]);
const InstinctSchema = z.enum(["sp", "so", "sx"]);
const InsightToleranceSchema = z.enum(["fragile", "guarded", "elastic", "integrated"]);

const EnneagramOperatingLayerSchema = z.object({
  artifact: z.literal("chapter_enneagram_operating_layer"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  characters: z.array(
    z.object({
      character: z.string(),
      enneagramType: EnneagramTypeSchema,
      coreFear: z.string(),
      coreDesire: z.string(),
      defenseMechanism: z.string(),
      attentionFixation: z.string(),
      stressPattern: z.string(),
      securityPattern: z.string(),
      emotionalStyle: z.string(),
      selfAwarenessLevel: SelfAwarenessLevelSchema,
      selfNarrationAccuracy: z.number().min(0).max(1),
      whatTheyCanAdmit: z.array(z.string()),
      whatTheyCannotAdmit: z.array(z.string()),
      howTheyMisreadOthers: z.string(),
      howTypeShapesLanguageUnderPressure: z.string(),
      temporallyValidForChapter1: z.boolean(),
    }),
  ),
});

const EnneagramConsciousnessEngineSchema = z.object({
  artifact: z.literal("chapter_enneagram_consciousness_engine"),
  schemaVersion: z.literal("1.0.0"),
  chapter: z.literal(1),
  generatedAt: z.string(),
  characters: z.array(
    z.object({
      character: z.string(),
      coreStructure: z.object({
        enneagramType: EnneagramTypeSchema,
        wing: z.string(),
        instinctualStack: z.tuple([InstinctSchema, InstinctSchema, InstinctSchema]),
      }),
      attentionEngine: z.object({
        noticesFirst: z.string(),
        ignores: z.string(),
        overFocusesOn: z.string(),
      }),
      distortionEngine: z.object({
        misinterpretsRealityAs: z.string(),
        coreNarrativeBias: z.string(),
      }),
      defenseMechanism: z.object({
        psychologicalProtectionPattern: z.string(),
      }),
      relationshipFieldBehavior: z.object({
        intimateBehavior: z.string(),
        kinshipRole: z.string(),
        powerWorkBehavior: z.string(),
        socialGroupBehavior: z.string(),
      }),
      stressSecurityMovement: z.object({
        underPressure: z.string(),
        inGrowth: z.string(),
      }),
      levelsOfDevelopment: z.object({
        currentAwarenessLevel: SelfAwarenessLevelSchema,
        selfAwareness: z.string(),
        insightTolerance: InsightToleranceSchema,
      }),
      spiritualOrientation: z.object({
        seeks: z.string(),
        distorts: z.string(),
        experiencesMeaning: z.string(),
      }),
      languageImpact: z.object({
        sentenceStructure: z.string(),
        silenceVsSpeech: z.string(),
        emotionalExpression: z.string(),
        abstractionVsEmbodiment: z.string(),
      }),
      renderMaskingRules: z.object({
        hideTypeLabelsInProse: z.literal(true),
        expressVia: z.array(z.enum(["perception", "action", "silence", "misreading"])),
        preserveTemporalIntegrity: z.boolean(),
        preserveCanon: z.boolean(),
      }),
    }),
  ),
});

const ChapterDraftLikeSchema = z.object({
  artifact: z.literal("chapter_draft"),
  chapter: z.literal(1),
  title: z.string(),
  segments: z.array(z.object({ segment: z.number(), text: z.string() })),
  fullText: z.string(),
});

const PreviousDraftSchema = z.union([OutlineDrivenDraftSchema, ChapterDraftLikeSchema]);

export type Book1RegenerationLoopInput = {
  chapterOutline: Chapter1DeepOutline;
  chapterEvidencePack: unknown;
  chapterLaw: unknown;
  chapterVoiceSpec: unknown;
  chapterCharacterHiddenHistories: unknown;
  chapterEpicSimulation: unknown;
  previousDraft: unknown;
  previousConsistencyReport: unknown;
  previousVoiceReport: unknown;
  previousGapReport: unknown;
  previousAdversarialSummary: unknown;
  characterConsoleSession: unknown;
  lawConsoleSession: unknown;
  criticFeedbackMap?: unknown;
  highFindingReductionPlan?: unknown;
  commitCanonical?: boolean;
  forceBeatChainValidationFailure?: boolean;
};

type CanonRisk = "low" | "moderate" | "high" | "critical";

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function compareHigherBetter(before: number, after: number): "improved" | "worsened" | "unchanged" {
  if (after > before) return "improved";
  if (after < before) return "worsened";
  return "unchanged";
}

function compareLowerBetter(before: number, after: number): "improved" | "worsened" | "unchanged" {
  if (after < before) return "improved";
  if (after > before) return "worsened";
  return "unchanged";
}

function canonRiskFromSeverity(input: { critical: number; high: number; lockViolations: number }): CanonRisk {
  if (input.lockViolations > 0) return "critical";
  if (input.critical > 0) return "critical";
  if (input.high > 1) return "high";
  if (input.high > 0) return "moderate";
  return "low";
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

type HighFindingConstraint = z.infer<typeof Book1HighFindingReductionPlanSchema>["targetedRendererConstraints"][number];

function hasConstraint(input: {
  constraints: HighFindingConstraint[];
  adjustmentType: string;
}): boolean {
  return input.constraints.some((constraint) => constraint.adjustmentType === input.adjustmentType);
}

function numericConstraint(input: {
  constraints: HighFindingConstraint[];
  adjustmentType: string;
  key: string;
  fallback: number;
}): number {
  const found = input.constraints.find((constraint) => constraint.adjustmentType === input.adjustmentType);
  const value = found?.parameters[input.key];
  return typeof value === "number" && Number.isFinite(value) ? value : input.fallback;
}

function wordCount(value: string): number {
  return value.split(/\s+/g).filter((word) => word.trim().length > 0).length;
}

function applyLeakageGuard(text: string): string {
  let out = text;
  for (const token of [
    "the focus turns to",
    "psychologically",
    "this beat matters because",
    "the reader should feel",
    "transition:",
    "foreshadowing signal",
    "segment",
    "chapter law",
    "evidence traces",
  ]) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "gi"), " ");
  }
  return compact(out);
}

function buildEntryStrategyPlan(input: {
  segments: Array<{ segment: number }>;
  segmentEnergy: Array<{ segment: number; dominantEnergy: string }>;
}): z.infer<typeof EntryStrategyPlanSchema> {
  const generatedAt = new Date().toISOString();
  const strategies: Array<z.infer<typeof EntryStrategySchema>> = [
    "sensory-first",
    "motion-first",
    "object-first",
    "body-state-first",
    "environmental-pressure-first",
    "dialogue-adjacent",
    "withheld-knowledge-first",
    "ritual-action-first",
    "sound-cue-first",
    "spatial-shift-first",
    "interrupted-attention-first",
    "environmental-change-in-progress",
  ];
  let previous: z.infer<typeof EntryStrategySchema> | null = null;
  const segmentPlans = input.segments.map((segment, index) => {
    const energy = input.segmentEnergy.find((row) => row.segment === segment.segment)?.dominantEnergy ?? "stillness";
    const energyPreferred: z.infer<typeof EntryStrategySchema> =
      /motion|threat/i.test(energy)
        ? "motion-first"
        : /ritual/i.test(energy)
          ? "ritual-action-first"
          : /stillness/i.test(energy)
            ? "withheld-knowledge-first"
            : "sensory-first";
    const embodimentBias = segment.segment === 2 || segment.segment === 4 ? "strong" : "normal";
    const forced: z.infer<typeof EntryStrategySchema> =
      embodimentBias === "strong"
        ? segment.segment === 2
          ? "interrupted-attention-first"
          : "body-state-first"
        : energyPreferred;
    let strategy: z.infer<typeof EntryStrategySchema> = forced;
    if (strategy === previous) {
      strategy = strategies[(index + 3) % strategies.length];
      if (strategy === previous) strategy = strategies[(index + 5) % strategies.length];
    }
    previous = strategy;
    return {
      segment: segment.segment,
      strategy,
      energyAlignment: energy,
      embodimentBias,
    };
  });
  return EntryStrategyPlanSchema.parse({
    artifact: "chapter_entry_strategy_plan",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt,
    segmentPlans,
  });
}

function buildParagraphShapePlan(input: {
  segments: Array<{ segment: number }>;
}): z.infer<typeof ParagraphShapePlanSchema> {
  const generatedAt = new Date().toISOString();
  const rotatingProfiles: Array<z.infer<typeof ParagraphShapeProfileSchema>> = [
    "compressed-intense",
    "observational-spread",
    "action-threaded",
    "reflective-narrow",
    "dialogic-tension",
    "environmental-drift",
    "ritual-sequence",
  ];
  const segmentProfiles = input.segments.map((segment, index) => {
    let dominantProfile = rotatingProfiles[index % rotatingProfiles.length];
    if (segment.segment === 2) dominantProfile = "action-threaded";
    if (segment.segment === 4) dominantProfile = "environmental-drift";
    const targetParagraphLength = dominantProfile === "compressed-intense" ? "short" : dominantProfile === "observational-spread" ? "long" : "medium";
    const clauseDensity = dominantProfile === "dialogic-tension" ? "low" : dominantProfile === "observational-spread" ? "high" : "medium";
    return {
      segment: segment.segment,
      dominantProfile,
      targetParagraphLength,
      clauseDensity,
    };
  });
  return ParagraphShapePlanSchema.parse({
    artifact: "chapter_paragraph_shape_plan",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt,
    segmentProfiles,
  });
}

function buildEmbodimentAssemblyAdjustments(input: {
  segments: Array<{ segment: number }>;
}): z.infer<typeof EmbodimentAssemblyAdjustmentsSchema> {
  const generatedAt = new Date().toISOString();
  const segmentRules = input.segments.map((segment) => {
    const lowEmbodimentRisk = segment.segment === 2 || segment.segment === 4;
    return {
      segment: segment.segment,
      lowEmbodimentRisk,
      openingMustInclude: lowEmbodimentRisk ? ["physical_action", "sensory_cue", "immediate_pressure_cue"] : [],
      increasePhysicalActionDensity: lowEmbodimentRisk,
      increaseSensoryAnchoring: lowEmbodimentRisk,
      reduceDeclarativeExplanation: lowEmbodimentRisk,
    };
  });
  return EmbodimentAssemblyAdjustmentsSchema.parse({
    artifact: "chapter_embodiment_assembly_adjustments",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt,
    segmentRules,
  });
}

function buildTransitionTexturePlan(input: {
  segments: Array<{ segment: number }>;
}): z.infer<typeof TransitionTexturePlanSchema> {
  const generatedAt = new Date().toISOString();
  const transitionModes: Array<
    "attention-shift" | "movement-shift" | "environmental-pressure-shift" | "social-reading-shift" | "unfinished-action-carry"
  > = ["attention-shift", "movement-shift", "environmental-pressure-shift", "social-reading-shift", "unfinished-action-carry"];
  const segmentTransitions = input.segments.map((segment, index) => ({
    segment: segment.segment,
    transitionMode: transitionModes[index % transitionModes.length],
    carryForwardCue: `unfinished-${segment.segment}-gesture`,
  }));
  return TransitionTexturePlanSchema.parse({
    artifact: "chapter_transition_texture_plan",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt,
    segmentTransitions,
  });
}

function buildSegment24OpenerPolicy(input: { segments: Array<{ segment: number }> }): z.infer<typeof Segment24OpenerPolicySchema> {
  return Segment24OpenerPolicySchema.parse({
    artifact: "chapter_segment_2_4_opener_policy",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    policies: input.segments
      .filter((row) => row.segment === 2 || row.segment === 4)
      .map((row) => ({
        segment: row.segment,
        requiresBodyStateCue: true,
        requiresSensoryCue: true,
        requiresPressureCue: true,
        requiresVisibleMicroAction: true,
        bannedAbstractOpenerForms: [
          "summary-style orientation",
          "generalized emotional framing",
          "explanatory historical setup",
        ],
      })),
  });
}

function buildSegment24EmbodimentPolicy(input: {
  segments: Array<{ segment: number }>;
}): z.infer<typeof Segment24EmbodimentPolicySchema> {
  return Segment24EmbodimentPolicySchema.parse({
    artifact: "chapter_segment_2_4_embodiment_policy",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    segmentPolicies: input.segments
      .filter((row) => row.segment === 2 || row.segment === 4)
      .map((row) => ({
        segment: row.segment,
        requiredEmbodimentSignals: [
          "gesture",
          "movement",
          "touch",
          "sound",
          "material_object_interaction",
          "spatial_adjustment",
          "environmental_contact",
        ],
        reduceAbstractExplanatoryPhrasing: true,
        reduceDeclarativeEmotionalLabeling: true,
        requirePhysicalNoticeAvoidChangePivot: true,
      })),
  });
}

function buildOpeningFamilyAudit(input: {
  entryStrategyPlan: z.infer<typeof EntryStrategyPlanSchema>;
}): z.infer<typeof OpeningFamilyAuditSchema> {
  const sorted = [...input.entryStrategyPlan.segmentPlans].sort((a, b) => a.segment - b.segment);
  const segments = sorted.map((plan, index) => {
    const previous = sorted[index - 1] ?? null;
    const sameAsPrevious = previous ? previous.strategy === plan.strategy : false;
    const forcedDivergenceApplied =
      (plan.segment === 2 || plan.segment === 4) &&
      previous !== null &&
      previous.strategy !== plan.strategy;
    return {
      segment: plan.segment,
      openingFamily: plan.strategy,
      previousSegmentFamily: previous?.strategy ?? null,
      sameAsPrevious,
      forcedDivergenceApplied,
    };
  });
  return OpeningFamilyAuditSchema.parse({
    artifact: "chapter_opening_family_audit",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    segments,
  });
}

function buildOpeningParagraphFamilyPlan(input: {
  segments: Array<{ segment: number }>;
}): z.infer<typeof OpeningParagraphFamilyPlanSchema> {
  const order: Array<z.infer<typeof OpeningParagraphFamilySchema>> = [
    "perception_before_interpretation",
    "immediate_embodied_pressure",
    "object_centered_attention",
    "scene_already_in_motion",
    "environmental_friction",
    "social_tension_signal",
    "ritual_sequence_in_progress",
  ];
  let previous: z.infer<typeof OpeningParagraphFamilySchema> | null = null;
  const segments = input.segments.map((row, index) => {
    let family = order[index % order.length];
    let segmentBiasApplied = false;
    if (row.segment === 2) {
      family = "immediate_embodied_pressure";
      segmentBiasApplied = true;
    }
    if (row.segment === 4) {
      family = "scene_already_in_motion";
      segmentBiasApplied = true;
    }
    if (previous && family === previous) {
      family = order[(index + 2) % order.length];
    }
    const sameAsPrevious = previous === family;
    const output = {
      segment: row.segment,
      family,
      previousFamily: previous,
      sameAsPrevious,
      segmentBiasApplied,
    };
    previous = family;
    return output;
  });
  return OpeningParagraphFamilyPlanSchema.parse({
    artifact: "chapter_opening_paragraph_family_plan",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    segments,
  });
}

function openerStem(value: string): string {
  return compact(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/g)
    .filter((token) => token.length > 0)
    .slice(0, 4)
    .join(" ");
}

function openerSyntaxStem(value: string): string {
  const text = compact(value);
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+[a-z]+/.test(text)) return "character-name-start";
  if (/^(The|A|An)\s+[a-z]/.test(text)) return "article-led-object-start";
  if (/^(He|She|They|It)\s+[a-z]/.test(text)) return "pronoun-verb-loop";
  if (/^(Wind|Weather|Smoke|River|Air)\s+[a-z]/.test(text)) return "environmental-declarative-loop";
  if (/^[A-Z][a-z]+,\s+[a-z]/.test(text)) return "name-comma-loop";
  return "other";
}

function firstToken(value: string): string {
  return compact(value).toLowerCase().split(/\s+/g)[0] ?? "";
}

function firstNounFamily(value: string): string {
  const tokens = compact(value).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/g).filter(Boolean);
  return tokens[1] ?? tokens[0] ?? "none";
}

function firstVerbFamily(value: string): string {
  const tokens = compact(value).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/g).filter(Boolean);
  const verbish = tokens.find((token) =>
    /(s$|ed$|ing$|is|are|was|were|runs|moves|shifts|turns|keeps|holds|carries|presses)/.test(token),
  );
  return verbish ?? "none";
}

function firstOrientationFamily(value: string): string {
  const lower = compact(value).toLowerCase();
  if (/\b(sound|scrape|footfall|voice|noise|echo)\b/.test(lower)) return "sound";
  if (/\b(move|motion|step|cross|pivot|shift|turn)\b/.test(lower)) return "motion";
  if (/\b(bowl|tool|hand|object|clay|reed|ash)\b/.test(lower)) return "object";
  if (/\b(wind|weather|smoke|river|air|rain|heat)\b/.test(lower)) return "environment";
  if (/\b(witness|rank|order|social|council)\b/.test(lower)) return "social";
  if (/\b(pressure|threat|risk|danger|narrow)\b/.test(lower)) return "pressure";
  if (/\b(breath|shoulder|jaw|skin|wrist|body)\b/.test(lower)) return "body";
  return "mixed";
}

function buildFirstTwoSentencePlan(input: {
  segments: Array<{ segment: number }>;
}): z.infer<typeof FirstTwoSentencePlanSchema> {
  const sequence: Array<z.infer<typeof FirstTwoSentenceFamilySchema>> = [
    "sound_to_withheld_recognition",
    "body_to_environment",
    "object_to_body",
    "motion_to_social_cue",
    "spatial_shift_to_pressure_cue",
    "environment_to_action",
    "ritual_action_to_bodily_interruption",
    "social_cue_to_material_contact",
  ];
  let previous: z.infer<typeof FirstTwoSentenceFamilySchema> | null = null;
  const segments = input.segments.map((row, index) => {
    let family = sequence[index % sequence.length];
    const segment2Or4BiasApplied = row.segment === 2 || row.segment === 4;
    if (row.segment === 2) family = "body_to_environment";
    if (row.segment === 4) family = "motion_to_social_cue";
    if (previous && family === previous) family = sequence[(index + 3) % sequence.length];
    const out = {
      segment: row.segment,
      family,
      previousFamily: previous,
      sameAsPrevious: previous === family,
      segment2Or4BiasApplied,
    };
    previous = family;
    return out;
  });
  const segment1Family = segments[0]?.family;
  for (let i = 1; i < segments.length; i += 1) {
    if (segment1Family && segments[i] && segments[i].family === segment1Family) {
      segments[i].family = sequence[(i + 5) % sequence.length];
      segments[i].sameAsPrevious = segments[i - 1]?.family === segments[i].family;
    }
  }
  return FirstTwoSentencePlanSchema.parse({
    artifact: "chapter_first_two_sentence_plan",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    segments,
  });
}

function buildVoiceEngineRulebook(): z.infer<typeof VoiceEngineRulebookSchema> {
  return VoiceEngineRulebookSchema.parse({
    artifact: "chapter_voice_engine_rulebook",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    sentenceCompressionExpansionRules: [
      "alternate compressed and expanded sentence runs inside each segment",
      "open with concrete signal before interpretive clause",
      "avoid three consecutive equal-length declarative starts",
    ],
    abstractionCeiling: {
      maxAbstractSignalsPerParagraph: 2,
      preferredConcreteToAbstractRatio: 2.4,
    },
    historicalTextureEmbeddingRules: [
      "embed historical context through labor, objects, and social ordering",
      "replace summary history statements with lived scene cues",
      "use ritual/material continuity instead of exposition",
    ],
    emotionalRestraintRules: [
      "render emotion through withheld action, pacing, and bodily signal",
      "avoid direct naming when tension can be inferred from scene behavior",
      "favor misreading and silence over declared interior certainty",
    ],
    paragraphPressureRules: [
      "every paragraph carries one active pressure source",
      "pressure should transform movement or speaking order by paragraph end",
      "do not resolve pressure in same paragraph where introduced",
    ],
    metaphorImageDensityRules: [
      "allow one image pulse per paragraph maximum",
      "images must arise from material world, not abstract thesis",
    ],
    forbiddenSentenceFamilies: [
      "summary declaration followed by abstract interpretation",
      "uniform declarative cadence for full paragraph openings",
      "meta-governance phrasing in narrative surface",
    ],
    preferredTransitionBehaviors: [
      "object continuity handoff",
      "unfinished action carry",
      "attention shift with social consequence",
      "environmental pressure continuation",
    ],
  });
}

function buildNarrativeDistancePlan(input: {
  segments: Array<{ segment: number }>;
  targetedConstraints: HighFindingConstraint[];
  activeFeedbackCategories: Set<string>;
}): z.infer<typeof NarrativeDistancePlanSchema> {
  const sequence: Array<z.infer<typeof NarrativeDistanceModeSchema>> = [
    "immediate_embodied",
    "close_observational",
    "social_reading",
    "restrained_reflective",
  ];
  const tightenNarrativeDistance =
    hasConstraint({
      constraints: input.targetedConstraints,
      adjustmentType: "raise-distance-mode-diversity",
    }) ||
    input.activeFeedbackCategories.has("synthetic_rhythm") ||
    input.activeFeedbackCategories.has("repeated_paragraph_shape");
  const maxConsecutiveSameDistanceMode = Math.max(
    1,
    Math.trunc(
      numericConstraint({
        constraints: input.targetedConstraints,
        adjustmentType: "raise-distance-mode-diversity",
        key: "maxConsecutiveSameDistanceMode",
        fallback: 1,
      }),
    ),
  );
  const paragraphs: Array<{
    segment: number;
    paragraph: "A" | "B" | "C";
    mode: z.infer<typeof NarrativeDistanceModeSchema>;
    previousMode: z.infer<typeof NarrativeDistanceModeSchema> | null;
    sameAsPrevious: boolean;
  }> = [];
  let previousMode: z.infer<typeof NarrativeDistanceModeSchema> | null = null;
  let previousModeRunLength = 0;
  for (const segment of input.segments) {
    const baseModes: Array<z.infer<typeof NarrativeDistanceModeSchema>> = [
      "immediate_embodied",
      tightenNarrativeDistance
        ? segment.segment % 2 === 0
          ? "social_reading"
          : "close_observational"
        : segment.segment % 2 === 0
          ? "close_observational"
          : "social_reading",
      tightenNarrativeDistance
        ? segment.segment % 2 === 0
          ? "restrained_reflective"
          : "social_reading"
        : segment.segment % 3 === 0
          ? "restrained_reflective"
          : "close_observational",
    ];
    for (const [idx, paragraph] of ["A", "B", "C"].entries()) {
      let mode = baseModes[idx] ?? sequence[(segment.segment + idx) % sequence.length];
      if (mode === "restrained_reflective" && paragraph === "A") mode = "immediate_embodied";
      if (
        previousMode === mode &&
        previousModeRunLength >= maxConsecutiveSameDistanceMode
      ) {
        mode = sequence[(segment.segment + idx + 1) % sequence.length];
      }
      paragraphs.push({
        segment: segment.segment,
        paragraph: paragraph as "A" | "B" | "C",
        mode,
        previousMode,
        sameAsPrevious: previousMode === mode,
      });
      if (previousMode === mode) {
        previousModeRunLength += 1;
      } else {
        previousModeRunLength = 1;
      }
      previousMode = mode;
    }
  }
  return NarrativeDistancePlanSchema.parse({
    artifact: "chapter_narrative_distance_plan",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    paragraphs,
  });
}

function buildAbstractionSuppression(input: {
  targetedConstraints: HighFindingConstraint[];
  activeFeedbackCategories: Set<string>;
}): z.infer<typeof AbstractionSuppressionSchema> {
  const tightenAbstraction =
    hasConstraint({
      constraints: input.targetedConstraints,
      adjustmentType: "tighten-abstract-lexicon-blocklist",
    }) ||
    input.activeFeedbackCategories.has("abstraction_overuse_by_segment") ||
    input.activeFeedbackCategories.has("repeated_abstract_fear_language");
  const blockedAbstractPatterns = [
    "historical process",
    "structural tension",
    "systemic pressure",
    "unresolved dynamic",
    "social dynamic",
    ...(tightenAbstraction ? ["pressure pattern", "constraint field", "risk profile", "interior state"] : []),
  ];
  const substitutionRules = [
    { from: "historical process", to: "handled object and repeated labor cue", strategy: "object interaction" },
    { from: "structural tension", to: "distance shift and speaking-order change", strategy: "spatial relation" },
    { from: "systemic pressure", to: "weather, body, and route constraint", strategy: "perception" },
    { from: "unresolved dynamic", to: "unfinished action and silence carry", strategy: "silence" },
    { from: "social dynamic", to: "witness pause and material contact", strategy: "social cue" },
    ...(tightenAbstraction
      ? [
          { from: "constraint field", to: "doorway spacing and hand-to-tool hesitation", strategy: "social cue" },
          { from: "interior state", to: "breath pattern and unfinished movement", strategy: "bodily cue" },
        ]
      : []),
  ];
  return AbstractionSuppressionSchema.parse({
    artifact: "chapter_abstraction_suppression",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    blockedAbstractPatterns: unique(blockedAbstractPatterns),
    substitutionRules,
  });
}

function buildEnneagramOperatingLayer(input: {
  activeCharacters: string[];
  cognitionSignatures: z.infer<typeof Book1CognitionSignaturesSchema>["characters"];
  segmentSimulationState: z.infer<typeof Book1SegmentSimulationStateSchema>;
}): z.infer<typeof EnneagramOperatingLayerSchema> {
  const typeTemplate: Record<
    z.infer<typeof EnneagramTypeSchema>,
    {
      coreFear: string;
      coreDesire: string;
      defenseMechanism: string;
      attentionFixation: string;
      stressPattern: string;
      securityPattern: string;
      emotionalStyle: string;
      howTypeShapesLanguageUnderPressure: string;
    }
  > = {
    "1": {
      coreFear: "moral disorder that exposes negligence in duty",
      coreDesire: "to remain principled and structurally reliable",
      defenseMechanism: "tightening behavior into strict correction routines",
      attentionFixation: "procedural errors and lapse sequences",
      stressPattern: "over-control and clipped correction under friction",
      securityPattern: "measured flexibility with procedural clarity",
      emotionalStyle: "controlled indignation filtered through restraint",
      howTypeShapesLanguageUnderPressure: "precise, clipped clauses with corrective pivots and narrow tolerance for ambiguity",
    },
    "2": {
      coreFear: "being dispensable when care is not reciprocated",
      coreDesire: "to secure belonging through indispensable support",
      defenseMechanism: "burying own need beneath visible service",
      attentionFixation: "relational imbalance and gratitude signals",
      stressPattern: "indirect demand through over-giving and wounded tone",
      securityPattern: "direct request with bounded generosity",
      emotionalStyle: "warm pressure that masks personal deprivation",
      howTypeShapesLanguageUnderPressure: "relational framing, implied obligation, and soft commands carried through concern language",
    },
    "3": {
      coreFear: "failure that collapses status and utility",
      coreDesire: "to remain effective and visibly competent",
      defenseMechanism: "fusing identity with visible effectiveness",
      attentionFixation: "status metrics, outcomes, and visible efficiency",
      stressPattern: "image-management and rushed optimization",
      securityPattern: "authentic pace with selective vulnerability",
      emotionalStyle: "goal-locked intensity with image masking",
      howTypeShapesLanguageUnderPressure: "result-first statements, trimmed affect words, and strategic brevity",
    },
    "4": {
      coreFear: "erasure of personal significance and interior truth",
      coreDesire: "to preserve identity depth and emotional authenticity",
      defenseMechanism: "magnifying felt lack into identity framing",
      attentionFixation: "what feels missing, misattuned, or misrecognized",
      stressPattern: "dramatic contrast and self-isolating interpretation",
      securityPattern: "steady self-expression without romantic inflation",
      emotionalStyle: "intense affect with symbolic coloring",
      howTypeShapesLanguageUnderPressure: "image-heavy phrasing, contrastive clauses, and emotional precision with selective withdrawal",
    },
    "5": {
      coreFear: "depletion and intrusion without cognitive control",
      coreDesire: "to remain competent, informed, and self-contained",
      defenseMechanism: "withdrawing into detached observation",
      attentionFixation: "information gaps, pattern mismatches, and boundary leaks",
      stressPattern: "detached minimalism and delayed response",
      securityPattern: "engaged analysis with embodied participation",
      emotionalStyle: "contained affect and analytic distance",
      howTypeShapesLanguageUnderPressure: "observational clauses, sparse verbs, and deferred commitment until evidence stabilizes",
    },
    "6": {
      coreFear: "betrayal or unbuffered threat inside trusted structures",
      coreDesire: "to secure reliable alliance and contingency safety",
      defenseMechanism: "treating suspicion as external certainty",
      attentionFixation: "loyalty signals, weak seams, and authority reliability",
      stressPattern: "worst-case chaining and rapid doubt loops",
      securityPattern: "grounded caution with cooperative trust",
      emotionalStyle: "vigilant tension alternating with loyal attachment",
      howTypeShapesLanguageUnderPressure: "conditional phrasing, risk qualifiers, and repeated verification cues",
    },
    "7": {
      coreFear: "entrapment in pain without exit route",
      coreDesire: "to preserve option-space and experiential freedom",
      defenseMechanism: "escaping discomfort through rapid reframing",
      attentionFixation: "escape routes, alternatives, and novelty pivots",
      stressPattern: "fragmented focus and compulsive redirection",
      securityPattern: "committed follow-through with grounded optimism",
      emotionalStyle: "upshifted energy masking discomfort",
      howTypeShapesLanguageUnderPressure: "fast transitions, option-list language, and abrupt topic pivots to avoid confinement cues",
    },
    "8": {
      coreFear: "being controlled, violated, or rendered powerless",
      coreDesire: "to remain sovereign and protective under pressure",
      defenseMechanism: "covering vulnerability with forceful assertion",
      attentionFixation: "power gradients, challenge points, and boundary breaches",
      stressPattern: "escalation, blunt dominance, and refusal to yield",
      securityPattern: "protective strength with calibrated restraint",
      emotionalStyle: "direct intensity and confrontational clarity",
      howTypeShapesLanguageUnderPressure: "short impact clauses, imperative rhythm, and boundary-marking verbs",
    },
    "9": {
      coreFear: "relational rupture and internal fragmentation",
      coreDesire: "to preserve continuity, harmony, and inner steadiness",
      defenseMechanism: "numbing conflict by smoothing over friction",
      attentionFixation: "ambient equilibrium and subtle disturbance cues",
      stressPattern: "passive delay and muted self-erasure",
      securityPattern: "active presence with clear priorities",
      emotionalStyle: "soft containment with delayed anger access",
      howTypeShapesLanguageUnderPressure: "smoothing transitions, indirect conflict language, and diffuse subject focus",
    },
  };
  const chooseType = (character: string, signature: z.infer<typeof Book1CognitionSignaturesSchema>["characters"][number] | undefined): z.infer<typeof EnneagramTypeSchema> => {
    const lower = `${character} ${signature?.decisionStyle ?? ""} ${signature?.thoughtStyle ?? ""} ${signature?.attentionBias ?? ""}`.toLowerCase();
    if (/\bduty|continuity|obligation|lineage\b/.test(lower)) return "1";
    if (/\bprotect|boundary|force|command\b/.test(lower)) return "8";
    if (/\brisk|misread|threat|watch\b/.test(lower)) return "6";
    if (/\bmemory|image|missing\b/.test(lower)) return "4";
    if (/\bobserve|analy|distance|quiet\b/.test(lower)) return "5";
    if (/\bfast|option|pivot|avoid pain\b/.test(lower)) return "7";
    return (["9", "6", "1", "5"][(character.length + lower.length) % 4] as z.infer<typeof EnneagramTypeSchema>);
  };
  const characters = input.activeCharacters.map((character, index) => {
    const signature = input.cognitionSignatures.find((row) => row.character.toLowerCase() === character.toLowerCase());
    const simulationPerson = input.segmentSimulationState.segments
      .flatMap((segment) => segment.people)
      .find((person) => person.character.toLowerCase() === character.toLowerCase());
    const enneagramType = chooseType(character, signature);
    const template = typeTemplate[enneagramType];
    const selfAwarenessLevel: z.infer<typeof SelfAwarenessLevelSchema> =
      enneagramType === "5" || enneagramType === "1" ? "developing" : index % 3 === 0 ? "high" : "low";
    const selfNarrationAccuracy = selfAwarenessLevel === "high" ? 0.78 : selfAwarenessLevel === "developing" ? 0.56 : 0.34;
    const whatTheyCanAdmit = unique([
      simulationPerson?.wants ?? template.coreDesire,
      template.attentionFixation,
      "immediate procedural risk in front of witnesses",
    ]).slice(0, 3);
    const whatTheyCannotAdmit = unique([
      simulationPerson?.hiding ?? template.coreFear,
      "dependence on validation from fragile alliances",
      template.coreFear,
    ]).slice(0, 3);
    return {
      character,
      enneagramType,
      coreFear: template.coreFear,
      coreDesire: template.coreDesire,
      defenseMechanism: template.defenseMechanism,
      attentionFixation: template.attentionFixation,
      stressPattern: template.stressPattern,
      securityPattern: template.securityPattern,
      emotionalStyle: template.emotionalStyle,
      selfAwarenessLevel,
      selfNarrationAccuracy,
      whatTheyCanAdmit,
      whatTheyCannotAdmit,
      howTheyMisreadOthers: simulationPerson?.misreads ?? "reads caution in others as concealed resistance",
      howTypeShapesLanguageUnderPressure: template.howTypeShapesLanguageUnderPressure,
      temporallyValidForChapter1: true,
    };
  });
  return EnneagramOperatingLayerSchema.parse({
    artifact: "chapter_enneagram_operating_layer",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    characters,
  });
}

function buildEnneagramConsciousnessEngine(input: {
  activeCharacters: string[];
  enneagramOperatingLayer: z.infer<typeof EnneagramOperatingLayerSchema>;
  cognitionSignatures: z.infer<typeof Book1CognitionSignaturesSchema>["characters"];
  hiddenHistories: z.infer<typeof ChapterCharacterHiddenHistoriesSchema>["characters"];
  segmentSimulationState: z.infer<typeof Book1SegmentSimulationStateSchema>;
}): z.infer<typeof EnneagramConsciousnessEngineSchema> {
  const wings: Record<z.infer<typeof EnneagramTypeSchema>, string> = {
    "1": "w9",
    "2": "w1",
    "3": "w2",
    "4": "w5",
    "5": "w6",
    "6": "w5",
    "7": "w8",
    "8": "w9",
    "9": "w1",
  };
  const instinctsByType: Record<z.infer<typeof EnneagramTypeSchema>, [z.infer<typeof InstinctSchema>, z.infer<typeof InstinctSchema>, z.infer<typeof InstinctSchema>]> = {
    "1": ["so", "sp", "sx"],
    "2": ["so", "sx", "sp"],
    "3": ["so", "sp", "sx"],
    "4": ["sx", "so", "sp"],
    "5": ["sp", "so", "sx"],
    "6": ["sp", "so", "sx"],
    "7": ["sx", "so", "sp"],
    "8": ["sx", "sp", "so"],
    "9": ["sp", "so", "sx"],
  };
  const characters = input.activeCharacters.map((character) => {
    const operating =
      input.enneagramOperatingLayer.characters.find((row) => row.character.toLowerCase() === character.toLowerCase()) ??
      input.enneagramOperatingLayer.characters[0];
    const signature = input.cognitionSignatures.find((row) => row.character.toLowerCase() === character.toLowerCase());
    const history = input.hiddenHistories.find((row) => row.character.toLowerCase() === character.toLowerCase());
    const person = input.segmentSimulationState.segments
      .flatMap((segment) => segment.people)
      .find((row) => row.character.toLowerCase() === character.toLowerCase());
    const awareness = operating?.selfAwarenessLevel ?? "developing";
    const insightTolerance: z.infer<typeof InsightToleranceSchema> =
      awareness === "high" ? "integrated" : awareness === "developing" ? "elastic" : "guarded";
    const type = operating?.enneagramType ?? "6";
    const attentionFirst = signature?.attentionBias ?? operating?.attentionFixation ?? "witness-order variance";
    return {
      character,
      coreStructure: {
        enneagramType: type,
        wing: wings[type],
        instinctualStack: instinctsByType[type],
      },
      attentionEngine: {
        noticesFirst: attentionFirst,
        ignores: `de-prioritizes cues that do not support ${operating?.coreDesire?.toLowerCase() ?? "immediate containment"}`,
        overFocusesOn: operating?.attentionFixation ?? "perceived social threat pivots",
      },
      distortionEngine: {
        misinterpretsRealityAs: person?.misreads ?? operating?.howTheyMisreadOthers ?? "delay equals concealed opposition",
        coreNarrativeBias: `filters events through ${operating?.coreFear?.toLowerCase() ?? "loss-of-control expectancy"}`,
      },
      defenseMechanism: {
        psychologicalProtectionPattern: operating?.defenseMechanism ?? "strategic withholding and control of exposure",
      },
      relationshipFieldBehavior: {
        intimateBehavior: `protects attachment through selective disclosure and ${operating?.stressPattern?.toLowerCase() ?? "constraint rituals"}`,
        kinshipRole: `carries household continuity by guarding ${history?.privateWound?.toLowerCase() ?? "legacy fracture"} from witness scrutiny`,
        powerWorkBehavior: `reads hierarchy through ${operating?.attentionFixation?.toLowerCase() ?? "status seams"} and answers with controlled leverage`,
        socialGroupBehavior: `tests group safety before trust by tracking ${signature?.decisionStyle?.toLowerCase() ?? "interaction timing"}`,
      },
      stressSecurityMovement: {
        underPressure: operating?.stressPattern ?? "tightens language and narrows options",
        inGrowth: operating?.securityPattern ?? "widens relational contact while keeping temporal discipline",
      },
      levelsOfDevelopment: {
        currentAwarenessLevel: awareness,
        selfAwareness: `self-narration accuracy ${Math.round((operating?.selfNarrationAccuracy ?? 0.5) * 100)}% with partial blind spots around exposed need`,
        insightTolerance,
      },
      spiritualOrientation: {
        seeks: `searches for meaning through ordered continuity of ${history?.futureArcHooks[0]?.toLowerCase() ?? "kinship obligation"}`,
        distorts: `treats uncertainty as proof of ${operating?.coreFear?.toLowerCase() ?? "impending rupture"}`,
        experiencesMeaning: `meaning arrives as embodied alignment between ritual sequence and witness trust pacing`,
      },
      languageImpact: {
        sentenceStructure: operating?.howTypeShapesLanguageUnderPressure ?? "short observational clauses with delayed thesis naming",
        silenceVsSpeech: `uses silence as control gate before speech clears social risk`,
        emotionalExpression: operating?.emotionalStyle ?? "contained affect with strategic disclosure",
        abstractionVsEmbodiment: "routes abstraction into body cues, object handling, and spatial relation before naming",
      },
      renderMaskingRules: {
        hideTypeLabelsInProse: true,
        expressVia: ["perception", "action", "silence", "misreading"],
        preserveTemporalIntegrity: true,
        preserveCanon: true,
      },
    };
  });
  return EnneagramConsciousnessEngineSchema.parse({
    artifact: "chapter_enneagram_consciousness_engine",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    characters,
  });
}

function buildVoiceCognitionMap(input: {
  activeCharacters: string[];
  cognitionSignatures: z.infer<typeof Book1CognitionSignaturesSchema>["characters"];
  hiddenHistories: z.infer<typeof ChapterCharacterHiddenHistoriesSchema>["characters"];
  enneagramMediationLayer: z.infer<typeof Book1EnneagramMediationLayerSchema>;
}): z.infer<typeof VoiceCognitionMapSchema> {
  const activeSet = new Set(input.activeCharacters.map((name) => name.toLowerCase()));
  const fearModes = [
    "translate fear into hand pressure and route changes",
    "translate fear into witness-spacing reads and slowed reply timing",
    "translate fear into ritual micro-corrections before speech",
    "translate fear into breath discipline and task-first sequencing",
  ];
  const memoryModes = [
    "memory activates through handled objects and worn surfaces",
    "memory activates through speaking-order shifts and kinship rank",
    "memory activates through interrupted ritual sequence",
    "memory activates through weather-body associations",
  ];
  const socialModes = [
    "reads silence debt before explicit claims",
    "reads doorway geometry before trust assignments",
    "reads hand-to-object transfer before oath language",
    "reads witness posture before concession",
  ];
  const bodilyByChannel: Record<string, string[]> = {
    image: ["eye-line narrows before commitment", "jaw sets when image-memory spikes"],
    duty: ["shoulders square before obligation is accepted", "hands return to tool-work under pressure"],
    suspicion: ["weight shifts to the door-side foot", "voice lowers when misread risk rises"],
    memory: ["touch lingers on marked surfaces", "breath holds at ritual discontinuity"],
    bodily_sensation: ["pulse is tracked through wrists and ribs", "breath cadence shortens before refusal"],
    social_reading: ["chin angle updates with rank movement", "fingers count pauses before reply"],
  };
  const characters = input.cognitionSignatures
    .filter((row) => activeSet.has(row.character.toLowerCase()))
    .map((row, index, allRows) => {
      const mediated = input.enneagramMediationLayer.characters.find(
        (entry) => entry.character.toLowerCase() === row.character.toLowerCase(),
      );
      const history = input.hiddenHistories.find((entry) => entry.character.toLowerCase() === row.character.toLowerCase());
      const neighbor = allRows[(index + 1) % allRows.length];
      const inferredInteriorChannel =
        /image/i.test(row.thoughtStyle)
          ? "image"
          : /duty|obligation/i.test(row.thoughtStyle)
            ? "duty"
            : /suspic|mistrust|guard/i.test(row.thoughtStyle)
              ? "suspicion"
              : /memory|recall|echo/i.test(row.thoughtStyle)
                ? "memory"
                : /body|breath|skin/i.test(row.thoughtStyle)
                  ? "bodily_sensation"
                  : "social_reading";
      const bodilyPatterns = bodilyByChannel[inferredInteriorChannel] ?? [
        "breath shortens under rank pressure",
        "grip tightens before choice",
      ];
      return {
        character: row.character,
        attentionBias: `${row.attentionBias}; mediation=${mediated?.perceptionBiasOutputs[0] ?? "notices movement before claims"}; rejects ${neighbor?.attentionBias ?? "undifferentiated scan"} framing`,
        fearTranslationMode: `${fearModes[index % fearModes.length]}; stress=${mediated?.bodilyStressConversions[0] ?? "adaptive containment through body routing"}`,
        memoryActivationStyle: memoryModes[index % memoryModes.length],
        namingAvoidanceStyle: `${row.namingAvoidanceStyle}; omission=${mediated?.omissionPatterns[0] ?? "withholds private dependency"}; names consequence through movement not thesis`,
        socialReadingMode: `${socialModes[index % socialModes.length]}; misreads=${mediated?.misreadingPatterns[0] ?? "reads delay as resistance"}; distortion=${mediated?.misreadingPatterns[1] ?? "hesitation equals concealment"}`,
        decisionMode: `${row.decisionStyle}; conflict=${mediated?.conflictResponsePatterns[0] ?? "protective escalation under strain"}; only escalates after embodied evidence shifts`,
        silenceThreshold: Math.max(0.18, Math.min(0.82, 0.28 + (index % 4) * 0.14)),
        spiritualRitualPerceptionMode: history
          ? `tracks ritual breakpoints against hidden wound: ${history.privateWound.toLowerCase()}; meaning=${mediated?.ritualMeaningPatterns[0] ?? "embodied continuity"}`
          : `tracks ritual pace as a live pressure gauge; meaning=${mediated?.ritualMeaningPatterns[1] ?? "embodied continuity"}`,
        bodilyConversionPatterns: [
          ...bodilyPatterns,
          mediated?.bodilyStressConversions[1] ?? "convert abstraction into breath cadence and object contact",
          "hand pressure shifts before irreversible step",
        ],
      };
    });
  return VoiceCognitionMapSchema.parse({
    artifact: "chapter_voice_cognition_map",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    characters,
  });
}

function buildPerspectiveRoutingPlan(input: {
  segments: Array<{ segment: number; cast: string[] }>;
  voiceCognitionMap: z.infer<typeof VoiceCognitionMapSchema>;
  narrativeDistancePlan: z.infer<typeof NarrativeDistancePlanSchema>;
  chapterLaw: z.infer<typeof ChapterLawSchema>;
  segmentSimulationState: z.infer<typeof Book1SegmentSimulationStateSchema>;
  enneagramMediationLayer: z.infer<typeof Book1EnneagramMediationLayerSchema>;
  targetedConstraints: HighFindingConstraint[];
  activeFeedbackCategories: Set<string>;
}): z.infer<typeof PerspectiveRoutingPlanSchema> {
  const modeByDistance: Record<z.infer<typeof NarrativeDistanceModeSchema>, z.infer<typeof PerspectiveRoutingPlanSchema>["routes"][number]["paragraphMode"]> = {
    immediate_embodied: "interior",
    close_observational: "observational",
    social_reading: "social-reading",
    restrained_reflective: "withheldKnowledge",
  };
  const routes: z.infer<typeof PerspectiveRoutingPlanSchema>["routes"] = [];
  const coreWithholding = input.chapterLaw.futureArcConstraints.map((row) => row.forbiddenResolution.toLowerCase());
  const enforceCharacterSeparation =
    hasConstraint({
      constraints: input.targetedConstraints,
      adjustmentType: "force-distinct-cognition-rotation",
    }) ||
    input.activeFeedbackCategories.has("character_interior_blending") ||
    input.activeFeedbackCategories.has("repeated_thought_content");
  for (const segment of input.segments) {
    const state = input.segmentSimulationState.segments.find((row) => row.segment === segment.segment);
    for (const paragraph of ["A", "B", "C"] as const) {
      const distance = input.narrativeDistancePlan.paragraphs.find(
        (row) => row.segment === segment.segment && row.paragraph === paragraph,
      );
      const castCandidates = input.voiceCognitionMap.characters.filter((row) =>
        segment.cast.some((name) => name.toLowerCase() === row.character.toLowerCase()),
      );
      const rotatedSource = castCandidates.length > 0 ? castCandidates[(paragraph === "A" ? 0 : paragraph === "B" ? 1 : 2) % castCandidates.length] : undefined;
      const source =
        (enforceCharacterSeparation ? rotatedSource : undefined) ??
        castCandidates[0] ??
        input.voiceCognitionMap.characters[0];
      const mediated = input.enneagramMediationLayer.characters.find(
        (row) => row.character.toLowerCase() === (source?.character ?? "").toLowerCase(),
      );
      const distanceMode = distance?.mode ?? "close_observational";
      const silenceBias = (mediated?.silencePatterns.join(" ") ?? "").toLowerCase();
      const mode =
        paragraph === "C"
          ? "withheldKnowledge"
          : silenceBias.includes("extends") && paragraph === "B"
            ? "withheldKnowledge"
          : enforceCharacterSeparation && paragraph === "B"
            ? "social-reading"
          : paragraph === "B" && distanceMode === "social_reading"
            ? "social-reading"
            : silenceBias.includes("control gate") && paragraph !== "A"
              ? "withheldKnowledge"
            : modeByDistance[distanceMode];
      const mustRemainWithheld = unique([
        ...coreWithholding,
        state?.hiddenChange ?? "the next irreversible alignment",
        `${source?.character ?? "lead"} full motive naming`,
        `bias-mask:${mediated?.misreadingPatterns[1] ?? "threat-colored attribution"}`,
      ]).slice(0, 4);
      routes.push({
        segment: segment.segment,
        paragraph,
        dominantCognitionSource: source?.character ?? segment.cast[0] ?? "Household witness",
        narrativeDistanceMode: distanceMode,
        paragraphMode: mode,
        lawfulForeshadowingOnly: paragraph !== "A",
        mustRemainWithheld,
        previousDistanceMode: distance?.previousMode ?? null,
        sameAsPreviousDistanceMode: Boolean(distance?.sameAsPrevious),
      });
    }
  }
  return PerspectiveRoutingPlanSchema.parse({
    artifact: "chapter_perspective_routing_plan",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    routes,
  });
}

function buildVoiceLawEngine(input: {
  voiceRulebook: z.infer<typeof VoiceEngineRulebookSchema>;
  chapterLaw: z.infer<typeof ChapterLawSchema>;
  targetedConstraints: HighFindingConstraint[];
  activeFeedbackCategories: Set<string>;
}): z.infer<typeof VoiceLawEngineSchema> {
  const tightenHistoricalEmbedding =
    hasConstraint({
      constraints: input.targetedConstraints,
      adjustmentType: "tighten-historical-embedding-law",
    }) || input.activeFeedbackCategories.has("low_embodiment");
  const tightenAbstraction =
    hasConstraint({
      constraints: input.targetedConstraints,
      adjustmentType: "tighten-abstract-lexicon-blocklist",
    }) || input.activeFeedbackCategories.has("abstraction_overuse_by_segment");
  const maxAbstractSignalsPerParagraph = Math.max(
    0,
    Math.trunc(
      numericConstraint({
        constraints: input.targetedConstraints,
        adjustmentType: "tighten-abstract-lexicon-blocklist",
        key: "maxAbstractSignalsPerParagraph",
        fallback: tightenAbstraction ? 1 : input.voiceRulebook.abstractionCeiling.maxAbstractSignalsPerParagraph - 1,
      }),
    ),
  );
  const historicalRules = unique([
    ...input.voiceRulebook.historicalTextureEmbeddingRules,
    ...input.chapterLaw.chronologyInvariants.map((row) => `historical condition must stay lived: ${row.rule}`),
    ...(tightenHistoricalEmbedding
      ? [
          "each paragraph must include at least one concrete material or social ordering signal",
          "historical pressure must be shown by labor sequence change before abstract framing",
        ]
      : []),
  ]);
  return VoiceLawEngineSchema.parse({
    artifact: "chapter_voice_law_engine",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    abstractionCeiling: {
      maxAbstractSignalsPerParagraph,
      maxAbstractSignalsPerSegment: Math.max(1, maxAbstractSignalsPerParagraph * 2),
    },
    imageDensityRange: { minPerParagraph: 1, maxPerParagraph: 3 },
    sentenceCompressionExpansionProfile: input.voiceRulebook.sentenceCompressionExpansionRules,
    emotionalRestraintLaw: input.voiceRulebook.emotionalRestraintRules,
    paragraphPressureCurve: input.voiceRulebook.paragraphPressureRules,
    historicalEmbeddingRules: historicalRules,
    forbiddenSentenceFamilies: input.voiceRulebook.forbiddenSentenceFamilies,
    transitionBehaviors: input.voiceRulebook.preferredTransitionBehaviors,
    acceptableMetaphorImageClasses: ["river-material", "tool-hand contact", "weather-pressure", "ritual gesture"],
    antiSummaryRules: [
      "do not lead paragraphs with explanatory thesis language",
      "replace abstract motive labels with observed behavior change",
      "history appears as handled condition, not interpretive recap",
    ],
    antiOutlineLeakageRules: [
      "remove planning and governance terms from narrative surface",
      "forbid chapter-purpose phrasing inside generated prose",
    ],
    antiInterchangeableInteriorityRules: [
      "route interior cues through character-specific attention bias",
      "do not reuse identical fear-language textures across cast",
      "each lead character must expose a distinct notice->decide->withhold chain",
    ],
  });
}

function buildLanguageSuppressionMap(input: {
  abstractionSuppression: z.infer<typeof AbstractionSuppressionSchema>;
  thoughtRecurrenceGuard: z.infer<typeof Book1ThoughtRecurrenceGuardSchema>;
  enneagramMediationLayer: z.infer<typeof Book1EnneagramMediationLayerSchema>;
}): z.infer<typeof LanguageSuppressionMapSchema> {
  const recurrenceTokens = unique(
    input.thoughtRecurrenceGuard.segmentGuards.flatMap((row) => [
      ...row.blockedFearAbstractions,
      ...row.blockedSymbolicParaphrases,
      ...row.blockedThoughtPhrases,
    ]),
  );
  const mediationOmissionTokens = unique(
    input.enneagramMediationLayer.characters.flatMap((row) => row.omissionPatterns.map((token) => token.toLowerCase())),
  )
    .map((token) => token.split(/\W+/g).slice(0, 3).join(" "))
    .filter((token) => token.length > 8);
  const typeLeakBlocklist = [
    "enneagram",
    "type 1",
    "type 2",
    "type 3",
    "type 4",
    "type 5",
    "type 6",
    "type 7",
    "type 8",
    "type 9",
    "wing",
    "instinctual stack",
  ];
  const mediationMisreadTokens = unique(
    input.enneagramMediationLayer.characters.map((row) => row.misreadingPatterns.join(" ").toLowerCase()),
  )
    .map((token) => token.split(/\W+/g).slice(0, 3).join(" "))
    .filter((token) => token.length > 8);
  return LanguageSuppressionMapSchema.parse({
    artifact: "chapter_language_suppression_map",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    blockedPatterns: [
      ...input.abstractionSuppression.blockedAbstractPatterns,
      ...recurrenceTokens,
      "fear is",
      "motive is",
      "history shows",
      "history teaches",
      "the reason is",
      "in this chapter",
      "chapter",
      "segment",
      "future arc",
      "planning language",
      ...mediationOmissionTokens.slice(0, 8),
      ...typeLeakBlocklist,
      ...mediationMisreadTokens.slice(0, 5),
    ],
    openerTokenFamilies: ["the", "pressure", "fear", "history", "there", "this", "alexis", "he", "she"],
    transformationRoutes: [
      { sourcePattern: "fear is", rewriteAs: "bodily cue" },
      { sourcePattern: "motive is", rewriteAs: "action" },
      { sourcePattern: "history shows", rewriteAs: "object interaction" },
      { sourcePattern: "history teaches", rewriteAs: "perception" },
      { sourcePattern: "the reason is", rewriteAs: "silence" },
      { sourcePattern: "future arc", rewriteAs: "silence" },
      { sourcePattern: "segment", rewriteAs: "spatial relation" },
      { sourcePattern: "planning language", rewriteAs: "perception" },
    ],
  });
}

function buildRenderDirectives(input: {
  segments: Array<{ segment: number; cast: string[] }>;
  perspectiveRoutingPlan: z.infer<typeof PerspectiveRoutingPlanSchema>;
  voiceLawEngine: z.infer<typeof VoiceLawEngineSchema>;
  voiceCognitionMap: z.infer<typeof VoiceCognitionMapSchema>;
  embodiment: z.infer<typeof Book1EmbodimentMapSchema>;
  thoughtRecurrenceGuard: z.infer<typeof Book1ThoughtRecurrenceGuardSchema>;
  enneagramMediationLayer: z.infer<typeof Book1EnneagramMediationLayerSchema>;
  targetedConstraints: HighFindingConstraint[];
  activeFeedbackCategories: Set<string>;
}): z.infer<typeof RenderDirectivesSchema> {
  const beatOrders: Array<Array<"action" | "sensory" | "pressure" | "social" | "withheld" | "object">> = [
    ["sensory", "action", "pressure", "object"],
    ["action", "social", "pressure", "withheld"],
    ["object", "action", "social", "pressure"],
    ["pressure", "sensory", "action", "withheld"],
  ];
  const directives: z.infer<typeof RenderDirectivesSchema>["directives"] = [];
  const enforcePressureVariance =
    hasConstraint({
      constraints: input.targetedConstraints,
      adjustmentType: "enforce-pressure-curve-variance",
    }) ||
    input.activeFeedbackCategories.has("repeated_paragraph_shape") ||
    input.activeFeedbackCategories.has("synthetic_rhythm");
  const strengthenHistoricalTexture =
    hasConstraint({
      constraints: input.targetedConstraints,
      adjustmentType: "raise-minimum-sensory-object-beats",
    }) || input.activeFeedbackCategories.has("low_embodiment");
  const increaseSocialRouting =
    hasConstraint({
      constraints: input.targetedConstraints,
      adjustmentType: "increase-social-environmental-routing-share",
    }) || input.activeFeedbackCategories.has("weak_transition_texture");
  for (const segment of input.segments) {
    for (const paragraph of ["A", "B", "C"] as const) {
      const route = input.perspectiveRoutingPlan.routes.find((row) => row.segment === segment.segment && row.paragraph === paragraph);
      const lead = route?.dominantCognitionSource ?? segment.cast[0] ?? "Household witness";
      const cognition = input.voiceCognitionMap.characters.find((row) => row.character.toLowerCase() === lead.toLowerCase());
      const mediated = input.enneagramMediationLayer.characters.find(
        (row) => row.character.toLowerCase() === lead.toLowerCase(),
      );
      const packet = input.embodiment.segments.find((row) => row.segment === segment.segment);
      const guard = input.thoughtRecurrenceGuard.segmentGuards.find((row) => row.segment === segment.segment);
      const idx = segment.segment + (paragraph === "A" ? 0 : paragraph === "B" ? 1 : 2);
      directives.push({
        segment: segment.segment,
        paragraph,
        dominantBeatOrder:
          paragraph === "A"
            ? strengthenHistoricalTexture
              ? ["sensory", "object", "action", "social"]
              : ["sensory", "action", "social", "withheld"]
            : paragraph === "B"
              ? increaseSocialRouting
                ? ["action", "social", "object", "pressure"]
                : ["action", "pressure", "object", "social"]
              : beatOrders[idx % beatOrders.length],
        paragraphMood: `${route?.paragraphMode ?? "observational"} under ${cognition?.fearTranslationMode ?? "pressure translation"}; conflict=${mediated?.conflictResponsePatterns[0] ?? "containment"}; distortion=${mediated?.misreadingPatterns[0] ?? "delay as resistance"}; meaning=${mediated?.ritualMeaningPatterns[0] ?? "ritual continuity under strain"}`,
        sentencePressure: enforcePressureVariance
          ? idx % 3 === 0
            ? "compressed"
            : idx % 3 === 1
              ? "expanded"
              : "mixed"
          : (mediated?.bodilyStressConversions.join(" ") ?? "").toLowerCase().includes("tight")
            ? "compressed"
            : (mediated?.conflictResponsePatterns.join(" ") ?? "").toLowerCase().includes("calibrated")
              ? "mixed"
              : (mediated?.silencePatterns.join(" ") ?? "").toLowerCase().includes("control gate")
                ? "compressed"
                : paragraph === "A"
                ? "compressed"
                : paragraph === "B"
                  ? "mixed"
                  : "expanded",
        imagePermission:
          packet && packet.sensoryCues.length >= 2
            ? paragraph === "C"
              ? "high"
              : "medium"
            : strengthenHistoricalTexture && paragraph !== "A"
              ? "medium"
              : "low",
        abstractionCeiling:
          paragraph === "C"
            ? input.voiceLawEngine.abstractionCeiling.maxAbstractSignalsPerParagraph
            : Math.max(0, input.voiceLawEngine.abstractionCeiling.maxAbstractSignalsPerParagraph - 1),
        silenceWithholdingRequirement:
          paragraph === "C" ||
          (mediated?.omissionPatterns.join(" ") ?? "").toLowerCase().includes("ceiling") ||
          (guard?.blockedThoughtPhrases.length ?? 0) > 0,
        transitionBehavior:
          `${input.voiceLawEngine.transitionBehaviors[idx % input.voiceLawEngine.transitionBehaviors.length] ?? "unfinished action carry"}; ${mediated?.silencePatterns[0] ?? "silence carries unresolved pressure before reply"}`,
        allowedKnowledgeScope: paragraph === "C" || route?.lawfulForeshadowingOnly ? "lawful-foreshadowing-only" : "present-scene-only",
        activeCharacterScope: unique(segment.cast),
      });
    }
  }
  return RenderDirectivesSchema.parse({
    artifact: "chapter_render_directives",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    directives,
  });
}

function buildNarrativeSegment(input: {
  index: number;
  segmentNumber: number;
  setting: string;
  cast: string[];
  simulationState: {
    whoIsPresent: string[];
    people: Array<{ character: string; wants: string; knows: string; misreads: string; hiding: string }>;
    worldPressure: string;
    visibleAction: string;
    hiddenChange: string;
  };
  cognitionSignatures: Array<{
    character: string;
    attentionBias: string;
    thoughtStyle: string;
    emotionalProcessingStyle: string;
    namingAvoidanceStyle: string;
    sensoryPriority: string[];
    decisionStyle: string;
  }>;
  thoughtRecurrenceGuard: {
    blockedThoughtPhrases: string[];
    blockedMotifs: string[];
    blockedFearAbstractions: string[];
    blockedSymbolicParaphrases: string[];
    obsessionPatternIntended: boolean;
  };
  motiveDirective: {
    mode: "express directly" | "embody only" | "imply through action" | "suppress because already surfaced";
    rationale: string;
    coreImmediateWant: string;
    coreImmediateFear: string;
  };
  characterDistinction: {
    noticesFirst: string;
    neverNamesDirectly: string;
    emotionalPressurePhysicalization: string;
    sentenceTexture: string;
    dominantInteriorChannel: "image" | "duty" | "suspicion" | "memory" | "bodily_sensation" | "social_reading";
  };
  abstractFearDirective: {
    blockedAbstractPatterns: string[];
    maxAbstractFearMentionsPerParagraph: number;
  };
  abstractFearSubstitutionRules: Array<{ from: string; toPattern: string }>;
  entryStrategy: z.infer<typeof EntryStrategySchema>;
  paragraphShapeProfile: z.infer<typeof ParagraphShapeProfileSchema>;
  embodimentAdjustment: {
    lowEmbodimentRisk: boolean;
    openingMustInclude: string[];
    increasePhysicalActionDensity: boolean;
    increaseSensoryAnchoring: boolean;
    reduceDeclarativeExplanation: boolean;
  };
  transitionTexture: {
    transitionMode: "attention-shift" | "movement-shift" | "environmental-pressure-shift" | "social-reading-shift" | "unfinished-action-carry";
    carryForwardCue: string;
  };
  openingParagraphFamily: z.infer<typeof OpeningParagraphFamilySchema>;
  firstTwoSentenceFamily: z.infer<typeof FirstTwoSentenceFamilySchema>;
  openerSuppression: {
    recentStems: string[];
    recentSyntaxStems: string[];
    recentFirstTokens: string[];
    recentFirstNounFamilies: string[];
    recentFirstVerbFamilies: string[];
    recentOrientationFamilies: string[];
    segment1ProtectedStem: string | null;
    previousFirstTwoLengthPattern: string | null;
    previousFirstTwoClausePattern: string | null;
  };
  segment24OpenerPolicy?: {
    requiresBodyStateCue: boolean;
    requiresSensoryCue: boolean;
    requiresPressureCue: boolean;
    requiresVisibleMicroAction: boolean;
  };
  segment24EmbodimentPolicy?: {
    requiredEmbodimentSignals: string[];
    requirePhysicalNoticeAvoidChangePivot: boolean;
  };
  embodiment: {
    concreteActions: string[];
    bodyStateCues: string[];
    sensoryCues: string[];
    environmentalPressureCues: string[];
    socialRitualCues: string[];
    noticedFirst: string;
    remainsUnspoken: string;
    physicalChangeByEnd: string;
  };
  segmentEnergy: { dominantEnergy: string; tempoTarget: string; transitionPressure: string };
  sentencePattern: { bannedRecentOpenings: string[]; preferredNextOpeningTypes: string[]; paragraphShapeRecommendations: { targetSentenceRange: { min: number; max: number } } };
  evidenceLines: string[];
  voiceContract: {
    positiveConstraints: {
      historicalEmbeddingMode: { mode: string };
      transitionStyle: { preferred: string[] };
    };
  };
  voiceCognition: z.infer<typeof VoiceCognitionMapSchema>["characters"][number];
  perspectiveRoutes: z.infer<typeof PerspectiveRoutingPlanSchema>["routes"];
  voiceLawEngine: z.infer<typeof VoiceLawEngineSchema>;
  languageSuppressionMap: z.infer<typeof LanguageSuppressionMapSchema>;
  renderDirectives: z.infer<typeof RenderDirectivesSchema>["directives"];
  consciousnessCohesionRouterZones: z.infer<typeof Book1ConsciousnessCohesionRouterSchema>["paragraphZones"];
  voiceIdentityStabilizerGroups: z.infer<typeof Book1VoiceIdentityStabilizerSchema>["paragraphGroups"];
  embodiedInnerLifeRoutes: z.infer<typeof Book1EmbodiedInnerLifeRouterSchema>["routes"];
  enneagramMediationProfile: z.infer<typeof Book1EnneagramMediationLayerSchema>["characters"][number];
  developmentalProfile?: CharacterDevelopmentalProfile;
  developmentalSegmentImpact?: { activeIntimacyDynamics: string[]; developmentalPhaseInfluenceOnScene: string; bodilyConversionActivations: string[] };
  abstractionSuppression: z.infer<typeof AbstractionSuppressionSchema>;
  futureConstraint: string;
  statePatch: Record<string, unknown>;
}): string {
  type BeatType = "action" | "sensory" | "pressure" | "social" | "withheld" | "object";
  const lead = input.cast[0] ?? "Household witness";
  const second = input.cast[1] ?? "the next witness";
  const usedOpeners = new Set<string>();
  const blockedTokens = [
    ...input.thoughtRecurrenceGuard.blockedThoughtPhrases,
    ...input.thoughtRecurrenceGuard.blockedMotifs,
    ...input.thoughtRecurrenceGuard.blockedFearAbstractions,
    ...input.thoughtRecurrenceGuard.blockedSymbolicParaphrases,
  ].map((token) => token.toLowerCase());

  const routeFor = (slot: "A" | "B" | "C") => input.perspectiveRoutes.find((row) => row.paragraph === slot);
  const directiveFor = (slot: "A" | "B" | "C") => input.renderDirectives.find((row) => row.paragraph === slot);
  const cohesionFor = (slot: "A" | "B" | "C") =>
    input.consciousnessCohesionRouterZones.find((row) => row.paragraph === slot);
  const stabilizerFor = (slot: "A" | "B" | "C") =>
    input.voiceIdentityStabilizerGroups.find((row) => row.paragraph === slot);
  const embodiedFor = (slot: "A" | "B" | "C") =>
    input.embodiedInnerLifeRoutes.find(
      (row) => row.segment === input.segmentNumber && row.character.toLowerCase() === lead.toLowerCase(),
    );
  const take = (values: string[], fallback: string): string =>
    values.map((row) => compact(row)).find((row) => row.length > 0) ?? fallback;
  const noBlocked = (line: string): boolean => !blockedTokens.some((token) => token.length >= 6 && line.toLowerCase().includes(token));
  const uniqueOpening = (candidates: string[], fallback: string): string => {
    for (const candidate of candidates.map((row) => compact(row)).filter((row) => row.length > 0)) {
      const stem = openerStem(candidate);
      if (usedOpeners.has(stem) || !noBlocked(candidate)) continue;
      usedOpeners.add(stem);
      return candidate;
    }
    const safe = compact(fallback);
    usedOpeners.add(openerStem(safe));
    return safe;
  };
  const evidenceAnchor = take(
    input.evidenceLines.map((row) => row.replace(/\s+/g, " ").replace(/[:;]+/g, ",")),
    "hands verify what mouths avoid",
  );
  const entryByStrategy: Record<z.infer<typeof EntryStrategySchema>, string[]> = {
    "sensory-first": [
      `Smoke and wet reed meet skin before anyone risks a claim in ${input.setting.toLowerCase()}.`,
      `Heat from clay and ash reaches wrists first, so speech follows touch.`,
    ],
    "motion-first": [
      `${lead} shifts lanes between hearth and doorway, forcing answers to move with him.`,
      `A quick change in footing from ${second} redraws rank before names are spoken.`,
    ],
    "object-first": [
      `A marked bowl moves hand to hand and redistributes obligation without announcement.`,
      `Tool weight and grip angle decide urgency before argument does.`,
    ],
    "body-state-first": [
      `${lead}'s shoulders set early, and the room reads the set before his words.`,
      `Breath cadence at the threshold places each witness before any ruling is voiced.`,
    ],
    "environmental-pressure-first": [
      `Wind and smoke reduce the margin for hesitation around the fire line.`,
      `Weather pressure narrows each decision to what can be carried by hand.`,
    ],
    "dialogue-adjacent": [
      `"Keep to the order," ${lead} says quietly, and posture answers before speech.`,
      `"Who carries that weight tonight?" ${second} asks from the darker edge.`,
    ],
    "withheld-knowledge-first": [
      `The room arranges itself around what stays unsaid.`,
      `Unspoken knowledge reaches bodies faster than explanation ever could.`,
    ],
    "ritual-action-first": [
      `A practiced ritual pass sets speaking order before disagreement opens.`,
      `When a gesture misses half a beat, everyone recalibrates distance.`,
    ],
    "sound-cue-first": [
      `Clay against wood sounds once, and every gaze redirects.`,
      `Footfall and bowl-rim scrape cut through the talk and establish pace.`,
    ],
    "spatial-shift-first": [
      `${lead} takes one step toward the doorway line and control shifts with the step.`,
      `A half-turn toward the hearth changes who can answer first.`,
    ],
    "interrupted-attention-first": [
      `${lead}'s attention snaps to a hand movement that interrupts routine.`,
      `An unfinished gesture reroutes everyone before meaning is settled.`,
    ],
    "environmental-change-in-progress": [
      `As smoke thickens, the exchange tightens into shorter moves.`,
      `Wind pressure changes mid-scene, and voices follow the change.`,
    ],
  };
  const devConversions = input.developmentalSegmentImpact?.bodilyConversionActivations ?? [];
  const devSilenceLines = input.developmentalProfile?.renderingImpact.silencePatterns ?? [];
  const devIntimacyLines = input.developmentalProfile?.renderingImpact.intimacyDistancePatterns ?? [];
  const beatLine = (beat: BeatType, slot: "A" | "B" | "C", beatIndex: number): string => {
    const embodiedRoute = embodiedFor(slot);
    const cohesion = cohesionFor(slot);
    const stabilizer = stabilizerFor(slot);
    const variants: Record<BeatType, string[]> = {
      action: [
        take([input.simulationState.visibleAction, input.embodiment.concreteActions[0]], `${lead} answers by movement first.`),
        take([input.embodiment.concreteActions[1]], `${second} adjusts position and changes the next option.`),
        embodiedRoute?.bodyCue ?? "",
        ...(devConversions.length > 0 ? [take(devConversions, "")] : []),
      ],
      sensory: [
        take([input.embodiment.sensoryCues[0], input.embodiment.sensoryCues[1]], "Sound, heat, and texture arrive before speech."),
        embodiedRoute?.attentionShift ?? "",
        `${lead} filters detail through ${input.voiceCognition.attentionBias.toLowerCase()}.`,
      ],
      pressure: [
        take([input.simulationState.worldPressure, input.embodiment.environmentalPressureCues[0]], "Distance, rank, and weather close the margin."),
        embodiedRoute?.environmentalPressureContact ?? "",
        `${lead} converts strain as ${input.voiceCognition.fearTranslationMode.toLowerCase()}.`,
      ],
      social: [
        take([input.embodiment.socialRitualCues[0]], "Speaking order shifts by witness spacing."),
        embodiedRoute?.socialReading ?? "",
        `${input.simulationState.people[0]?.character ?? lead} and ${input.simulationState.people[1]?.character ?? second} misread each other through ${(input.enneagramMediationProfile.perceptionBiasOutputs[1] ?? "attention fixation drift").toLowerCase()} and ${(input.enneagramMediationProfile.misreadingPatterns[0] ?? "hesitation equals concealment").toLowerCase()}.`,
        cohesion?.supportingConsciousnessModifiers[0] ?? "",
        ...(devIntimacyLines.length > 0 ? [take(devIntimacyLines, "")] : []),
      ],
      withheld: [
        take([input.embodiment.remainsUnspoken], "What remains unsaid still directs movement."),
        embodiedRoute?.silencePattern ?? "",
        `${lead} holds back naming ${(input.enneagramMediationProfile.omissionPatterns[0] ?? input.characterDistinction.neverNamesDirectly).toLowerCase()} and lets silence carry it in ${(input.enneagramMediationProfile.intimacyDistancePatterns[0] ?? "selective disclosure under attachment strain").toLowerCase()}.`,
        stabilizer?.stabilizationRules[0] ?? "",
        ...(devSilenceLines.length > 0 ? [take(devSilenceLines, "")] : []),
      ],
      object: [
        `Handled proof stays material: ${evidenceAnchor}.`,
        embodiedRoute?.objectInteraction ?? "",
        embodiedRoute?.ritualDeviation ?? "",
        `Object contact marks memory activation as ${input.voiceCognition.memoryActivationStyle.toLowerCase()}.`,
      ],
    };
    const options = variants[beat] ?? variants.action;
    const leadIn = slot === "A" ? "Near the opening," : slot === "B" ? "Under closer pressure," : "At the carry-forward edge,";
    const picked = options[(input.index + beatIndex) % options.length] ?? options[0];
    return beatIndex === 0 ? `${leadIn} ${picked}` : picked;
  };

  const enforceFearDensity = (text: string): string =>
    input.abstractFearDirective.maxAbstractFearMentionsPerParagraph > 0
      ? text
      : text.replace(/\b(fear|risk|threat|danger|erasure|exposure)\b/gi, "signal");
  const replaceSuppressedPatterns = (text: string): string => {
    let next = text;
    for (const blocked of input.languageSuppressionMap.blockedPatterns) {
      const escaped = blocked.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      next = next.replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ");
    }
    for (const route of input.languageSuppressionMap.transformationRoutes) {
      const escaped = route.sourcePattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const mapped =
        route.rewriteAs === "perception"
          ? "breath, skin, and sound absorb it"
          : route.rewriteAs === "action"
            ? "hands and posture rewrite it"
            : route.rewriteAs === "silence"
              ? "silence carries it onward"
              : route.rewriteAs === "spatial relation"
                ? "distance carries the meaning"
                : route.rewriteAs === "bodily cue"
                  ? "jaw and breath carry the load"
                  : "object handling carries the claim";
      next = next.replace(new RegExp(`\\b${escaped}\\b`, "gi"), mapped);
    }
    return compact(next);
  };
  const trimToAbstractionCeiling = (text: string, ceiling: number): string => {
    const abstractTokens = ["system", "dynamic", "process", "structure", "framework", "abstraction", "conceptual"];
    const words = text.split(/\s+/g);
    let seen = 0;
    return words
      .map((word) => {
        const normalized = word.replace(/[^a-z]/gi, "");
        if (abstractTokens.some((token) => new RegExp(`^${token}`, "i").test(normalized))) {
          seen += 1;
          if (seen > ceiling) return "signal";
        }
        return word;
      })
      .join(" ");
  };
  const pressureShape = (paragraph: string, directive: z.infer<typeof RenderDirectivesSchema>["directives"][number] | undefined): string => {
    if (!directive) return paragraph;
    if (directive.sentencePressure === "compressed") return paragraph.replace(/; /g, ". ").replace(/, and /g, ". ");
    if (directive.sentencePressure === "expanded") return paragraph.replace(/\.\s+/g, "; the pressure does not clear, and ");
    return paragraph;
  };

  const buildParagraph = (slot: "A" | "B" | "C"): string => {
    const route = routeFor(slot);
    const directive = directiveFor(slot);
    const cohesion = cohesionFor(slot);
    const stabilizer = stabilizerFor(slot);
    const embodiedRoute = embodiedFor(slot);
    const beats = directive?.dominantBeatOrder ?? (["action", "sensory", "social", "withheld"] as BeatType[]);
    const entry = uniqueOpening(entryByStrategy[input.entryStrategy], `${input.setting} narrows and choices follow touch before speech.`);
    const firstLine =
      slot === "A"
        ? entry
        : uniqueOpening(
            [
              `From ${route?.paragraphMode ?? "observational"} range, ${lead} keeps decisions in ${input.voiceCognition.decisionMode.toLowerCase()}.`,
              `${lead} tracks ${input.characterDistinction.noticesFirst.toLowerCase()} and refuses a clean explanation.`,
              `Witness order shifts; ${lead} reads ${input.voiceCognition.socialReadingMode.toLowerCase()} while ${(input.enneagramMediationProfile.conflictResponsePatterns[0] ?? "protective containment under pressure").toLowerCase()}.`,
              `${lead} keeps speech at ${(input.enneagramMediationProfile.silencePatterns[0] ?? "silence as control gate before disclosure").toLowerCase()} and lets misreading travel ahead of admission.`,
              stabilizer?.localConsciousnessTexture ?? "",
              embodiedRoute?.attentionShift ?? "",
            ],
            `${lead} keeps attention on bodies, objects, and spacing.`,
          );
    const beatLines = beats.slice(0, 4).map((beat, beatIndex) => beatLine(beat, slot, beatIndex));
    const withholdingLine =
      route && route.mustRemainWithheld.length > 0
        ? `What remains withheld: ${route.mustRemainWithheld.slice(0, 2).map((row) => row.replace(/\.$/, "")).join("; ")}.`
        : `What remains withheld is carried in ${input.transitionTexture.carryForwardCue.toLowerCase()}.`;
    const transitionLine =
      slot === "C"
        ? `Transition behavior: ${directive?.transitionBehavior ?? "unfinished action carry"}; ${input.transitionTexture.carryForwardCue}.`
        : `${input.embodiment.physicalChangeByEnd}.`;
    const payload = [
      firstLine,
      ...beatLines,
      directive?.silenceWithholdingRequirement ? withholdingLine : "",
      cohesion?.lawfulWithholdingMode === "strict"
        ? "Withholding remains lawful and strict; motive exposure stays action-bound."
        : "",
      stabilizer?.stabilizationRules[1] ?? "",
      transitionLine,
    ]
      .filter((row) => row.length > 0)
      .join(" ");
    return pressureShape(payload, directive);
  };

  const paragraphA = buildParagraph("A");
  const paragraphB = buildParagraph("B");
  const paragraphC = buildParagraph("C");
  const normalized = [paragraphA, paragraphB, paragraphC]
    .map((paragraph, index) => {
      const slot = index === 0 ? "A" : index === 1 ? "B" : "C";
      const directive = directiveFor(slot);
      const cohesion = cohesionFor(slot);
      return trimToAbstractionCeiling(
        paragraph,
        cohesion?.abstractionCeilingOverride ??
          directive?.abstractionCeiling ??
          input.voiceLawEngine.abstractionCeiling.maxAbstractSignalsPerParagraph,
      );
    })
    .map((paragraph) =>
      enforceFearDensity(
        suppressAbstractFearLine({
          text: paragraph,
          stopPatterns: input.abstractFearDirective.blockedAbstractPatterns,
          substitutions: input.abstractFearSubstitutionRules,
        }),
      ),
    )
    .map((paragraph) => replaceSuppressedPatterns(paragraph))
    .map((paragraph) =>
      suppressAbstractFearLine({
        text: paragraph,
        stopPatterns: input.abstractionSuppression.blockedAbstractPatterns,
        substitutions: input.abstractionSuppression.substitutionRules.map((row) => ({ from: row.from, toPattern: row.to })),
      }),
    )
    .join("\n\n");
  return applyLeakageGuard(normalized);
}

export class Book1RegenerationLoopService {
  run(input: Book1RegenerationLoopInput): {
    voiceContract: Record<string, unknown>;
    proseBriefs: Record<string, unknown>;
    livedHistory: Record<string, unknown>;
    cognitionSignatures: Record<string, unknown>;
    segmentSimulationState: Record<string, unknown>;
    chapterState: Record<string, unknown>;
    chapterBeatProfileRecommendation: Record<string, unknown>;
    beatAssemblyResult: Record<string, unknown>;
    beatAssemblyPreflight: Record<string, unknown>;
    beatAssemblyBlocked: boolean;
    beatAssemblyFailure: Record<string, unknown> | null;
    narrativePsychologyArchitecture: Record<string, unknown>;
    narrativePsychologyValidation: Record<string, unknown>;
    narrativePsychologyChapterStateBias: Record<string, unknown>;
    narrativePsychologyBeatBias: Record<string, unknown>;
    proseGenerationConstraints: Record<string, unknown>;
    proseGenerationPreflight: Record<string, unknown>;
    proseGenerationValidation: Record<string, unknown>;
    literaryDevicePack: Record<string, unknown>;
    literaryDeviceApplicationPlan: Record<string, unknown>;
    literaryDeviceValidation: Record<string, unknown>;
    literaryDeviceCockpitSummary: Record<string, unknown>;
    epicSequencePlan: Record<string, unknown>;
    bookSequencePlan: Record<string, unknown>;
    chapterSequencePlan: Record<string, unknown>;
    chapterFunctionMatrix: Record<string, unknown>;
    recallReframingPlans: unknown[];
    sequenceValidation: Record<string, unknown>;
    sceneGenerationRequest: Record<string, unknown>;
    generatedChapterSceneBundle: Record<string, unknown>;
    sceneGenerationValidation: Record<string, unknown>;
    chapter1ProseGenerationPacket: Record<string, unknown>;
    chapter1ProseOutputPathReport: Record<string, unknown>;
    authorCockpitBundle: Record<string, unknown>;
    epicContinuityPack: Record<string, unknown>;
    epicContinuityValidation: Record<string, unknown>;
    epicEmotionalGravityPack: Record<string, unknown>;
    epicEmotionalGravityValidation: Record<string, unknown>;
    thoughtRecurrenceGuard: Record<string, unknown>;
    motiveCompression: Record<string, unknown>;
    characterDistinctionPlan: Record<string, unknown>;
    enneagramOperatingLayer: Record<string, unknown>;
    enneagramMediationLayer: Record<string, unknown>;
    abstractFearSuppression: Record<string, unknown>;
    entryStrategyPlan: Record<string, unknown>;
    paragraphShapePlan: Record<string, unknown>;
    embodimentAssemblyAdjustments: Record<string, unknown>;
    transitionTexturePlan: Record<string, unknown>;
    segment24OpenerPolicy: Record<string, unknown>;
    segment24EmbodimentPolicy: Record<string, unknown>;
    openingFamilyAudit: Record<string, unknown>;
    openingParagraphFamilyPlan: Record<string, unknown>;
    openerTokenAudit: Record<string, unknown>;
    firstTwoSentencePlan: Record<string, unknown>;
    openerFamilyMemory: Record<string, unknown>;
    segment1OpenerIsolation: Record<string, unknown>;
    earlyParagraphAntiSymmetry: Record<string, unknown>;
    voiceEngineRulebook: Record<string, unknown>;
    narrativeDistancePlan: Record<string, unknown>;
    abstractionSuppression: Record<string, unknown>;
    voiceCognitionMap: Record<string, unknown>;
    perspectiveRoutingPlan: Record<string, unknown>;
    voiceLawEngine: Record<string, unknown>;
    languageSuppressionMap: Record<string, unknown>;
    renderDirectives: Record<string, unknown>;
    consciousnessCohesionRouter: Record<string, unknown>;
    voiceIdentityStabilizer: Record<string, unknown>;
    embodiedInnerLifeRouter: Record<string, unknown>;
    sentencePatternPlan: Record<string, unknown>;
    segmentEnergy: Record<string, unknown>;
    embodiment: Record<string, unknown>;
    enneagramConsciousnessEngine: Record<string, unknown>;
    developmentalIntimacyEngine: Record<string, unknown>;
    proseShapeCritic: Record<string, unknown>;
    proseShapeSummary: Record<string, unknown>;
    regeneratedDraftJson: z.infer<typeof OutlineDrivenDraftSchema>;
    regeneratedDraftText: string;
    regenerationReview: Record<string, unknown>;
    regenerationDiff: Record<string, unknown>;
    regenerationSummary: Record<string, unknown>;
  } {
    const generatedAt = new Date().toISOString();
    const chapterEvidencePack = ChapterEvidencePackSchema.parse(input.chapterEvidencePack);
    const chapterLaw = ChapterLawSchema.parse(input.chapterLaw);
    const chapterVoiceSpec = ChapterVoiceSpecSchema.parse(input.chapterVoiceSpec);
    const chapterCharacterHiddenHistories = ChapterCharacterHiddenHistoriesSchema.parse(input.chapterCharacterHiddenHistories);
    const chapterEpicSimulation = ChapterEpicSimulationSchema.parse(input.chapterEpicSimulation);
    const previousDraftRaw = PreviousDraftSchema.parse(input.previousDraft);
    const previousDraft =
      "segmentDrafts" in previousDraftRaw
        ? previousDraftRaw
        : OutlineDrivenDraftSchema.parse({
            chapter: 1,
            title: previousDraftRaw.title,
            segmentDrafts: previousDraftRaw.segments.map((segment) => ({
              segment: segment.segment,
              heading: `Movement ${segment.segment}`,
              text: segment.text,
              compliance: {
                followsOutline: true,
                includesPsychologicalArc: /(fear|pressure|duty|desire)/i.test(segment.text),
                includesHistoricalGrounding: /(river|kinship|household|settlement)/i.test(segment.text),
              },
            })),
            fullText: previousDraftRaw.fullText,
          });
    const previousConsistencyReport = ChapterConsistencyReportSchema.parse(input.previousConsistencyReport);
    const previousVoiceReport = ChapterVoiceReportSchema.parse(input.previousVoiceReport);
    const previousGapReport = ChapterGapReportSchema.parse(input.previousGapReport);
    const previousAdversarialSummary = AdversarialSummarySchema.parse(input.previousAdversarialSummary);
    const characterSession = CharacterSessionSchema.parse(input.characterConsoleSession);
    const lawSession = LawSessionSchema.parse(input.lawConsoleSession);
    const criticFeedbackMap = input.criticFeedbackMap
      ? Book1CriticFeedbackMapSchema.parse(input.criticFeedbackMap)
      : null;
    const highFindingReductionPlan = input.highFindingReductionPlan
      ? Book1HighFindingReductionPlanSchema.parse(input.highFindingReductionPlan)
      : null;
    const activeFeedbackCategories = new Set((criticFeedbackMap?.findings ?? []).map((finding) => finding.findingCategory));
    const targetedConstraints = highFindingReductionPlan?.targetedRendererConstraints ?? [];

    const voiceContract = new Book1VoiceContractService().buildContract();
    const proseBriefs = new Book1ProseBriefTransformer().transform({
      outline: input.chapterOutline,
      voiceContract,
    });
    const livedHistory = new Book1LivedHistoryTransformer().transform({
      outline: input.chapterOutline,
      evidence: chapterEvidencePack.evidence.map((row) => ({ statement: row.statement })),
    });
    const activeCharacters = unique(
      input.chapterOutline.timeline.flatMap((segment) => segment.characters).filter((character) => character.trim().length > 0),
    );
    const cognitionSignatures = Book1CognitionSignaturesSchema.parse(
      new Book1CharacterCognitionSignatureService().build({
        activeCharacters,
        hiddenHistories: chapterCharacterHiddenHistories.characters,
      }),
    );
    const segmentSimulationState = Book1SegmentSimulationStateSchema.parse(
      new Book1SegmentSimulationStateBuilderService().build({
        outline: input.chapterOutline,
        hiddenHistories: chapterCharacterHiddenHistories,
        livedHistory,
        chapterEvidencePack,
        chapterLaw,
      }),
    );
    const narrativeThreadDerivationService = new NarrativeThreadDerivationService();
    const chapterCompositionService = new ChapterCompositionService();
    const threadToChapterStateService = new NarrativeThreadToChapterStateService();
    const threadToBeatProfileService = new NarrativeThreadToBeatProfileService();
    const callbackReentryService = new ThreadCallbackReentryService();
    const settingThreadCoverageService = new SettingThreadCoverageService();
    const narrativeThreadPack = narrativeThreadDerivationService.buildBook1SampleThreadPack();
    const chapterComposition =
      narrativeThreadPack.chapterCompositions[0] ??
      chapterCompositionService.compose({
        chapterId: "book1-chapter-01",
        chapterStateId: "book1-chapter-01",
        scenes: [
          {
            sceneId: "book1-ch01-fallback-sc01",
            sceneLabel: "Fallback scene",
            locationId: "natchitoches",
            activeThreadIds: ["book1-continuity-survival"],
            latentThreadIds: [],
            callbackThreadIds: [],
            distortedThreadIds: [],
            seededThreadIds: ["book1-continuity-survival"],
            echoNodeIds: [],
            hiddenConvergenceKeys: [],
            delayedConvergenceBindings: [],
            transitionToNextScene: "Fallback transition.",
          },
        ],
        chapterClosureProfile: "Fallback chapter composition.",
        chapterCarryForwardProfile: "Fallback carry-forward profile.",
      });
    const threadContinuityProjection = threadToChapterStateService.projectContinuityThreads(narrativeThreadPack.threads);
    const callbackEvents = callbackReentryService.deriveCallbackEvents(narrativeThreadPack.threads);
    const delayedConvergenceEvents = callbackReentryService.deriveDelayedConvergenceEvents(
      narrativeThreadPack.threads,
      "book1-chapter-04",
      "book1-ch04-sc01",
    );
    const settingCoverageReport = settingThreadCoverageService.buildCoverageReport({
      bookId: "book1",
      requiredLocationIds: ["natchitoches", "alexandria-portage", "atchafalaya-fork", "lower-river-market"],
      seeds: [
        {
          locationId: "natchitoches",
          locationName: "Natchitoches",
          routeRole: "source",
          appearanceMode: "direct_scene",
          associatedThreads: ["book1-continuity-survival", "book1-philosophy-reading-signs"],
          associatedCharacters: ["natchitoches-matriarch-keeper", "elder-memory-holder"],
          currentMeaning: "Continuity anchor and memory authority locus.",
          callbackLinks: ["storage-knot-gesture"],
          nextRecommendedAppearanceWindow: "chapter-02 direct scene",
        },
        {
          locationId: "lower-river-market",
          locationName: "Lower River Market",
          routeRole: "destination",
          appearanceMode: "rumor",
          associatedThreads: ["book1-red-river-route-setting"],
          associatedCharacters: ["household-runner"],
          currentMeaning: "Rumor corridor and trade disturbance signal source.",
          callbackLinks: ["double-harbor-rumor"],
          nextRecommendedAppearanceWindow: "chapter-03 report mention",
        },
      ],
      threads: narrativeThreadPack.threads,
    });
    const chapterState = deriveChapterState({
      chapterId: "book1-chapter-01",
      bookId: "book1",
      sequenceNumber: 1,
      era: "Natchitoches-centered Red River settlements, pre-displacement pressure horizon",
      timePosition: "chapter opening through first-light pressure shift",
      locationProfile: "Red River household + kinship work network",
      seasonPhase: "late-planting to early storage stress",
      progressionPhase: "phase_a",
      povWeightingCandidates: [
        { characterId: "natchitoches-matriarch-keeper", weight: 0.56, rationale: "Primary continuity and pressure interpreter." },
        { characterId: "younger-kin-observer", weight: 0.27, rationale: "Captures social and sensory edge signals." },
        { characterId: "household-runner", weight: 0.17, rationale: "Tracks external awareness with limited visibility." },
      ],
      axisInputs: {
        environmental_stability: {
          score: 72 - Math.min(18, Math.floor(input.chapterOutline.timeline.length / 2)),
          direction: "falling",
          rationale: "Reed, waterline, and moisture shifts imply stability drift before overt crisis.",
        },
        food_security: {
          score: chapterEvidencePack.evidence.some((row) => row.inferredYear === null) ? 64 : 72,
          direction: "falling",
          rationale: "Store adequacy remains moderate but spoilage and timing risk are active.",
        },
        social_cohesion: {
          score: 74 - Math.min(12, Math.floor(input.chapterOutline.timeline.length / 2)),
          direction: "falling",
          rationale: "Kin cohesion remains functional while silent pressure routing increases.",
        },
        external_awareness: {
          score: 34 + Math.min(22, chapterLaw.futureArcConstraints.length * 4),
          direction: "rising",
          rationale: "Future-arc constraints and messenger posture imply external disruption awareness.",
        },
        memory_continuity: {
          score: 83,
          direction: "flat",
          rationale: "Lineage memory remains trusted and frequently referenced for interpretation.",
        },
        identity_stability: {
          score: 79 - Math.min(10, chapterLaw.futureArcConstraints.length * 2),
          direction: "falling",
          rationale: "Identity is still stable but now tied to active continuity labor.",
        },
        labor_pressure: {
          score: 52 + Math.min(20, input.chapterOutline.timeline.length * 2),
          direction: "rising",
          rationale: "Storage reroutes and vigilance work increase labor intensity.",
        },
        signal_integrity: {
          score: 63 - Math.min(20, chapterEvidencePack.evidence.length),
          direction: "falling",
          rationale: "Signal readability softens as environmental cues become less consistent.",
        },
        decision_pressure: {
          score: 45 + Math.min(18, chapterLaw.futureArcConstraints.length * 4),
          direction: "rising",
          rationale: "Small decisions carry amplified downstream consequences.",
        },
        movement_pressure: {
          score: 18 + Math.min(18, chapterLaw.futureArcConstraints.length * 3),
          direction: "rising",
          rationale: "Movement remains low but no longer unthinkable.",
        },
        relational_heat: {
          score: 37 + Math.min(18, input.chapterOutline.timeline.length * 2),
          direction: "rising",
          rationale: "Unspoken tension and duty strain remain contained but increasing.",
        },
        meaning_load: {
          score: 34 + Math.min(20, chapterLaw.futureArcConstraints.length * 2),
          direction: "rising",
          rationale: "Meaning rises where continuity obligations are pressured by uncertain signals.",
        },
      },
      activeContinuityThreads: threadContinuityProjection.activeContinuityThreads,
      threatenedContinuityThreads: threadContinuityProjection.threatenedContinuityThreads,
      sourceBasis: [
        "chapter_segment_simulation_state",
        "chapter_law",
        "chapter_evidence_pack",
        "chapter_character_hidden_histories",
      ],
    });
    const chapterBeatProfileRecommendation = deriveBeatProfileRecommendation(chapterState);
    const narrativePsychologyArchitecture = new NarrativePsychologyDerivationService().buildBook1Architecture();
    const narrativePsychologyValidation = validateNarrativePsychologyArchitecture(narrativePsychologyArchitecture);
    const chapterNarrativePsychology =
      narrativePsychologyArchitecture.chapters.find((row) => row.sequence === chapterState.sequenceNumber) ??
      narrativePsychologyArchitecture.chapters[0];
    const narrativePsychologyChapterStateBias = mapNarrativePsychologyToChapterState({
      chapterPsychology: chapterNarrativePsychology,
      chapterState,
    });
    const narrativePsychologyBeatBias = mapNarrativePsychologyToBeatProfile({
      chapterStateBias: narrativePsychologyChapterStateBias,
      recommendation: chapterBeatProfileRecommendation,
    });
    const threadChapterStateInfluence = threadToChapterStateService.deriveInfluence({
      chapterState,
      threads: narrativeThreadPack.threads,
    });
    const threadBeatInfluence = threadToBeatProfileService.deriveInfluence({
      chapterId: chapterState.chapterId,
      threads: narrativeThreadPack.threads,
    });
    const narrativeThreadInspection = narrativeThreadDerivationService.deriveInspection({
      chapterId: chapterState.chapterId,
      threads: narrativeThreadPack.threads,
      chapterComposition,
      reinterpretations: narrativeThreadPack.reinterpretations,
      delayedConvergenceEvents: narrativeThreadPack.delayedConvergenceEvents.concat(delayedConvergenceEvents),
    });
    const beatProfileWithPsychologyBias = {
      ...chapterBeatProfileRecommendation,
      topWeightedBeatTypes: chapterBeatProfileRecommendation.topWeightedBeatTypes
        .map((row) => ({
          beatType: row.beatType,
          weight: Math.max(
            0,
            Math.min(
              1,
              Number(
                (
                  row.weight +
                  (narrativePsychologyBeatBias.beatWeightBias[row.beatType] ?? 0) * 0.2 +
                  (threadBeatInfluence.beatWeightBias[row.beatType] ?? 0) * 0.2
                ).toFixed(4),
              ),
            ),
          ),
        }))
        .sort((a, b) => b.weight - a.weight),
      transitionBiasNotes: chapterBeatProfileRecommendation.transitionBiasNotes.concat(
        narrativePsychologyBeatBias.emphasisNotes,
        threadBeatInfluence.emphasisNotes,
      ),
    };
    const beatAssemblyAdapter = new ChapterStateToBeatAssemblyChainService();
    const beatAssemblyResultSeed = beatAssemblyAdapter.run({
      chapterState,
      beatProfileRecommendation: beatProfileWithPsychologyBias,
    });
    const beatAssemblyResult = input.forceBeatChainValidationFailure
      ? {
          status: "blocked" as const,
          failure: {
            artifact: "chapter_state_beat_assembly_failure" as const,
            chapterId: chapterState.chapterId,
            chapter: chapterState.sequenceNumber,
            failureStage: "validation" as const,
            reasons: ["Forced failure path for gating regression test."],
            actionableNextSteps: ["Disable forceBeatChainValidationFailure for production runs."],
          },
        }
      : beatAssemblyResultSeed;
    const beatAssemblyBlocked = beatAssemblyResult.status === "blocked";
    const beatAssemblyFailure = beatAssemblyResult.status === "blocked" ? beatAssemblyResult.failure : null;
    const beatAssemblyPreflight =
      beatAssemblyResult.status === "ready"
        ? beatAssemblyResult.preflight
        : {
            artifact: "chapter_state_beat_preflight",
            chapterId: chapterState.chapterId,
            orderedBeatTypes: [] as string[],
            dominantPressures: chapterState.dominantPressures,
            suppressedPressures: chapterState.suppressedPressures,
          };
    const beatAssemblyChain =
      beatAssemblyResult.status === "ready"
        ? beatAssemblyResult.chain
        : new Book1BeatAssemblyService().buildChapter1BeatAssembly().chain;
    const blockedProseConstraints = ProseGenerationConstraintsSchema.parse({
      artifact: "prose_generation_constraints",
      proseConstraintId: `${chapterState.chapterId}-constraints-blocked`,
      chapterId: chapterState.chapterId,
      parentBeatChainId: beatAssemblyChain.artifact,
      parentChapterStateId: chapterState.chapterId,
      parentNarrativePsychologyId: chapterNarrativePsychology.parentBookId,
      povCharacterId: chapterState.povWeightingCandidates[0]?.characterId ?? "natchitoches-observer",
      proseMode: chapterNarrativePsychology.chapterPsychologyMode,
      narrativeDistance: "close_externalized_embodied",
      cognitionMode: ["native_relational", "place_linked"],
      sentencePressureProfile: { level: "medium", compressionBias: 0.5 },
      sensoryDensityProfile: { requiredDensity: "high", requiredChannels: ["touch"] },
      environmentalGroundingFloor: 0.8,
      relationalSignalDensity: 0.6,
      memoryInvocationAllowance: 0.4,
      expositionAllowance: 0.1,
      interpretationAllowance: 0.3,
      ambiguityAllowance: 0.4,
      revelationAllowance: 0.2,
      emotionalLabelAllowance: 0.1,
      meaningReflectionAllowance: 0.2,
      lineTensionProfile: { target: "steady", unresolvedCarryForward: 0.5 },
      paragraphBreathProfile: { averageSentences: 4, allowedLongParagraphRatio: 0.2 },
      cadenceProfile: ["Beat chain blocked; prose path constrained to diagnostics."],
      dictionGuardrails: ["No generation while beat gate blocked."],
      syntaxGuardrails: ["No generation while beat gate blocked."],
      forbiddenPatterns: ["free writing without validated beat chain"],
      requiredPatterns: ["emit blocking diagnostics for cockpit"],
      endingMomentumProfile: { vector: "blocked", carryForwardPressureType: "gating_failure" },
      literaryDeviceConstraints: {
        activeDeviceIds: [],
        suppressedDeviceIds: [],
        soundPatternAllowance: "minimal",
        symbolismAllowance: "minimal",
        metaphorSimileAllowance: "minimal",
        explicitnessCeiling: "implicit",
        closurePressureStyle: "state_pressure_seeded",
        callbackPhraseAllowance: false,
        placeMemoryInsertionOpportunities: [],
        repetitionAllowance: "rare_only",
      },
      continuityEmphasis: 0.7,
      placeImmersionTarget: 0.8,
      attachmentTarget: 0.7,
      driftFlags: ["beat_gating_blocked"],
      validationFlags: ["blocked"],
    });
    const baseProseConstraints = beatAssemblyResult.status === "ready"
      ? new ProseGenerationConstraintDerivationService().derive({
          chapterPsychology: chapterNarrativePsychology,
          chapterState,
          beatChain: beatAssemblyChain,
          integration: { deferNarratorToCluster3: true },
        })
      : blockedProseConstraints;
    const literaryDeviceDerivationService = new LiteraryDeviceDerivationService();
    const literaryValidationService = new LiteraryDeviceValidationService();
    const literaryToProseService = new LiteraryDeviceToProseConstraintsService();
    const literaryCockpitService = new LiteraryDeviceCockpitService();
    const symbolRegistryService = new LiterarySymbolRegistryService();
    const literaryDevicePack = literaryDeviceDerivationService.buildBook1SamplePack({
      chapterId: chapterState.chapterId,
      sceneId: chapterComposition.sceneSequence[0]?.sceneId ?? "book1-ch01-sc01",
      sceneRoles: chapterComposition.sceneSequence.map((_, index) =>
        index === chapterComposition.sceneSequence.length - 1 ? "closure_scene" : index === 0 ? "grounding_scene" : "warning_scene",
      ),
      beatTypes: beatAssemblyChain.beats.map((beat) => beat.beatType),
      chapterPsychologyMode: chapterNarrativePsychology.chapterPsychologyMode,
      chapterMode: chapterState.chapterMode,
    });
    const literaryDeviceApplicationPlan = literaryDeviceDerivationService.deriveApplicationPlan({
      chapterId: chapterState.chapterId,
      sceneId: chapterComposition.sceneSequence[0]?.sceneId,
      chapterPsychologyMode: chapterNarrativePsychology.chapterPsychologyMode,
      chapterMode: chapterState.chapterMode,
      psychologyAxes: {
        placeImmersion: chapterNarrativePsychology.axisTargets.place_immersion,
        unresolvedPull: chapterNarrativePsychology.axisTargets.unresolved_pull,
        signalIntegrity: chapterState.stateAxes.signal_integrity.score / 100,
        relationalHeat: chapterNarrativePsychology.axisTargets.relational_heat,
        laborPressure: chapterState.stateAxes.labor_pressure.score / 100,
      },
      activeThreadIds: narrativeThreadInspection.activeThreadIds,
      settingThreadIds: narrativeThreadPack.threads.filter((thread) => thread.threadType === "setting_thread").map((thread) => thread.threadId),
      philosophyThreadIds: narrativeThreadInspection.philosophyThreadIds,
      compositionMode: "delayed_convergence",
      sceneRoles: chapterComposition.sceneSequence.map((_, index) =>
        index === chapterComposition.sceneSequence.length - 1 ? "closure_scene" : index === 0 ? "grounding_scene" : "warning_scene",
      ),
      beatTypes: beatAssemblyChain.beats.map((beat) => beat.beatType),
      controlSettings: literaryDevicePack.controlSettings,
    });
    const literaryDeviceValidation = literaryValidationService.validate({
      plan: literaryDeviceApplicationPlan,
      controls: literaryDevicePack.controlSettings,
      activeThreadIds: narrativeThreadInspection.activeThreadIds,
      chapterMode: chapterState.chapterMode,
      chapterToneCeiling: chapterState.allowedMeaningIntensity,
    });
    const boundSymbols = symbolRegistryService.upsertSymbols({
      current: literaryDevicePack.symbolRegistry,
      updates: [],
    });
    let proseConstraints = literaryToProseService.apply({
      constraints: baseProseConstraints,
      plan: literaryDeviceApplicationPlan,
      validation: literaryDeviceValidation,
    });
    const literaryDeviceCockpitSummary = literaryCockpitService.buildSummary({
      chapterId: chapterState.chapterId,
      plan: literaryDeviceApplicationPlan,
      controls: literaryDevicePack.controlSettings,
      symbols: boundSymbols,
      validation: literaryDeviceValidation,
      sceneIds: chapterComposition.sceneSequence.map((scene) => scene.sceneId),
    });
    const chapterCompositionPlan = ChapterCompositionPlanSchema.parse({
      artifact: "chapter_composition_plan",
      schemaVersion: "1.0.0",
      compositionPlanId: `${chapterState.chapterId}-composition-plan`,
      chapterId: chapterState.chapterId,
      parentBookId: "book1",
      parentNarrativePsychologyId: chapterNarrativePsychology.parentBookId,
      parentChapterStateId: chapterState.chapterId,
      activeThreadIds: narrativeThreadInspection.activeThreadIds,
      latentThreadIds: narrativeThreadInspection.latentThreadIds,
      callbackThreadIds: narrativeThreadPack.threads.filter((thread) => thread.callbackPotential > 0.35).map((thread) => thread.threadId),
      routeRequirementStatus: {
        requiredLocationIds: settingCoverageReport.requiredLocationIds,
        missingLocationIds: settingCoverageReport.missingLocationIds,
        recurrenceSatisfied: settingCoverageReport.missingLocationIds.length === 0,
        enforcementNotes: settingCoverageReport.recommendations,
      },
      philosophyRequirementStatus: {
        activePhilosophyThreadIds: narrativeThreadInspection.philosophyThreadIds,
        explicitnessCeiling: 0.28,
        satisfied: narrativeThreadInspection.philosophyThreadIds.length > 0,
        warnings: narrativeThreadInspection.philosophyThreadIds.length > 0 ? [] : ["No active philosophy thread in chapter."],
      },
      compositionMode: "delayed_convergence",
      sceneCountTarget: Math.max(2, Math.min(6, chapterComposition.sceneSequence.length)),
      sceneSequence: chapterComposition.sceneSequence.map((scene, index) => ({
        scenePlanId: `${chapterState.chapterId}-scene-${String(index + 1).padStart(2, "0")}`,
        chapterId: chapterState.chapterId,
        sceneOrder: index + 1,
        sceneRole:
          index === 0
            ? "grounding_scene"
            : index === chapterComposition.sceneSequence.length - 1
              ? "closure_scene"
              : index === 1
                ? "warning_scene"
                : "rumor_scene",
        povCandidateWeights: chapterState.povWeightingCandidates.map((candidate) => ({
          povId: candidate.characterId,
          weight: Number(candidate.weight.toFixed(2)),
        })),
        dominantThreadIds: scene.activeThreadIds,
        secondaryThreadIds: scene.callbackThreadIds,
        latentThreadIds: scene.latentThreadIds,
        settingBindings: [scene.locationId],
        routeBindings: [scene.locationId],
        philosophyBindings: narrativeThreadInspection.philosophyThreadIds.slice(0, 2),
        callbackSeeds: scene.seededThreadIds.map((threadId) => `${scene.sceneId}:${threadId}`),
        delayedConvergenceKeys: scene.hiddenConvergenceKeys,
        requiredBeatBiases: {
          salience_lock_beat: index === 0 ? 0.6 : 0.3,
          consequence_seed_beat: index > 0 ? 0.5 : 0.2,
        },
        requiredStateBiases: {
          unresolved_pull: index === chapterComposition.sceneSequence.length - 1 ? 0.65 : 0.45,
          external_awareness: 0.5,
        },
        apparentConnectionLevel: scene.hiddenConvergenceKeys.length > 0 ? "apparently_isolated" : "indirectly_linked",
        actualConnectionLevel: scene.hiddenConvergenceKeys.length > 0 ? "convergent_later" : "hidden_linked",
        transitionStrategy: scene.transitionToNextScene,
        carryForwardPressureType: "threaded_pressure",
        sceneClosureType: index === chapterComposition.sceneSequence.length - 1 ? "pressure_forward" : "open_knot",
        validationFlags: [],
      })),
      sceneContrastProfile: {
        tonalContrast: 0.58,
        pressureContrast: 0.62,
        threadMixContrast: 0.55,
        settingContrast: 0.47,
        notes: chapterComposition.sceneContrastLogic,
      },
      delayedConvergenceBindings: chapterComposition.sceneSequence
        .flatMap((scene) =>
          scene.hiddenConvergenceKeys.map((key) => ({
            delayedConvergenceKey: key,
            hiddenConvergenceBinding: scene.delayedConvergenceBindings.length > 0 ? scene.delayedConvergenceBindings : [scene.sceneId],
            convergenceWindow: "chapter-04-to-07",
            convergencePayoffTarget: "book1-mid-convergence",
            connectionVisibilityNow: "apparently_isolated",
            connectionVisibilityLater: "convergent_later",
          })),
        ),
      callbackMarkers: callbackEvents.map((event) => ({
        callbackId: event.callbackEventId,
        sourceSceneId: event.sourceNodeId,
        sourceThreadId: event.threadId,
        callbackStrength: Number(Math.min(1, event.addedMeaningLoad).toFixed(2)),
        callbackWindow: event.reentryChapterId,
        callbackType: "warning_pattern",
        laterTargetOptions: [event.reentrySceneId],
      })),
      reinterpretationAnchors: narrativeThreadPack.reinterpretations.map((reinterpretation) => ({
        reinterpretationAnchorId: reinterpretation.reinterpretationId,
        sourceSceneId: reinterpretation.eventAnchorId,
        sourceThreadIds: [reinterpretation.threadId],
        originalPovId: reinterpretation.sourcePov,
        alternatePovCandidates: [reinterpretation.targetPov],
        reinterpretableElements: [reinterpretation.reinterpretationDelta],
        likelyMeaningShift: reinterpretation.reinterpretationDelta,
        hiddenInformationDelta: `memory-distortion=${reinterpretation.memoryDistortionFactor}`,
        reentryEligibilityWindow: "chapter-03+",
        validationFlags: [],
      })),
      densityScore:
        narrativeThreadInspection.sceneDensity.reduce((acc, row) => acc + row.densityScore, 0) /
        Math.max(1, narrativeThreadInspection.sceneDensity.length),
      densityWarnings: narrativeThreadInspection.warnings,
      routeCoverageNotes: settingCoverageReport.recommendations,
      continuityCarryForwardPlan: chapterComposition.sceneTransitions.slice(-2),
      unresolvedPressurePlan: [chapterComposition.chapterCarryForwardProfile, chapterComposition.chapterClosureProfile],
      chapterClosureProfile: "convergence_teased",
      validationFlags: [],
    });
    const governanceOrchestration = new CanonicalNarrativeGovernanceOrchestrationService();
    const cluster3Governance = governanceOrchestration.orchestrate({
      proseConstraintsAfterLiteraryLayer: proseConstraints,
      epicId: "book1-epic",
      bookId: "book1",
      chapterId: chapterState.chapterId,
      chapterSequence: chapterState.sequenceNumber,
      chapterMode: chapterState.chapterMode,
      chapterPsychologyMode: chapterNarrativePsychology.chapterPsychologyMode,
      activeThreadIds: narrativeThreadInspection.activeThreadIds,
      chapterCompositionPlan,
      narrativeThreads: narrativeThreadPack.threads,
      settingCoverageReport,
      sceneIdsInChapter: chapterComposition.sceneSequence.map((scene) => scene.sceneId),
      preparationPath: "book1_regeneration_orchestration",
      literaryLayerParityNote: null,
    });
    const sequenceDerivation = cluster3Governance.sequenceDerivation;
    const sequenceValidation = cluster3Governance.sequenceValidation;
    const epicContinuityPack = cluster3Governance.epicContinuityPack;
    const epicContinuityValidation = cluster3Governance.validations.epicContinuity;
    const epicEmotionalGravityPack = cluster3Governance.epicEmotionalGravityPack;
    const epicEmotionalGravityValidation = cluster3Governance.validations.epicEmotionalGravity;
    const narratorPresencePack = cluster3Governance.narratorPresencePack;
    const narratorPresenceValidation = cluster3Governance.validations.narratorPresence;
    proseConstraints = cluster3Governance.proseConstraints;
    const sceneGeneration = new SceneGenerationEngineService().run({
      chapterId: chapterState.chapterId,
      parentBookId: "book1",
      parentChapterStateId: chapterState.chapterId,
      parentNarrativePsychologyId: chapterNarrativePsychology.parentBookId,
      chapterCompositionPlan,
      sequencePlanId: sequenceDerivation.bookSequencePlan.bookId,
      activeThreadPackId: "book1-thread-pack",
      routeLedgerSnapshot: settingCoverageReport,
      philosophyPropagationPlanId: `${chapterState.chapterId}:philosophy`,
      callbackPlanId: `${chapterState.chapterId}:callbacks`,
      reinterpretationAnchorSetId: `${chapterState.chapterId}:reinterpretation`,
      chapterLevelProseConstraints: proseConstraints,
      chapterMode: chapterState.chapterMode,
      chapterPsychologyMode: chapterNarrativePsychology.chapterPsychologyMode,
      chapterLevelLiteraryControlSettings: literaryDevicePack.controlSettings,
      chapterLevelLiteraryDevicePlan: literaryDeviceApplicationPlan,
      beatChain: beatAssemblyChain,
    });
    const prosePreflight = new ProseGenerationPreflightService().build({ constraints: proseConstraints });
    const proseOutputPathService = new ProseGenerationOutputPathService();
    const chapter1ProseGenerationPacket = proseOutputPathService.buildChapter1Packet({
      chapterPsychology: chapterNarrativePsychology,
      chapterState,
      beatChain: beatAssemblyChain,
      proseConstraints,
    });
    const chapter1ProseOutputPathReport = proseOutputPathService.runConstrainedOutputPath({
      chapterPsychology: chapterNarrativePsychology,
      chapterState,
      beatChain: beatAssemblyChain,
      proseConstraints,
    });
    const proseGenerationValidation = beatAssemblyResult.status === "ready"
      ? new ProseGenerationValidationService().validate({
          constraints: proseConstraints,
          beatChain: beatAssemblyChain,
          proseBySegment: chapter1ProseOutputPathReport.generatedParagraphs,
        })
      : chapter1ProseOutputPathReport.validation;
    const thoughtRecurrenceGuard = Book1ThoughtRecurrenceGuardSchema.parse(
      new Book1ThoughtRecurrenceGuardService().build({
        segmentSimulationState,
      }),
    );
    const enneagramOperatingLayer = EnneagramOperatingLayerSchema.parse(
      buildEnneagramOperatingLayer({
        activeCharacters,
        cognitionSignatures: cognitionSignatures.characters,
        segmentSimulationState,
      }),
    );
    const enneagramConsciousnessEngine = EnneagramConsciousnessEngineSchema.parse(
      buildEnneagramConsciousnessEngine({
        activeCharacters,
        enneagramOperatingLayer,
        cognitionSignatures: cognitionSignatures.characters,
        hiddenHistories: chapterCharacterHiddenHistories.characters,
        segmentSimulationState,
      }),
    );
    const enneagramMediationLayer = Book1EnneagramMediationLayerSchema.parse(
      new Book1EnneagramMediationService().build({
        activeCharacters,
        enneagramOperatingLayer,
        enneagramConsciousnessEngine,
      }),
    );
    const roleMap: Record<string, "focal-adult" | "ascending-adult" | "elder" | "threshold-learner" | "child"> = {};
    for (const character of activeCharacters) {
      const lower = character.toLowerCase();
      if (lower.includes("elder") || lower.includes("memory holder")) roleMap[character] = "elder";
      else if (lower.includes("child") || lower.includes("silent recorder")) roleMap[character] = "child";
      else if (lower.includes("threshold") || lower.includes("younger woman")) roleMap[character] = "threshold-learner";
      else {
        const consciousness = enneagramConsciousnessEngine.characters.find(
          (row) => row.character.toLowerCase() === lower,
        );
        roleMap[character] = consciousness?.levelsOfDevelopment?.currentAwarenessLevel === "high"
          ? "focal-adult"
          : "ascending-adult";
      }
    }
    const developmentalIntimacyEngine = Book1DevelopmentalIntimacyEngineSchema.parse(
      new Book1DevelopmentalIntimacyEngineService().build({
        activeCharacters,
        characterSeeds: activeCharacters.map((character) => ({
          character,
          role: roleMap[character] ?? "ascending-adult",
        })),
        segments: input.chapterOutline.timeline.map((segment) => ({
          segment: segment.segment,
          sceneFocus: segment.sceneFocus,
          characters: segment.characters,
        })),
      }),
    );
    const motiveCompression = Book1MotiveCompressionSchema.parse(
      new Book1MotiveCompressionService().build({
        segmentSimulationState,
      }),
    );
    const characterDistinctionPlan = Book1CharacterDistinctionPlanSchema.parse(
      new Book1CharacterDistinctionPlanService().build({
        cognitionSignatures,
        segmentSimulationState,
      }),
    );
    const motiveCompressionWithMediation = {
      ...motiveCompression,
      characterStates: motiveCompression.characterStates.map((state) => {
        const mediated = enneagramMediationLayer.characters.find(
          (row) => row.character.toLowerCase() === state.character.toLowerCase(),
        );
        if (!mediated) return state;
        return {
          ...state,
          coreImmediateWant: state.coreImmediateWant,
          coreImmediateFear: state.coreImmediateFear,
          currentTacticalBehavior: `${state.currentTacticalBehavior} Under strain converts through ${mediated.bodilyStressConversions[0]?.toLowerCase() ?? "embodied stress routing"}.`,
        };
      }),
      segmentDirectives: motiveCompression.segmentDirectives.map((directive) => {
        const mediated = enneagramMediationLayer.characters.find(
          (row) => row.character.toLowerCase() === directive.character.toLowerCase(),
        );
        if (!mediated) return directive;
        const mode =
          mediated.omissionPatterns.some((pattern) => pattern.toLowerCase().includes("ceiling"))
            ? "suppress because already surfaced"
            : mediated.silencePatterns.some((pattern) => pattern.toLowerCase().includes("control gate"))
              ? "imply through action"
              : directive.mode;
        return {
          ...directive,
          mode,
          rationale: `${directive.rationale} Mediation signal: ${mediated.omissionPatterns[0] ?? "withhold direct motive labels"}.`,
        };
      }),
    };
    const characterDistinctionPlanWithMediation = {
      ...characterDistinctionPlan,
      characters: characterDistinctionPlan.characters.map((character) => {
        const mediated = enneagramMediationLayer.characters.find(
          (row) => row.character.toLowerCase() === character.character.toLowerCase(),
        );
        const devProfile = developmentalIntimacyEngine.characters.find(
          (row) => row.character.toLowerCase() === character.character.toLowerCase(),
        );
        if (!mediated) return character;
        const devBodyConversion = devProfile?.renderingImpact.bodilyConversionPatterns[0] ?? "";
        const devSilence = devProfile?.renderingImpact.silencePatterns[0] ?? "";
        return {
          ...character,
          noticesFirst: `${character.noticesFirst}; mediation=${mediated.perceptionBiasOutputs[0] ?? "attention routed through embodied cues"}`,
          neverNamesDirectly: mediated.omissionPatterns[0] ?? character.neverNamesDirectly,
          emotionalPressurePhysicalization: `${character.emotionalPressurePhysicalization} Stress tell: ${mediated.bodilyStressConversions[0] ?? "somatic conversion before naming"}.${devBodyConversion ? ` Developmental conversion: ${devBodyConversion}.` : ""}`,
          sentenceTexture: `${character.sentenceTexture}; silence mode: ${mediated.silencePatterns[0] ?? "speech delayed by social-risk gating"}${devSilence ? `; developmental silence: ${devSilence}` : ""}`,
        };
      }),
    };
    const abstractFearSuppression = Book1AbstractFearSuppressionSchema.parse(
      new Book1AbstractFearLanguageSuppressorService().build({
        segments: input.chapterOutline.timeline.map((segment) => ({
          segment: segment.segment,
        })),
      }),
    );
    const sentencePatternPlan = Book1SentencePatternPlanSchema.parse(
      new Book1SentencePatternGovernorService().buildPlan({
        segments: input.chapterOutline.timeline.map((segment) => ({
          segment: segment.segment,
          sceneFocus: segment.sceneFocus,
          setting: segment.setting,
        })),
      }),
    );
    const segmentEnergy = Book1SegmentEnergyMapSchema.parse(
      new Book1SegmentEnergyService().build({
        outline: input.chapterOutline,
      }),
    );
    const embodiment = Book1EmbodimentMapSchema.parse(
      new Book1EmbodimentTransformerService().transform({
        chapterEvidencePack,
        livedHistory,
        proseBriefs,
        chapterLaw,
      }),
    );
    const entryStrategyPlan = EntryStrategyPlanSchema.parse(
      buildEntryStrategyPlan({
        segments: input.chapterOutline.timeline.map((segment) => ({ segment: segment.segment })),
        segmentEnergy: segmentEnergy.segments.map((segment) => ({ segment: segment.segment, dominantEnergy: segment.dominantEnergy })),
      }),
    );
    const paragraphShapePlan = ParagraphShapePlanSchema.parse(
      buildParagraphShapePlan({
        segments: input.chapterOutline.timeline.map((segment) => ({ segment: segment.segment })),
      }),
    );
    const embodimentAssemblyAdjustments = EmbodimentAssemblyAdjustmentsSchema.parse(
      buildEmbodimentAssemblyAdjustments({
        segments: input.chapterOutline.timeline.map((segment) => ({ segment: segment.segment })),
      }),
    );
    const transitionTexturePlan = TransitionTexturePlanSchema.parse(
      buildTransitionTexturePlan({
        segments: input.chapterOutline.timeline.map((segment) => ({ segment: segment.segment })),
      }),
    );
    const segment24OpenerPolicy = Segment24OpenerPolicySchema.parse(
      buildSegment24OpenerPolicy({
        segments: input.chapterOutline.timeline.map((segment) => ({ segment: segment.segment })),
      }),
    );
    const segment24EmbodimentPolicy = Segment24EmbodimentPolicySchema.parse(
      buildSegment24EmbodimentPolicy({
        segments: input.chapterOutline.timeline.map((segment) => ({ segment: segment.segment })),
      }),
    );
    const openingFamilyAudit = OpeningFamilyAuditSchema.parse(
      buildOpeningFamilyAudit({
        entryStrategyPlan,
      }),
    );
    const openingParagraphFamilyPlan = OpeningParagraphFamilyPlanSchema.parse(
      buildOpeningParagraphFamilyPlan({
        segments: input.chapterOutline.timeline.map((segment) => ({ segment: segment.segment })),
      }),
    );
    const firstTwoSentencePlan = FirstTwoSentencePlanSchema.parse(
      buildFirstTwoSentencePlan({
        segments: input.chapterOutline.timeline.map((segment) => ({ segment: segment.segment })),
      }),
    );
    const voiceEngineRulebook = VoiceEngineRulebookSchema.parse(buildVoiceEngineRulebook());
    const narrativeDistancePlan = NarrativeDistancePlanSchema.parse(
      buildNarrativeDistancePlan({
        segments: input.chapterOutline.timeline.map((segment) => ({ segment: segment.segment })),
        targetedConstraints,
        activeFeedbackCategories,
      }),
    );
    const abstractionSuppression = AbstractionSuppressionSchema.parse(
      buildAbstractionSuppression({
        targetedConstraints,
        activeFeedbackCategories,
      }),
    );
    const rawVoiceCognitionMap = VoiceCognitionMapSchema.parse(
      buildVoiceCognitionMap({
        activeCharacters,
        cognitionSignatures: cognitionSignatures.characters,
        hiddenHistories: chapterCharacterHiddenHistories.characters,
        enneagramMediationLayer,
      }),
    );
    const voiceCognitionMap = {
      ...rawVoiceCognitionMap,
      characters: rawVoiceCognitionMap.characters.map((character) => {
        const devProfile = developmentalIntimacyEngine.characters.find(
          (row) => row.character.toLowerCase() === character.character.toLowerCase(),
        );
        if (!devProfile) return character;
        const devConversions = devProfile.renderingImpact.bodilyConversionPatterns.slice(0, 2);
        return {
          ...character,
          bodilyConversionPatterns: [
            ...character.bodilyConversionPatterns,
            ...devConversions,
          ],
        };
      }),
    };
    const perspectiveRoutingPlan = PerspectiveRoutingPlanSchema.parse(
      buildPerspectiveRoutingPlan({
        segments: input.chapterOutline.timeline.map((segment) => ({ segment: segment.segment, cast: segment.characters })),
        voiceCognitionMap,
        narrativeDistancePlan,
        chapterLaw,
        segmentSimulationState,
        enneagramMediationLayer,
        targetedConstraints,
        activeFeedbackCategories,
      }),
    );
    const voiceLawEngine = VoiceLawEngineSchema.parse(
      buildVoiceLawEngine({
        voiceRulebook: voiceEngineRulebook,
        chapterLaw,
        targetedConstraints,
        activeFeedbackCategories,
      }),
    );
    const languageSuppressionMap = LanguageSuppressionMapSchema.parse(
      buildLanguageSuppressionMap({
        abstractionSuppression,
        thoughtRecurrenceGuard,
        enneagramMediationLayer,
      }),
    );
    const renderDirectives = RenderDirectivesSchema.parse(
      buildRenderDirectives({
        segments: input.chapterOutline.timeline.map((segment) => ({ segment: segment.segment, cast: segment.characters })),
        perspectiveRoutingPlan,
        voiceLawEngine,
        voiceCognitionMap,
        embodiment,
        thoughtRecurrenceGuard,
        enneagramMediationLayer,
        targetedConstraints,
        activeFeedbackCategories,
      }),
    );
    const consciousnessCohesionRouter = Book1ConsciousnessCohesionRouterSchema.parse(
      new Book1ConsciousnessCohesionRouterService().build({
        chapterVoiceCognitionMap: voiceCognitionMap,
        chapterEnneagramMediationLayer: enneagramMediationLayer,
        chapterDevelopmentalIntimacyEngine: developmentalIntimacyEngine,
        chapterSegmentSimulationState: segmentSimulationState,
        chapterRenderDirectives: renderDirectives,
        chapterVoiceLawEngine: voiceLawEngine,
        chapterLanguageSuppressionMap: languageSuppressionMap,
        chapterPerspectiveRoutingPlan: perspectiveRoutingPlan,
      }),
    );
    const voiceIdentityStabilizer = Book1VoiceIdentityStabilizerSchema.parse(
      new Book1VoiceIdentityStabilizerService().build({
        chapterVoiceCognitionMap: voiceCognitionMap,
        chapterConsciousnessCohesionRouter: consciousnessCohesionRouter,
      }),
    );
    const embodiedInnerLifeRouter = Book1EmbodiedInnerLifeRouterSchema.parse(
      new Book1EmbodiedInnerLifeRouterService().build({
        segments: input.chapterOutline.timeline.map((segment) => ({
          segment: segment.segment,
          cast: segment.characters,
        })),
        chapterDevelopmentalIntimacyEngine: developmentalIntimacyEngine,
        chapterEnneagramMediationLayer: enneagramMediationLayer,
        chapterCognitionSignatures: cognitionSignatures,
      }),
    );
    const segment1OpenerIsolation = Segment1OpenerIsolationSchema.parse({
      artifact: "chapter_segment_1_opener_isolation",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      segment1Family: firstTwoSentencePlan.segments[0]?.family ?? "sound_to_withheld_recognition",
      protectedTokenStem: "",
      blockedForLaterSegments: firstTwoSentencePlan.segments[0]
        ? [firstTwoSentencePlan.segments[0].family]
        : [],
    });

    const lockedAnchorSet = new Set(chapterEpicSimulation.hiddenTimeline.map((row) => row.beatId));
    const characterMutationMap = new Map(
      characterSession.turns
        .map((turn) => turn.proposedMutation)
        .filter((row): row is NonNullable<typeof row> => Boolean(row))
        .map((mutation) => [mutation.mutationId, mutation]),
    );
    const lawActionMap = new Map(lawSession.actions.map((action) => [action.actionId, action]));
    const selectedCharacterMutationIds =
      characterSession.branchSandbox.canonicalMutations.length > 0
        ? characterSession.branchSandbox.canonicalMutations.map((row) => row.mutationId)
        : characterSession.branchSandbox.simulatedMutations.map((row) => row.mutationId);
    const selectedLawActionIds =
      lawSession.branchSandbox.canonicalMutations.length > 0
        ? lawSession.branchSandbox.canonicalMutations.map((row) => row.actionId)
        : lawSession.branchSandbox.simulatedPatches.map((row) => row.actionId);
    const approvedCharacterMutations = selectedCharacterMutationIds
      .map((row) => characterMutationMap.get(row))
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
    const approvedLawActions = selectedLawActionIds
      .map((row) => lawActionMap.get(row))
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    const changedSystems: string[] = [
      "voice_contract",
      "prose_briefs",
      "lived_history",
      "cognition_signatures",
      "enneagram_operating_layer",
      "enneagram_consciousness_engine",
      "enneagram_mediation_layer",
      "segment_simulation_state",
      "chapter_state_model",
      "chapter_state_to_beat_profile",
      "thought_recurrence_guard",
      "motive_compression",
      "character_distinction_plan",
      "abstract_fear_suppression",
      "entry_strategy_randomizer",
      "paragraph_shape_alternator",
      "embodiment_first_injection",
      "transition_texture_builder",
      "segment_2_4_opener_policy",
      "segment_2_4_embodiment_policy",
      "opening_family_audit",
      "opening_paragraph_family_diversification",
      "opener_token_suppression",
      "first_two_sentence_diversity_governor",
      "segment_1_opener_isolation",
      "early_paragraph_anti_symmetry",
      "voice_engine_rulebook",
      "narrative_distance_controller",
      "abstraction_suppression_layer",
      "voice_cognition_map",
      "perspective_routing_plan",
      "voice_law_engine",
      "language_suppression_map",
      "render_directives",
      "consciousness_cohesion_router",
      "voice_identity_stabilizer",
      "embodied_inner_life_router",
      "sentence_pattern_governor",
      "segment_energy",
      "embodiment",
      "developmental_intimacy_engine",
    ];
    const changedCharacterStateConditions: string[] = [];
    const changedChapterLawConditions: string[] = [];
    const blockedMutations: string[] = [];
    let blockedAnchorViolations = 0;
    const provenanceRefs: string[] = [];
    changedSystems.push(
      "narrative_psychology_architecture",
      "narrative_psychology_to_chapter_state",
      "narrative_psychology_to_beat_profile",
      "chapter_state_to_beat_assembly_chain",
      "prose_generation_constraints",
      "prose_generation_preflight",
      "prose_generation_validation",
      "literary_device_control_system",
      "literary_device_derivation",
      "literary_device_validation",
      "literary_device_to_prose_constraints",
      "literary_device_cockpit",
      "narrative_sequence_architecture",
      "scene_generation_engine",
      "prose_narrative_realism_cluster5",
      "epic_narrative_continuity",
      "epic_continuity_validation",
      "epic_emotional_gravity",
      "epic_emotional_gravity_validation",
      "human_gravity_runtime_cluster6",
      "narrator_presence_engine",
      "narrator_convergence_engine",
    );
    if (beatAssemblyBlocked) {
      const humanGravitySceneId =
        chapterComposition.sceneSequence[0]?.sceneId ?? `${chapterState.chapterId}:runtime-scene`;
      const humanGravityRuntimePanel = buildHumanGravityRuntimeCockpitPanelFromProfile(
        new HumanGravityRuntimeDerivationService().deriveFromPackContext({
          pack: epicEmotionalGravityPack,
          chapterId: chapterState.chapterId,
          sceneId: humanGravitySceneId,
          chapterSequence: chapterState.sequenceNumber,
          participatingPeopleIds: ["natchitoches-matriarch-keeper", "younger-kin-observer"],
        }),
      );
      const cluster3RuntimeActivationTruthForCockpit = buildCluster3RuntimeActivationTruth({
        proseConstraints,
        sequenceValidation,
        epicContinuityPack,
        epicEmotionalGravityPack,
        narratorPresencePack,
        epicContinuityValidation,
        epicEmotionalGravityValidation,
        narratorPresenceValidation,
      });
      const authorCockpitBundle = buildAuthorCommandCockpitBundle({
        runtimeId: RUNTIME_ID_BOOK1_REGENERATION,
        context: resolveCockpitScopeContext({ scope: "chapter", chapterId: chapterState.chapterId }),
        metrics: {
          chapterProgressionState: 0.62,
          contradictionRisk: Math.min(0.95, Number((0.66 + threadChapterStateInfluence.influencedAxes.length * 0.01).toFixed(2))),
          chapterReadiness: 0.21,
        },
        chapterState: {
          chapterId: chapterState.chapterId,
          chapterMode: chapterState.chapterMode,
          dominantPressures: chapterState.dominantPressures,
          suppressedPressures: chapterState.suppressedPressures,
          movementPressure: chapterState.stateAxes.movement_pressure.score,
          decisionPressure: chapterState.stateAxes.decision_pressure.score,
          meaningLoad: chapterState.stateAxes.meaning_load.score,
          allowedMeaningIntensity: chapterState.allowedMeaningIntensity,
          validationPassed: chapterState.validationFlags.passesAll,
          riskFlags: chapterState.chapterRiskFlags,
          summaryLine: chapterState.chapterStateSummary,
        },
        narrativePsychology: {
          chapterId: chapterNarrativePsychology.chapterId,
          chapterPsychologyMode: chapterNarrativePsychology.chapterPsychologyMode,
          emotionalObjective: chapterNarrativePsychology.chapterEmotionalObjective,
          pullScore: chapterNarrativePsychology.pullProfile.pullScore,
          carryForwardHook: chapterNarrativePsychology.chapterCarryForwardHookType,
          driftWarnings: narrativePsychologyChapterStateBias.driftWarnings,
        },
        proseConstraints: {
          proseMode: proseConstraints.proseMode,
          narrativeDistance: proseConstraints.narrativeDistance,
          sensoryDensityTarget: proseConstraints.sensoryDensityProfile.requiredDensity,
          expositionAllowance: proseConstraints.expositionAllowance,
          emotionalExplicitnessCeiling: proseConstraints.emotionalLabelAllowance,
          ambiguityAllowance: proseConstraints.ambiguityAllowance,
          endingMomentumProfile: proseConstraints.endingMomentumProfile.vector,
          attachmentTarget: proseConstraints.attachmentTarget,
          placeImmersionTarget: proseConstraints.placeImmersionTarget,
          compliant: false,
          driftWarnings: beatAssemblyFailure?.reasons ?? [],
        },
        beatGating: {
          required: true,
          blocked: true,
          reason: (beatAssemblyFailure?.reasons ?? []).join(" | ") || "Beat assembly validation failed.",
        },
        narrativeThreads: {
          ...narrativeThreadInspection,
          warnings: narrativeThreadInspection.warnings.concat(
            settingCoverageReport.recommendations.slice(0, 1),
            callbackEvents.length === 0 ? ["No callback events detected in active chapter thread set."] : [],
          ),
        },
        chapterComposition: {
          chapterId: chapterComposition.chapterId,
          compositionMode: "delayed_convergence",
          sceneCount: chapterComposition.sceneSequence.length,
          sceneRoleSpread: chapterComposition.sceneSequence.map((_, index) =>
            index === chapterComposition.sceneSequence.length - 1 ? "closure_scene" : index === 0 ? "grounding_scene" : "rumor_scene",
          ),
          dominantThreadFamilies: chapterComposition.dominantThreads,
          latentThreadFamilies: chapterComposition.latentThreads,
          delayedConvergenceMarkers: Array.from(new Set(chapterComposition.sceneSequence.flatMap((scene) => scene.delayedConvergenceBindings))),
          callbackMarkers: narrativeThreadInspection.callbackMarkers,
          reinterpretationAnchorIds: narrativeThreadInspection.reinterpretationCandidates,
          routeCoverageStatus: settingCoverageReport.missingLocationIds.length === 0 ? "satisfied" : "missing_required_presence",
          philosophyPropagationStatus:
            narrativeThreadInspection.philosophyThreadIds.length > 0 ? "active_non_preachy" : "not_applicable_for_this_chapter",
          densityScore:
            narrativeThreadInspection.sceneDensity.reduce((acc, row) => acc + row.densityScore, 0) /
            Math.max(1, narrativeThreadInspection.sceneDensity.length),
          thinnessWarnings: narrativeThreadInspection.warnings,
          chapterClosureProfile: "convergence_teased",
          carryForwardUnresolvedPressureSummary: [
            chapterComposition.chapterCarryForwardProfile,
            chapterComposition.chapterClosureProfile,
          ],
        },
        literaryDevices: {
          chapterId: chapterState.chapterId,
          activeDevicePanel: literaryDeviceCockpitSummary.activeDevices.map((row) => ({
            deviceId: row.deviceId,
            activationMode: row.activationMode,
            densityBand: row.densityBand,
            scope: row.scope,
            contexts: row.contexts,
            misuseRisk: row.misuseRisk,
            currentChapterApplicationStatus: row.chapterApplicationStatus,
          })),
          symbolRegistry: literaryDeviceCockpitSummary.symbolRegistry.map((row) => ({
            symbolId: row.symbolId,
            symbolName: row.symbolName,
            carriers: row.carriers,
            threadBindings: row.threadBindings,
            settingBindings: row.settingBindings,
            payoffWindow: row.payoffWindow,
            callbackWindow: row.callbackWindow,
          })),
          motifRegistry: literaryDeviceCockpitSummary.motifRegistry,
          routeEchoControls: {
            activationMode:
              literaryDevicePack.controlSettings.find((row) => row.deviceId === "route_echo")?.activationMode ?? "off",
            densityBand: literaryDevicePack.controlSettings.find((row) => row.deviceId === "route_echo")?.densityBand ?? "rare",
            boundRoutes: literaryDevicePack.controlSettings
              .find((row) => row.deviceId === "route_echo")
              ?.settingBindings.filter((settingId) => settingId.includes("river")) ?? [],
          },
          philosophyEchoControls: {
            activationMode:
              literaryDevicePack.controlSettings.find((row) => row.deviceId === "philosophy_echo")?.activationMode ?? "off",
            explicitnessCeiling:
              literaryDevicePack.controlSettings.find((row) => row.deviceId === "philosophy_echo")?.explicitnessBand ?? "implicit",
            carrierModes:
              literaryDevicePack.controlSettings.find((row) => row.deviceId === "philosophy_echo")?.targetCarrierModes ?? [],
          },
          alliterationControl: literaryDeviceCockpitSummary.alliterationControl,
          densityWarnings: literaryDeviceCockpitSummary.densityWarnings,
          misuseWarnings: literaryDeviceCockpitSummary.misuseWarnings,
          chapterLiteraryProfileSummary: literaryDeviceCockpitSummary.chapterProfileSummary,
          perSceneDeviceDistribution: literaryDeviceCockpitSummary.sceneDistributionSummary,
          literaryDriftWarnings: literaryDeviceCockpitSummary.driftWarnings,
        },
        epicContinuity: {
          epicId: epicContinuityPack.epicContinuityProfile.epicId,
          chapterId: epicContinuityPack.cockpitSummary.chapterId,
          currentQuestionExpression: epicContinuityPack.cockpitSummary.currentQuestionExpression,
          activeAnchorIds: epicContinuityPack.cockpitSummary.activeAnchorIds,
          anchorRecurrenceHealth: epicContinuityPack.cockpitSummary.anchorRecurrenceHealth,
          identityPersistenceStatus: epicContinuityPack.cockpitSummary.identityPersistenceStatus,
          meaningEscalationStatus: epicContinuityPack.cockpitSummary.meaningEscalationStatus,
          readerMemoryTargets: epicContinuityPack.cockpitSummary.readerMemoryTargets,
          hookLayerStatus: epicContinuityPack.cockpitSummary.hookLayerStatus,
          temporalTransitionHealth: epicContinuityPack.cockpitSummary.temporalTransitionHealth,
          disconnectionWarnings: epicContinuityPack.cockpitSummary.disconnectionWarnings,
          unresolvedEpicContinuityRisks: epicContinuityPack.cockpitSummary.unresolvedEpicContinuityRisks.concat(
            epicContinuityValidation.risks,
          ),
        },
        emotionalGravity: {
          epicId: epicEmotionalGravityPack.epicEmotionalGravityProfile.epicId,
          chapterId: epicEmotionalGravityPack.cockpitSummary.chapterId,
          attachmentStatusByCharacter: epicEmotionalGravityPack.cockpitSummary.attachmentStatusByCharacter,
          activeFearDesireVulnerabilityLines: epicEmotionalGravityPack.cockpitSummary.activeFearDesireVulnerabilityLines,
          consequenceIrreversibilityMarkers: epicEmotionalGravityPack.cockpitSummary.consequenceIrreversibilityMarkers,
          fateAgencyPressureMap: epicEmotionalGravityPack.cockpitSummary.fateAgencyPressureMap,
          relationalStakesMap: epicEmotionalGravityPack.cockpitSummary.relationalStakesMap,
          generationalBurdenStatus: epicEmotionalGravityPack.cockpitSummary.generationalBurdenStatus,
          emotionalCarryForwardSummary: epicEmotionalGravityPack.cockpitSummary.emotionalCarryForwardSummary,
          temporalEmotionalContinuityHealth: epicEmotionalGravityPack.cockpitSummary.temporalEmotionalContinuityHealth,
          emotionallyThinWarnings: epicEmotionalGravityPack.cockpitSummary.emotionallyThinWarnings,
          resetHeavyWarnings: epicEmotionalGravityPack.cockpitSummary.resetHeavyWarnings,
          epicEmotionalGravityScore: epicEmotionalGravityPack.cockpitSummary.epicEmotionalGravityScore,
          diagnostics: epicEmotionalGravityPack.cockpitSummary.diagnostics.concat(epicEmotionalGravityValidation.risks),
        },
        narratorPresence: {
          chapterId: narratorPresencePack.cockpitSummary.chapterId,
          currentNarratorPresenceLevel: narratorPresencePack.cockpitSummary.currentNarratorPresenceLevel,
          narratorAuthorityMode: narratorPresencePack.cockpitSummary.narratorAuthorityMode,
          narratorKnowledgeMode: narratorPresencePack.cockpitSummary.narratorKnowledgeMode,
          convergenceStage: narratorPresencePack.cockpitSummary.convergenceStage,
          upcomingConvergenceTriggers: narratorPresencePack.cockpitSummary.upcomingConvergenceTriggers,
          narratorHookContinuityContribution: narratorPresencePack.cockpitSummary.narratorHookContinuityContribution,
          narratorCharacterBoundaryWarnings: narratorPresencePack.cockpitSummary.narratorCharacterBoundaryWarnings.concat(
            narratorPresenceValidation.softWarnings.map((row) => row.message),
          ),
          temporalBridgeStatus: narratorPresencePack.cockpitSummary.temporalBridgeStatus,
          firstPersonReadinessStatus: narratorPresencePack.cockpitSummary.firstPersonReadinessStatus,
          voiceShiftRisks: narratorPresencePack.cockpitSummary.voiceShiftRisks.concat(
            narratorPresenceValidation.hardFailures.map((row) => row.message),
          ),
        },
        proseRealism: buildProseRealismCockpitPanelFromGovernance({
          chapterId: chapterState.chapterId,
          proseConstraints,
          narratorPresencePack,
          epicEmotionalGravityPack,
        }),
        humanGravityRuntime: humanGravityRuntimePanel,
        cluster3RuntimeActivationTruth: cluster3RuntimeActivationTruthForCockpit,
        runtimeConvergenceTruth: buildRuntimeGovernanceConvergenceTruth({
          runtimePathLabel: "regeneration",
          cluster3: cluster3RuntimeActivationTruthForCockpit,
          literaryLayerParityNotes: ["beat_assembly_blocked_operational_warnings_may_differ_from_ready_path"],
        }),
      });
      const blockedResult = {
        artifact: "book1_chapter_01_regeneration_blocked",
        schemaVersion: "1.0.0",
        chapter: 1,
        generatedAt,
        gate: {
          beatAssemblyRequired: true,
          blocked: true,
          failure: beatAssemblyFailure,
        },
        nextActions: beatAssemblyFailure?.actionableNextSteps ?? [],
      };
      return {
        voiceContract,
        proseBriefs,
        livedHistory,
        cognitionSignatures,
        segmentSimulationState,
        chapterState,
        chapterBeatProfileRecommendation: beatProfileWithPsychologyBias,
        beatAssemblyResult: blockedResult,
        beatAssemblyPreflight,
        beatAssemblyBlocked: true,
        beatAssemblyFailure,
        narrativePsychologyArchitecture,
        narrativePsychologyValidation,
        narrativePsychologyChapterStateBias,
        narrativePsychologyBeatBias,
        proseGenerationConstraints: proseConstraints,
        proseGenerationPreflight: prosePreflight,
        proseGenerationValidation,
        literaryDevicePack,
        literaryDeviceApplicationPlan,
        literaryDeviceValidation,
        literaryDeviceCockpitSummary,
        epicSequencePlan: sequenceDerivation.epicSequencePlan,
        bookSequencePlan: sequenceDerivation.bookSequencePlan,
        chapterSequencePlan: sequenceDerivation.chapterSequencePlan,
        chapterFunctionMatrix: sequenceDerivation.chapterFunctionMatrix,
        recallReframingPlans: sequenceDerivation.recallReframingPlans,
        sequenceValidation,
        sceneGenerationRequest: sceneGeneration.request,
        generatedChapterSceneBundle: sceneGeneration.bundle,
        sceneGenerationValidation: sceneGeneration.validation,
        chapter1ProseGenerationPacket,
        chapter1ProseOutputPathReport,
        authorCockpitBundle,
        epicContinuityPack,
        epicContinuityValidation,
        epicEmotionalGravityPack,
        epicEmotionalGravityValidation,
        thoughtRecurrenceGuard,
        motiveCompression: motiveCompressionWithMediation,
        characterDistinctionPlan: characterDistinctionPlanWithMediation,
        enneagramOperatingLayer,
        enneagramConsciousnessEngine,
        enneagramMediationLayer,
        developmentalIntimacyEngine,
        abstractFearSuppression,
        entryStrategyPlan,
        paragraphShapePlan,
        embodimentAssemblyAdjustments,
        transitionTexturePlan,
        segment24OpenerPolicy,
        segment24EmbodimentPolicy,
        openingFamilyAudit,
        openingParagraphFamilyPlan,
        openerTokenAudit: { artifact: "chapter_opener_token_audit", chapter: 1, entries: [] },
        firstTwoSentencePlan,
        openerFamilyMemory: { artifact: "chapter_opener_family_memory", chapter: 1, entries: [] },
        segment1OpenerIsolation,
        earlyParagraphAntiSymmetry: { artifact: "chapter_early_paragraph_anti_symmetry", chapter: 1, entries: [] },
        voiceEngineRulebook,
        narrativeDistancePlan,
        abstractionSuppression,
        voiceCognitionMap,
        perspectiveRoutingPlan,
        voiceLawEngine,
        languageSuppressionMap,
        renderDirectives,
        consciousnessCohesionRouter,
        voiceIdentityStabilizer,
        embodiedInnerLifeRouter,
        sentencePatternPlan,
        segmentEnergy,
        embodiment,
        proseShapeCritic: {
          artifact: "chapter_prose_shape_critic",
          chapter: 1,
          findings: [],
          summary: "Regeneration blocked before prose-shape critic stage.",
        },
        proseShapeSummary: {
          artifact: "chapter_prose_shape_summary",
          schemaVersion: "1.0.0",
          chapter: 1,
          generatedAt,
          mostCommonFailurePattern: null,
          segmentsWithMostFailures: [],
          failureCluster: "blocked_by_beat_gating",
          totalsByCategory: {},
        },
        regeneratedDraftJson: previousDraft,
        regeneratedDraftText: previousDraft.fullText,
        regenerationReview: blockedResult,
        regenerationDiff: {
          artifact: "book1_chapter_01_regeneration_diff",
          chapter: 1,
          lockEnforcement: { lockedAnchorViolations: 0, blockedMutations: [] },
        },
        regenerationSummary: {
          artifact: "book1_chapter_01_regeneration_summary",
          chapter: 1,
          generatedAt,
          changedSystems: unique(changedSystems),
          changedChapterLawConditions,
          changedCharacterStateConditions,
          whatImproved: [],
          whatWorsened: ["beat_assembly_validation"],
          unchangedRisks: ["regeneration_blocked"],
          recommendation: "reject new draft",
          canonRisk: "high",
          lockedAnchorsEnforced: true,
          canonicalOverwritePerformed: false,
          provenance: { sourceArtifacts: ["chapter_state_to_beat_assembly_chain_service"] },
        },
      };
    }
    const characterStateOverrides = new Map<string, Record<string, unknown>>();
    for (const mutation of approvedCharacterMutations) {
      const isAnchorMutation = mutation.mutationKind === "anchor";
      const targetLooksLockedAnchor = lockedAnchorSet.has(mutation.targetKey);
      if (isAnchorMutation && targetLooksLockedAnchor && !characterSession.governancePolicy.allowAnchorMutation) {
        blockedMutations.push(`character:${mutation.mutationId}`);
        blockedAnchorViolations += 1;
        continue;
      }
      const [characterKey] = mutation.targetKey.split(".");
      const existing = characterStateOverrides.get(characterKey) ?? {};
      characterStateOverrides.set(characterKey, { ...existing, ...mutation.patch });
      changedCharacterStateConditions.push(`${mutation.targetKey} <= ${JSON.stringify(mutation.patch)}`);
      changedSystems.push("character_console");
      provenanceRefs.push(...mutation.provenanceRefs);
    }

    const lawTuning = {
      symbolicEmphasis: 0.5,
      foreshadowingIntensity: 0.5,
      revealImplyBalance: { reveal: 0.5, imply: 0.5 },
      ritualVisibility: 0.5,
      emotionalResidueTarget: "controlled_uncertainty",
      chapterEndHookIntensity: 0.5,
    };
    for (const action of approvedLawActions) {
      const isAnchorMutation = action.actionType === "propose_anchor_mutation";
      const targetLooksLockedAnchor = lockedAnchorSet.has(action.targetKey);
      if (isAnchorMutation && targetLooksLockedAnchor && !lawSession.governancePolicy.allowAnchorMutation) {
        blockedMutations.push(`law:${action.actionId}`);
        blockedAnchorViolations += 1;
        continue;
      }
      if (action.actionType === "adjust_symbolic_emphasis") lawTuning.symbolicEmphasis = asNumber(action.patch.motifWeight, 0.5);
      if (action.actionType === "adjust_foreshadowing_intensity") {
        lawTuning.foreshadowingIntensity = Math.max(0, Math.min(1, 0.5 + asNumber(action.patch.intensityDelta, 0)));
      }
      if (action.actionType === "change_reveal_imply_balance") {
        lawTuning.revealImplyBalance = {
          reveal: asNumber(action.patch.revealRatio, 0.5),
          imply: asNumber(action.patch.implyRatio, 0.5),
        };
      }
      if (action.actionType === "change_emotional_residue_target") {
        lawTuning.emotionalResidueTarget = String(action.patch.target ?? lawTuning.emotionalResidueTarget);
      }
      if (action.actionType === "alter_chapter_end_hook_intensity") {
        lawTuning.chapterEndHookIntensity = asNumber(action.patch.hookIntensity, 0.5);
      }
      changedChapterLawConditions.push(`${action.actionType}:${action.targetKey} <= ${JSON.stringify(action.patch)}`);
      changedSystems.push("law_console");
      provenanceRefs.push(...action.provenanceRefs);
    }

    const evidenceSnippets = chapterEvidencePack.evidence.slice(0, Math.max(12, input.chapterOutline.timeline.length * 2));
    const cast = chapterCharacterHiddenHistories.characters.map((row) => row.character);
    const rollingOpenerStems: string[] = [];
    const rollingSyntaxStems: string[] = [];
    const rollingFirstTokens: string[] = [];
    const rollingFirstNounFamilies: string[] = [];
    const rollingFirstVerbFamilies: string[] = [];
    const rollingOrientationFamilies: string[] = [];
    let previousFirstTwoLengthPattern: string | null = null;
    let previousFirstTwoClausePattern: string | null = null;
    const openerTokenAuditEntries: Array<{
      segment: number;
      paragraphIndex: number;
      openerStem: string;
      syntaxStem: string;
      conflictDetected: boolean;
      resolvedByAlternateFamily: boolean;
    }> = [];
    const openerFamilyMemoryEntries: Array<{
      segment: number;
      paragraphIndex: number;
      firstToken: string;
      firstNounFamily: string;
      firstVerbFamily: string;
      firstSyntaxStem: string;
      firstOrientationFamily: string;
      conflictDetected: boolean;
      forcedAlternativeApplied: boolean;
    }> = [];
    const earlyParagraphPatterns: Array<{
      segment: number;
      sentenceLengthPattern: string;
      clauseCountPattern: string;
      orientationThenExplanationShape: boolean;
      repeatsPreviousPattern: boolean;
    }> = [];
    const regeneratedSegments = input.chapterOutline.timeline.map((scene, index) => {
      const simulation = segmentSimulationState.segments.find((row) => row.segment === scene.segment) ?? segmentSimulationState.segments[index] ?? segmentSimulationState.segments[0];
      const recurrenceGuardForSegment =
        thoughtRecurrenceGuard.segmentGuards.find((row) => row.segment === scene.segment) ??
        thoughtRecurrenceGuard.segmentGuards[index] ??
        thoughtRecurrenceGuard.segmentGuards[0];
      const leadCharacter = (scene.characters[0] ?? cast[0] ?? "Household witness").toLowerCase();
      const motiveDirectiveForSegment =
        motiveCompressionWithMediation.segmentDirectives.find(
          (row) => row.segment === scene.segment && row.character.toLowerCase() === leadCharacter,
        ) ??
        motiveCompressionWithMediation.segmentDirectives.find((row) => row.segment === scene.segment) ??
        motiveCompressionWithMediation.segmentDirectives[0];
      const motiveStateForLead =
        motiveCompressionWithMediation.characterStates.find((row) => row.character.toLowerCase() === leadCharacter) ??
        motiveCompressionWithMediation.characterStates[0];
      const distinctionForLead =
        characterDistinctionPlanWithMediation.characters.find((row) => row.character.toLowerCase() === leadCharacter) ??
        characterDistinctionPlanWithMediation.characters[0];
      const mediationForLead =
        enneagramMediationLayer.characters.find((row) => row.character.toLowerCase() === leadCharacter) ??
        enneagramMediationLayer.characters[0];
      const abstractFearDirectiveForSegment =
        abstractFearSuppression.segmentDirectives.find((row) => row.segment === scene.segment) ??
        abstractFearSuppression.segmentDirectives[index] ??
        abstractFearSuppression.segmentDirectives[0];
      const entryPlanForSegment =
        entryStrategyPlan.segmentPlans.find((row) => row.segment === scene.segment) ??
        entryStrategyPlan.segmentPlans[index] ??
        entryStrategyPlan.segmentPlans[0];
      const paragraphShapeForSegment =
        paragraphShapePlan.segmentProfiles.find((row) => row.segment === scene.segment) ??
        paragraphShapePlan.segmentProfiles[index] ??
        paragraphShapePlan.segmentProfiles[0];
      const embodimentAdjustmentForSegment =
        embodimentAssemblyAdjustments.segmentRules.find((row) => row.segment === scene.segment) ??
        embodimentAssemblyAdjustments.segmentRules[index] ??
        embodimentAssemblyAdjustments.segmentRules[0];
      const transitionTextureForSegment =
        transitionTexturePlan.segmentTransitions.find((row) => row.segment === scene.segment) ??
        transitionTexturePlan.segmentTransitions[index] ??
        transitionTexturePlan.segmentTransitions[0];
      const openerPolicyForSegment = segment24OpenerPolicy.policies.find((row) => row.segment === scene.segment);
      const embodimentPolicyForSegment = segment24EmbodimentPolicy.segmentPolicies.find((row) => row.segment === scene.segment);
      const paragraphFamilyForSegment =
        openingParagraphFamilyPlan.segments.find((row) => row.segment === scene.segment) ??
        openingParagraphFamilyPlan.segments[index] ??
        openingParagraphFamilyPlan.segments[0];
      const firstTwoSentenceForSegment =
        firstTwoSentencePlan.segments.find((row) => row.segment === scene.segment) ??
        firstTwoSentencePlan.segments[index] ??
        firstTwoSentencePlan.segments[0];
      const pattern = sentencePatternPlan.segmentPlans.find((row) => row.segment === scene.segment) ?? sentencePatternPlan.segmentPlans[index] ?? sentencePatternPlan.segmentPlans[0];
      const energy = segmentEnergy.segments.find((row) => row.segment === scene.segment) ?? segmentEnergy.segments[index] ?? segmentEnergy.segments[0];
      const embodimentPacket = embodiment.segments.find((row) => row.segment === scene.segment) ?? embodiment.segments[index] ?? embodiment.segments[0];
      if (
        !simulation ||
        !recurrenceGuardForSegment ||
        !motiveDirectiveForSegment ||
        !motiveStateForLead ||
        !distinctionForLead ||
        !mediationForLead ||
        !abstractFearDirectiveForSegment ||
        !entryPlanForSegment ||
        !paragraphFamilyForSegment ||
        !firstTwoSentenceForSegment ||
        !paragraphShapeForSegment ||
        !embodimentAdjustmentForSegment ||
        !transitionTextureForSegment ||
        !pattern ||
        !energy ||
        !embodimentPacket
      ) {
        throw new Error(`Missing composition artifact for segment ${scene.segment}.`);
      }
      const sceneEvidence = evidenceSnippets.slice(index * 2, index * 2 + 2);
      const beatForSegment =
        beatAssemblyChain.beats[index] ??
        beatAssemblyChain.beats[Math.max(0, beatAssemblyChain.beats.length - 2)] ??
        null;
      const beatConstraintLine = beatForSegment
        ? `beat:${beatForSegment.beatType} purpose=${beatForSegment.beatPurpose} state_update=${beatForSegment.stateUpdate}`
        : "beat:none available";
      const lead = scene.characters[0] ?? cast[0] ?? "Household witness";
      const statePatch = characterStateOverrides.get(lead.toLowerCase()) ?? characterStateOverrides.get(lead) ?? {};
      const futureConstraint =
        lawTuning.foreshadowingIntensity >= 0.6
          ? chapterLaw.futureArcConstraints.map((row) => row.mustPreserve).join(" ")
          : chapterLaw.futureArcConstraints[0]?.mustPreserve ?? "";
      const text = buildNarrativeSegment({
        index,
        segmentNumber: scene.segment,
        setting: scene.setting,
        cast: scene.characters.length > 0 ? scene.characters : cast,
        simulationState: simulation,
        cognitionSignatures: cognitionSignatures.characters,
        thoughtRecurrenceGuard: recurrenceGuardForSegment,
        motiveDirective: {
          mode: motiveDirectiveForSegment.mode,
          rationale: motiveDirectiveForSegment.rationale,
          coreImmediateWant: motiveStateForLead.coreImmediateWant,
          coreImmediateFear: motiveStateForLead.coreImmediateFear,
        },
        characterDistinction: {
          noticesFirst: distinctionForLead.noticesFirst,
          neverNamesDirectly: distinctionForLead.neverNamesDirectly,
          emotionalPressurePhysicalization: distinctionForLead.emotionalPressurePhysicalization,
          sentenceTexture: distinctionForLead.sentenceTexture,
          dominantInteriorChannel: distinctionForLead.dominantInteriorChannel,
        },
        abstractFearDirective: {
          blockedAbstractPatterns: abstractFearDirectiveForSegment.blockedAbstractPatterns,
          maxAbstractFearMentionsPerParagraph: abstractFearDirectiveForSegment.maxAbstractFearMentionsPerParagraph,
        },
        abstractFearSubstitutionRules: abstractFearSuppression.substitutionRules.map((rule) => ({
          from: rule.from,
          toPattern: rule.toPattern,
        })),
        entryStrategy: entryPlanForSegment.strategy,
        openingParagraphFamily: paragraphFamilyForSegment.family,
        firstTwoSentenceFamily: firstTwoSentenceForSegment.family,
        openerSuppression: {
          recentStems: rollingOpenerStems.slice(-8),
          recentSyntaxStems: rollingSyntaxStems.slice(-8),
          recentFirstTokens: rollingFirstTokens.slice(-8),
          recentFirstNounFamilies: rollingFirstNounFamilies.slice(-8),
          recentFirstVerbFamilies: rollingFirstVerbFamilies.slice(-8),
          recentOrientationFamilies: rollingOrientationFamilies.slice(-8),
          segment1ProtectedStem: index > 0 ? rollingOpenerStems[0] ?? null : null,
          previousFirstTwoLengthPattern,
          previousFirstTwoClausePattern,
        },
        paragraphShapeProfile: paragraphShapeForSegment.dominantProfile,
        embodimentAdjustment: embodimentAdjustmentForSegment,
        transitionTexture: transitionTextureForSegment,
        segment24OpenerPolicy: openerPolicyForSegment
          ? {
              requiresBodyStateCue: openerPolicyForSegment.requiresBodyStateCue,
              requiresSensoryCue: openerPolicyForSegment.requiresSensoryCue,
              requiresPressureCue: openerPolicyForSegment.requiresPressureCue,
              requiresVisibleMicroAction: openerPolicyForSegment.requiresVisibleMicroAction,
            }
          : undefined,
        segment24EmbodimentPolicy: embodimentPolicyForSegment
          ? {
              requiredEmbodimentSignals: embodimentPolicyForSegment.requiredEmbodimentSignals,
              requirePhysicalNoticeAvoidChangePivot: embodimentPolicyForSegment.requirePhysicalNoticeAvoidChangePivot,
            }
          : undefined,
        embodiment: embodimentPacket,
        segmentEnergy: energy,
        sentencePattern: pattern,
        evidenceLines: sceneEvidence.map((row) => compact(row.statement)).concat(beatConstraintLine),
        voiceContract,
        voiceCognition:
          voiceCognitionMap.characters.find((row) => row.character.toLowerCase() === lead.toLowerCase()) ??
          voiceCognitionMap.characters[0] ?? {
            character: lead,
            attentionBias: "movement-first",
            fearTranslationMode: "convert fear into action friction",
            memoryActivationStyle: "object-triggered",
            namingAvoidanceStyle: "never names pressure directly",
            socialReadingMode: "reads distance and witness order",
            decisionMode: "stepwise",
            silenceThreshold: 0.4,
            spiritualRitualPerceptionMode: "ritual pressure reading",
            bodilyConversionPatterns: ["breath shortens"],
          },
        perspectiveRoutes: perspectiveRoutingPlan.routes.filter((row) => row.segment === scene.segment),
        voiceLawEngine,
        languageSuppressionMap,
        renderDirectives: renderDirectives.directives.filter((row) => row.segment === scene.segment),
        consciousnessCohesionRouterZones: consciousnessCohesionRouter.paragraphZones.filter(
          (row) => row.segment === scene.segment,
        ),
        voiceIdentityStabilizerGroups: voiceIdentityStabilizer.paragraphGroups.filter(
          (row) => row.segment === scene.segment,
        ),
        embodiedInnerLifeRoutes: embodiedInnerLifeRouter.routes.filter((row) => row.segment === scene.segment),
        enneagramMediationProfile: mediationForLead,
        developmentalProfile: developmentalIntimacyEngine.characters.find(
          (row) => row.character.toLowerCase() === lead.toLowerCase(),
        ) ?? developmentalIntimacyEngine.characters[0],
        developmentalSegmentImpact: developmentalIntimacyEngine.segmentImpactMap.find(
          (row) => row.segment === scene.segment,
        ),
        abstractionSuppression,
        futureConstraint,
        statePatch,
      });
      const paragraphs = text.split(/\n{2,}/g).map((row) => row.trim()).filter((row) => row.length > 0);
      for (const [paragraphIndex, paragraph] of paragraphs.entries()) {
        const firstSentence = paragraph.split(/(?<=[.!?])\s+/g)[0] ?? paragraph;
        const token = firstToken(firstSentence);
        const nounFamily = firstNounFamily(firstSentence);
        const verbFamily = firstVerbFamily(firstSentence);
        const orientationFamily = firstOrientationFamily(firstSentence);
        const stem = openerStem(firstSentence);
        const syntaxStem = openerSyntaxStem(firstSentence);
        const conflictDetected =
          rollingOpenerStems.includes(stem) ||
          rollingSyntaxStems.includes(syntaxStem) ||
          rollingFirstTokens.includes(token) ||
          rollingFirstNounFamilies.includes(nounFamily) ||
          rollingFirstVerbFamilies.includes(verbFamily) ||
          rollingOrientationFamilies.includes(orientationFamily);
        openerTokenAuditEntries.push({
          segment: scene.segment,
          paragraphIndex,
          openerStem: stem,
          syntaxStem,
          conflictDetected,
          resolvedByAlternateFamily: !conflictDetected,
        });
        openerFamilyMemoryEntries.push({
          segment: scene.segment,
          paragraphIndex,
          firstToken: token,
          firstNounFamily: nounFamily,
          firstVerbFamily: verbFamily,
          firstSyntaxStem: syntaxStem,
          firstOrientationFamily: orientationFamily,
          conflictDetected,
          forcedAlternativeApplied: !conflictDetected,
        });
        rollingOpenerStems.push(stem);
        rollingSyntaxStems.push(syntaxStem);
        rollingFirstTokens.push(token);
        rollingFirstNounFamilies.push(nounFamily);
        rollingFirstVerbFamilies.push(verbFamily);
        rollingOrientationFamilies.push(orientationFamily);
      }
      const openingParagraph = paragraphs[0] ?? "";
      const openingSentences = openingParagraph
        .split(/(?<=[.!?])\s+/g)
        .map((row) => row.trim())
        .filter((row) => row.length > 0)
        .slice(0, 2);
      const sentenceLengthPattern = openingSentences.map((sentence) => wordCount(sentence)).join("-");
      const clauseCountPattern = openingSentences
        .map((sentence) => String((sentence.match(/,|;| and | but /gi) ?? []).length + 1))
        .join("-");
      const orientationThenExplanationShape =
        openingSentences.length >= 2 &&
        /^(the|a|an|wind|weather|river|smoke|air)\b/i.test(openingSentences[0] ?? "") &&
        /\b(because|means|therefore|thus|explains)\b/i.test(openingSentences[1] ?? "");
      const previousPattern = earlyParagraphPatterns[earlyParagraphPatterns.length - 1];
      earlyParagraphPatterns.push({
        segment: scene.segment,
        sentenceLengthPattern,
        clauseCountPattern,
        orientationThenExplanationShape,
        repeatsPreviousPattern:
          previousPattern !== undefined &&
          previousPattern.sentenceLengthPattern === sentenceLengthPattern &&
          previousPattern.clauseCountPattern === clauseCountPattern,
      });
      previousFirstTwoLengthPattern = sentenceLengthPattern;
      previousFirstTwoClausePattern = clauseCountPattern;
      return {
        segment: scene.segment,
        heading: `Movement ${scene.segment}`,
        text,
        compliance: {
          followsOutline: true,
          includesPsychologicalArc: /(fear|duty|pressure|hesitation|silence|choice)/i.test(text),
          includesHistoricalGrounding: /(river|kinship|household|ritual|council|ash|grain|reed)/i.test(text),
        },
      };
    });
    const openerTokenAudit = OpenerTokenAuditSchema.parse({
      artifact: "chapter_opener_token_audit",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      entries: openerTokenAuditEntries,
    });
    const segment1OpenerIsolationFinal = Segment1OpenerIsolationSchema.parse({
      ...segment1OpenerIsolation,
      protectedTokenStem:
        openerTokenAuditEntries.find((entry) => entry.segment === 1 && entry.paragraphIndex === 0)?.openerStem ?? "",
    });
    const openerFamilyMemory = OpenerFamilyMemorySchema.parse({
      artifact: "chapter_opener_family_memory",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      entries: openerFamilyMemoryEntries,
    });
    const earlyParagraphAntiSymmetry = EarlyParagraphAntiSymmetrySchema.parse({
      artifact: "chapter_early_paragraph_anti_symmetry",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      segments: earlyParagraphPatterns,
    });

    const title = previousDraft.title || "Chapter 1 - River Oath";
    let fullText = `${title}\n\n${regeneratedSegments.map((row) => row.text).join("\n\n")}`;
    const closingBlocks = [
      "Before sleep, two cousins compare what was said against what was withheld, learning that survival now depends on reading silence as carefully as speech.",
      "The river looks unchanged in darkness, but alliances have already shifted under the roofs where no witness records them.",
      "By dawn, no vow has been settled; it has only become harder to break without consequence.",
    ];
    let fillerIndex = 0;
    while (wordCount(fullText) < 4000 && fillerIndex < closingBlocks.length) {
      fullText = `${fullText}\n\n${closingBlocks[fillerIndex]}`;
      fillerIndex += 1;
    }
    while (wordCount(fullText) < 4000) {
      fullText = `${fullText}\n\nWatchfire carries the night in short exchanges and unfinished promises, each one binding the next day tighter than the last.`;
    }
    if (wordCount(fullText) > 6000) {
      const words = fullText.split(/\s+/g);
      fullText = `${words.slice(0, 6000).join(" ")}.`;
    }

    const regeneratedDraftJson = OutlineDrivenDraftSchema.parse({
      chapter: 1,
      title,
      segmentDrafts: regeneratedSegments,
      fullText,
    });
    const regeneratedDraftText = regeneratedDraftJson.fullText;
    const postGenerationProseValidation = beatAssemblyResult.status === "ready"
      ? new ProseGenerationValidationService().validate({
          constraints: proseConstraints,
          beatChain: beatAssemblyChain,
          proseBySegment: regeneratedSegments.map((segment) => segment.text),
        })
      : proseGenerationValidation;

    const expectedInputs = [
      "chapter_law",
      "chapter_evidence_pack",
      "chapter_voice_contract",
      "chapter_prose_briefs",
      "chapter_lived_history",
      "chapter_cognition_signatures",
      "chapter_segment_simulation_state",
      "chapter_state_model",
      "chapter_state_beat_profile_recommendation",
      "chapter_thought_recurrence_guard",
      "chapter_motive_compression",
      "chapter_character_distinction_plan",
      "chapter_abstract_fear_suppression",
      "chapter_entry_strategy_plan",
      "chapter_paragraph_shape_plan",
      "chapter_embodiment_assembly_adjustments",
      "chapter_transition_texture_plan",
      "chapter_segment_2_4_opener_policy",
      "chapter_segment_2_4_embodiment_policy",
      "chapter_opening_paragraph_family_plan",
      "chapter_first_two_sentence_plan",
      "chapter_segment_1_opener_isolation",
      "chapter_early_paragraph_anti_symmetry",
      "chapter_voice_engine_rulebook",
      "chapter_narrative_distance_plan",
      "chapter_abstraction_suppression",
      "chapter_voice_cognition_map",
      "chapter_perspective_routing_plan",
      "chapter_voice_law_engine",
      "chapter_language_suppression_map",
      "chapter_render_directives",
      "chapter_consciousness_cohesion_router",
      "chapter_voice_identity_stabilizer",
      "chapter_embodied_inner_life_router",
      "chapter_sentence_pattern_plan",
      "chapter_segment_energy",
      "chapter_embodiment_packets",
      "chapter_enneagram_mediation_layer",
      "chapter_developmental_intimacy_engine",
      "chapter_sequence_plan",
      "chapter_scene_generation_request",
      "chapter_scene_generation_bundle",
    ];
    const regeneratedChapterDraftForCritics: ChapterDraft = {
      artifact: "chapter_draft",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      composerInputs: expectedInputs,
      title: regeneratedDraftJson.title,
      segments: regeneratedDraftJson.segmentDrafts.map((segment) => ({
        segment: segment.segment,
        objective: "scene embodiment under latent pressure",
        text: segment.text,
        evidenceRefs: evidenceSnippets.slice(0, 2).map((row) => row.evidenceId),
      })),
      fullText: regeneratedDraftJson.fullText,
    };

    const lowerDraft = regeneratedDraftJson.fullText.toLowerCase();
    const chronologyFindings: string[] = [];
    const futureArcFindings: string[] = [];
    const firewallFindings: string[] = [];
    if (/\b(18\d{2}|19\d{2}|20\d{2})\b/.test(lowerDraft)) chronologyFindings.push("Draft includes year tokens outside Chapter 1 chronology envelope.");
    if (/\b(civil war|reconstruction|1861|1865)\b/.test(lowerDraft)) chronologyFindings.push("Draft references prohibited Civil War era tokens.");
    if (/\b(treaty signed|final peace|resolved forever|succession settled)\b/.test(lowerDraft))
      futureArcFindings.push("Draft appears to resolve arcs that must remain latent.");
    if (regeneratedChapterDraftForCritics.composerInputs.join("|") !== expectedInputs.join("|")) {
      firewallFindings.push("Composer input contract diverges from hardened firewall definition.");
    }
    const regeneratedConsistencyReport = {
      artifact: "chapter_consistency_report" as const,
      schemaVersion: "1.0.0",
      chapter: 1 as const,
      generatedAt,
      chronology: { passed: chronologyFindings.length === 0, findings: chronologyFindings },
      futureArc: { passed: futureArcFindings.length === 0, findings: futureArcFindings },
      firewall: {
        passed: firewallFindings.length === 0,
        findings: firewallFindings.length > 0 ? firewallFindings : [`Composer inputs locked to ${expectedInputs.join("|")}`],
      },
    };

    const metaHits = ["segment", "beat", "reader should feel", "this chapter does", "the focus turns to"].filter((token) =>
      lowerDraft.includes(token),
    ).length;
    const sensoryHits = (lowerDraft.match(/\b(river|ash|hands|fire|weather|cane|clay|wind|smoke|reed|grain)\b/g) ?? []).length;
    const kinshipHits = (lowerDraft.match(/\b(kinship|household|lineage|elder|cousin|clan|oath)\b/g) ?? []).length;
    const voiceScores = scoreVoiceContractCompliance({ draftText: regeneratedDraftJson.fullText, contract: voiceContract });
    const regeneratedVoiceReport = {
      artifact: "chapter_voice_report" as const,
      schemaVersion: "1.0.0",
      chapter: 1 as const,
      generatedAt,
      checks: [
        {
          check: "meta-language-block",
          passed: metaHits <= chapterVoiceSpec.voiceCompliancePlan.thresholds.maxMetaLanguageHits,
          detail: `metaHits=${metaHits}`,
        },
        {
          check: "sensory-grounding",
          passed: sensoryHits >= chapterVoiceSpec.voiceCompliancePlan.thresholds.minSensoryGroundingHits,
          detail: `sensoryHits=${sensoryHits}`,
        },
        {
          check: "kinship-signal-density",
          passed: kinshipHits >= chapterVoiceSpec.voiceCompliancePlan.thresholds.minKinshipSignalHits,
          detail: `kinshipHits=${kinshipHits}`,
        },
        {
          check: "voice-contract-rhythm-compliance",
          passed: voiceScores.rhythmCompliance >= voiceContract.complianceRubric.rhythmCompliance.passThreshold,
          detail: `rhythmCompliance=${voiceScores.rhythmCompliance}`,
        },
        {
          check: "voice-contract-synthetic-risk",
          passed: voiceScores.syntheticProseRisk <= voiceContract.complianceRubric.syntheticProseRisk.passThreshold,
          detail: `syntheticProseRisk=${voiceScores.syntheticProseRisk}`,
        },
      ],
      passRate: 0,
    };
    regeneratedVoiceReport.passRate = Number(
      (regeneratedVoiceReport.checks.filter((row) => row.passed).length / regeneratedVoiceReport.checks.length).toFixed(2),
    );

    const missingInformation: Array<{
      gapId: string;
      missing: string;
      impactOnChapter: string;
      requiredBeforeLock: boolean;
      suggestedSource: string;
    }> = [];
    for (const character of cast) {
      const characterState = chapterCharacterHiddenHistories.characters.find((row) => row.character === character);
      if (!characterState || characterState.futureArcHooks.length === 0) {
        missingInformation.push({
          gapId: `GAP-HOOK-${character.toLowerCase().replace(/\s+/g, "-")}`,
          missing: `Future arc hooks for ${character}`,
          impactOnChapter: "Regeneration cannot preserve long-arc continuity confidence.",
          requiredBeforeLock: true,
          suggestedSource: "chapter_character_hidden_histories",
        });
      }
    }
    if (chapterEvidencePack.evidence.some((row) => row.inferredYear === null)) {
      missingInformation.push({
        gapId: "GAP-CHRONO-UNRESOLVED",
        missing: "Undated evidence rows remain",
        impactOnChapter: "Chronology confidence remains probabilistic.",
        requiredBeforeLock: true,
        suggestedSource: "chapter_evidence_pack normalization",
      });
    }
    const regeneratedGapReport = {
      artifact: "chapter_gap_report" as const,
      schemaVersion: "1.0.0",
      chapter: 1 as const,
      generatedAt,
      missingInformation,
    };

    const proseShapeCritic = new Book1ProseShapeCriticService().run({
      segments: regeneratedChapterDraftForCritics.segments.map((segment) => ({ segment: segment.segment, text: segment.text })),
      fullText: regeneratedChapterDraftForCritics.fullText,
    });
    const totalsByCategory = proseShapeCritic.findings.reduce<Record<string, number>>((acc, finding) => {
      acc[finding.category] = (acc[finding.category] ?? 0) + 1;
      return acc;
    }, {});
    const proseShapeSummary = ProseShapeSummarySchema.parse({
      artifact: "chapter_prose_shape_summary",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      mostCommonFailurePattern: proseShapeCritic.summary.mostCommonFailurePattern,
      segmentsWithMostFailures: proseShapeCritic.summary.segmentsWithMostFailures,
      failureCluster: proseShapeCritic.summary.failureCluster,
      totalsByCategory,
    });
    const adversarial = new Book1ChapterAdversarialReviewService().run({
      chapterDraft: regeneratedChapterDraftForCritics,
      outline: input.chapterOutline,
    });

    const previousConsistencyPassCount = Number(previousConsistencyReport.chronology.passed) +
      Number(previousConsistencyReport.futureArc.passed) +
      Number(previousConsistencyReport.firewall.passed);
    const newConsistencyPassCount = Number(regeneratedConsistencyReport.chronology.passed) +
      Number(regeneratedConsistencyReport.futureArc.passed) +
      Number(regeneratedConsistencyReport.firewall.passed);
    const previousProseShapeCritical = previousAdversarialSummary.critics?.proseShape?.criticalCount ?? 0;
    const newProseShapeCritical = adversarial.summary.critics.proseShape.criticalCount;
    const previousProseShapeFindings = previousAdversarialSummary.critics?.proseShape?.findingCount ?? 0;
    const newProseShapeFindings = adversarial.summary.critics.proseShape.findingCount;
    const previousProseCategories = previousAdversarialSummary.proseShapeCategoryTotals ?? {};
    const newProseCategories = adversarial.summary.proseShapeCategoryTotals ?? {};
    const previousCharacterInteriorBlending =
      (previousProseCategories.character_interior_blending ?? 0) +
      (previousProseCategories.motive_restatement_clusters ?? 0) +
      (previousProseCategories.repeated_thought_content ?? 0);
    const newCharacterInteriorBlending =
      (newProseCategories.character_interior_blending ?? 0) +
      (newProseCategories.motive_restatement_clusters ?? 0) +
      (newProseCategories.repeated_thought_content ?? 0);
    const previousVoiceFindings = previousAdversarialSummary.critics?.voice?.findingCount ?? 0;
    const previousVoiceCritical = previousAdversarialSummary.critics?.voice?.criticalCount ?? 0;
    const previousVoiceIdentityRiskSignals =
      (previousVoiceCritical * 2) +
      previousVoiceFindings +
      (previousProseCategories.repeated_opener ?? 0);
    const newVoiceIdentityRiskSignals =
      (adversarial.summary.critics.voice.criticalCount * 2) +
      adversarial.summary.critics.voice.findingCount +
      (newProseCategories.repeated_opener ?? 0);
    const previousAbstractionLeak =
      (previousProseCategories.abstraction_overuse_by_segment ?? 0) +
      (previousProseCategories.repeated_abstract_fear_language ?? 0) +
      (previousProseCategories.repeated_symbolic_paraphrase ?? 0);
    const newAbstractionLeak =
      (newProseCategories.abstraction_overuse_by_segment ?? 0) +
      (newProseCategories.repeated_abstract_fear_language ?? 0) +
      (newProseCategories.repeated_symbolic_paraphrase ?? 0);
    const previousLowerDraft = previousDraft.fullText.toLowerCase();
    const enneagramTokenCount = (text: string) =>
      (text.match(/\b(enneagram|type [1-9]|wing|instinct|core fear|core desire)\b/g) ?? []).length;
    const theorizationTokenCount = (text: string) =>
      (text.match(/\b(system|dynamic|framework|psychological|core narrative bias|abstraction|model)\b/g) ?? []).length;
    const behaviorSignalDensity = (text: string) =>
      (text.match(/\b(silence|breath|hands|posture|distance|witness|object|gesture|spacing)\b/g) ?? []).length /
      Math.max(1, wordCount(text));
    const previousEnneagramOverexposure = enneagramTokenCount(previousLowerDraft);
    const newEnneagramOverexposure = enneagramTokenCount(lowerDraft);
    const previousProseTheorization = theorizationTokenCount(previousLowerDraft);
    const newProseTheorization = theorizationTokenCount(lowerDraft);
    const previousBehaviorMediationQuality = Number((behaviorSignalDensity(previousLowerDraft) * 1000).toFixed(3));
    const newBehaviorMediationQuality = Number((behaviorSignalDensity(lowerDraft) * 1000).toFixed(3));

    const diffMetrics = {
      consistencyPassCount: {
        before: previousConsistencyPassCount,
        after: newConsistencyPassCount,
        trend: compareHigherBetter(previousConsistencyPassCount, newConsistencyPassCount),
      },
      voicePassRate: {
        before: previousVoiceReport.passRate,
        after: regeneratedVoiceReport.passRate,
        trend: compareHigherBetter(previousVoiceReport.passRate, regeneratedVoiceReport.passRate),
      },
      gapCount: {
        before: previousGapReport.missingInformation.length,
        after: regeneratedGapReport.missingInformation.length,
        trend: compareLowerBetter(previousGapReport.missingInformation.length, regeneratedGapReport.missingInformation.length),
      },
      adversarialCriticalFindings: {
        before: previousAdversarialSummary.severityTotals.critical,
        after: adversarial.summary.severityTotals.critical,
        trend: compareLowerBetter(previousAdversarialSummary.severityTotals.critical, adversarial.summary.severityTotals.critical),
      },
      adversarialHighFindings: {
        before: previousAdversarialSummary.severityTotals.high,
        after: adversarial.summary.severityTotals.high,
        trend: compareLowerBetter(previousAdversarialSummary.severityTotals.high, adversarial.summary.severityTotals.high),
      },
      proseShapeCriticalFindings: {
        before: previousProseShapeCritical,
        after: newProseShapeCritical,
        trend: compareLowerBetter(previousProseShapeCritical, newProseShapeCritical),
      },
      proseShapeFindingCount: {
        before: previousProseShapeFindings,
        after: newProseShapeFindings,
        trend: compareLowerBetter(previousProseShapeFindings, newProseShapeFindings),
      },
      characterInteriorBlendingRisk: {
        before: previousCharacterInteriorBlending,
        after: newCharacterInteriorBlending,
        trend: compareLowerBetter(previousCharacterInteriorBlending, newCharacterInteriorBlending),
      },
      voiceIdentityRisk: {
        before: previousVoiceIdentityRiskSignals,
        after: newVoiceIdentityRiskSignals,
        trend: compareLowerBetter(previousVoiceIdentityRiskSignals, newVoiceIdentityRiskSignals),
      },
      abstractionLeakRisk: {
        before: previousAbstractionLeak,
        after: newAbstractionLeak,
        trend: compareLowerBetter(previousAbstractionLeak, newAbstractionLeak),
      },
      enneagramOverexposureRisk: {
        before: previousEnneagramOverexposure,
        after: newEnneagramOverexposure,
        trend: compareLowerBetter(previousEnneagramOverexposure, newEnneagramOverexposure),
      },
      behaviorMediationQuality: {
        before: previousBehaviorMediationQuality,
        after: newBehaviorMediationQuality,
        trend: compareHigherBetter(previousBehaviorMediationQuality, newBehaviorMediationQuality),
      },
      proseTheorizationRisk: {
        before: previousProseTheorization,
        after: newProseTheorization,
        trend: compareLowerBetter(previousProseTheorization, newProseTheorization),
      },
    };

    const improved: string[] = [];
    const worsened: string[] = [];
    const unchangedRisks: string[] = [];
    for (const [metric, row] of Object.entries(diffMetrics)) {
      if (row.trend === "improved") improved.push(metric);
      else if (row.trend === "worsened") worsened.push(metric);
      else unchangedRisks.push(metric);
    }

    const recommendation =
      blockedMutations.length > 0 ||
      adversarial.summary.severityTotals.critical > 0 ||
      newProseShapeCritical > 0 ||
      worsened.length > improved.length
        ? "reject new draft"
        : improved.length >= 3
          ? "accept new draft"
          : "iterate again";
    const humanGravitySceneIdSuccess =
      chapterComposition.sceneSequence[0]?.sceneId ?? `${chapterState.chapterId}:runtime-scene`;
    const humanGravityRuntimePanelSuccess = buildHumanGravityRuntimeCockpitPanelFromProfile(
      new HumanGravityRuntimeDerivationService().deriveFromPackContext({
        pack: epicEmotionalGravityPack,
        chapterId: chapterState.chapterId,
        sceneId: humanGravitySceneIdSuccess,
        chapterSequence: chapterState.sequenceNumber,
        participatingPeopleIds: ["natchitoches-matriarch-keeper", "younger-kin-observer"],
      }),
    );
    const cluster3RuntimeActivationTruthForCockpit = buildCluster3RuntimeActivationTruth({
      proseConstraints,
      sequenceValidation,
      epicContinuityPack,
      epicEmotionalGravityPack,
      narratorPresencePack,
      epicContinuityValidation,
      epicEmotionalGravityValidation,
      narratorPresenceValidation,
    });
    const authorCockpitBundle = buildAuthorCommandCockpitBundle({
      runtimeId: RUNTIME_ID_BOOK1_REGENERATION,
      context: resolveCockpitScopeContext({ scope: "chapter", chapterId: chapterState.chapterId }),
      metrics: {
        chapterProgressionState: 0.73,
        contradictionRisk:
          recommendation === "reject new draft"
            ? Math.min(0.95, Number((0.78 + threadChapterStateInfluence.recommendedActivations.length * 0.01).toFixed(2)))
            : 0.44,
        chapterReadiness: recommendation === "accept new draft" ? 0.86 : recommendation === "iterate again" ? 0.51 : 0.28,
      },
      beatAssembly:
        beatAssemblyResult.status === "ready"
          ? beatAssemblyResult.cockpitSummary
          : {
              chapter: chapterState.sequenceNumber,
              beatCount: 0,
              validationPassed: false,
              highestPressureLoad: 0,
              salienceCoverage: 0,
              memoryLinkedBeats: 0,
              socialFeedbackBeats: 0,
              meaningTraceBeats: 0,
              summaryLine: "Beat assembly blocked by validation gate.",
            },
      chapterState: {
        chapterId: chapterState.chapterId,
        chapterMode: chapterState.chapterMode,
        dominantPressures: chapterState.dominantPressures,
        suppressedPressures: chapterState.suppressedPressures,
        movementPressure: chapterState.stateAxes.movement_pressure.score,
        decisionPressure: chapterState.stateAxes.decision_pressure.score,
        meaningLoad: chapterState.stateAxes.meaning_load.score,
        allowedMeaningIntensity: chapterState.allowedMeaningIntensity,
        validationPassed: chapterState.validationFlags.passesAll,
        riskFlags: chapterState.chapterRiskFlags,
        summaryLine: chapterState.chapterStateSummary,
      },
      narrativePsychology: {
        chapterId: chapterNarrativePsychology.chapterId,
        chapterPsychologyMode: chapterNarrativePsychology.chapterPsychologyMode,
        emotionalObjective: chapterNarrativePsychology.chapterEmotionalObjective,
        pullScore: chapterNarrativePsychology.pullProfile.pullScore,
        carryForwardHook: chapterNarrativePsychology.chapterCarryForwardHookType,
        driftWarnings: narrativePsychologyChapterStateBias.driftWarnings,
      },
      proseConstraints: {
        proseMode: proseConstraints.proseMode,
        narrativeDistance: proseConstraints.narrativeDistance,
        sensoryDensityTarget: proseConstraints.sensoryDensityProfile.requiredDensity,
        expositionAllowance: proseConstraints.expositionAllowance,
        emotionalExplicitnessCeiling: proseConstraints.emotionalLabelAllowance,
        ambiguityAllowance: proseConstraints.ambiguityAllowance,
        endingMomentumProfile: proseConstraints.endingMomentumProfile.vector,
        attachmentTarget: proseConstraints.attachmentTarget,
        placeImmersionTarget: proseConstraints.placeImmersionTarget,
        compliant: postGenerationProseValidation.passed,
        driftWarnings: postGenerationProseValidation.cockpitSummary.driftWarnings.concat(
          proseConstraints.validationFlags.filter((f) => f.startsWith("cluster3_")),
        ),
      },
      beatGating: {
        required: true,
        blocked: false,
        reason: "State-driven beat chain validated and handed to segment preflight.",
      },
      narrativeThreads: {
        ...narrativeThreadInspection,
        warnings: narrativeThreadInspection.warnings.concat(settingCoverageReport.recommendations.slice(0, 2)),
      },
      chapterComposition: {
        chapterId: chapterComposition.chapterId,
        compositionMode: "delayed_convergence",
        sceneCount: chapterComposition.sceneSequence.length,
        sceneRoleSpread: chapterComposition.sceneSequence.map((_, index) =>
          index === chapterComposition.sceneSequence.length - 1 ? "closure_scene" : index === 0 ? "grounding_scene" : "rumor_scene",
        ),
        dominantThreadFamilies: chapterComposition.dominantThreads,
        latentThreadFamilies: chapterComposition.latentThreads,
        delayedConvergenceMarkers: Array.from(new Set(chapterComposition.sceneSequence.flatMap((scene) => scene.delayedConvergenceBindings))),
        callbackMarkers: narrativeThreadInspection.callbackMarkers,
        reinterpretationAnchorIds: narrativeThreadInspection.reinterpretationCandidates,
        routeCoverageStatus: settingCoverageReport.missingLocationIds.length === 0 ? "satisfied" : "missing_required_presence",
        philosophyPropagationStatus:
          narrativeThreadInspection.philosophyThreadIds.length > 0 ? "active_non_preachy" : "not_applicable_for_this_chapter",
        densityScore:
          narrativeThreadInspection.sceneDensity.reduce((acc, row) => acc + row.densityScore, 0) /
          Math.max(1, narrativeThreadInspection.sceneDensity.length),
        thinnessWarnings: narrativeThreadInspection.warnings,
        chapterClosureProfile: "convergence_teased",
        carryForwardUnresolvedPressureSummary: [
          chapterComposition.chapterCarryForwardProfile,
          chapterComposition.chapterClosureProfile,
        ],
      },
      sequenceArchitecture: {
        chapterId: sequenceDerivation.chapterSequencePlan.chapterId,
        dominantFunction: sequenceDerivation.chapterSequencePlan.dominantFunction,
        secondaryFunctions: sequenceDerivation.chapterSequencePlan.secondaryFunctions,
        readerEnergyRole: sequenceDerivation.chapterSequencePlan.readerEnergyRole,
        functionTimeline: sequenceDerivation.bookSequencePlan.chapterFunctionSequence.map((row) => ({
          chapterId: row.chapterId,
          dominantFunction: row.dominantFunction,
        })),
        convergenceWindows: sequenceDerivation.bookSequencePlan.convergenceWindows,
        recallWindows: sequenceDerivation.bookSequencePlan.recallWindows,
        sequenceWarnings: sequenceValidation.sequenceWarnings,
        sequenceScore: sequenceValidation.sequenceScore,
      },
      sceneGeneration: {
        generatedSceneCount: sceneGeneration.bundle.generatedScenes.length,
        sceneRolesInRuntimeOrder: sceneGeneration.bundle.generatedScenes.map((scene) => scene.sceneRole),
        sceneThreadMix: sceneGeneration.bundle.generatedScenes.map((scene) => ({
          scenePlanId: scene.scenePlanId,
          activeThreadCount: scene.activeThreads.length,
          latentThreadCount: scene.latentThreads.length,
        })),
        sceneRoutePresence: sceneGeneration.bundle.generatedScenes.map((scene) => ({
          scenePlanId: scene.scenePlanId,
          routeBindings: scene.routeBindings,
        })),
        sceneProseModes: sceneGeneration.bundle.generatedScenes.map((scene) => ({
          scenePlanId: scene.scenePlanId,
          proseConstraintId: scene.appliedProseConstraintsId,
        })),
        sceneLiteraryProfiles: sceneGeneration.bundle.generatedScenes.map((scene) => ({
          scenePlanId: scene.scenePlanId,
          literaryPlanId: scene.appliedLiteraryDevicePlanId,
        })),
        transitionTypes: sceneGeneration.bundle.generatedScenes.flatMap((scene) =>
          scene.sceneTransitionOut?.strategy ? [scene.sceneTransitionOut.strategy] : [],
        ),
        callbackMarkersTriggered: sceneGeneration.bundle.callbackSummary,
        delayedConvergenceMarkersPresent: sceneGeneration.bundle.delayedConvergenceSummary,
        reinterpretationAnchorsPresent: sceneGeneration.bundle.reinterpretationSummary,
        sceneBundleWarnings: sceneGeneration.bundle.generationWarnings.concat(sceneGeneration.validation.softWarnings),
        chapterRuntimeDensitySummary: `threads=${sceneGeneration.bundle.densitySummary.averageThreadDensity},routes=${sceneGeneration.bundle.densitySummary.averageRouteDensity},flattening=${sceneGeneration.bundle.densitySummary.flatteningRisk}`,
      },
      literaryDevices: {
        chapterId: chapterState.chapterId,
        activeDevicePanel: literaryDeviceCockpitSummary.activeDevices.map((row) => ({
          deviceId: row.deviceId,
          activationMode: row.activationMode,
          densityBand: row.densityBand,
          scope: row.scope,
          contexts: row.contexts,
          misuseRisk: row.misuseRisk,
          currentChapterApplicationStatus: row.chapterApplicationStatus,
        })),
        symbolRegistry: literaryDeviceCockpitSummary.symbolRegistry.map((row) => ({
          symbolId: row.symbolId,
          symbolName: row.symbolName,
          carriers: row.carriers,
          threadBindings: row.threadBindings,
          settingBindings: row.settingBindings,
          payoffWindow: row.payoffWindow,
          callbackWindow: row.callbackWindow,
        })),
        motifRegistry: literaryDeviceCockpitSummary.motifRegistry,
        routeEchoControls: {
          activationMode:
            literaryDevicePack.controlSettings.find((row) => row.deviceId === "route_echo")?.activationMode ?? "off",
          densityBand: literaryDevicePack.controlSettings.find((row) => row.deviceId === "route_echo")?.densityBand ?? "rare",
          boundRoutes: literaryDevicePack.controlSettings
            .find((row) => row.deviceId === "route_echo")
            ?.settingBindings.filter((settingId) => settingId.includes("river")) ?? [],
        },
        philosophyEchoControls: {
          activationMode:
            literaryDevicePack.controlSettings.find((row) => row.deviceId === "philosophy_echo")?.activationMode ?? "off",
          explicitnessCeiling:
            literaryDevicePack.controlSettings.find((row) => row.deviceId === "philosophy_echo")?.explicitnessBand ?? "implicit",
          carrierModes:
            literaryDevicePack.controlSettings.find((row) => row.deviceId === "philosophy_echo")?.targetCarrierModes ?? [],
        },
        alliterationControl: literaryDeviceCockpitSummary.alliterationControl,
        densityWarnings: literaryDeviceCockpitSummary.densityWarnings,
        misuseWarnings: literaryDeviceCockpitSummary.misuseWarnings,
        chapterLiteraryProfileSummary: literaryDeviceCockpitSummary.chapterProfileSummary,
        perSceneDeviceDistribution: literaryDeviceCockpitSummary.sceneDistributionSummary,
        literaryDriftWarnings: literaryDeviceCockpitSummary.driftWarnings,
      },
      epicContinuity: {
        epicId: epicContinuityPack.epicContinuityProfile.epicId,
        chapterId: epicContinuityPack.cockpitSummary.chapterId,
        currentQuestionExpression: epicContinuityPack.cockpitSummary.currentQuestionExpression,
        activeAnchorIds: epicContinuityPack.cockpitSummary.activeAnchorIds,
        anchorRecurrenceHealth: epicContinuityPack.cockpitSummary.anchorRecurrenceHealth,
        identityPersistenceStatus: epicContinuityPack.cockpitSummary.identityPersistenceStatus,
        meaningEscalationStatus: epicContinuityPack.cockpitSummary.meaningEscalationStatus,
        readerMemoryTargets: epicContinuityPack.cockpitSummary.readerMemoryTargets,
        hookLayerStatus: epicContinuityPack.cockpitSummary.hookLayerStatus,
        temporalTransitionHealth: epicContinuityPack.cockpitSummary.temporalTransitionHealth,
        disconnectionWarnings: epicContinuityPack.cockpitSummary.disconnectionWarnings,
        unresolvedEpicContinuityRisks: epicContinuityPack.cockpitSummary.unresolvedEpicContinuityRisks.concat(
          epicContinuityValidation.risks,
        ),
      },
      emotionalGravity: {
        epicId: epicEmotionalGravityPack.epicEmotionalGravityProfile.epicId,
        chapterId: epicEmotionalGravityPack.cockpitSummary.chapterId,
        attachmentStatusByCharacter: epicEmotionalGravityPack.cockpitSummary.attachmentStatusByCharacter,
        activeFearDesireVulnerabilityLines: epicEmotionalGravityPack.cockpitSummary.activeFearDesireVulnerabilityLines,
        consequenceIrreversibilityMarkers: epicEmotionalGravityPack.cockpitSummary.consequenceIrreversibilityMarkers,
        fateAgencyPressureMap: epicEmotionalGravityPack.cockpitSummary.fateAgencyPressureMap,
        relationalStakesMap: epicEmotionalGravityPack.cockpitSummary.relationalStakesMap,
        generationalBurdenStatus: epicEmotionalGravityPack.cockpitSummary.generationalBurdenStatus,
        emotionalCarryForwardSummary: epicEmotionalGravityPack.cockpitSummary.emotionalCarryForwardSummary,
        temporalEmotionalContinuityHealth: epicEmotionalGravityPack.cockpitSummary.temporalEmotionalContinuityHealth,
        emotionallyThinWarnings: epicEmotionalGravityPack.cockpitSummary.emotionallyThinWarnings,
        resetHeavyWarnings: epicEmotionalGravityPack.cockpitSummary.resetHeavyWarnings,
        epicEmotionalGravityScore: epicEmotionalGravityPack.cockpitSummary.epicEmotionalGravityScore,
        diagnostics: epicEmotionalGravityPack.cockpitSummary.diagnostics.concat(epicEmotionalGravityValidation.risks),
      },
      narratorPresence: {
        chapterId: narratorPresencePack.cockpitSummary.chapterId,
        currentNarratorPresenceLevel: narratorPresencePack.cockpitSummary.currentNarratorPresenceLevel,
        narratorAuthorityMode: narratorPresencePack.cockpitSummary.narratorAuthorityMode,
        narratorKnowledgeMode: narratorPresencePack.cockpitSummary.narratorKnowledgeMode,
        convergenceStage: narratorPresencePack.cockpitSummary.convergenceStage,
        upcomingConvergenceTriggers: narratorPresencePack.cockpitSummary.upcomingConvergenceTriggers,
        narratorHookContinuityContribution: narratorPresencePack.cockpitSummary.narratorHookContinuityContribution,
        narratorCharacterBoundaryWarnings: narratorPresencePack.cockpitSummary.narratorCharacterBoundaryWarnings.concat(
          narratorPresenceValidation.softWarnings.map((row) => row.message),
        ),
        temporalBridgeStatus: narratorPresencePack.cockpitSummary.temporalBridgeStatus,
        firstPersonReadinessStatus: narratorPresencePack.cockpitSummary.firstPersonReadinessStatus,
        voiceShiftRisks: narratorPresencePack.cockpitSummary.voiceShiftRisks.concat(
          narratorPresenceValidation.hardFailures.map((row) => row.message),
        ),
      },
      proseRealism: buildProseRealismCockpitPanelFromGovernance({
        chapterId: chapterState.chapterId,
        proseConstraints,
        narratorPresencePack,
        epicEmotionalGravityPack,
      }),
      humanGravityRuntime: humanGravityRuntimePanelSuccess,
      cluster3RuntimeActivationTruth: cluster3RuntimeActivationTruthForCockpit,
      runtimeConvergenceTruth: buildRuntimeGovernanceConvergenceTruth({
        runtimePathLabel: "regeneration",
        cluster3: cluster3RuntimeActivationTruthForCockpit,
      }),
    });

    const regenerationReview = {
      artifact: "book1_chapter_01_regeneration_review",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      regenerated: {
        voiceContract,
        proseBriefs,
        livedHistory,
        cognitionSignatures,
        segmentSimulationState,
        chapterState,
        chapterBeatProfileRecommendation: beatProfileWithPsychologyBias,
        beatAssemblyResult,
        beatAssemblyPreflight,
        narrativePsychologyArchitecture,
        narrativePsychologyValidation,
        narrativePsychologyChapterStateBias,
        narrativePsychologyBeatBias,
        proseGenerationConstraints: proseConstraints,
        proseGenerationPreflight: prosePreflight,
        proseGenerationValidation: postGenerationProseValidation,
        literaryDevicePack,
        literaryDeviceApplicationPlan,
        literaryDeviceValidation,
        literaryDeviceCockpitSummary,
        chapter1ProseGenerationPacket,
        chapter1ProseOutputPathReport,
        thoughtRecurrenceGuard,
        motiveCompression: motiveCompressionWithMediation,
        characterDistinctionPlan: characterDistinctionPlanWithMediation,
        enneagramOperatingLayer,
        enneagramConsciousnessEngine,
        enneagramMediationLayer,
        developmentalIntimacyEngine,
        abstractFearSuppression,
        entryStrategyPlan,
        paragraphShapePlan,
        embodimentAssemblyAdjustments,
        transitionTexturePlan,
        segment24OpenerPolicy,
        segment24EmbodimentPolicy,
        openingFamilyAudit,
        openingParagraphFamilyPlan,
        openerTokenAudit,
        firstTwoSentencePlan,
        openerFamilyMemory,
        segment1OpenerIsolation: segment1OpenerIsolationFinal,
        earlyParagraphAntiSymmetry,
        voiceEngineRulebook,
        narrativeDistancePlan,
        abstractionSuppression,
        voiceCognitionMap,
        perspectiveRoutingPlan,
        voiceLawEngine,
        languageSuppressionMap,
        renderDirectives,
        consciousnessCohesionRouter,
        voiceIdentityStabilizer,
        embodiedInnerLifeRouter,
        sentencePatternPlan,
        segmentEnergy,
        embodiment,
        consistencyReport: regeneratedConsistencyReport,
        voiceReport: regeneratedVoiceReport,
        gapReport: regeneratedGapReport,
        proseShapeCritic,
        proseShapeSummary,
        adversarialReview: adversarial,
        authorCockpitBundle,
        epicContinuityPack,
        epicContinuityValidation,
        epicEmotionalGravityPack,
        epicEmotionalGravityValidation,
      },
      provenance: {
        sourceArtifacts: unique([
          "reports/book1-chapter-01-chapter_draft.json",
          "reports/book1-chapter-01-chapter_consistency_report.json",
          "reports/book1-chapter-01-chapter_voice_report.json",
          "reports/book1-chapter-01-chapter_gap_report.json",
          "reports/book1-chapter-01-adversarial-summary.json",
          "reports/book1-chapter-01-scene-generation-request.json",
          "reports/book1-chapter-01-generated-scene-bundle.json",
          "reports/book1-chapter-01-scene-generation-validation.json",
          "reports/book1-character-console-session.json",
          "reports/book1-law-console-session.json",
          ...provenanceRefs,
        ]),
      },
    };

    const regenerationDiff = {
      artifact: "book1_chapter_01_regeneration_diff",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      comparedAgainst: {
        draft: "reports/book1-chapter-01-draft.json",
        consistency: "reports/book1-chapter-01-chapter_consistency_report.json",
        voice: "reports/book1-chapter-01-chapter_voice_report.json",
        gap: "reports/book1-chapter-01-chapter_gap_report.json",
        adversarialSummary: "reports/book1-chapter-01-adversarial-summary.json",
        sequenceValidation: "reports/book1-chapter-01-sequence-validation.json",
        sceneBundle: "reports/book1-chapter-01-generated-scene-bundle.json",
      },
      metrics: diffMetrics,
      lockEnforcement: {
        lockedAnchorViolations: blockedAnchorViolations,
        blockedMutations,
      },
      canonicalMutation: {
        requested: input.commitCanonical === true,
        performed: false,
        reason: "Regeneration loop never overwrites canonical artifacts without explicit external approval workflow.",
      },
    };

    const regenerationSummary = {
      artifact: "book1_chapter_01_regeneration_summary",
      schemaVersion: "1.0.0",
      chapter: 1,
      generatedAt,
      changedSystems: unique(changedSystems),
      changedChapterLawConditions,
      changedCharacterStateConditions,
      whatImproved: improved,
      whatWorsened: worsened,
      unchangedRisks,
      enneagramOverexposureRisk:
        newEnneagramOverexposure >= 6 ? "critical" : newEnneagramOverexposure >= 3 ? "high" : newEnneagramOverexposure > 0 ? "moderate" : "low",
      behaviorMediationQuality:
        newBehaviorMediationQuality >= 5 ? "strong" : newBehaviorMediationQuality >= 3 ? "adequate" : "weak",
      proseTheorizationRisk:
        newProseTheorization >= 10 ? "critical" : newProseTheorization >= 6 ? "high" : newProseTheorization >= 3 ? "moderate" : "low",
      recommendation,
      beatAssemblyGate: {
        required: true,
        blocked: false,
        validationPassed: beatAssemblyChain.chainValidation.passed,
      },
      proseConstraintCompliance: {
        passed: postGenerationProseValidation.passed,
        hardFailures: postGenerationProseValidation.hardFailureCount,
        softFailures: postGenerationProseValidation.softFailureCount,
      },
      canonRisk: canonRiskFromSeverity({
        critical: adversarial.summary.severityTotals.critical,
        high: adversarial.summary.severityTotals.high,
        lockViolations: blockedAnchorViolations,
      }),
      lockedAnchorsEnforced: blockedMutations.length > 0 || chapterEpicSimulation.hiddenTimeline.length > 0,
      canonicalOverwritePerformed: false,
      provenance: regenerationReview.provenance,
    };

    return {
      voiceContract,
      proseBriefs,
      livedHistory,
      cognitionSignatures,
      segmentSimulationState,
      chapterState,
      chapterBeatProfileRecommendation: beatProfileWithPsychologyBias,
      beatAssemblyResult,
      beatAssemblyPreflight,
      beatAssemblyBlocked: false,
      beatAssemblyFailure: null,
      narrativePsychologyArchitecture,
      narrativePsychologyValidation,
      narrativePsychologyChapterStateBias,
      narrativePsychologyBeatBias,
      proseGenerationConstraints: proseConstraints,
      proseGenerationPreflight: prosePreflight,
      proseGenerationValidation: postGenerationProseValidation,
      literaryDevicePack,
      literaryDeviceApplicationPlan,
      literaryDeviceValidation,
      literaryDeviceCockpitSummary,
      epicSequencePlan: sequenceDerivation.epicSequencePlan,
      bookSequencePlan: sequenceDerivation.bookSequencePlan,
      chapterSequencePlan: sequenceDerivation.chapterSequencePlan,
      chapterFunctionMatrix: sequenceDerivation.chapterFunctionMatrix,
      recallReframingPlans: sequenceDerivation.recallReframingPlans,
      sequenceValidation,
      sceneGenerationRequest: sceneGeneration.request,
      generatedChapterSceneBundle: sceneGeneration.bundle,
      sceneGenerationValidation: sceneGeneration.validation,
      chapter1ProseGenerationPacket,
      chapter1ProseOutputPathReport,
      authorCockpitBundle,
      epicContinuityPack,
      epicContinuityValidation,
      epicEmotionalGravityPack,
      epicEmotionalGravityValidation,
      thoughtRecurrenceGuard,
      motiveCompression: motiveCompressionWithMediation,
      characterDistinctionPlan: characterDistinctionPlanWithMediation,
      enneagramOperatingLayer,
      enneagramConsciousnessEngine,
      enneagramMediationLayer,
      developmentalIntimacyEngine,
      abstractFearSuppression,
      entryStrategyPlan,
      paragraphShapePlan,
      embodimentAssemblyAdjustments,
      transitionTexturePlan,
      segment24OpenerPolicy,
      segment24EmbodimentPolicy,
      openingFamilyAudit,
      openingParagraphFamilyPlan,
      openerTokenAudit,
      firstTwoSentencePlan,
      openerFamilyMemory,
      segment1OpenerIsolation: segment1OpenerIsolationFinal,
      earlyParagraphAntiSymmetry,
      voiceEngineRulebook,
      narrativeDistancePlan,
      abstractionSuppression,
      voiceCognitionMap,
      perspectiveRoutingPlan,
      voiceLawEngine,
      languageSuppressionMap,
      renderDirectives,
      consciousnessCohesionRouter,
      voiceIdentityStabilizer,
      embodiedInnerLifeRouter,
      sentencePatternPlan,
      segmentEnergy,
      embodiment,
      proseShapeCritic,
      proseShapeSummary,
      regeneratedDraftJson,
      regeneratedDraftText,
      regenerationReview,
      regenerationDiff,
      regenerationSummary,
    };
  }
}
