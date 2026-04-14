import { createHash } from "node:crypto";

import type { ChapterCoherenceReport } from "@/lib/domain/chapter-coherence";
import type {
  ArcPhaseDistribution,
  BookCoherenceIssue,
  BookCoherenceReport,
  ChapterArcContribution,
  MovementCoherenceReport,
  MovementSegmentReport,
  NarrativeArcPhase,
  PacingAssessment,
  RevealCurveSummary,
  TensionCurveSummary,
} from "@/lib/domain/book-coherence";
import {
  BOOK_COHERENCE_REPORT_VERSION,
  MOVEMENT_COHERENCE_REPORT_VERSION,
} from "@/lib/domain/book-coherence";

function emptyPhaseDistribution(): ArcPhaseDistribution {
  return {
    setup: 0,
    escalation: 0,
    climax: 0,
    resolution: 0,
    aftermath: 0,
  };
}

function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Math.sqrt(nums.reduce((s, n) => s + (n - m) ** 2, 0) / nums.length);
}

function coefficientOfVariation(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const m = nums.reduce((a, b) => a + b, 0) / nums.length;
  if (m === 0) return null;
  return stdDev(nums) / m;
}

/**
 * Hybrid: global tension peak → climax for that chapter; otherwise position buckets on [0,1].
 */
export function classifyChapterArcPhase(
  index: number,
  chapterCount: number,
  tensionMean: number,
  allTensions: number[]
): NarrativeArcPhase {
  const n = chapterCount;
  if (n <= 0) return "setup";
  const maxT = Math.max(...allTensions, 0);
  const peakIdx = allTensions.length === 0 ? -1 : allTensions.indexOf(maxT);
  if (n >= 3 && index === peakIdx && maxT >= 0.42) {
    return "climax";
  }
  const t = n === 1 ? 0 : index / (n - 1);
  if (t < 0.22) return "setup";
  if (t < 0.48) return "escalation";
  if (t < 0.72) return "climax";
  if (t < 0.88) return "resolution";
  return "aftermath";
}

export function buildChapterContributions(
  orderedReports: ChapterCoherenceReport[],
  sequenceInBookByIndex?: (number | null)[]
): ChapterArcContribution[] {
  const tensions = orderedReports.map((r) => {
    const tp = r.rhythmAssessment.tensionProxyByScene;
    return tp.length > 0 ? tp.reduce((a, b) => a + b, 0) / tp.length : 0.5;
  });
  const n = orderedReports.length;
  return orderedReports.map((r, i) => {
    const tp = r.rhythmAssessment.tensionProxyByScene;
    const tensionMean =
      tp.length > 0 ? tp.reduce((a, b) => a + b, 0) / tp.length : 0.5;
    const revealHitsTotal = r.revealAssessment.revealKeywordHitsByScene.reduce(
      (a, b) => a + b,
      0
    );
    return {
      chapterId: r.chapterId,
      sequenceInBook: sequenceInBookByIndex?.[i] ?? i,
      title: r.title,
      sceneCount: r.sceneCount,
      chapterCoherenceScore: r.overallCoherenceScore,
      tensionMean,
      revealHitsTotal,
      classifiedPhase: classifyChapterArcPhase(i, n, tensionMean, tensions),
      chapterReportInputHash: r.inputContentHash,
    };
  });
}

export function assessTensionCurve(contributions: ChapterArcContribution[]): TensionCurveSummary {
  const byChapterIndex = contributions.map((c) => c.tensionMean);
  let peakChapterIndex: number | null = null;
  if (byChapterIndex.length > 0) {
    const max = Math.max(...byChapterIndex);
    peakChapterIndex = byChapterIndex.indexOf(max);
  }
  const flatAcrossBook =
    byChapterIndex.length >= 4 && coefficientOfVariation(byChapterIndex)! < 0.08;
  const notes: string[] = [];
  if (flatAcrossBook) notes.push("Tension proxy is nearly flat across chapters.");
  if (peakChapterIndex != null && contributions.length >= 3) {
    const t = peakChapterIndex / (contributions.length - 1);
    if (t < 0.25) notes.push("Tension peak sits early—climax may feel premature.");
    if (t > 0.92) notes.push("Tension peak sits very late.");
  }
  return { byChapterIndex, peakChapterIndex, flatAcrossBook, notes };
}

