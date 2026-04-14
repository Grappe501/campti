"use server";

import type {
  BookCoherenceReport,
  MovementCoherenceReport,
} from "@/lib/domain/book-coherence";
import {
  buildBookCoherenceReport,
  buildBookRefinementPlan,
  buildMovementCoherenceReportForBookSegments,
  buildMovementCoherenceReportForEpic,
  executeBookRefinement,
  type BookRefinementExecutionResult,
  type ExecuteBookRefinementOptions,
} from "@/lib/services/book-coherence-refinement-service";
import { buildBookObserverSnapshot } from "@/lib/services/world-observer-service";

export async function actionBuildBookCoherenceReport(bookId: string): Promise<BookCoherenceReport> {
  return buildBookCoherenceReport(bookId);
}

export async function actionBuildBookRefinementPlan(bookId: string) {
  const report = await buildBookCoherenceReport(bookId);
  return buildBookRefinementPlan(report);
}

export async function actionBuildMovementCoherenceReportForEpic(epicId: string): Promise<MovementCoherenceReport> {
  return buildMovementCoherenceReportForEpic(epicId);
}

export async function actionBuildMovementCoherenceReportForBookSegments(
  bookId: string,
  segmentCount: number
): Promise<MovementCoherenceReport> {
  return buildMovementCoherenceReportForBookSegments(bookId, segmentCount);
}

export async function actionExecuteBookRefinement(
  bookId: string,
  options?: ExecuteBookRefinementOptions
): Promise<BookRefinementExecutionResult> {
  return executeBookRefinement(bookId, options);
}

export async function actionBuildBookObserverSnapshot(bookId: string) {
  return buildBookObserverSnapshot(bookId);
}
