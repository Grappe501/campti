import type { StorylineGuidanceBundle } from "@/lib/domain/storyline-guidance-bundle";

export type StorylineExplainabilitySummary = {
  arcState: {
    lifecycleState: string;
    tensionLevel: number;
    intensityLevel: number;
    explanationSummaryCode: string;
    explanationReasonCodes: string[];
  };
  chapterProgression: {
    chapterFunction: string;
    progressionState: string;
    readinessScore: number;
    transitionBlockers: string[];
    explanationSummaryCode: string;
    explanationReasonCodes: string[];
  };
  narrativePressure: {
    activePressureCount: number;
    topPressureCategories: string[];
    blockedCategoryCodes: string[];
    reinforcedCategoryCodes: string[];
    explanationReasonCodes: string[];
  };
  branchGovernance: {
    legitimacyStatus: string;
    riskRating: string;
    reconvergenceRecommendation: string;
    arcCompatibilityWarnings: string[];
    manageabilityWarnings: string[];
    explanationSummaryCode: string;
    explanationReasonCodes: string[];
  };
  storylineGuidance: {
    allowedSceneTendencies: string[];
    discouragedSceneTendencies: string[];
    tensionEmphasisWeights: Array<{
      pressureCategory: string;
      weight: number;
    }>;
    reasonCodes: string[];
  };
  compactBundle: StorylineGuidanceBundle;
};
