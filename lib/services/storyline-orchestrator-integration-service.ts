import type { ConversationEmotionalContinuity } from "@/lib/domain/conversation-emotional-continuity";
import type { TemporalEvolutionSummary } from "@/lib/domain/temporal-evolution";
import {
  STORYLINE_GUIDANCE_BUNDLE_CONTRACT_VERSION,
  type StorylineGuidanceBundle,
  type StorylineOrchestrationInputs,
} from "@/lib/domain/storyline-guidance-bundle";
import {
  applyNarrativeArcUpdate,
  createNarrativeArc,
} from "@/lib/services/arc-engine-service";
import {
  createBranchGovernanceState,
  evaluateBranchGovernance,
} from "@/lib/services/branch-governance-service";
import {
  createChapterMovementProgressionState,
  evaluateChapterMovementProgression,
} from "@/lib/services/chapter-movement-progression-service";
import { assertMemoryBoundary } from "@/lib/services/interaction-truth-firewall-service";
import { evaluateNarrativePressure } from "@/lib/services/narrative-pressure-engine-service";

function clamp0to100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function assertStorylineModeRestrictions(input: {
  mode: StorylineGuidanceBundle["mode"];
  channel: StorylineGuidanceBundle["channel"];
}): void {
  if (input.mode === "scene_mode" && input.channel !== "canonical_dyad") {
    throw new Error("[storyline-orchestrator] scene_mode requires canonical_dyad channel.");
  }
}

function assertStorylineTruthBoundary(input: {
  mode: StorylineGuidanceBundle["mode"];
  channel: StorylineGuidanceBundle["channel"];
}): void {
  const source = input.channel === "canonical_dyad" ? "canonical_truth" : "reader_interaction_memory";
  const target = "character_bounded_knowledge";
  assertMemoryBoundary({
    source,
    target,
    payload: {
      storylineBundleMode: input.mode,
      storylineBundleChannel: input.channel,
    },
  });
}

function lifecyclePriorityWeight(lifecycleState: string): number {
  switch (lifecycleState) {
    case "crisis":
      return 95;
    case "escalating":
      return 84;
    case "turning":
      return 78;
    case "resolving":
      return 70;
    case "active":
      return 66;
    case "seeded":
      return 52;
    case "stalled":
      return 38;
    case "resolved":
    case "transformed":
      return 24;
    default:
      return 30;
  }
}

