export const CHAPTER_ASSEMBLY_CONTRACT_VERSION = "1" as const;

export type ChapterEntryCondition = {
  conditionId: string;
  satisfied: boolean;
};

export type ChapterCompletionCondition = {
  conditionId: string;
  satisfied: boolean;
};

export type TransitionBurden = {
  burdenId: string;
  sourceChapterId: string | null;
  targetChapterId: string;
  mustResolveNow: string[];
  mustCarryForward: string[];
  unresolvedCarryover: string[];
};

export type ChapterAssemblyState = {
  contractVersion: typeof CHAPTER_ASSEMBLY_CONTRACT_VERSION;
  chapterId: string;
  entryConditions: ChapterEntryCondition[];
  completionConditions: ChapterCompletionCondition[];
  dependencies: string[];
  transitionBurden: TransitionBurden;
  structuralReadiness: "blocked" | "ready";
  complete: boolean;
  justificationCodes: string[];
};

export type ChapterAssemblyOutputSurface = {
  chapterId: string;
  entryStatus: "blocked" | "ready";
  completionStatus: "incomplete" | "complete";
  unresolvedDependencies: string[];
  unresolvedCarryover: string[];
  transitionBurdenSummary: {
    mustResolveNowCount: number;
    mustCarryForwardCount: number;
  };
};
