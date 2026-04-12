import type { AnalyzeProseContext } from "@/lib/prose-quality";
import { ProseQualityAnalysisScopeValues } from "@/lib/prisma-enums/prose-quality-scope";
import { suggestionsFromGoalsAndReport } from "@/lib/prose-quality";
import {
  assembleChapterReaderText,
  type ChapterAssemblyPurpose,
} from "@/lib/services/chapter-assembly-service";
import { prisma } from "@/lib/prisma";
import { resolveSceneReaderText } from "@/lib/services/scene-reader-text";
import { runProseQualityAnalysis } from "@/lib/services/prose-quality-service";

function pickSceneProseForAnalysis(scene: {
  publishedReaderText: string | null;
  authoringText: string | null;
  generationText: string | null;
  draftText: string | null;
}): string {
  return (
    resolveSceneReaderText(scene) ||
    scene.authoringText?.trim() ||
    scene.generationText?.trim() ||
    scene.draftText?.trim() ||
    ""
  );
}

/**
 * Loads scene + optional voice profiles for QA; persists `ProseQualityReport` scoped to SCENE.
 */
export async function analyzeProseQualityBySceneId(params: {
  sceneId: string;
  context?: AnalyzeProseContext;
  persist?: boolean;
  sceneDraftVersionId?: string | null;
}) {
  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: params.sceneId },
    include: {
      chapter: { include: { book: true } },
      persons: { take: 1 },
    },
  });

  const prose = pickSceneProseForAnalysis(scene);
  const povPersonId = scene.persons[0]?.id;
  const characterVoiceProfile = povPersonId
    ? await prisma.characterVoiceProfile.findUnique({
        where: { personId: povPersonId },
      })
    : null;

  const ctx: AnalyzeProseContext = {
    ...params.context,
    characterVoiceProfile:
      params.context?.characterVoiceProfile ??
      (characterVoiceProfile
        ? {
            dictionLevel: characterVoiceProfile.dictionLevel,
            rhythmStyle: characterVoiceProfile.rhythmStyle,
            metaphorStyle: characterVoiceProfile.metaphorStyle,
            dialectNotes: characterVoiceProfile.dialectNotes,
            silencePatterns: characterVoiceProfile.silencePatterns,
            emotionalExpressionStyle:
              characterVoiceProfile.emotionalExpressionStyle,
            notes: characterVoiceProfile.notes,
          }
        : null),
  };

  const analyzerContextSnapshot = {
    sceneId: scene.id,
    chapterId: scene.chapterId,
    bookId: scene.chapter.bookId,
    epicId: scene.chapter.book.epicId,
  };

  const report = await runProseQualityAnalysis({
    analysisScope: ProseQualityAnalysisScopeValues.SCENE,
    sceneId: scene.id,
    prose,
    sceneDraftVersionId: params.sceneDraftVersionId,
    context: ctx,
    persist: params.persist,
    analyzerContextSnapshot,
  });

  const suggestions = suggestionsFromGoalsAndReport(
    ctx.authorGoals,
    report,
    prose
  );

  return { report, suggestions, proseSample: prose };
}

/**
 * Assembles chapter text then runs deterministic QA with scope CHAPTER_ASSEMBLY.
 */
export async function analyzeProseQualityByChapterId(params: {
  chapterId: string;
  purpose?: ChapterAssemblyPurpose;
  context?: AnalyzeProseContext;
  persist?: boolean;
}) {
  const assembled = await assembleChapterReaderText({
    chapterId: params.chapterId,
    persist: false,
    purpose: params.purpose ?? "author_draft",
  });

  const chapter = await prisma.chapter.findUniqueOrThrow({
    where: { id: params.chapterId },
    include: { book: true },
  });

  const analyzerContextSnapshot = {
    chapterId: chapter.id,
    bookId: chapter.bookId,
    sceneIdsOrdered: assembled.sceneIds,
    assemblyPurpose: params.purpose ?? "author_draft",
  };

  const report = await runProseQualityAnalysis({
    analysisScope: ProseQualityAnalysisScopeValues.CHAPTER_ASSEMBLY,
    chapterId: chapter.id,
    prose: assembled.text,
    context: params.context,
    persist: params.persist,
    analyzerContextSnapshot,
  });

  const suggestions = suggestionsFromGoalsAndReport(
    params.context?.authorGoals,
    report,
    assembled.text
  );

  return { report, suggestions, assembled, proseSample: assembled.text };
}
