"use server";

import {
  analyzeProseQualityByChapterId,
  analyzeProseQualityBySceneId,
} from "@/lib/services/narrative-prose-quality-service";
import {
  assembleChapterReaderText,
  rollupChapterStaleFromScenes,
  type ChapterAssemblyPurpose,
} from "@/lib/services/chapter-assembly-service";
import type { AnalyzeProseContext } from "@/lib/prose-quality";
import {
  listProseQualityReportsForChapter,
  listProseQualityReportsForScene,
} from "@/lib/services/prose-quality-service";

export async function actionAnalyzeProseBySceneId(params: {
  sceneId: string;
  context?: AnalyzeProseContext;
  persist?: boolean;
}) {
  return analyzeProseQualityBySceneId(params);
}

export async function actionAnalyzeProseByChapterId(params: {
  chapterId: string;
  purpose?: ChapterAssemblyPurpose;
  context?: AnalyzeProseContext;
  persist?: boolean;
}) {
  return analyzeProseQualityByChapterId(params);
}

export async function actionAssembleChapter(params: {
  chapterId: string;
  persist?: boolean;
  purpose?: ChapterAssemblyPurpose;
}) {
  return assembleChapterReaderText(params);
}

export async function actionRollupChapterStale(chapterId: string) {
  return rollupChapterStaleFromScenes(chapterId);
}

export async function actionListSceneProseReports(sceneId: string) {
  return listProseQualityReportsForScene(sceneId);
}

export async function actionListChapterProseReports(chapterId: string) {
  return listProseQualityReportsForChapter(chapterId);
}
