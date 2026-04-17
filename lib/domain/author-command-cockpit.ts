import type { EnforcementClass, ReadinessEvidenceTrustClass } from "@/lib/domain/enforcement-contract";
import type { RuntimeAuthorityStamp } from "@/lib/domain/runtime-authority";

export const AUTHOR_COMMAND_COCKPIT_CONTRACT_VERSION = "1" as const;

/** Cluster 7 — operator-visible certification / validation health (derived from runtime truth, not decorative). */
export type CockpitCertificationHardeningSummary = {
  contractVersion: "1";
  canonicalArtifactAuthority: import("@/lib/domain/canonical-artifact-governance").ArtifactAuthorityClass;
  saveEligible: boolean;
  saveBlockedReasons: string[];
  readinessEvidenceTrustClass: import("@/lib/domain/enforcement-contract").ReadinessEvidenceTrustClass;
  semanticHardViolations: number;
  semanticSoftViolations: number;
  overrideUsage: { allowSaveOnInvalidRealism: boolean; allowSaveOnInvalidHumanGravity: boolean };
  driftWarnings: string[];
  driftErrors: string[];
  certificationReadinessLine: string;
  remediationTargets: string[];
  /** Normative gates from certification truth / artifact truth rules. */
  certificationTruthRuleSatisfied: boolean;
  artifactTruthRuleSatisfied: boolean;
  mayPresentAsExecutionReady: boolean;
  mayPresentAsProductionGrade: boolean;
  validationFlags: string[];
};

export const COCKPIT_ENFORCEMENT_SEMANTIC_TRUTH_VERSION = "1" as const;

export type CockpitEnforcementPanelTruth = {
  panelKey: string;
  subsystemId: string;
  enforcementClass: EnforcementClass;
  participatesInCanonicalRuntime: boolean;
  affectsCanonicalOutput: boolean;
  canBlockInvalidExecution: boolean;
  demoSafeStatus: "demo_safe" | "demo_with_warnings" | "non_demo_safe";
  deterministicOrSampleSeeded: "neither" | "deterministic" | "sample_seeded" | "mixed";
  /** Cockpit panels are observational aggregates unless explicitly tied to canonical mutation paths. */
  observationalOnly: true;
  readinessEvidenceTrustClass: ReadinessEvidenceTrustClass;
  mayCountAsAuthoritativeProductionReadinessEvidence: boolean;
  readinessTrustAllowanceRuleId: string | null;
};

export type CockpitEnforcementSemanticTruth = {
  contractVersion: typeof COCKPIT_ENFORCEMENT_SEMANTIC_TRUTH_VERSION;
  canonicalRuntimeId: string;
  cockpitRuntimeId: string;
  /** The cockpit bundle never mutates canonical narrative truth. */
  cockpitBundleObservationalOnly: true;
  panelTruth: CockpitEnforcementPanelTruth[];
  globalWarnings: string[];
  ambiguousSubsystemReferences: string[];
};

export const AUTHOR_COCKPIT_SCOPES = ["scene", "chapter", "book", "epic"] as const;
export type AuthorCockpitScope = (typeof AUTHOR_COCKPIT_SCOPES)[number];

export type CockpitScopeContext = {
  scope: AuthorCockpitScope;
  sceneId?: string;
  chapterId?: string;
  bookId?: string;
  epicId?: string;
};

export type IndicatorSeverity = "low" | "medium" | "high";

export type CockpitIndicator = {
  key: string;
  label: string;
  value: string | number;
  severity: IndicatorSeverity;
  source: "governed_state";
  explainable: true;
};

export type ScopeIndicatorBank = {
  scope: AuthorCockpitScope;
  indicators: CockpitIndicator[];
};

export type ToolRailSection = {
  id: string;
  label: string;
  tools: string[];
};

export type CockpitToolRailSystem = {
  topBand: ToolRailSection;
  leftRail: ToolRailSection;
  rightRail: ToolRailSection;
  lowerLayer?: ToolRailSection;
};

