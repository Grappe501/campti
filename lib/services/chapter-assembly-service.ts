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
