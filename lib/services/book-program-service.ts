import {
  BOOK_PROGRAM_CONTRACT_VERSION,
  type BookProgram,
  type BookProductionState,
  type ChapterProgram,
} from "@/lib/domain/book-program";

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeChapterQueue(chapters: ChapterProgram[]): ChapterProgram[] {
  return [...chapters].sort((a, b) => a.orderIndex - b.orderIndex);
}

function deriveProductionState(input: {
  requestedState?: BookProductionState;
  completionCriteria: BookProgram["completionCriteria"];
  unresolvedDependencies: string[];
}): BookProductionState {
  if (input.requestedState === "certified") {
    const allComplete = input.completionCriteria.every((criterion) => criterion.satisfied);
    if (!allComplete || input.unresolvedDependencies.length > 0) {
      throw new Error("[book-program] cannot certify with unresolved dependencies or unmet completion criteria.");
    }
  }
  return input.requestedState ?? "planning";
}

export function createBookProgram(input: {
  bookId: string;
  activeArcIds: string[];
  chapterQueue: ChapterProgram[];
  movementMap: Record<string, string[]>;
  unresolvedDependencies: string[];
  completionCriteria: BookProgram["completionCriteria"];
  lineage: BookProgram["lineage"];
  productionState?: BookProductionState;
}): BookProgram {
  const bookId = input.bookId.trim();
  if (!bookId) throw new Error("[book-program] bookId is required.");

  const chapterQueue = normalizeChapterQueue(input.chapterQueue);
  if (chapterQueue.length === 0) {
    throw new Error("[book-program] chapterQueue must include at least one chapter.");
  }
  for (const chapter of chapterQueue) {
    if (!chapter.chapterId.trim()) {
      throw new Error("[book-program] chapterId is required for all chapter programs.");
    }
  }

  const unresolvedDependencies = uniqueNonEmpty(input.unresolvedDependencies);
  const completionCriteria = input.completionCriteria.map((criterion) => ({
    ...criterion,
    criterionId: criterion.criterionId.trim(),
    description: criterion.description.trim(),
  }));
  if (completionCriteria.length === 0) {
    throw new Error("[book-program] completionCriteria must be provided.");
  }

  const productionState = deriveProductionState({
    requestedState: input.productionState,
    completionCriteria,
    unresolvedDependencies,
  });

  return {
    contractVersion: BOOK_PROGRAM_CONTRACT_VERSION,
    bookId,
    activeArcIds: uniqueNonEmpty(input.activeArcIds),
    chapterQueue,
    movementMap: input.movementMap,
    productionState,
    unresolvedDependencies,
    completionCriteria,
    lineage: input.lineage,
  };
}

export function evaluateBookProgramTraceability(program: BookProgram): {
  traceabilityOk: boolean;
  missingTraceability: string[];
} {
  const missingTraceability: string[] = [];
  if (program.activeArcIds.length === 0) missingTraceability.push("missing_emergence_arc_references");
  if (Object.keys(program.movementMap).length === 0) missingTraceability.push("missing_storyline_movement_map");
  if (!program.lineage.sourceRunId.trim()) missingTraceability.push("missing_lineage_source_run");
  if (program.chapterQueue.some((chapter) => chapter.requiredArcStates.length === 0)) {
    missingTraceability.push("chapter_missing_required_arc_states");
  }
  if (program.unresolvedDependencies.length > 0) {
    missingTraceability.push("unresolved_dependencies_present");
  }
  return {
    traceabilityOk: missingTraceability.length === 0,
    missingTraceability,
  };
}