export function assessRevealCurve(contributions: ChapterArcContribution[]): RevealCurveSummary {
  const revealTotalsByChapter = contributions.map((c) => c.revealHitsTotal);
  let maxRevealChapterIndex: number | null = null;
  if (revealTotalsByChapter.length > 0) {
    const max = Math.max(...revealTotalsByChapter);
    maxRevealChapterIndex = revealTotalsByChapter.indexOf(max);
  }
  const n = revealTotalsByChapter.length;
  const late = n >= 3 ? revealTotalsByChapter.slice(Math.max(0, n - 2)).reduce((a, b) => a + b, 0) : 0;
  const early = n >= 2 ? revealTotalsByChapter.slice(0, 2).reduce((a, b) => a + b, 0) : 0;
  const clusteredLate = n >= 4 && late >= 4 && early >= 1;
  const notes: string[] = [];
  if (clusteredLate) notes.push("Reveal-density clusters toward the final chapters.");
  return {
    revealTotalsByChapter,
    maxRevealChapterIndex,
    clusteredLate,
    notes,
  };
}

export function assessBookPacing(contributions: ChapterArcContribution[]): PacingAssessment {
  const sceneCountsByChapter = contributions.map((c) => c.sceneCount);
  const sceneCountCv = coefficientOfVariation(sceneCountsByChapter);
  const unevenPacing = sceneCountCv != null && sceneCountCv > 0.45 && contributions.length >= 3;
  const notes: string[] = [];
  if (unevenPacing) notes.push("Scene counts vary strongly between chapters.");
  return { sceneCountsByChapter, sceneCountCv, unevenPacing, notes };
}

export function detectArcImbalance(
  contributions: ChapterArcContribution[],
  phaseDistribution: ArcPhaseDistribution,
  tension: TensionCurveSummary,
  reveal: RevealCurveSummary,
  pacing: PacingAssessment
): BookCoherenceIssue[] {
  const issues: BookCoherenceIssue[] = [];
  const n = contributions.length;
  if (n === 0) return issues;

  const setupRatio = phaseDistribution.setup / n;
  if (setupRatio > 0.55 && n >= 4) {
    issues.push({
      code: "arc.too_many_setup_chapters",
      severity: "warning",
      message: "A large share of chapters classify as setup by position/tension.",
      chapterIds: contributions.filter((c) => c.classifiedPhase === "setup").map((c) => c.chapterId),
      evidence: { setupRatio },
    });
  }

  if (phaseDistribution.escalation === 0 && n >= 5) {
    issues.push({
      code: "arc.missing_escalation",
      severity: "warning",
      message: "No chapter sits in the escalation bucket—arc may skip rising action.",
      chapterIds: [],
    });
  }

  const climaxChapters = contributions.filter((c) => c.classifiedPhase === "climax");
  if (climaxChapters.length === 0 && n >= 4) {
    issues.push({
      code: "arc.weak_or_missing_climax",
      severity: "warning",
      message: "No dedicated climax chapter detected from phase/tension peak.",
      chapterIds: [],
    });
  }

  const resEarly = contributions.findIndex((c) => c.classifiedPhase === "resolution");
  if (resEarly >= 0 && resEarly < Math.floor(n * 0.55) && n >= 4) {
    issues.push({
      code: "arc.premature_resolution",
      severity: "info",
      message: "Resolution-phase chapter appears before the last third of the book.",
      chapterIds: [contributions[resEarly]!.chapterId],
    });
  }

  if (phaseDistribution.aftermath / n > 0.35 && n >= 4) {
    issues.push({
      code: "arc.aftermath_too_long",
      severity: "info",
      message: "Several late chapters read as aftermath—check cadence.",
      chapterIds: contributions.filter((c) => c.classifiedPhase === "aftermath").map((c) => c.chapterId),
    });
  }

  if (reveal.clusteredLate) {
    issues.push({
      code: "arc.reveal_cluster",
      severity: "info",
      message: "Reveal-keyword density clusters late in the book.",
      chapterIds: contributions.slice(-2).map((c) => c.chapterId),
    });
  }

  if (tension.flatAcrossBook) {
    issues.push({
      code: "arc.tension_flat_across_book",
      severity: "warning",
      message: "Cross-chapter tension proxy barely moves.",
      chapterIds: [],
    });
  }

  if (pacing.unevenPacing) {
    issues.push({
      code: "arc.uneven_pacing",
      severity: "info",
      message: "Scene-count variance across chapters is high.",
      chapterIds: [],
      evidence: { sceneCountCv: pacing.sceneCountCv },
    });
  }

  const lowCoherence = contributions.filter((c) => c.chapterCoherenceScore < 55);
  if (lowCoherence.length >= Math.ceil(n * 0.4) && n >= 3) {
    issues.push({
      code: "chapter.coherence_drag",
      severity: "warning",
      message: "Many chapters have low chapter-level coherence scores.",
      chapterIds: lowCoherence.map((c) => c.chapterId),
    });
  }

  return issues;
}

