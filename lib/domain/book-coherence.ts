/**
 * Phase 6.4 — Book-level arc / movement coherence (deterministic + advisory LLM).
 * Does not rewrite human prose or reorder chapters in the database.
 */

import type { ChapterCoherenceReport } from "@/lib/domain/chapter-coherence";

export const BOOK_COHERENCE_REPORT_VERSION = "1" as const;
export const MOVEMENT_COHERENCE_REPORT_VERSION = "1" as const;

export type NarrativeArcPhase = "setup" | "escalation" | "climax" | "resolution" | "aftermath";

export type BookCoherenceSeverity = "info" | "warning" | "blocking";

export type BookCoherenceIssueCode =
  | "arc.too_many_setup_chapters"
  | "arc.missing_escalation"
  | "arc.weak_or_missing_climax"
  | "arc.premature_resolution"
  | "arc.aftermath_too_long"
  | "arc.reveal_cluster"
  | "arc.tension_flat_across_book"
  | "arc.uneven_pacing"
  | "movement.imbalance"
  | "chapter.coherence_drag";

export type BookCoherenceIssue = {
  code: BookCoherenceIssueCode;
  severity: BookCoherenceSeverity;
  message: string;
  chapterIds: string[];
  evidence?: Record<string, string | number | boolean | null>;
};

export type ChapterArcContribution = {
  chapterId: string;
  sequenceInBook: number | null;
  title: string;
  sceneCount: number;
  chapterCoherenceScore: number;
  /** Mean scene-level tension proxy for the chapter. */
  tensionMean: number;
  /** Total reveal-keyword hits across scenes. */
  revealHitsTotal: number;
  classifiedPhase: NarrativeArcPhase;
  /** Chapter report input hash (ties to Phase 6.3). */
  chapterReportInputHash: string;
};

export type ArcPhaseDistribution = Record<NarrativeArcPhase, number>;

export type TensionCurveSummary = {
  /** Per chapter (book order), mean tension proxy. */
  byChapterIndex: number[];
  peakChapterIndex: number | null;
  /** True when variance is very low across chapters. */
  flatAcrossBook: boolean;
  notes: string[];
};

export type RevealCurveSummary = {
  revealTotalsByChapter: number[];
  maxRevealChapterIndex: number | null;
  clusteredLate: boolean;
  notes: string[];
};

export type PacingAssessment = {
  sceneCountsByChapter: number[];
  sceneCountCv: number | null;
  unevenPacing: boolean;
  notes: string[];
};

export type BookCoherenceReport = {
  contractVersion: typeof BOOK_COHERENCE_REPORT_VERSION;
  bookId: string;
  epicId: string;
  bookTitle: string;
  movementIndex: number;
  chapterCount: number;
  arcPhaseDistribution: ArcPhaseDistribution;
  chapterContributions: ChapterArcContribution[];
  tensionCurveSummary: TensionCurveSummary;
  revealCurveSummary: RevealCurveSummary;
  pacingAssessment: PacingAssessment;
  coherenceIssues: BookCoherenceIssue[];
  overallCoherenceScore: number;
  advisoryOnly: true;
  inputContentHash: string;
  builtAtIso: string;
  /** Embedded chapter reports for inspectability (reproducible). */
  chapterReports: ChapterCoherenceReport[];
};

export type BookRefinementMode =
  | "ADVISORY_ONLY"
  | "PERSIST_BOOK_GUIDANCE"
  | "PERSIST_EPIC_GUIDANCE"
  | "NO_AUTOMATIC_CHANGE";

export type BookRefinementPlan = {
  contractVersion: "1";
  bookId: string;
  mode: BookRefinementMode;
  basedOnReportHash: string;
  reasons: string[];
  notes: string[];
};

export const BOOK_ARC_GUIDANCE_VERSION = "book-arc-guidance-v1" as const;

export type BookArcGuidanceV1 = {
  contractVersion: typeof BOOK_ARC_GUIDANCE_VERSION;
  explanations: string[];
  restructuringSuggestions: string[];
  missingChapterTypes: string[];
  confidence: number;
  modelNotes: string | null;
};

/** One movement = one Book under an Epic (Michener-style), or a synthetic segment within a Book. */
export type MovementSegmentReport = {
  movementId: string;
  label: string;
  bookId: string | null;
  movementIndex: number | null;
  chapterIds: string[];
  chapterCount: number;
  arcPhaseDistribution: ArcPhaseDistribution;
  meanChapterCoherence: number;
  meanTension: number;
  meanReveal: number;
  coherenceIssues: BookCoherenceIssue[];
  overallCoherenceScore: number;
};

export type MovementCoherenceReport = {
  contractVersion: typeof MOVEMENT_COHERENCE_REPORT_VERSION;
  scope: "epic_books" | "book_segments";
  epicId: string | null;
  bookId: string | null;
  movements: MovementSegmentReport[];
  coherenceIssues: BookCoherenceIssue[];
  overallCoherenceScore: number;
  advisoryOnly: true;
  inputContentHash: string;
  builtAtIso: string;
};
