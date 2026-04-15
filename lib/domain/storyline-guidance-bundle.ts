import type {
  ChapterMovementProgressionOutputSurface,
  ChapterMovementProgressionState,
} from "@/lib/domain/chapter-movement-progression";
import type {
  BranchGovernanceOutputSurface,
  BranchGovernanceState,
} from "@/lib/domain/branch-governance";
import type { NarrativeArcState } from "@/lib/domain/narrative-arc";
import type { NarrativePressureOutputSurface } from "@/lib/domain/narrative-pressure";

export const STORYLINE_GUIDANCE_BUNDLE_CONTRACT_VERSION = "1" as const;

export type StorylineMode = "scene_mode" | "interaction_mode";
export type StorylineChannel = "canonical_dyad" | "reader_bond_dyad";

export type StorylineOrchestrationInputs = {
  arcStates: NarrativeArcState[];
  chapterProgressionState: ChapterMovementProgressionState;
  chapterProgressionOutput: ChapterMovementProgressionOutputSurface;
  narrativePressureOutput: NarrativePressureOutputSurface;
  branchGovernanceState: BranchGovernanceState;
  branchGovernanceOutput: BranchGovernanceOutputSurface;
  currentNarrativeQuestions?: string[];
};

export type StorylineGuidanceBundle = {
  contractVersion: typeof STORYLINE_GUIDANCE_BUNDLE_CONTRACT_VERSION;
  mode: StorylineMode;
  channel: StorylineChannel;
  activeArcPriorities: Array<{
    arcId: string;
    arcType: string;
    lifecycleState: string;
    priorityWeight: number;
  }>;
  chapterProgressionSummary: {
    chapterFunction: string;
    progressionState: string;
    readinessScore: number;
    unresolvedCarryoverCount: number;
  };
  currentNarrativeQuestions: string[];
  sceneTendencyGuidance: {
    allowedSceneTendencies: string[];
    discouragedSceneTendencies: string[];
  };
  branchConstraints: {
    legalityStatus: string;
    canonicalityStatus: string;
    depthStatus: string;
    reconvergenceRecommendation: string;
    divergenceWarnings: string[];
  };
  tensionEmphasisWeights: Array<{
    pressureCategory: string;
    weight: number;
  }>;
  explainability: {
    reasonCodes: string[];
    subsystemSummaries: string[];
  };
  debugExplanation?: {
    activeSubsystems: string[];
    boundedCapsApplied: string[];
  };
};
