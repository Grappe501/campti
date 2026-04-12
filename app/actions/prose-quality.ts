"use server";

import type { AnalyzeProseContext } from "@/lib/prose-quality";
import {
  compareProseDrafts,
  suggestionsFromGoalsAndReport,
} from "@/lib/prose-quality";
import {
  listProseQualityReportsForScene,
  runProseQualityAnalysis,
} from "@/lib/services/prose-quality-service";
import { ProseQualityAnalysisScopeValues } from "@/lib/prisma-enums/prose-quality-scope";

export async function actionAnalyzeSceneProse(params: {
  sceneId: string;
  prose: string;
  sceneDraftVersionId?: string | null;
  context?: AnalyzeProseContext;
  narrativeVoiceProfileId?: string | null;
  characterVoicePersonId?: string | null;
  persist?: boolean;
}) {
  const report = await runProseQualityAnalysis({
    analysisScope: ProseQualityAnalysisScopeValues.SCENE,
    sceneId: params.sceneId,
    prose: params.prose,
    sceneDraftVersionId: params.sceneDraftVersionId,
    context: params.context,
    narrativeVoiceProfileId: params.narrativeVoiceProfileId,
    characterVoicePersonId: params.characterVoicePersonId,
    persist: params.persist ?? false,
  });
  const suggestions = suggestionsFromGoalsAndReport(
    params.context?.authorGoals,
    report,
    params.prose
  );
  return { report, suggestions };
}

export async function actionCompareSceneDrafts(params: {
  left: string;
  right: string;
  leftLabel: string;
  rightLabel: string;
}) {
  return compareProseDrafts(
    params.left,
    params.right,
    params.leftLabel,
    params.rightLabel
  );
}

export async function actionListProseQualityReports(sceneId: string) {
  return listProseQualityReportsForScene(sceneId);
}
