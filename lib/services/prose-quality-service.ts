import type { Prisma } from "@prisma/client";

import {
  analyzeProseDeterministic,
  type AnalyzeProseContext,
  type ProseQualityReportV1,
} from "@/lib/prose-quality";
import {
  ProseQualityAnalysisScopeValues,
  type ProseQualityAnalysisScopeValue,
} from "@/lib/prisma-enums/prose-quality-scope";
import { prisma } from "@/lib/prisma";

const KIND = "deterministic_v1" as const;

export type RunProseQualityAnalysisParams = {
  analysisScope?: ProseQualityAnalysisScopeValue;
  /** Required when scope = SCENE */
  sceneId?: string | null;
  /** Required when scope = CHAPTER_ASSEMBLY */
  chapterId?: string | null;
  prose: string;
  sceneDraftVersionId?: string | null;
  context?: AnalyzeProseContext;
  narrativeVoiceProfileId?: string | null;
  characterVoicePersonId?: string | null;
  persist?: boolean;
  /** Serialized narrative + QA inputs for reproducibility */
  analyzerContextSnapshot?: Prisma.InputJsonValue;
};

function assertScopePayload(p: RunProseQualityAnalysisParams) {
  const scope = p.analysisScope ?? ProseQualityAnalysisScopeValues.SCENE;
  if (scope === ProseQualityAnalysisScopeValues.SCENE) {
    if (!p.sceneId?.trim()) {
      throw new Error("sceneId is required when analysisScope is SCENE");
    }
  } else {
    if (!p.chapterId?.trim()) {
      throw new Error("chapterId is required when analysisScope is CHAPTER_ASSEMBLY");
    }
  }
}

export async function runProseQualityAnalysis(
  params: RunProseQualityAnalysisParams
): Promise<ProseQualityReportV1> {
  assertScopePayload(params);
  const scope = params.analysisScope ?? ProseQualityAnalysisScopeValues.SCENE;
  const report = analyzeProseDeterministic(params.prose, params.context ?? {});

  if (params.persist) {
    await prisma.proseQualityReport.create({
      data: {
        analysisScope: scope,
        sceneId:
          scope === ProseQualityAnalysisScopeValues.SCENE
            ? params.sceneId!
            : undefined,
        chapterId:
          scope === ProseQualityAnalysisScopeValues.CHAPTER_ASSEMBLY
            ? params.chapterId!
            : undefined,
        sceneDraftVersionId: params.sceneDraftVersionId ?? undefined,
        analyzerKind: KIND,
        proseSha256: report.proseStats.sha256,
        reportJson: report as unknown as Prisma.InputJsonValue,
        narrativeVoiceProfileId: params.narrativeVoiceProfileId ?? undefined,
        characterVoicePersonId: params.characterVoicePersonId ?? undefined,
        authorGoalsSnapshot: params.context?.authorGoals
          ? (params.context.authorGoals as Prisma.InputJsonValue)
          : undefined,
        analyzerContextSnapshot: params.analyzerContextSnapshot ?? undefined,
      } as unknown as Prisma.ProseQualityReportUncheckedCreateInput,
    });
  }

  return report;
}

export async function listProseQualityReportsForScene(sceneId: string, take = 20) {
  return prisma.proseQualityReport.findMany({
    where: {
      sceneId,
      analysisScope: ProseQualityAnalysisScopeValues.SCENE,
    } as Prisma.ProseQualityReportWhereInput,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function listProseQualityReportsForChapter(
  chapterId: string,
  take = 20
) {
  return prisma.proseQualityReport.findMany({
    where: {
      chapterId,
      analysisScope: ProseQualityAnalysisScopeValues.CHAPTER_ASSEMBLY,
    } as Prisma.ProseQualityReportWhereInput,
    orderBy: { createdAt: "desc" },
    take,
  });
}