export function assembleStorylineGuidanceBundle(input: {
  mode: StorylineGuidanceBundle["mode"];
  channel: StorylineGuidanceBundle["channel"];
  orchestration: StorylineOrchestrationInputs;
  includeDebugExplanation?: boolean;
}): StorylineGuidanceBundle {
  assertStorylineModeRestrictions({ mode: input.mode, channel: input.channel });
  assertStorylineTruthBoundary({ mode: input.mode, channel: input.channel });

  const activeArcPriorities = [...input.orchestration.arcStates]
    .map((arc) => ({
      arcId: arc.arcId,
      arcType: arc.arcType,
      lifecycleState: arc.lifecycleState,
      priorityWeight: clamp0to100(
        lifecyclePriorityWeight(arc.lifecycleState) + arc.tensionLevel * 0.35 + arc.intensityLevel * 0.2
      ),
    }))
    .sort((a, b) => b.priorityWeight - a.priorityWeight)
    .slice(0, 5);

  const chapterProgressionSummary = {
    chapterFunction: input.orchestration.chapterProgressionState.chapterFunction,
    progressionState: input.orchestration.chapterProgressionState.progressionState,
    readinessScore: input.orchestration.chapterProgressionOutput.progressionReadiness.score,
    unresolvedCarryoverCount: input.orchestration.chapterProgressionState.unresolvedCarryovers.length,
  };

  const currentNarrativeQuestions = [
    ...(input.orchestration.currentNarrativeQuestions ?? []),
    ...input.orchestration.chapterProgressionOutput.unresolvedNeeds.slice(0, 4).map((carry) => carry.carryoverId),
  ]
    .filter((entry, index, arr) => Boolean(entry) && arr.indexOf(entry) === index)
    .slice(0, 8);

  const pressureHints = input.orchestration.narrativePressureOutput.influenceHints;
  const allowedSceneTendencies = pressureHints
    .filter(
      (hint) =>
        hint.sceneCandidateWeightDelta >= 0 &&
        hint.responseTendencyWeightDelta >= 0 &&
        hint.tensionEmphasisWeightDelta >= 0
    )
    .map((hint) => `${hint.category}:allow_structural_bias`)
    .slice(0, 8);
  const discouragedSceneTendencies = [
    ...pressureHints
      .filter(
        (hint) =>
          hint.sceneCandidateWeightDelta < 0 ||
          hint.responseTendencyWeightDelta < 0 ||
          hint.tensionEmphasisWeightDelta < 0
      )
      .map((hint) => `${hint.category}:discourage_overextension`),
    ...input.orchestration.branchGovernanceOutput.divergenceWarnings.map((warning) => `branch_warning:${warning}`),
    ...input.orchestration.chapterProgressionOutput.transitionBlockers.map(
      (blocker) => `transition_blocker:${blocker}`
    ),
  ].slice(0, 8);

  const tensionEmphasisWeights = input.orchestration.narrativePressureOutput.activePressures
    .map((pressure) => ({
      pressureCategory: pressure.category,
      weight: pressure.intensity,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  const reasonCodes = [
    `mode:${input.mode}`,
    `channel:${input.channel}`,
    `active_arc_priorities:${activeArcPriorities.length}`,
    `chapter_readiness:${chapterProgressionSummary.readinessScore}`,
    `pressure_categories:${tensionEmphasisWeights.length}`,
    `branch_legality:${input.orchestration.branchGovernanceOutput.branchLegality.status}`,
  ];

  const subsystemSummaries = [
    `arc_states=${input.orchestration.arcStates.length}`,
    `chapter_function=${chapterProgressionSummary.chapterFunction}`,
    `pressure_active=${input.orchestration.narrativePressureOutput.activePressures.length}`,
    `branch_depth=${input.orchestration.branchGovernanceState.divergenceDepth}`,
  ];

  const debugExplanation = input.includeDebugExplanation
    ? {
        activeSubsystems: ["arc_engine", "chapter_progression", "pressure_engine", "branch_governance"],
        boundedCapsApplied: [
          "activeArcPriorities<=5",
          "currentNarrativeQuestions<=8",
          "sceneTendencies<=8",
          "tensionEmphasisWeights<=6",
        ],
      }
    : undefined;

  return {
    contractVersion: STORYLINE_GUIDANCE_BUNDLE_CONTRACT_VERSION,
    mode: input.mode,
    channel: input.channel,
    activeArcPriorities,
    chapterProgressionSummary,
    currentNarrativeQuestions,
    sceneTendencyGuidance: {
      allowedSceneTendencies,
      discouragedSceneTendencies,
    },
    branchConstraints: {
      legalityStatus: input.orchestration.branchGovernanceOutput.branchLegality.status,
      canonicalityStatus: input.orchestration.branchGovernanceOutput.branchLegality.canonicality,
      depthStatus: input.orchestration.branchGovernanceOutput.branchLegality.depthStatus,
      reconvergenceRecommendation:
        input.orchestration.branchGovernanceOutput.reconvergenceNeed.recommendation,
      divergenceWarnings: input.orchestration.branchGovernanceOutput.divergenceWarnings.slice(0, 8),
    },
    tensionEmphasisWeights,
    explainability: {
      reasonCodes: reasonCodes.slice(0, 10),
      subsystemSummaries,
    },
    ...(debugExplanation ? { debugExplanation } : {}),
  };
}

export function buildStorylineOrchestrationInputsFromSeamContext(input: {
  mode: StorylineGuidanceBundle["mode"];
  channel: StorylineGuidanceBundle["channel"];
  seamId: string;
  relationshipSignalCodes: string[];
  emotionalContinuity?: ConversationEmotionalContinuity | null;
  temporalEvolution?: TemporalEvolutionSummary | null;
}): StorylineOrchestrationInputs {
  const observedAtIso = "2026-01-01T00:00:00.000Z";
  const relationshipPressure = clamp0to100(
    (input.emotionalContinuity?.pressureState.currentAffectPressure ?? 0) +
      (input.temporalEvolution?.behaviorTendencySummary.conflictReadinessDelta ?? 0)
  );
  const arc = createNarrativeArc({
    arcId: `storyline:${input.seamId}`,
    arcType: input.mode === "scene_mode" ? "family_survival" : "reconciliation_attempt",
    arcScope: input.mode === "scene_mode" ? "local_social" : "dyadic",
    anchorEntities: [{ anchorKind: "character", anchorId: input.seamId }],
    createdAtIso: observedAtIso,
    sourcePlane: input.channel === "canonical_dyad" ? "canonical_truth" : "reader_interaction_memory",
    targetPlane: "character_bounded_knowledge",
  });
  const updatedArc = applyNarrativeArcUpdate({
    arc,
    observedAtIso,
    sourcePlane: input.channel === "canonical_dyad" ? "canonical_truth" : "reader_interaction_memory",
    targetPlane: "character_bounded_knowledge",
    evidence: {
      observedEvents: input.relationshipSignalCodes.length,
      activeConsequences: 0,
      relationshipShift: clamp0to100(
        100 - (input.emotionalContinuity?.pressureState.guardednessPressure ?? relationshipPressure)
      ),
      memoryActivationPressure: input.relationshipSignalCodes.length > 0 ? 55 : 0,
      temporalPressure: input.temporalEvolution?.applied ? 56 : 0,
      worldStatePressure: input.temporalEvolution?.repeatedPressureFactors.conflict ?? 40,
      storylineMomentum: clamp0to100(45 + input.relationshipSignalCodes.length * 8),
    },
  }).updatedArc;

  const chapterState = createChapterMovementProgressionState({
    chapterId: `chapter:${input.seamId}`,
    movementId: `movement:${input.seamId}`,
    orderIndex: 1,
    chapterFunction: "deepening",
    entryConditions: { minActiveArcs: 1, maxHighSeverityConsequences: 2 },
    completionConditions: { minProgressedArcs: 1, minResolvedArcs: 0, maxUnresolvedQuestions: 3 },
    createdAtIso: observedAtIso,
    sourcePlane: input.channel === "canonical_dyad" ? "canonical_truth" : "reader_interaction_memory",
    targetPlane: "character_bounded_knowledge",
  });
  const chapterEval = evaluateChapterMovementProgression({
    state: chapterState,
    evaluatedAtIso: observedAtIso,
    sourcePlane: input.channel === "canonical_dyad" ? "canonical_truth" : "reader_interaction_memory",
    targetPlane: "character_bounded_knowledge",
    progressionInput: {
      activeArcs: [{ arcId: updatedArc.arcId, lifecycleState: updatedArc.lifecycleState }],
      consequences: [],
      relationshipThresholds: {
        ruptureRiskHigh: (input.emotionalContinuity?.pressureState.volatilityPressure ?? 0) >= 65,
        trustFloorBreached: (input.emotionalContinuity?.pressureState.guardednessPressure ?? 0) >= 70,
        reconciliationOpen: (input.emotionalContinuity?.pressureState.opennessPressure ?? 0) >= 45,
      },
      unresolvedQuestions: input.relationshipSignalCodes.slice(0, 2),
      priorState: null,
    },
  });

  const pressureOutput = evaluateNarrativePressure({
    evaluatedAtIso: observedAtIso,
    sourcePlane: input.channel === "canonical_dyad" ? "canonical_truth" : "reader_interaction_memory",
    targetPlane: "character_bounded_knowledge",
    pressureInput: {
      activeArcs: [
        {
          arcId: updatedArc.arcId,
          arcType: updatedArc.arcType,
          lifecycleState: updatedArc.lifecycleState,
          tensionLevel: updatedArc.tensionLevel,
        },
      ],
      chapterFunction: chapterEval.updatedState.chapterFunction,
      unresolvedConsequences: [],
      worldStatePressure: input.temporalEvolution?.repeatedPressureFactors.conflict ?? relationshipPressure,
      shapingDefaults: {},
    },
  });

  const branchState = createBranchGovernanceState({
    branchId: `branch:${input.seamId}`,
    parentBranchId: null,
    lineagePath: [`branch:${input.seamId}`],
    branchType:
      input.mode === "scene_mode" ? "scene_divergence" : "reader_influenced_interaction_branch",
    divergenceCause:
      input.mode === "scene_mode" ? "arc_conflict" : "reader_interaction_variation",
    divergenceDepth: 0,
    activeArcDifferences: [],
    createdAtIso: observedAtIso,
    sourcePlane: input.channel === "canonical_dyad" ? "canonical_truth" : "reader_interaction_memory",
    targetPlane: "character_bounded_knowledge",
  });
  const branchEval = evaluateBranchGovernance({
    state: branchState,
    governanceInput: {
      existingSiblingBranchCount: 0,
      unresolvedArcPrerequisites: [],
    },
    evaluatedAtIso: observedAtIso,
    sourcePlane: input.channel === "canonical_dyad" ? "canonical_truth" : "reader_interaction_memory",
    targetPlane: "character_bounded_knowledge",
  });

  return {
    arcStates: [updatedArc],
    chapterProgressionState: chapterEval.updatedState,
    chapterProgressionOutput: chapterEval.outputSurface,
    narrativePressureOutput: pressureOutput,
    branchGovernanceState: branchEval.updatedState,
    branchGovernanceOutput: branchEval.outputSurface,
    currentNarrativeQuestions: input.relationshipSignalCodes.slice(0, 4),
  };
}
