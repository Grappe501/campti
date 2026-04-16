import {
  BookContinuityPlanSchema,
  CamptiEpicContinuityPackSchema,
  EpicContinuityCockpitSummarySchema,
  EpicContinuityDiagnosticsSchema,
  EpicContinuityDownstreamBiasSchema,
  EpicNarrativeContinuityProfileSchema,
  SeriesContinuityPlanSchema,
  type CamptiEpicContinuityPack,
} from "@/lib/domain/epic-narrative-continuity";
import { EpicQuestionEngineService } from "@/lib/services/epic-question-engine-service";
import { HookOrchestrationService } from "@/lib/services/hook-orchestration-service";
import { IdentityPersistenceService } from "@/lib/services/identity-persistence-service";
import { MeaningEscalationService } from "@/lib/services/meaning-escalation-service";
import { NarrativeAnchorRegistryService } from "@/lib/services/narrative-anchor-registry-service";
import { ReaderMemoryStrategyService } from "@/lib/services/reader-memory-strategy-service";
import { TemporalTransitionContinuityService } from "@/lib/services/temporal-transition-continuity-service";
import { NarratorPresenceDerivationService } from "@/lib/services/narrator-presence-derivation-service";
import { NarratorPresenceToHookContinuityService } from "@/lib/services/narrator-presence-to-hook-continuity-service";

export class EpicContinuityDerivationService {
  private readonly questionEngine = new EpicQuestionEngineService();

  private readonly anchorRegistryService = new NarrativeAnchorRegistryService();

  private readonly identityService = new IdentityPersistenceService();

  private readonly meaningService = new MeaningEscalationService();

  private readonly memoryService = new ReaderMemoryStrategyService();

  private readonly hookService = new HookOrchestrationService();

  private readonly temporalService = new TemporalTransitionContinuityService();

  private readonly narratorPresence = new NarratorPresenceDerivationService();

  private readonly narratorHookBridge = new NarratorPresenceToHookContinuityService();

