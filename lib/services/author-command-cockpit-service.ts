import {
  AUTHOR_COMMAND_COCKPIT_CONTRACT_VERSION,
  type AuthorCommandAction,
  type AuthorCommandCockpitBundle,
  type CockpitScopeContext,
} from "@/lib/domain/author-command-cockpit";
import { deriveCenteredSurfaceTitle } from "@/lib/services/cockpit-shell-architecture-service";
import { deriveGuidedSignals } from "@/lib/services/guided-signals-service";
import { buildIndicatorBank } from "@/lib/services/indicator-bank-model-service";
import { listAvailableScopeEscalations } from "@/lib/services/cockpit-scope-model-service";
import { buildToolRailSystem } from "@/lib/services/tool-rail-system-service";

export function buildAuthorCommandCockpitBundle(input: {
  context: CockpitScopeContext;
  labels?: {
    sceneLabel?: string;
    chapterLabel?: string;
    bookLabel?: string;
    epicLabel?: string;
  };
  metrics: Record<string, number>;
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
  literaryDevices?: AuthorCommandCockpitBundle["literaryDevices"];
}): AuthorCommandCockpitBundle {
  const centered = deriveCenteredSurfaceTitle({
    scope: input.context.scope,
    ...input.labels,
  });
  const toolRails = buildToolRailSystem(input.context.scope);
  const indicatorBank = buildIndicatorBank({
    scope: input.context.scope,
    metrics: input.metrics,
  });
  const guidedSignals = deriveGuidedSignals({ indicatorBank, threshold: "medium" });
  const availableActions = deriveAvailableActions(input.context);

  return {
    contractVersion: AUTHOR_COMMAND_COCKPIT_CONTRACT_VERSION,
    sourceOfTruth: "governed_author_state",
    context: input.context,
    centeredSurface: {
      scope: input.context.scope,
      title: centered.title,
      subtitle: centered.subtitle,
    },
    toolRails,
    indicatorBank,
    guidedSignals,
    availableActions,
    beatAssembly: input.beatAssembly,
    chapterState: input.chapterState,
    narrativePsychology: input.narrativePsychology,
    proseConstraints: input.proseConstraints,
    beatGating: input.beatGating,
    narrativeThreads: input.narrativeThreads,
    chapterComposition: input.chapterComposition,
    literaryDevices: input.literaryDevices,
    bounded: true,
    explainable: true,
    nonOmniscient: true,
    mutatesCanonicalTruth: false,
  };
}

function deriveAvailableActions(context: CockpitScopeContext): AuthorCommandAction[] {
  const actions: AuthorCommandAction[] = [
    "inspect",
    "revise",
    "compare_states",
    "resolve_blocker",
    "enter_review_mode",
  ];
  if (context.scope !== "scene") {
    actions.push("rebalance");
  }
  if (listAvailableScopeEscalations(context.scope).length > 0) {
    actions.push("escalate_scope");
  }
  return actions;
}
