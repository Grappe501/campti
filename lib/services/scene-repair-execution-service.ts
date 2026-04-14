import { NarrativeAssemblyStatus, NarrativeDependencyConsumerKind } from "@prisma/client";

import type { SceneRepairPlan } from "@/lib/domain/scene-repair";
import { prisma } from "@/lib/prisma";
import { analyzeProseDeterministic, type ProseQualityReportV1 } from "@/lib/prose-quality";
import { listProseQualityReportsForScene } from "@/lib/services/prose-quality-service";
import { assembleChapterReaderText } from "@/lib/services/chapter-assembly-service";
import {
  generateSceneDraft,
  repairSceneContinuity,
  rewriteSceneDraft,
  type RunSceneGenerationParams,
} from "@/lib/services/scene-generation-service";
import type {
  SceneRepairClassificationContext,
  SceneRepairPlanHints,
} from "@/lib/services/scene-repair-planning-service";
import { buildSceneRepairPlan } from "@/lib/services/scene-repair-planning-service";

export type SceneRepairExecutionResult = {
  plan: SceneRepairPlan;
  outcome: "skipped" | "chapter_reassembled" | "scene_generation_ran" | "no_op";
  jobSummary?: {
    savedGenerationText: boolean;
    proseQualityRun: boolean;
    sceneAssemblyMarkedCurrent: boolean;
  };
  chapterAssembly?: Awaited<ReturnType<typeof assembleChapterReaderText>>;
  postRepairProseQuality?: ReturnType<typeof analyzeProseDeterministic>;
};

async function loadClassificationContext(
  sceneId: string,
  hints?: SceneRepairPlanHints
): Promise<SceneRepairClassificationContext> {
  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    select: {
      id: true,
      chapterId: true,
      narrativeAssemblyStatus: true,
      continuityState: true,
      generationText: true,
      authoringText: true,
    },
  });
  const chapter = await prisma.chapter.findUnique({
    where: { id: scene.chapterId },
    select: { id: true, narrativeAssemblyStatus: true },
  });
  const edges = await prisma.narrativeDependencyEdge.findMany({
    where: { consumerKind: NarrativeDependencyConsumerKind.SCENE, consumerId: sceneId },
    select: { producerKind: true },
    take: 200,
  });

  let mergedHints: SceneRepairPlanHints = { ...(hints ?? {}) };
  if (mergedHints.proseQuality == null) {
    const reports = await listProseQualityReportsForScene(sceneId, 1);
    const r = reports[0]?.reportJson as ProseQualityReportV1 | null;
    if (r?.issues) {
      const critical = r.issues.filter((i) => i.severity === "critical").length;
      const warning = r.issues.filter((i) => i.severity === "warning").length;
      mergedHints = {
        ...mergedHints,
        proseQuality: { criticalIssueCount: critical, warningIssueCount: warning },
      };
    }
  }

  return {
    scene,
    chapter,
    dependencyEdges: edges,
    hints: mergedHints,
  };
}

export async function planSceneRepair(
  sceneId: string,
  hints?: SceneRepairPlanHints
): Promise<SceneRepairPlan> {
  const ctx = await loadClassificationContext(sceneId, hints);
  return buildSceneRepairPlan(ctx);
}

export type ExecuteSceneRepairOptions = {
  /** Merged into planner (prose QA from DB used when omitted). */
  hints?: SceneRepairPlanHints;
  /** When false, does not persist `generationText` (dry run). Default true. */
  saveGenerationText?: boolean;
  runProseQuality?: boolean;
  /** Extra deterministic pass after generation (redundant if `runProseQuality` already ran). Default false. */
  postRepairProseQa?: boolean;
  registerDependencies?: boolean;
  runSocialPressureAdvisory?: boolean;
} & Pick<RunSceneGenerationParams, "proseQaContext" | "loaderOptions">;

/**
 * Runs the planned repair path. Never writes `authoringText` or `publishedReaderText`.
 */
export async function executeSceneRepair(
  sceneId: string,
  options: ExecuteSceneRepairOptions = {}
): Promise<SceneRepairExecutionResult> {
  const plan = await planSceneRepair(sceneId, options.hints);
  const saveGenerationText = options.saveGenerationText !== false;

  if (plan.repairMode === "NO_AUTOMATIC_REPAIR") {
    return { plan, outcome: "no_op" };
  }

  if (plan.repairMode === "REASSEMBLE_CHAPTER_ONLY") {
    if (!plan.chapterId) {
      return { plan, outcome: "skipped" };
    }
    const chapterAssembly = await assembleChapterReaderText({
      chapterId: plan.chapterId,
      persist: saveGenerationText,
      purpose: "reader_publish",
    });
    return { plan, outcome: "chapter_reassembled", chapterAssembly };
  }

  const base: RunSceneGenerationParams = {
    sceneId,
    saveGenerationText,
    runProseQuality: options.runProseQuality ?? true,
    registerDependencies: options.registerDependencies ?? true,
    runSocialPressureAdvisory: options.runSocialPressureAdvisory ?? true,
    proseQaContext: options.proseQaContext,
    loaderOptions: options.loaderOptions,
  };

  let run: Awaited<ReturnType<typeof generateSceneDraft>>;
  if (plan.repairMode === "REGENERATE_DRAFT") {
    run = await generateSceneDraft(sceneId, base);
  } else if (plan.repairMode === "REWRITE_EXISTING_DRAFT") {
    run = await rewriteSceneDraft(sceneId, base);
  } else if (plan.repairMode === "REPAIR_CONTINUITY") {
    run = await repairSceneContinuity(sceneId, base);
  } else {
    return { plan, outcome: "skipped" };
  }

  if (saveGenerationText && run.savedGenerationText) {
    await prisma.scene.update({
      where: { id: sceneId },
      data: {
        narrativeAssemblyStatus: NarrativeAssemblyStatus.CURRENT,
        assemblyInvalidatedAt: null,
      },
    });
  }

  const postRepairProseQuality = await maybeRunPostRepairQualityChecks(sceneId, run.output.generatedText, {
    run: options.postRepairProseQa === true,
    proseQaContext: options.proseQaContext,
  });

  return {
    plan,
    outcome: "scene_generation_ran",
    jobSummary: {
      savedGenerationText: run.savedGenerationText,
      proseQualityRun: Boolean(run.proseQuality),
      sceneAssemblyMarkedCurrent: saveGenerationText && run.savedGenerationText,
    },
    postRepairProseQuality: postRepairProseQuality ?? undefined,
  };
}

export async function executeChapterReassembly(
  chapterId: string,
  options: { persist?: boolean; purpose?: "author_draft" | "reader_publish" } = {}
): Promise<Awaited<ReturnType<typeof assembleChapterReaderText>>> {
  const persist = options.persist !== false;
  return assembleChapterReaderText({
    chapterId,
    persist,
    purpose: options.purpose ?? "reader_publish",
  });
}

export async function maybeRunPostRepairQualityChecks(
  sceneId: string,
  generatedText: string,
  opts: {
    run: boolean;
    proseQaContext?: RunSceneGenerationParams["proseQaContext"];
  }
): Promise<ReturnType<typeof analyzeProseDeterministic> | null> {
  if (!opts.run || !generatedText.trim()) return null;
  return analyzeProseDeterministic(generatedText, opts.proseQaContext ?? {});
}
