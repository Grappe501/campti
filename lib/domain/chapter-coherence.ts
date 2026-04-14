/**
 * Phase 6.3 — Chapter coherence / assembly refinement (deterministic analysis + advisory refinement).
 * Does not target human-authored scene or chapter prose; optional AI touches `generatedSummary` / metadata only.
 */

export const CHAPTER_COHERENCE_REPORT_VERSION = "1" as const;

export type ChapterCoherenceSeverity = "info" | "warning" | "blocking";

export type ChapterCoherenceIssueCode =
  | "scene_order.gap_or_duplicate"
  | "scene_order.unsorted"
  | "transition.abrupt_pov"
  | "transition.abrupt_tone"
  | "transition.low_lexical_overlap"
  | "transition.abrupt_handoff"
  | "rhythm.flat_scene_lengths"
  | "rhythm.repeated_beat_streak"
  | "rhythm.flat_tension_curve"
  | "reveal.too_early"
  | "reveal.crowded_late"
  | "opening.weak_hook"
  | "opening.slow_start"
  | "ending.weak_cadence"
  | "ending.no_turn"
  | "pov.inconsistent_sequence"
  | "pressure.continuity_warning_scene"
  | "assembly.empty_scene_slice";

export type ChapterCoherenceIssue = {
  code: ChapterCoherenceIssueCode;
  severity: ChapterCoherenceSeverity;
  message: string;
  sceneIds: string[];
  /** Small structured hints for observers / LLM grounding. */
  evidence?: Record<string, string | number | boolean | null>;
};

export type SceneOrderSummary = {
  orderedSceneIds: string[];
  orderSource: "orderInChapter_then_sceneNumber";
  issues: ChapterCoherenceIssue[];
};

export type ChapterTransitionAssessment = {
  pairCount: number;
  /** One entry per adjacent pair (prev → next). */
  pairs: Array<{
    prevSceneId: string;
    nextSceneId: string;
    povShift: boolean;
    toneDelta: number;
    lexicalOverlap: number;
    abrupt: boolean;
    notes: string[];
  }>;
  abruptTransitionCount: number;
};

export type ChapterRhythmAssessment = {
  sceneWordCounts: number[];
  lengthCoefficientOfVariation: number | null;
  beatLabels: string[];
  longestRepeatedBeatRun: number;
  tensionProxyByScene: number[];
  flatTensionCurve: boolean;
  notes: string[];
};

export type ChapterRevealAssessment = {
  revealKeywordHitsByScene: number[];
  firstHeavyRevealIndex: number | null;
  revealTooEarly: boolean;
  crowdedLateReveals: boolean;
  notes: string[];
};

export type ChapterOpeningAssessment = {
  firstSceneId: string | null;
  firstSceneWordCount: number;
  weakHook: boolean;
  slowStart: boolean;
  notes: string[];
};

export type ChapterEndingAssessment = {
  lastSceneId: string | null;
  lastSceneWordCount: number;
  endsWithQuestion: boolean;
  weakCadence: boolean;
  notes: string[];
};

export type ChapterCoherenceReport = {
  contractVersion: typeof CHAPTER_COHERENCE_REPORT_VERSION;
  chapterId: string;
  bookId: string;
  title: string;
  sceneCount: number;
  sceneOrderSummary: SceneOrderSummary;
  transitionAssessments: ChapterTransitionAssessment;
  rhythmAssessment: ChapterRhythmAssessment;
  revealAssessment: ChapterRevealAssessment;
  openingAssessment: ChapterOpeningAssessment;
  endingAssessment: ChapterEndingAssessment;
  coherenceIssues: ChapterCoherenceIssue[];
  overallCoherenceScore: number;
  /** True when this report is observation-only (no writes implied). */
  advisoryOnly: true;
  /** Input fingerprint for reproducibility. */
  inputContentHash: string;
  builtAtIso: string;
};

export type ChapterRefinementMode =
  | "REASSEMBLE_ONLY"
  | "GENERATE_TRANSITION_GUIDANCE"
  | "REORDER_SCENE_SUGGESTION"
  | "CHAPTER_SUMMARY_REWRITE"
  | "NO_AUTOMATIC_CHANGE";

export type ChapterRefinementPlan = {
  contractVersion: "1";
  chapterId: string;
  mode: ChapterRefinementMode;
  /** Mirrors deterministic report hash slice. */
  basedOnReportHash: string;
  reasons: string[];
  notes: string[];
};

/** Optional LLM layer — advisory JSON, never auto-promoted to canon. */
export const CHAPTER_REFINEMENT_GUIDANCE_VERSION = "chapter-refinement-guidance-v1" as const;

export type ChapterRefinementGuidanceV1 = {
  contractVersion: typeof CHAPTER_REFINEMENT_GUIDANCE_VERSION;
  explanations: string[];
  /** Suggested scene id order (same set as chapter); author must apply manually. */
  suggestedSceneReorderIds: string[] | null;
  transitionEmphasis: Array<{
    afterSceneId: string;
    emphasis: string;
  }>;
  missingScenePurpose: string | null;
  confidence: number;
  modelNotes: string | null;
};
