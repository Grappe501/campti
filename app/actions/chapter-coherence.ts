"use server";

import type { ChapterCoherenceReport } from "@/lib/domain/chapter-coherence";
import { buildChapterObserverSnapshot } from "@/lib/services/world-observer-service";
import {
  buildChapterCoherenceReport,
  buildChapterRefinementPlan,
  executeChapterRefinement,
  type BuildChapterRefinementPlanOptions,
  type ChapterRefinementExecutionResult,
  type ExecuteChapterRefinementOptions,
} from "@/lib/services/chapter-coherence-refinement-service";

export async function actionBuildChapterCoherenceReport(chapterId: string): Promise<ChapterCoherenceReport> {
  return buildChapterCoherenceReport(chapterId);
}

export async function actionBuildChapterRefinementPlan(
  chapterId: string,
  options?: BuildChapterRefinementPlanOptions
) {
  return buildChapterRefinementPlan(chapterId, options);
}

export async function actionExecuteChapterRefinement(
  chapterId: string,
  options?: ExecuteChapterRefinementOptions
): Promise<ChapterRefinementExecutionResult> {
  return executeChapterRefinement(chapterId, options);
}

export async function actionBuildChapterObserverSnapshot(chapterId: string) {
  return buildChapterObserverSnapshot(chapterId);
}
