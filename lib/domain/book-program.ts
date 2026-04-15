export const BOOK_PROGRAM_CONTRACT_VERSION = "1" as const;

export const BOOK_PRODUCTION_STATES = ["planning", "drafting", "revision", "certified"] as const;
export type BookProductionState = (typeof BOOK_PRODUCTION_STATES)[number];

export type ChapterStructuralReadiness = "not_ready" | "conditionally_ready" | "ready";
export type ChapterDraftStatus = "not_started" | "in_progress" | "submitted" | "approved";

export type BookProgramLineageMetadata = {
  createdFromPhase: string;
  sourceRunId: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type BookCompletionCriterion = {
  criterionId: string;
  description: string;
  satisfied: boolean;
};

export type ChapterProgram = {
  chapterId: string;
  orderIndex: number;
  targetFunction: string;
  requiredArcStates: Array<{
    arcId: string;
    requiredLifecycleState: string;
  }>;
  structuralReadiness: ChapterStructuralReadiness;
  draftStatus: ChapterDraftStatus;
  revisionHistoryPointer: string | null;
};

export type BookProgram = {
  contractVersion: typeof BOOK_PROGRAM_CONTRACT_VERSION;
  bookId: string;
  activeArcIds: string[];
  chapterQueue: ChapterProgram[];
  movementMap: Record<string, string[]>;
  productionState: BookProductionState;
  unresolvedDependencies: string[];
  completionCriteria: BookCompletionCriterion[];
  lineage: BookProgramLineageMetadata;
};
