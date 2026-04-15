import {
  CHAPTER_ASSEMBLY_CONTRACT_VERSION,
  type ChapterAssemblyOutputSurface,
  type ChapterAssemblyState,
} from "@/lib/domain/chapter-assembly";

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function evaluateChapterAssembly(input: {
  chapterId: string;
  dependencies: string[];
  entryConditions: ChapterAssemblyState["entryConditions"];
  completionConditions: ChapterAssemblyState["completionConditions"];
  transitionBurden: ChapterAssemblyState["transitionBurden"];
}): {
  state: ChapterAssemblyState;
  output: ChapterAssemblyOutputSurface;
} {
  const chapterId = input.chapterId.trim();
  if (!chapterId) throw new Error("[chapter-assembly] chapterId is required.");

  const unresolvedDependencies = uniqueNonEmpty(input.dependencies);
  const unresolvedCarryover = uniqueNonEmpty(input.transitionBurden.unresolvedCarryover);
  const entryBlocked = input.entryConditions.some((condition) => !condition.satisfied);
  const completionSatisfied = input.completionConditions.every((condition) => condition.satisfied);

  const structuralReadiness: ChapterAssemblyState["structuralReadiness"] =
    entryBlocked || unresolvedDependencies.length > 0 ? "blocked" : "ready";

  // Hardening: completion requires structural readiness and explicit no unresolved carryover.
  const complete = structuralReadiness === "ready" && completionSatisfied && unresolvedCarryover.length === 0;
  const justificationCodes: string[] = [];
  if (entryBlocked) justificationCodes.push("entry_conditions_unsatisfied");
  if (unresolvedDependencies.length > 0) justificationCodes.push("dependencies_unresolved");
  if (!completionSatisfied) justificationCodes.push("completion_conditions_unsatisfied");
  if (unresolvedCarryover.length > 0) justificationCodes.push("carryover_unresolved_explicit");
  if (complete) justificationCodes.push("structural_completion_justified");

  const state: ChapterAssemblyState = {
    contractVersion: CHAPTER_ASSEMBLY_CONTRACT_VERSION,
    chapterId,
    entryConditions: input.entryConditions,
    completionConditions: input.completionConditions,
    dependencies: unresolvedDependencies,
    transitionBurden: {
      ...input.transitionBurden,
      unresolvedCarryover,
    },
    structuralReadiness,
    complete,
    justificationCodes,
  };

  const output: ChapterAssemblyOutputSurface = {
    chapterId: state.chapterId,
    entryStatus: state.structuralReadiness,
    completionStatus: state.complete ? "complete" : "incomplete",
    unresolvedDependencies,
    unresolvedCarryover,
    transitionBurdenSummary: {
      mustResolveNowCount: state.transitionBurden.mustResolveNow.length,
      mustCarryForwardCount: state.transitionBurden.mustCarryForward.length,
    },
  };

  return { state, output };
}
import { createHash } from "crypto";

import {
  NarrativeAssemblyStatus,
  NarrativeContinuityState,
} from "@prisma/client";

import { resolveSceneFinalText } from "@/lib/domain/scene-text-resolution";
import { prisma } from "@/lib/prisma";
import { resolveSceneReaderText } from "@/lib/services/scene-reader-text";

export type ChapterAssemblyWarning = {
  sceneId: string;
  code: string;
  message: string;
};

export type AssembledChapter = {
  chapterId: string;
  bookId: string;
  text: string;
  contentHash: string;
  sceneIds: string[];
  warnings: ChapterAssemblyWarning[];
};

function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

export type ChapterAssemblyPurpose =
  /** Human working copy wins over model draft (planning / revision). */
  | "author_draft"
  /** Reader-facing: published slice wins when set. */
  | "reader_publish";

/**
 * Loads ordered scenes, picks text per scene, concatenates with blank lines.
 * Persists cache on chapter when `persist` is true and sets assembly CURRENT.
 */
export async function assembleChapterReaderText(params: {
  chapterId: string;
  persist?: boolean;
  purpose?: ChapterAssemblyPurpose;
}): Promise<AssembledChapter> {
  const chapter = await prisma.chapter.findUniqueOrThrow({
    where: { id: params.chapterId },
    include: {
      scenes: {
        orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
      },
      book: true,
    },
  });

  const purpose = params.purpose ?? "reader_publish";
  const warnings: ChapterAssemblyWarning[] = [];
  const parts: string[] = [];
  const sceneIds: string[] = [];

  for (const scene of chapter.scenes) {
    sceneIds.push(scene.id);
    const body =
      purpose === "author_draft"
        ? resolveSceneFinalText(
            {
              sceneId: scene.id,
              generationText: scene.generationText,
              humanText: scene.authoringText,
              publishedReaderText: scene.publishedReaderText,
              legacyDraftText: scene.draftText,
            },
            "author_working_first"
          )
        : resolveSceneReaderText(scene);
    if (!body.trim()) {
      warnings.push({
        sceneId: scene.id,
        code: "scene.empty_reader_text",
        message:
          "Scene has no published/authoring/generation/draft text—skipped in assembly.",
      });
      continue;
    }
    if (scene.continuityState === NarrativeContinuityState.WARNING) {
      warnings.push({
        sceneId: scene.id,
        code: "continuity.warning",
        message: "Scene flagged WARNING—review before relying on assembly.",
      });
    }
    if (scene.continuityState === NarrativeContinuityState.BLOCKING) {
      warnings.push({
        sceneId: scene.id,
        code: "continuity.blocking",
        message: "Scene flagged BLOCKING—assembly includes text but publish pipeline should stop.",
      });
    }
    parts.push(body.trim());
  }

  const text = parts.join("\n\n");
  const contentHash = sha256(text);

  if (params.persist) {
    await prisma.chapter.update({
      where: { id: params.chapterId },
      data: {
        readerAssembledText: text,
        assemblyContentHash: contentHash,
        lastAssembledAt: new Date(),
        narrativeAssemblyStatus: NarrativeAssemblyStatus.CURRENT,
        assemblyInvalidatedAt: null,
      },
    });
  }

  return {
    chapterId: chapter.id,
    bookId: chapter.bookId,
    text,
    contentHash,
    sceneIds,
    warnings,
  };
}

/**
 * If any scene in the chapter is STALE assembly, roll stale to chapter (and clear cached assembly).
 */
export async function rollupChapterStaleFromScenes(chapterId: string) {
  const stale = await prisma.scene.findFirst({
    where: {
      chapterId,
      narrativeAssemblyStatus: NarrativeAssemblyStatus.STALE,
    },
    select: { id: true },
  });
  if (!stale) return { updated: false as const };
  await prisma.chapter.update({
    where: { id: chapterId },
    data: {
      narrativeAssemblyStatus: NarrativeAssemblyStatus.STALE,
      assemblyInvalidatedAt: new Date(),
      readerAssembledText: null,
      assemblyContentHash: null,
    },
  });
  return { updated: true as const };
}