export type GuidedSignal = {
  signalId: string;
  summary: string;
  rationale: string;
  severity: IndicatorSeverity;
  bounded: true;
  explainable: true;
  advisoryOnly: true;
};

export const AUTHOR_COMMAND_ACTIONS = [
  "inspect",
  "revise",
  "rebalance",
  "resolve_blocker",
  "enter_review_mode",
  "compare_states",
  "escalate_scope",
] as const;
export type AuthorCommandAction = (typeof AUTHOR_COMMAND_ACTIONS)[number];

export type Cluster3RuntimeActivationTruth = {
  contractVersion: "1";
  governanceMergeApplied: boolean;
  proseConstraintCluster3Flags: string[];
  sequenceStructuralHookPressureActive: boolean;
  epicContinuityPackValidated: boolean;
  epicEmotionalGravityPackValidated: boolean;
  narratorPresenceValidated: boolean;
  encsMaterialInfluences: string[];
  eegsMaterialInfluences: string[];
  narratorMaterialInfluences: string[];
  hcelHookHardSignalsActive: boolean;
  advisoryRemainderNote: string;
};

export type AuthorCommandCockpitBundle = {
  contractVersion: typeof AUTHOR_COMMAND_COCKPIT_CONTRACT_VERSION;
  sourceOfTruth: "governed_author_state";
  context: CockpitScopeContext;
  centeredSurface: {
    scope: AuthorCockpitScope;
    title: string;
    subtitle: string;
  };
  toolRails: CockpitToolRailSystem;
  indicatorBank: ScopeIndicatorBank;
  guidedSignals: GuidedSignal[];
  availableActions: AuthorCommandAction[];
  runtimeAuthority: RuntimeAuthorityStamp;
  beatAssembly?: {
    chapter: number;
    beatCount: number;
    validationPassed: boolean;
    highestPressureLoad: number;
    salienceCoverage: number;
    memoryLinkedBeats: number;
    socialFeedbackBeats: number;
    meaningTraceBeats: number;
    summaryLine: string;
  };
  chapterState?: {
    chapterId: string;
    chapterMode: string;
    dominantPressures: string[];
    suppressedPressures: string[];
    movementPressure: number;
    decisionPressure: number;
    meaningLoad: number;
    allowedMeaningIntensity: string;
    validationPassed: boolean;
    riskFlags: string[];
    summaryLine: string;
  };
  narrativePsychology?: {
    chapterId: string;
    chapterPsychologyMode: string;
    emotionalObjective: string;
    pullScore: number;
    carryForwardHook: string;
    driftWarnings: string[];
  };
  proseConstraints?: {
    proseMode: string;
    narrativeDistance: string;
    sensoryDensityTarget: string;
    expositionAllowance: number;
    emotionalExplicitnessCeiling: number;
    ambiguityAllowance: number;
    endingMomentumProfile: string;
    attachmentTarget: number;
    placeImmersionTarget: number;
    compliant: boolean;
    driftWarnings: string[];
  };
  literaryDevices?: {
    chapterId: string;
    activeDevicePanel: Array<{
      deviceId: string;
      activationMode: "off" | "subtle" | "moderate" | "strong" | "required";
      densityBand: "rare" | "occasional" | "patterned" | "motif_driven";
      scope: "line" | "paragraph" | "scene" | "chapter" | "thread" | "pov" | "character" | "book";
      contexts: string[];
      misuseRisk: "low" | "moderate" | "high" | "critical";
      currentChapterApplicationStatus: "suppressed" | "allowed" | "active" | "required";
    }>;
    symbolRegistry: Array<{
      symbolId: string;
      symbolName: string;
      carriers: string[];
      threadBindings: string[];
      settingBindings: string[];
      payoffWindow: string;
      callbackWindow: string;
    }>;
    motifRegistry: Array<{
      motifId: string;
      motifName: string;
      boundThreadIds: string[];
      recurrenceTarget: "rare" | "occasional" | "patterned" | "motif_driven";
    }>;
    routeEchoControls: {
      activationMode: string;
      densityBand: string;
      boundRoutes: string[];
    };
    philosophyEchoControls: {
      activationMode: string;
      explicitnessCeiling: "implicit" | "low" | "moderate" | "high";
      carrierModes: string[];
    };
    alliterationControl: {
      activationMode: "off" | "subtle" | "moderate" | "strong" | "required";
      densityBand: "rare" | "occasional" | "patterned" | "motif_driven";
      numericInput: number;
      mappedDensityBand: "rare" | "occasional" | "patterned" | "motif_driven";
      allowedLineZones: string[];
      forbiddenLineZones: string[];
      consonantClusteringTolerance: number;
    };
    densityWarnings: string[];
    misuseWarnings: string[];
    chapterLiteraryProfileSummary: string;
    perSceneDeviceDistribution: Array<{
      sceneId: string;
      activeDeviceCount: number;
      overloadRisk: "low" | "moderate" | "high";
    }>;
    literaryDriftWarnings: string[];
  };
  beatGating?: {
    required: boolean;
    blocked: boolean;
    reason: string;
  };
  narrativeThreads?: {
    chapterId: string;
    activeThreadIds: string[];
    latentThreadIds: string[];
    callbackMarkers: string[];
    delayedConvergenceMarkers: string[];
    reinterpretationCandidates: string[];
    philosophyThreadIds: string[];
    unresolvedThreadCount: number;
    resolvedThreadCount: number;
    sceneDensity: Array<{
      sceneId: string;
      activeThreadCount: number;
      latentThreadCount: number;
      densityScore: number;
    }>;
    warnings: string[];
  };
  chapterComposition?: {
    chapterId: string;
    compositionMode:
      | "braided_continuity"
      | "signal_clustered"
      | "contrast_composition"
      | "delayed_convergence"
      | "memory_echo"
      | "route_braided"
      | "relational_spread"
      | "layered_pressure"
      | "fracture_spread"
      | "adaptation_braid";
    sceneCount: number;
    sceneRoleSpread: string[];
    dominantThreadFamilies: string[];
    latentThreadFamilies: string[];
    delayedConvergenceMarkers: string[];
    callbackMarkers: string[];
    reinterpretationAnchorIds: string[];
    routeCoverageStatus: string;
    philosophyPropagationStatus: string;
    densityScore: number;
    thinnessWarnings: string[];
    chapterClosureProfile: string;
    carryForwardUnresolvedPressureSummary: string[];
  };
  sequenceArchitecture?: {
    chapterId: string;
    dominantFunction: string;
    secondaryFunctions: string[];
    readerEnergyRole: string;
    functionTimeline: Array<{ chapterId: string; dominantFunction: string }>;
    convergenceWindows: string[];
    recallWindows: string[];
    sequenceWarnings: string[];
    sequenceScore: number;
  };
  sceneGeneration?: {
    generatedSceneCount: number;
    sceneRolesInRuntimeOrder: string[];
    sceneThreadMix: Array<{ scenePlanId: string; activeThreadCount: number; latentThreadCount: number }>;
    sceneRoutePresence: Array<{ scenePlanId: string; routeBindings: string[] }>;
    sceneProseModes: Array<{ scenePlanId: string; proseConstraintId: string }>;
    sceneLiteraryProfiles: Array<{ scenePlanId: string; literaryPlanId: string }>;
    transitionTypes: string[];
    callbackMarkersTriggered: string[];
    delayedConvergenceMarkersPresent: string[];
    reinterpretationAnchorsPresent: string[];
    sceneBundleWarnings: string[];
    chapterRuntimeDensitySummary: string;
  };
  epicContinuity?: {
    epicId: string;
    chapterId: string;
    currentQuestionExpression: string;
    activeAnchorIds: string[];
    anchorRecurrenceHealth: number;
    identityPersistenceStatus: string;
    meaningEscalationStatus: string;
    readerMemoryTargets: string[];
    hookLayerStatus: string[];
    temporalTransitionHealth: string;
    disconnectionWarnings: string[];
    unresolvedEpicContinuityRisks: string[];
  };
  emotionalGravity?: {
    epicId: string;
    chapterId: string;
    attachmentStatusByCharacter: string[];
    activeFearDesireVulnerabilityLines: string[];
    consequenceIrreversibilityMarkers: string[];
    fateAgencyPressureMap: string[];
    relationalStakesMap: string[];
    generationalBurdenStatus: string[];
    emotionalCarryForwardSummary: string[];
    temporalEmotionalContinuityHealth: string;
    emotionallyThinWarnings: string[];
    resetHeavyWarnings: string[];
    epicEmotionalGravityScore: number;
    diagnostics: string[];
  };
  /** Cluster 6 — human-gravity runtime bundle (attachment/stakes/consequence/burden governors on canonical generation). */
  humanGravityRuntime?: {
    chapterId: string;
    sceneId: string;
    humanGravityScore: number;
    /** True only when prompt/seed/no-reset gate materially participates (see runtime contract). */
    humanGravityCanonicalRuntimeActive: boolean;
    povBiasSummary: string;
    activeFearDesireVulnerabilityLines: string[];
    relationalThreatTop: string[];
    activeConsequenceMarkers: string[];
    burdenAndInheritanceLines: string[];
    carryForwardResidue: string[];
    repairDifficultySignals: string[];
    shallowOrResetWarnings: string[];
    refinementTargets: string[];
    /** Mirrors profile: substantive CLUSTER6 prompt lines on canonical path. */
    runtimePromptLinesMaterialized: boolean;
    noResetValidationParticipatesInCanonicalValidity: boolean;
  };
  narratorPresence?: {
    chapterId: string;
    currentNarratorPresenceLevel: string;
    narratorAuthorityMode: string;
    narratorKnowledgeMode: string;
    convergenceStage: string;
    upcomingConvergenceTriggers: string[];
    narratorHookContinuityContribution: number;
    narratorCharacterBoundaryWarnings: string[];
    temporalBridgeStatus: string;
    firstPersonReadinessStatus: string;
    voiceShiftRisks: string[];
  };
  /** Cluster 5 — prose & narrative realism observability (governance-linked scores + refinement targets). */
  proseRealism?: {
    chapterId: string;
    governanceLinked: boolean;
    eraTruthScore: number | null;
    cognitionTruthScore: number | null;
    narratorBoundaryIntegrity: number | null;
    emotionalCredibility: number | null;
    sensoryEmbodiment: number | null;
    voiceDistinctness: number | null;
    consequenceResidue: number | null;
    literaryNaturalness: number | null;
    antiMechanicalWarnings: string[];
    recommendedRefinementTargets: string[];
  };
  /** Cluster 3 — which narrative governance layers materially influenced this run’s canonical prose/sequence path. */
  cluster3RuntimeActivationTruth?: Cluster3RuntimeActivationTruth;
  /** Cluster 4 — regeneration vs production governance parity and runtime path truth. */
  runtimeConvergenceTruth?: import("@/lib/domain/canonical-scene-generation-governance").RuntimeGovernanceConvergenceTruth;
  /** Cluster 2 — machine-readable enforcement truth for populated panels (optional when not computed). */
  enforcementSemanticTruth?: CockpitEnforcementSemanticTruth;
  /** Cluster 7 — validation/certification visibility (optional when scene/cluster7 truth not evaluated). */
  certificationHardening?: CockpitCertificationHardeningSummary;
  bounded: true;
  explainable: true;
  nonOmniscient: true;
  mutatesCanonicalTruth: false;
};
