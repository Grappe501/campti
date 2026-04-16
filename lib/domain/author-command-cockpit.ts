import type { RuntimeAuthorityStamp } from "@/lib/domain/runtime-authority";

export const AUTHOR_COMMAND_COCKPIT_CONTRACT_VERSION = "1" as const;

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
  bounded: true;
  explainable: true;
  nonOmniscient: true;
  mutatesCanonicalTruth: false;
};
