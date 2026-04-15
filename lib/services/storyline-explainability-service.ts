import type { ConversationEmotionalContinuity } from "@/lib/domain/conversation-emotional-continuity";
import type { StorylineExplainabilitySummary } from "@/lib/domain/storyline-explainability";
import type { TemporalEvolutionSummary } from "@/lib/domain/temporal-evolution";
import {
  assembleStorylineGuidanceBundle,
  buildStorylineOrchestrationInputsFromSeamContext,
} from "@/lib/services/storyline-orchestrator-integration-service";

export function buildStorylineExplainabilitySummary(input: {
  mode: "scene_mode" | "interaction_mode";
  channel: "canonical_dyad" | "reader_bond_dyad";
  seamId: string;
  relationshipSignalCodes: string[];
  emotionalContinuity?: ConversationEmotionalContinuity | null;
  temporalEvolution?: TemporalEvolutionSummary | null;
}): StorylineExplainabilitySummary {
  const orchestration = buildStorylineOrchestrationInputsFromSeamContext({
    mode: input.mode,
    channel: input.channel,
    seamId: input.seamId,
    relationshipSignalCodes:
      input.relationshipSignalCodes.length > 0 ? input.relationshipSignalCodes : [`seam:${input.seamId}:baseline`],
    emotionalContinuity: input.emotionalContinuity ?? null,
    temporalEvolution: input.temporalEvolution ?? null,
  });
  const compactBundle = assembleStorylineGuidanceBundle({
    mode: input.mode,
    channel: input.channel,
    orchestration,
  });
  const topPressures = [...orchestration.narrativePressureOutput.activePressures]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 4);

  return {
    arcState: {
      lifecycleState: orchestration.arcStates[0]?.lifecycleState ?? "dormant",
      tensionLevel: orchestration.arcStates[0]?.tensionLevel ?? 0,
      intensityLevel: orchestration.arcStates[0]?.intensityLevel ?? 0,
      explanationSummaryCode: orchestration.arcStates[0]?.lastExplanation.summaryCode ?? "arc_unknown",
      explanationReasonCodes: (orchestration.arcStates[0]?.lastExplanation.reasonCodes ?? []).slice(0, 6),
    },
    chapterProgression: {
      chapterFunction: orchestration.chapterProgressionState.chapterFunction,
      progressionState: orchestration.chapterProgressionState.progressionState,
      readinessScore: orchestration.chapterProgressionOutput.progressionReadiness.score,
      transitionBlockers: orchestration.chapterProgressionOutput.transitionBlockers.slice(0, 6),
      explanationSummaryCode: orchestration.chapterProgressionState.explanation.summaryCode,
      explanationReasonCodes: orchestration.chapterProgressionState.explanation.reasonCodes.slice(0, 6),
    },
    narrativePressure: {
      activePressureCount: orchestration.narrativePressureOutput.activePressures.length,
      topPressureCategories: topPressures.map((pressure) => pressure.category),
      blockedCategoryCodes: orchestration.narrativePressureOutput.categoryIntensitySummary
        .filter((entry) => entry.blocked)
        .map((entry) => entry.category)
        .slice(0, 6),
      reinforcedCategoryCodes: orchestration.narrativePressureOutput.categoryIntensitySummary
        .filter((entry) => entry.reinforced)
        .map((entry) => entry.category)
        .slice(0, 6),
      explanationReasonCodes: topPressures.flatMap((pressure) => pressure.explanation.reasonCodes).slice(0, 8),
    },
    branchGovernance: {
      legitimacyStatus: orchestration.branchGovernanceState.legitimacyStatus,
      riskRating: orchestration.branchGovernanceState.branchRiskRating,
      reconvergenceRecommendation: orchestration.branchGovernanceState.reconvergenceRecommendation,
      arcCompatibilityWarnings: orchestration.branchGovernanceState.arcCompatibilityWarnings.slice(0, 6),
      manageabilityWarnings: orchestration.branchGovernanceState.manageabilityWarnings.slice(0, 6),
      explanationSummaryCode: orchestration.branchGovernanceState.explanation.summaryCode,
      explanationReasonCodes: orchestration.branchGovernanceState.explanation.reasonCodes.slice(0, 6),
    },
    storylineGuidance: {
      allowedSceneTendencies: compactBundle.sceneTendencyGuidance.allowedSceneTendencies.slice(0, 6),
      discouragedSceneTendencies: compactBundle.sceneTendencyGuidance.discouragedSceneTendencies.slice(0, 6),
      tensionEmphasisWeights: compactBundle.tensionEmphasisWeights.slice(0, 4),
      reasonCodes: compactBundle.explainability.reasonCodes.slice(0, 8),
    },
    compactBundle,
  };
}