  deriveCamptiPack(input: {
    chapterId: string;
    chapterSequence: number;
    chapterMode: string;
    chapterPsychologyMode: string;
    activeThreadIds: string[];
    recallWindows: string[];
  }): CamptiEpicContinuityPack {
    const epicQuestionProfile = this.questionEngine.buildCamptiQuestionProfile();
    const anchorRegistry = this.anchorRegistryService.buildCamptiRegistry();
    const identityPersistenceProfile = this.identityService.buildCamptiProfile();
    const meaningEscalationProfile = this.meaningService.buildCamptiProfile();
    const readerMemoryStrategy = this.memoryService.buildCamptiStrategy();
    const hookOrchestrationProfile = this.hookService.buildCamptiProfile();
    const temporalTransitionProfiles = this.temporalService.buildCamptiTransitions();
    const narratorPresencePack = this.narratorPresence.deriveCamptiPack({
      chapterId: input.chapterId,
      chapterSequence: input.chapterSequence,
      sceneIds: [],
    });
    const narratorHookAdapter = this.narratorHookBridge.deriveAdapter({
      chapterId: input.chapterId,
      modeProfile: narratorPresencePack.chapterPresencePlan.modeProfile,
      convergence: narratorPresencePack.convergenceProfile,
    });
    const narratorAwareTransitions = temporalTransitionProfiles.map((transition) => ({
      ...transition,
      hookContinuityDeclaration: this.narratorHookBridge.augmentDeclaration({
        declaration: transition.hookContinuityDeclaration,
        adapter: narratorHookAdapter,
      }),
    }));

    const recurrence = this.anchorRegistryService.validateRecurrenceHealth({
      registry: anchorRegistry,
      requiredEraIds: ["era-1650", "era-1960"],
    });
    const transitionValidation = this.temporalService.validateTransitionProfiles({
      profiles: narratorAwareTransitions,
    });
    const identityStatus = this.identityService.derivePersistenceStatus({
      profile: identityPersistenceProfile,
    });
    const meaningStatus = this.meaningService.deriveEscalationStatus({
      profile: meaningEscalationProfile,
      chapterSequence: input.chapterSequence,
    });

    const seriesPlan = SeriesContinuityPlanSchema.parse({
      seriesId: "campti-trilogy-mainline",
      parentEpicId: "campti-epic",
      seriesQuestionRole: "Reframe one central question through differing historical pressure systems.",
      seriesIdentityRole: "Track what remains recognizable in continuity practice across generations.",
      seriesAnchorPlan: ["anchor-river-witness", "anchor-phrase-warning", "anchor-family-name-pattern"],
      seriesMeaningEscalationBand: "from place-survival to historical-memory judgment",
      seriesEmotionalSignature: ["attachment", "loss-pressure", "continuity-duty", "recovery"],
      seriesTransitionStrategy: [
        "Lead each era with transformed recurrence of at least two anchors.",
        "Bind each era shift to a memory reward and a hook carry-forward signal.",
      ],
      seriesHookProfile: ["attachment+recognition dual hooks", "epic-question hook each major closure"],
      validationFlags: ["series-question-role-defined"],
    });

    const book1Plan = BookContinuityPlanSchema.parse({
      bookId: "book1",
      parentEpicId: "campti-epic",
      parentSeriesId: seriesPlan.seriesId,
      bookRoleInEpic: "Belonging and warning literacy foundation under early pressure.",
      bookQuestionExpression: "How do people preserve belonging when place signals begin to destabilize?",
      bookAnchorRequirements: ["anchor-river-witness", "anchor-phrase-warning", "anchor-gesture-river-check"],
      bookIdentityPersistenceGoals: [
        "Establish warning inheritance as identity infrastructure.",
        "Seed lineage memory signals for later recovery.",
      ],
      bookMeaningEscalationGoals: [
        "warning -> pattern",
        "river -> witness",
        "gesture -> continuity ritual",
      ],
      bookMemoryRewardPlan: ["phrase callback in late chapters", "gesture scene-shape recall"],
      bookHookProfile: ["attachment under threat", "unresolved continuity pressure"],
      hookContinuityDeclaration: this.narratorHookBridge.augmentDeclaration({
        declaration: {
        hookContinuityScore: 0.79,
        emotionalAttachmentDrivers: ["place-labor belonging", "kinship duty under strain"],
        attachmentContinuitySignals: ["belonging pressure remains emotionally legible", "kinship duty stays central"],
        readerCarryDeclaration: {
          emotionalCarry: ["attachment under threat", "warning anxiety"],
          understandingQuestion: ["How long can belonging survive signal destabilization?"],
          waitingForResolution: ["whether warning literacy can be transmitted before rupture deepens"],
          continuityReassuranceSignals: ["anchor-river-witness recurrence", "warning phrase callbacks"],
        },
        structuralCuriosityDrivers: ["delayed convergence keys", "callback seed spacing"],
        philosophicalEngagementDrivers: ["belonging under pressure", "survival vs fidelity tension"],
        unresolvedContinuityPressureCarryForward: [
          "warning signals remain partially unreadable",
          "identity carryover choices remain unresolved into next book movement",
        ],
        },
        adapter: narratorHookAdapter,
      }),
      bookTemporalFeelProfile: ["earthbound", "embodied", "ritualized vigilance"],
      bookTransitionInProfile: ["open with place-labor grounding and continuity cues"],
      bookTransitionOutProfile: ["close with adaptation pressure and unresolved continuity duty"],
      validationFlags: ["book1-foundation-valid"],
    });

    const book3Plan = BookContinuityPlanSchema.parse({
      bookId: "book3-1960",
      parentEpicId: "campti-epic",
      parentSeriesId: seriesPlan.seriesId,
      bookRoleInEpic: "Reinterpret inherited continuity under late historical rupture.",
      bookQuestionExpression: "What survives when inherited memory conflicts with official narratives?",
      bookAnchorRequirements: ["anchor-family-name-pattern", "anchor-phrase-warning", "anchor-river-witness"],
      bookIdentityPersistenceGoals: ["Recover fragmented lineage line.", "Reclaim warning and route literacy as living truth."],
      bookMeaningEscalationGoals: ["object/name fragment -> recovered truth", "river -> judgment"],
      bookMemoryRewardPlan: ["name fragment payoff", "phrase reinterpretation payoff"],
      bookHookProfile: ["structural connection curiosity", "epic question curiosity"],
      hookContinuityDeclaration: this.narratorHookBridge.augmentDeclaration({
        declaration: {
        hookContinuityScore: 0.73,
        emotionalAttachmentDrivers: ["recovery grief-pride blend", "family-line reclamation stakes"],
        attachmentContinuitySignals: ["inheritance attachment persists", "recovery ache remains central"],
        readerCarryDeclaration: {
          emotionalCarry: ["grief-pride reclamation pressure", "epic-level unresolved ache"],
          understandingQuestion: ["What survives when inherited memory fights official narrative?"],
          waitingForResolution: ["whether reconstructed lineage can repair continuity fractures"],
          continuityReassuranceSignals: ["anchor-family-name-pattern recurrence", "anchor-phrase-warning reinterpretation"],
        },
        structuralCuriosityDrivers: ["record/oral mismatch resolution", "cross-era anchor transformations"],
        philosophicalEngagementDrivers: ["truth vs official narrative", "memory as identity infrastructure"],
        unresolvedContinuityPressureCarryForward: [
          "full lineage reconstruction remains incomplete",
          "epic-level question remains open despite local recoveries",
        ],
        },
        adapter: narratorHookAdapter,
      }),
      bookTemporalFeelProfile: ["institution-facing", "dislocated", "investigative-emotional"],
      bookTransitionInProfile: ["re-establish continuity with transformed anchors in opening movement"],
      bookTransitionOutProfile: ["epic-scale question remains open but deepened"],
      validationFlags: ["later-era-book-plan-valid"],
    });

    const epicContinuityProfile = EpicNarrativeContinuityProfileSchema.parse({
      artifact: "epic_narrative_continuity_profile",
      schemaVersion: "1.0.0",
      epicId: "campti-epic",
      epicTitle: "Campti Epic",
      epicQuestion: epicQuestionProfile.centralHumanQuestion,
      epicQuestionVariants: epicQuestionProfile.expressionVariants.map((row) => row.variantId),
      emotionalNorthStar: "Continuity carried through adaptation without identity severance.",
      identityCore: identityPersistenceProfile.identityCore,
      continuityLaws: [
        "Question centrality must remain recognizable across all scale transitions.",
        "Era difference is required; disconnection is forbidden.",
        "Anchor recurrence must transform while preserving continuity signal.",
      ],
      continuityAnchorIds: anchorRegistry.anchors.map((row) => row.anchorId),
      activeAnchorFamilies: anchorRegistry.activeAnchorFamilies,
      identityPersistenceProfileId: identityPersistenceProfile.profileId,
      meaningEscalationProfileId: meaningEscalationProfile.profileId,
      readerMemoryStrategyId: readerMemoryStrategy.strategyId,
      hookOrchestrationProfileId: hookOrchestrationProfile.profileId,
      temporalTransitionProfiles: temporalTransitionProfiles.map((row) => row.profileId),
      seriesBookContinuityPlans: [seriesPlan.seriesId, book1Plan.bookId, book3Plan.bookId],
      routeContinuityProfile: [
        "Route memory must appear as lived route, rumor route, and archived route across eras.",
      ],
      validationFlags: ["epic-central-question-stable", "cross-era-continuity-active"],
    });

    const downstreamBias = EpicContinuityDownstreamBiasSchema.parse({
      artifact: "epic_continuity_downstream_bias",
      chapterId: input.chapterId,
      narrativePsychologyBias: [
        `prioritize emotional continuity with chapter mode ${input.chapterPsychologyMode}`,
        "preserve epic-question curiosity without overt exposition",
      ],
      chapterStateBias: [
        `align chapter-state continuity pressures with chapter mode ${input.chapterMode}`,
        "increase memory_continuity and identity_stability weight during transition chapters",
      ],
      narrativeThreadPriorityBias: [
        "prioritize continuity_thread and memory_thread when anchor recurrence is due",
        ...input.activeThreadIds.slice(0, 2).map((threadId) => `maintain active thread continuity: ${threadId}`),
      ],
      chapterCompositionRequirements: [
        "require at least one anchor recurrence event in transition windows",
        "enforce callback/reinterpretation spacing for memory rewards",
        "require narrator continuity anchor support during high dislocation windows",
      ],
      sequenceArchitectureBias: [
        "sequence closures must carry epic-level unresolved meaning pressure",
        "recall windows must include transformed-anchor callbacks",
        "sequence checkpoints should honor narrator convergence stage progression",
      ],
      routeRecurrenceBias: ["increase route echo density when river/place anchors are active"],
      literaryDeviceAllowanceBias: [
        "allow symbol and phrase motifs when tied to anchor families",
        "suppress ornamental device usage without continuity function",
      ],
      hookClosureCarryForwardBias: [
        "layer hooks: scene + structure + epic question",
        "closure must preserve continuity-under-threat signal",
        `narrator contribution score: ${narratorHookAdapter.narratorHookContinuityContribution}`,
      ],
    });

    const cockpitSummary = EpicContinuityCockpitSummarySchema.parse({
      artifact: "epic_continuity_cockpit_summary",
      epicId: epicContinuityProfile.epicId,
      chapterId: input.chapterId,
      currentQuestionExpression:
        epicQuestionProfile.expressionVariants.find((row) => row.scale === "book")?.expressionLine ??
        epicQuestionProfile.centralHumanQuestion,
      activeAnchorIds: anchorRegistry.anchors.slice(0, 3).map((row) => row.anchorId),
      anchorRecurrenceHealth: recurrence.recurrenceHealth,
      identityPersistenceStatus: identityStatus,
      meaningEscalationStatus: meaningStatus,
      readerMemoryTargets: readerMemoryStrategy.memoryTargets.map((row) => row.targetId),
      hookLayerStatus: hookOrchestrationProfile.hookLayers.map((row) => `${row.layerType}:active`),
      temporalTransitionHealth: transitionValidation.continuityHealth,
      disconnectionWarnings: recurrence.warnings.concat(transitionValidation.warnings),
      unresolvedEpicContinuityRisks:
        input.recallWindows.length === 0
          ? ["No recall windows surfaced in sequence layer; continuity rewards may underfire."]
          : [],
    });

    const diagnostics = EpicContinuityDiagnosticsSchema.parse({
      artifact: "epic_continuity_diagnostics",
      epicId: epicContinuityProfile.epicId,
      continuityStrengthScore: Number(((cockpitSummary.anchorRecurrenceHealth + 0.81) / 2).toFixed(3)),
      risks: cockpitSummary.disconnectionWarnings.concat(cockpitSummary.unresolvedEpicContinuityRisks),
      protections: [
        "Question centrality is explicit and linked across scales.",
        "Anchor recurrence tracks transformed era variants.",
        "Transition anti-dislocation strategy is explicit.",
      ],
      unresolvedItems: cockpitSummary.unresolvedEpicContinuityRisks,
    });

    return CamptiEpicContinuityPackSchema.parse({
      artifact: "campti_epic_continuity_pack",
      schemaVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      epicContinuityProfile,
      epicQuestionProfile,
      seriesContinuityPlans: [seriesPlan],
      bookContinuityPlans: [book1Plan, book3Plan],
      anchorRegistry,
      identityPersistenceProfile,
      meaningEscalationProfile,
      readerMemoryStrategy,
      hookOrchestrationProfile,
      temporalTransitionProfiles: narratorAwareTransitions,
      downstreamBias,
      cockpitSummary,
      diagnostics,
    });
  }
}