function scoreBookFromIssues(issues: BookCoherenceIssue[]): number {
  let s = 100;
  for (const i of issues) {
    if (i.severity === "blocking") s -= 16;
    else if (i.severity === "warning") s -= 7;
    else s -= 3;
  }
  return Math.max(0, Math.min(100, Math.round(s)));
}

export function analyzeBookArcStructure(
  contributions: ChapterArcContribution[]
): ArcPhaseDistribution {
  const d = emptyPhaseDistribution();
  for (const c of contributions) {
    d[c.classifiedPhase]++;
  }
  return d;
}

export function buildBookCoherenceReportFromChapterReports(input: {
  bookId: string;
  epicId: string;
  bookTitle: string;
  movementIndex: number;
  orderedChapterReports: ChapterCoherenceReport[];
  sequenceInBookByChapterOrder?: (number | null)[];
}): BookCoherenceReport {
  const ordered = input.orderedChapterReports;
  const contributions = buildChapterContributions(ordered, input.sequenceInBookByChapterOrder);
  const arcPhaseDistribution = analyzeBookArcStructure(contributions);
  const tensionCurveSummary = assessTensionCurve(contributions);
  const revealCurveSummary = assessRevealCurve(contributions);
  const pacingAssessment = assessBookPacing(contributions);
  const coherenceIssues = detectArcImbalance(
    contributions,
    arcPhaseDistribution,
    tensionCurveSummary,
    revealCurveSummary,
    pacingAssessment
  );
  const overallCoherenceScore = scoreBookFromIssues(coherenceIssues);
  const inputContentHash = createHash("sha256")
    .update(
      JSON.stringify({
        bookId: input.bookId,
        chapterHashes: ordered.map((r) => r.inputContentHash),
      })
    )
    .digest("hex");

  return {
    contractVersion: BOOK_COHERENCE_REPORT_VERSION,
    bookId: input.bookId,
    epicId: input.epicId,
    bookTitle: input.bookTitle,
    movementIndex: input.movementIndex,
    chapterCount: ordered.length,
    arcPhaseDistribution,
    chapterContributions: contributions,
    tensionCurveSummary,
    revealCurveSummary,
    pacingAssessment,
    coherenceIssues,
    overallCoherenceScore,
    advisoryOnly: true,
    inputContentHash,
    builtAtIso: new Date().toISOString(),
    chapterReports: ordered,
  };
}

/** Split ordered chapter ids into `segmentCount` contiguous segments (deterministic). */
export function groupChapterIdsIntoSegments(
  orderedChapterIds: string[],
  segmentCount: number
): string[][] {
  if (orderedChapterIds.length === 0 || segmentCount <= 1) return [orderedChapterIds];
  const n = orderedChapterIds.length;
  const k = Math.min(segmentCount, n);
  const base = Math.floor(n / k);
  let rem = n % k;
  const out: string[][] = [];
  let idx = 0;
  for (let s = 0; s < k; s++) {
    const len = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem--;
    out.push(orderedChapterIds.slice(idx, idx + len));
    idx += len;
  }
  return out;
}

