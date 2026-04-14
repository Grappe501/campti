import { NarrativeAssemblyStatus } from "@prisma/client";

import { buildChapterCoherenceReportFromScenes } from "@/lib/chapter-coherence/chapter-coherence-deterministic";
import type { ChapterSceneAnalysisRow } from "@/lib/chapter-coherence/chapter-coherence-deterministic";
import {
  explainChapterCoherenceWithModel,
  suggestChapterSummaryRewriteWithModel,
} from "@/lib/chapter-coherence/chapter-refinement-llm-adapter";
import type {
  ChapterCoherenceReport,
  ChapterRefinementGuidanceV1,
  ChapterRefinementMode,
  ChapterRefinementPlan,
} from "@/lib/domain/chapter-coherence";
import { prisma } from "@/lib/prisma";
import { assembleChapterReaderText } from "@/lib/services/chapter-assembly-service";
import { resolveSceneReaderText } from "@/lib/services/scene-reader-text";

export type BuildChapterRefinementPlanOptions = {
  /** When true, plan may recommend LLM guidance even if score is moderate. */
  preferGuidance?: boolean;
};

export type ExecuteChapterRefinementOptions = {
  /** Defaults to plan from `buildChapterRefinementPlan`. */
  mode?: ChapterRefinementMode;
  /** Run OpenAI calls when applicable. Default false (observation-only). */
  runLlm?: boolean;
  /** Persist assembly / metadata / generated summary when allowed. Default false. */
  persist?: boolean;
};

export type ChapterRefinementExecutionResult = {
  plan: ChapterRefinementPlan;
  report: ChapterCoherenceReport;
  guidance: ChapterRefinementGuidanceV1 | null;
  assembled: Awaited<ReturnType<typeof assembleChapterReaderText>> | null;
  summaryRewriteApplied: boolean;
  metadataUpdated: boolean;
  notes: string[];
};

async function loadChapterScenesForAnalysis(chapterId: string): Promise<{
  chapter: {
    id: string;
    bookId: string;
    title: string;
    narrativeAssemblyStatus: NarrativeAssemblyStatus;
    generatedSummary: string | null;
    humanEditedSummary: string | null;
    generationMetadataJson: unknown;
  };
  rows: ChapterSceneAnalysisRow[];
}> {
  const chapter = await prisma.chapter.findUniqueOrThrow({
    where: { id: chapterId },
    select: {
      id: true,
      bookId: true,
      title: true,
      narrativeAssemblyStatus: true,
      generatedSummary: true,
      humanEditedSummary: true,
      generationMetadataJson: true,
      scenes: {
        orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
        select: {
          id: true,
          orderInChapter: true,
          sceneNumber: true,
          description: true,
          summary: true,
          narrativeIntent: true,
          emotionalTone: true,
          pov: true,
          continuityState: true,
          narrativeAssemblyStatus: true,
          publishedReaderText: true,
          authoringText: true,
          generationText: true,
          draftText: true,
        },
      },
    },
  });

  const rows: ChapterSceneAnalysisRow[] = chapter.scenes.map((s) => ({
    id: s.id,
    orderInChapter: s.orderInChapter,
    sceneNumber: s.sceneNumber,
    description: s.description,
    summary: s.summary,
    narrativeIntent: s.narrativeIntent,
    emotionalTone: s.emotionalTone,
    pov: s.pov,
    continuityState: s.continuityState,
    narrativeAssemblyStatus: s.narrativeAssemblyStatus,
    readerText: resolveSceneReaderText(s),
  }));

  return {
    chapter: {
      id: chapter.id,
      bookId: chapter.bookId,
      title: chapter.title,
      narrativeAssemblyStatus: chapter.narrativeAssemblyStatus,
      generatedSummary: chapter.generatedSummary,
      humanEditedSummary: chapter.humanEditedSummary,
      generationMetadataJson: chapter.generationMetadataJson,
    },
    rows,
  };
}

export async function buildChapterCoherenceReport(chapterId: string): Promise<ChapterCoherenceReport> {
  const { chapter, rows } = await loadChapterScenesForAnalysis(chapterId);
  return buildChapterCoherenceReportFromScenes({
    chapterId: chapter.id,
    bookId: chapter.bookId,
    title: chapter.title,
    scenes: rows,
  });
}

