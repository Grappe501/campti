import { assembleChapterReaderText } from "@/lib/services/chapter-assembly-service";
import { buildBookCoherenceReport } from "@/lib/services/book-coherence-refinement-service";
import { buildChapterCoherenceReport } from "@/lib/services/chapter-coherence-refinement-service";
import {
  createWorkflowRunSummary,
  failWorkflow,
  pushCheckpoint,
} from "@/lib/services/author-production-workflow-service";
import { runSceneGeneration, type RunSceneGenerationParams } from "@/lib/services/scene-generation-service";
import {
  buildBookObserverSnapshot,
  buildChapterObserverSnapshot,
  buildSceneObserverSnapshot,
} from "@/lib/services/world-observer-service";

export type SceneDraftPackage = {
  sceneId: string;
  run: Awaited<ReturnType<typeof runSceneGeneration>>;
  sceneObserver: Awaited<ReturnType<typeof buildSceneObserverSnapshot>>;
  workflow: ReturnType<typeof createWorkflowRunSummary>;
};

/**
 * Generate a scene draft and return observer slice + run payload (typed boundaries for UI/automation).
 */
export async function orchestrateSceneDraftPackage(
  sceneId: string,
  params?: RunSceneGenerationParams
): Promise<SceneDraftPackage> {
  let wf = createWorkflowRunSummary({ sceneId });
  wf = pushCheckpoint(wf, "build_scene_input");
  let run: SceneDraftPackage["run"];
  try {
    run = await runSceneGeneration({ sceneId, ...params });
  } catch (e) {
    wf = failWorkflow(wf, e instanceof Error ? e.message : "scene_generation_failed");
    throw e;
  }
  wf = pushCheckpoint(wf, "generate_draft");
  wf = pushCheckpoint(wf, "run_prose_qa", run.proseQuality ? "prose_qa" : undefined);
  wf = pushCheckpoint(wf, "run_humanization_advisory", run.humanizationAdvisory?.findings.length ? "findings" : undefined);
  const sceneObserver = await buildSceneObserverSnapshot(sceneId);
  wf = pushCheckpoint(wf, "inspect_social_field", "observer_snapshot");
  return { sceneId, run, sceneObserver, workflow: wf };
}

export type ChapterProductionPackage = {
  chapterId: string;
  chapterCoherence: Awaited<ReturnType<typeof buildChapterCoherenceReport>>;
  assembly: Awaited<ReturnType<typeof assembleChapterReaderText>> | null;
  chapterObserver: Awaited<ReturnType<typeof buildChapterObserverSnapshot>>;
  workflow: ReturnType<typeof createWorkflowRunSummary>;
};

export async function orchestrateChapterProductionPackage(
  chapterId: string,
  options?: { persistAssembly?: boolean; runAssembly?: boolean }
): Promise<ChapterProductionPackage> {
  let wf = createWorkflowRunSummary({ chapterId });
  wf = pushCheckpoint(wf, "chapter_coherence");
  const chapterCoherence = await buildChapterCoherenceReport(chapterId);
  const persist = options?.persistAssembly === true;
  const runAsm = options?.runAssembly !== false;
  let assembly: ChapterProductionPackage["assembly"] = null;
  if (runAsm) {
    wf = pushCheckpoint(wf, "assemble_chapter");
    assembly = await assembleChapterReaderText({
      chapterId,
      persist,
      purpose: "reader_publish",
    });
  }
  const chapterObserver = await buildChapterObserverSnapshot(chapterId);
  return { chapterId, chapterCoherence, assembly, chapterObserver, workflow: wf };
}

export type BookProductionPackage = {
  bookId: string;
  bookCoherence: Awaited<ReturnType<typeof buildBookCoherenceReport>>;
  bookObserver: Awaited<ReturnType<typeof buildBookObserverSnapshot>>;
  workflow: ReturnType<typeof createWorkflowRunSummary>;
};

export async function orchestrateBookProductionPackage(bookId: string): Promise<BookProductionPackage> {
  let wf = createWorkflowRunSummary({ bookId });
  wf = pushCheckpoint(wf, "book_coherence");
  const bookCoherence = await buildBookCoherenceReport(bookId);
  const bookObserver = await buildBookObserverSnapshot(bookId);
  return { bookId, bookCoherence, bookObserver, workflow: wf };
}