export function buildMovementSegmentFromBookReport(
  report: BookCoherenceReport,
  movementId: string,
  label: string,
  bookId: string | null,
  movementIndex: number | null
): MovementSegmentReport {
  const n = report.chapterContributions.length;
  const meanChapterCoherence =
    n > 0
      ? report.chapterContributions.reduce((a, c) => a + c.chapterCoherenceScore, 0) / n
      : 0;
  const meanTension =
    n > 0 ? report.chapterContributions.reduce((a, c) => a + c.tensionMean, 0) / n : 0;
  const meanReveal =
    n > 0 ? report.chapterContributions.reduce((a, c) => a + c.revealHitsTotal, 0) / n : 0;
  return {
    movementId,
    label,
    bookId,
    movementIndex,
    chapterIds: report.chapterContributions.map((c) => c.chapterId),
    chapterCount: n,
    arcPhaseDistribution: report.arcPhaseDistribution,
    meanChapterCoherence,
    meanTension,
    meanReveal,
    coherenceIssues: report.coherenceIssues,
    overallCoherenceScore: report.overallCoherenceScore,
  };
}

export function buildMovementCoherenceReportFromEpicBooks(
  epicId: string,
  bookReports: Array<{
    bookId: string;
    title: string;
    movementIndex: number;
    report: BookCoherenceReport;
  }>
): MovementCoherenceReport {
  const movements = bookReports.map((b) =>
    buildMovementSegmentFromBookReport(
      b.report,
      b.bookId,
      b.title || `Movement ${b.movementIndex}`,
      b.bookId,
      b.movementIndex
    )
  );
  const allIssues = movements.flatMap((m) => m.coherenceIssues);
  const overall =
    movements.length > 0
      ? Math.round(
          movements.reduce((a, m) => a + m.overallCoherenceScore, 0) / movements.length
        )
      : 100;
  const inputContentHash = createHash("sha256")
    .update(
      JSON.stringify({
        epicId,
        bookHashes: bookReports.map((b) => b.report.inputContentHash),
      })
    )
    .digest("hex");

  return {
    contractVersion: MOVEMENT_COHERENCE_REPORT_VERSION,
    scope: "epic_books",
    epicId,
    bookId: null,
    movements,
    coherenceIssues: allIssues.slice(0, 80),
    overallCoherenceScore: overall,
    advisoryOnly: true,
    inputContentHash,
    builtAtIso: new Date().toISOString(),
  };
}

export function buildMovementCoherenceReportFromChapterSegments(input: {
  bookId: string;
  epicId: string;
  bookTitle: string;
  movementIndex: number;
  orderedChapterReports: ChapterCoherenceReport[];
  segmentCount: number;
}): MovementCoherenceReport {
  const ids = input.orderedChapterReports.map((r) => r.chapterId);
  const segments = groupChapterIdsIntoSegments(ids, input.segmentCount);
  const movements: MovementSegmentReport[] = segments.map((segIds, segIdx) => {
    const subset = input.orderedChapterReports.filter((r) => segIds.includes(r.chapterId));
    const br = buildBookCoherenceReportFromChapterReports({
      bookId: `${input.bookId}::segment-${segIdx}`,
      epicId: input.epicId,
      bookTitle: `${input.bookTitle} — segment ${segIdx + 1}`,
      movementIndex: input.movementIndex,
      orderedChapterReports: subset,
    });
    return buildMovementSegmentFromBookReport(
      br,
      `segment-${input.bookId}-${segIdx}`,
      `Segment ${segIdx + 1}`,
      input.bookId,
      null
    );
  });
  const overall =
    movements.length > 0
      ? Math.round(
          movements.reduce((a, m) => a + m.overallCoherenceScore, 0) / movements.length
        )
      : 100;
  const inputContentHash = createHash("sha256")
    .update(
      JSON.stringify({
        bookId: input.bookId,
        segmentCount: input.segmentCount,
        chapterHashes: input.orderedChapterReports.map((r) => r.inputContentHash),
      })
    )
    .digest("hex");

  return {
    contractVersion: MOVEMENT_COHERENCE_REPORT_VERSION,
    scope: "book_segments",
    epicId: null,
    bookId: input.bookId,
    movements,
    coherenceIssues: movements.flatMap((m) => m.coherenceIssues).slice(0, 80),
    overallCoherenceScore: overall,
    advisoryOnly: true,
    inputContentHash,
    builtAtIso: new Date().toISOString(),
  };
}