export function buildChapterRefinementPlanFromReport(
  report: ChapterCoherenceReport,
  chapterMeta: {
    narrativeAssemblyStatus: NarrativeAssemblyStatus;
    generatedSummary: string | null;
    humanEditedSummary: string | null;
  },
  options?: BuildChapterRefinementPlanOptions
): ChapterRefinementPlan {
  const reasons: string[] = [];
  const notes: string[] = [];

  if (chapterMeta.narrativeAssemblyStatus === NarrativeAssemblyStatus.STALE) {
    reasons.push("chapter_assembly_stale");
    return {
      contractVersion: "1",
      chapterId: report.chapterId,
      mode: "REASSEMBLE_ONLY",
      basedOnReportHash: report.inputContentHash,
      reasons,
      notes: ["Reader assembly cache is stale—rebuild before deeper coherence work."],
    };
  }

  const orderIssues = report.sceneOrderSummary.issues.filter((i) => i.severity === "warning");
  if (orderIssues.length > 0) {
    reasons.push("scene_order_needs_attention");
    return {
      contractVersion: "1",
      chapterId: report.chapterId,
      mode: "REORDER_SCENE_SUGGESTION",
      basedOnReportHash: report.inputContentHash,
      reasons,
      notes: ["Fix ordering metadata before optimizing transitions."],
    };
  }

  const abrupt = report.transitionAssessments.abruptTransitionCount;
  if (report.overallCoherenceScore < 65 || abrupt >= 2 || options?.preferGuidance) {
    reasons.push("transition_or_rhythm_signals");
    if (abrupt >= 2) reasons.push(`abrupt_transitions=${abrupt}`);
    return {
      contractVersion: "1",
      chapterId: report.chapterId,
      mode: "GENERATE_TRANSITION_GUIDANCE",
      basedOnReportHash: report.inputContentHash,
      reasons,
      notes,
    };
  }

  const canAiSummary =
    !chapterMeta.humanEditedSummary?.trim() &&
    !chapterMeta.generatedSummary?.trim() &&
    report.sceneCount >= 2;
  if (canAiSummary && report.overallCoherenceScore < 78) {
    reasons.push("missing_generated_chapter_summary");
    return {
      contractVersion: "1",
      chapterId: report.chapterId,
      mode: "CHAPTER_SUMMARY_REWRITE",
      basedOnReportHash: report.inputContentHash,
      reasons,
      notes: ["AI synopsis can anchor planning; no human synopsis present."],
    };
  }

  reasons.push("within_thresholds");
  return {
    contractVersion: "1",
    chapterId: report.chapterId,
    mode: "NO_AUTOMATIC_CHANGE",
    basedOnReportHash: report.inputContentHash,
    reasons,
    notes: ["Observe-only; no automatic refinement selected."],
  };
}

export async function buildChapterRefinementPlan(
  chapterId: string,
  options?: BuildChapterRefinementPlanOptions
): Promise<{ plan: ChapterRefinementPlan; report: ChapterCoherenceReport }> {
  const { chapter, rows } = await loadChapterScenesForAnalysis(chapterId);
  const report = buildChapterCoherenceReportFromScenes({
    chapterId: chapter.id,
    bookId: chapter.bookId,
    title: chapter.title,
    scenes: rows,
  });
  const plan = buildChapterRefinementPlanFromReport(report, chapter, options);
  return { plan, report };
}

export async function executeChapterRefinement(
  chapterId: string,
  options: ExecuteChapterRefinementOptions = {}
): Promise<ChapterRefinementExecutionResult> {
  const { plan, report } = await buildChapterRefinementPlan(chapterId);
  const mode = options.mode ?? plan.mode;
  const runLlm = options.runLlm === true;
  const persist = options.persist === true;

  const { chapter } = await loadChapterScenesForAnalysis(chapterId);
  const notes: string[] = [...plan.notes];
  let guidance: ChapterRefinementGuidanceV1 | null = null;
  let assembled: Awaited<ReturnType<typeof assembleChapterReaderText>> | null = null;
  let summaryRewriteApplied = false;
  let metadataUpdated = false;

  if (mode === "REASSEMBLE_ONLY" && persist) {
    assembled = await assembleChapterReaderText({ chapterId, persist: true, purpose: "reader_publish" });
    notes.push("Chapter reader assembly persisted.");
  }

  async function persistGuidance(g: ChapterRefinementGuidanceV1) {
    const prev =
      chapter.generationMetadataJson && typeof chapter.generationMetadataJson === "object"
        ? (chapter.generationMetadataJson as Record<string, unknown>)
        : {};
    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        generationMetadataJson: {
          ...prev,
          chapterRefinementGuidanceV1: g,
          lastChapterRefinementAtIso: new Date().toISOString(),
          lastChapterRefinementMode: mode,
        },
      },
    });
    metadataUpdated = true;
    notes.push("Stored advisory guidance in generationMetadataJson.");
  }

  if (mode === "REORDER_SCENE_SUGGESTION") {
    if (runLlm) {
      guidance = await explainChapterCoherenceWithModel(report);
      if (guidance && persist) await persistGuidance(guidance);
    } else {
      notes.push("Reorder suggestions require runLlm=true.");
    }
  }

  if (mode === "GENERATE_TRANSITION_GUIDANCE") {
    if (runLlm) {
      guidance = await explainChapterCoherenceWithModel(report);
      if (guidance && persist) await persistGuidance(guidance);
    } else {
      notes.push("LLM guidance skipped (runLlm=false).");
    }
  }

  if (mode === "CHAPTER_SUMMARY_REWRITE") {
    if (chapter.humanEditedSummary?.trim()) {
      notes.push("humanEditedSummary present—skipping AI summary write.");
    } else if (runLlm && persist) {
      const sceneSummaries = (
        await prisma.scene.findMany({
          where: { chapterId },
          orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
          select: { summary: true },
        })
      )
        .map((s) => s.summary?.trim())
        .filter((s): s is string => Boolean(s));
      const text = await suggestChapterSummaryRewriteWithModel({
        chapterTitle: chapter.title,
        sceneSummaries,
        coherenceReport: report,
      });
      if (text?.trim()) {
        await prisma.chapter.update({
          where: { id: chapterId },
          data: { generatedSummary: text.trim() },
        });
        summaryRewriteApplied = true;
        notes.push("Updated generatedSummary only.");
      }
    } else {
      notes.push("Summary rewrite skipped (runLlm or persist false).");
    }
  }

  if (mode === "NO_AUTOMATIC_CHANGE" && runLlm) {
    guidance = await explainChapterCoherenceWithModel(report);
    if (guidance && persist) await persistGuidance(guidance);
  }

  return {
    plan: { ...plan, mode },
    report,
    guidance,
    assembled,
    summaryRewriteApplied,
    metadataUpdated,
    notes,
  };
}
