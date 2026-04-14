import type { ChapterSceneAnalysisRow } from "@/lib/chapter-coherence/chapter-coherence-deterministic";
import { buildChapterCoherenceReportFromScenes } from "@/lib/chapter-coherence/chapter-coherence-deterministic";
import {
  buildBookCoherenceReportFromChapterReports,
  buildMovementCoherenceReportFromEpicBooks,
  buildMovementCoherenceReportFromChapterSegments,
} from "@/lib/book-coherence/book-coherence-deterministic";
import {
  explainBookArcWithModel,
  explainEpicMovementArcWithModel,
} from "@/lib/book-coherence/book-arc-llm-adapter";
import type {
  BookArcGuidanceV1,
  BookCoherenceReport,
  BookRefinementPlan,
  MovementCoherenceReport,
} from "@/lib/domain/book-coherence";
import type { ChapterCoherenceReport } from "@/lib/domain/chapter-coherence";
import { prisma } from "@/lib/prisma";
import { resolveSceneReaderText } from "@/lib/services/scene-reader-text";

const sceneSelect = {
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
} as const;

function toSceneRows(
  scenes: Array<{
    id: string;
    orderInChapter: number | null;
    sceneNumber: number | null;
    description: string;
    summary: string | null;
    narrativeIntent: string | null;
    emotionalTone: string | null;
    pov: string | null;
    continuityState: import("@prisma/client").NarrativeContinuityState;
    narrativeAssemblyStatus: import("@prisma/client").NarrativeAssemblyStatus;
    publishedReaderText: string | null;
    authoringText: string | null;
    generationText: string | null;
    draftText: string | null;
  }>
): ChapterSceneAnalysisRow[] {
  return scenes.map((s) => ({
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
}

async function buildOrderedChapterReportsForBook(bookId: string): Promise<{
  reports: ChapterCoherenceReport[];
  sequences: (number | null)[];
  book: {
    id: string;
    epicId: string;
    title: string;
    movementIndex: number;
  };
}> {
  const book = await prisma.book.findUniqueOrThrow({
    where: { id: bookId },
    select: {
      id: true,
      epicId: true,
      title: true,
      movementIndex: true,
      chapters: {
        orderBy: [{ sequenceInBook: "asc" }],
        select: {
          id: true,
          title: true,
          sequenceInBook: true,
          scenes: {
            orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
            select: sceneSelect,
          },
        },
      },
    },
  });

  const reports: ChapterCoherenceReport[] = [];
  const sequences: (number | null)[] = [];
  for (const ch of book.chapters) {
    const rows = toSceneRows(ch.scenes);
    reports.push(
      buildChapterCoherenceReportFromScenes({
        chapterId: ch.id,
        bookId: book.id,
        title: ch.title,
        scenes: rows,
      })
    );
    sequences.push(ch.sequenceInBook);
  }

  return {
    reports,
    sequences,
    book: {
      id: book.id,
      epicId: book.epicId,
      title: book.title,
      movementIndex: book.movementIndex,
    },
  };
}

export async function buildBookCoherenceReport(bookId: string): Promise<BookCoherenceReport> {
  const { reports, sequences, book } = await buildOrderedChapterReportsForBook(bookId);
  return buildBookCoherenceReportFromChapterReports({
    bookId: book.id,
    epicId: book.epicId,
    bookTitle: book.title,
    movementIndex: book.movementIndex,
    orderedChapterReports: reports,
    sequenceInBookByChapterOrder: sequences,
  });
}

export async function buildMovementCoherenceReportForEpic(epicId: string): Promise<MovementCoherenceReport> {
  const epic = await prisma.epic.findUniqueOrThrow({
    where: { id: epicId },
    select: {
      id: true,
      books: {
        orderBy: { movementIndex: "asc" },
        select: {
          id: true,
          title: true,
          movementIndex: true,
          epicId: true,
          chapters: {
            orderBy: [{ sequenceInBook: "asc" }],
            select: {
              id: true,
              title: true,
              sequenceInBook: true,
              scenes: {
                orderBy: [{ orderInChapter: "asc" }, { sceneNumber: "asc" }],
                select: sceneSelect,
              },
            },
          },
        },
      },
    },
  });

  const bookReports: Array<{
    bookId: string;
    title: string;
    movementIndex: number;
    report: BookCoherenceReport;
  }> = [];

  for (const b of epic.books) {
    const chapterReports: ChapterCoherenceReport[] = [];
    const sequences: (number | null)[] = [];
    for (const ch of b.chapters) {
      chapterReports.push(
        buildChapterCoherenceReportFromScenes({
          chapterId: ch.id,
          bookId: b.id,
          title: ch.title,
          scenes: toSceneRows(ch.scenes),
        })
      );
      sequences.push(ch.sequenceInBook);
    }
    const br = buildBookCoherenceReportFromChapterReports({
      bookId: b.id,
      epicId: b.epicId,
      bookTitle: b.title,
      movementIndex: b.movementIndex,
      orderedChapterReports: chapterReports,
      sequenceInBookByChapterOrder: sequences,
    });
    bookReports.push({
      bookId: b.id,
      title: b.title,
      movementIndex: b.movementIndex,
      report: br,
    });
  }

  return buildMovementCoherenceReportFromEpicBooks(epicId, bookReports);
}

export async function buildMovementCoherenceReportForBookSegments(
  bookId: string,
  segmentCount: number
): Promise<MovementCoherenceReport> {
  const { reports, book } = await buildOrderedChapterReportsForBook(bookId);
  return buildMovementCoherenceReportFromChapterSegments({
    bookId: book.id,
    epicId: book.epicId,
    bookTitle: book.title,
    movementIndex: book.movementIndex,
    orderedChapterReports: reports,
    segmentCount,
  });
}

export function buildBookRefinementPlan(report: BookCoherenceReport): BookRefinementPlan {
  const reasons: string[] = [];
  if (report.coherenceIssues.length >= 6) reasons.push("high_issue_count");
  if (report.overallCoherenceScore < 62) reasons.push("low_book_score");
  if (reasons.length === 0) {
    return {
      contractVersion: "1",
      bookId: report.bookId,
      mode: "NO_AUTOMATIC_CHANGE",
      basedOnReportHash: report.inputContentHash,
      reasons: ["within_thresholds"],
      notes: ["Observation-only unless author runs LLM guidance."],
    };
  }
  return {
    contractVersion: "1",
    bookId: report.bookId,
    mode: "PERSIST_BOOK_GUIDANCE",
    basedOnReportHash: report.inputContentHash,
    reasons,
    notes: ["Optional: persist model guidance to book metadata (advisory)."],
  };
}

export type ExecuteBookRefinementOptions = {
  runLlm?: boolean;
  persist?: boolean;
  /** When set, build epic movement report and optional epic-level guidance. */
  epicId?: string | null;
  segmentCount?: number | null;
};

export type BookRefinementExecutionResult = {
  bookReport: BookCoherenceReport | null;
  movementReport: MovementCoherenceReport | null;
  guidance: BookArcGuidanceV1 | null;
  plan: BookRefinementPlan;
  metadataUpdated: boolean;
  notes: string[];
};

export async function executeBookRefinement(
  bookId: string,
  options: ExecuteBookRefinementOptions = {}
): Promise<BookRefinementExecutionResult> {
  const runLlm = options.runLlm === true;
  const persist = options.persist === true;
  const notes: string[] = [];

  const bookReport = await buildBookCoherenceReport(bookId);
  const plan = buildBookRefinementPlan(bookReport);

  let movementReport: MovementCoherenceReport | null = null;
  if (options.epicId?.trim()) {
    movementReport = await buildMovementCoherenceReportForEpic(options.epicId.trim());
  } else if (options.segmentCount != null && options.segmentCount > 1) {
    movementReport = await buildMovementCoherenceReportForBookSegments(bookId, options.segmentCount);
  }

  let guidance: BookArcGuidanceV1 | null = null;
  if (runLlm) {
    if (movementReport && options.epicId?.trim()) {
      guidance = await explainEpicMovementArcWithModel(movementReport);
    } else {
      guidance = await explainBookArcWithModel(bookReport);
    }
  }

  let metadataUpdated = false;
  if (guidance && persist) {
    const bookRow = await prisma.book.findUniqueOrThrow({
      where: { id: bookId },
      select: { metadataJson: true },
    });
    const prev =
      bookRow.metadataJson && typeof bookRow.metadataJson === "object"
        ? (bookRow.metadataJson as Record<string, unknown>)
        : {};
    await prisma.book.update({
      where: { id: bookId },
      data: {
        metadataJson: {
          ...prev,
          bookArcGuidanceV1: guidance,
          lastBookArcRefinementAtIso: new Date().toISOString(),
        },
      },
    });
    metadataUpdated = true;
    notes.push("Merged bookArcGuidanceV1 into Book.metadataJson (advisory).");
  }

  if (guidance && persist && options.epicId?.trim()) {
    const epicRow = await prisma.epic.findUnique({
      where: { id: options.epicId.trim() },
      select: { metadataJson: true },
    });
    if (epicRow) {
      const prev =
        epicRow.metadataJson && typeof epicRow.metadataJson === "object"
          ? (epicRow.metadataJson as Record<string, unknown>)
          : {};
      await prisma.epic.update({
        where: { id: options.epicId.trim() },
        data: {
          metadataJson: {
            ...prev,
            epicArcGuidanceV1: guidance,
            lastEpicArcRefinementAtIso: new Date().toISOString(),
          },
        },
      });
      notes.push("Merged epicArcGuidanceV1 into Epic.metadataJson (advisory).");
    }
  }

  if (!runLlm) notes.push("LLM arc guidance skipped (runLlm=false).");

  return {
    bookReport,
    movementReport,
    guidance,
    plan,
    metadataUpdated,
    notes,
  };
}
