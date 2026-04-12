import type { CharacterVoiceProfile, NarrativeVoiceProfile } from "@prisma/client";

/** Human-declared scene goals; drives rule-based suggestions (not model truth). */
export type AuthorSceneGoals = {
  /** Prefer withholding / gap over explanation */
  privilegeSilence?: boolean;
  /** Flag if land/tenure/place not concrete in scene */
  requireLandAnchor?: boolean;
  /** Encourage embodied verbs/sensation */
  requireBodyAnchors?: boolean;
  /** Minimum count of `historicalAnchorTerms` that should appear */
  minHistoricalTermHits?: number;
  /** Free text for UI + future AI assist prompt assembly */
  emotionalObjective?: string;
  /** Themes author wants carried (silence, memory, power, etc.) */
  thematicPressures?: string[];
};

export type Severity = "info" | "warning" | "critical";

export type ProseIssue = {
  code: string;
  severity: Severity;
  message: string;
  excerpt?: string;
  startOffset?: number;
  endOffset?: number;
};

export type RhythmMetrics = {
  sentenceCount: number;
  lengths: number[];
  meanLength: number;
  stdevLength: number;
  coefficientOfVariation: number;
  maxRunSameLengthBucket: number;
  monotonousRhythm: boolean;
};

export type RepeatedPhraseHit = {
  normalized: string;
  count: number;
  exampleExcerpt?: string;
};

export type ClicheHit = {
  phrase: string;
  excerpt: string;
  startOffset: number;
  endOffset: number;
};

export type SensoryMetrics = {
  sensoryHits: number;
  abstractHits: number;
  ratio: number;
  thinExcerpts: string[];
};

export type DialogueMetrics = {
  quotedSegments: number;
  /** 0–1 higher = more distinct word choice between alternating quoted blocks; null if not computable */
  alternatingDistinctiveness: number | null;
  note: string | null;
};

export type VoiceFitMetrics = {
  narrativeProfileTermsMatched: number;
  narrativeProfileTermsTotal: number;
  characterProfileTermsMatched: number;
  characterProfileTermsTotal: number;
  issues: ProseIssue[];
};

export type HistoricalAnchorMetrics = {
  termsRequested: string[];
  termsFound: string[];
  termsMissing: string[];
  hitRate: number;
};

export type ProseQualityReportV1 = {
  version: 1;
  analyzerKind: "deterministic_v1";
  proseStats: {
    wordCount: number;
    paragraphCount: number;
    sha256: string;
  };
  rhythm: RhythmMetrics;
  repetition: {
    phrases: RepeatedPhraseHit[];
    maxNgram: number;
  };
  cliche: {
    hits: ClicheHit[];
  };
  sensory: SensoryMetrics;
  dialogue: DialogueMetrics;
  voiceFit: VoiceFitMetrics;
  historicalAnchors: HistoricalAnchorMetrics | null;
  issues: ProseIssue[];
};

export type RewriteSuggestion = {
  id: string;
  priority: number;
  target: "sentence" | "paragraph" | "scene" | "dialogue" | "voice";
  message: string;
  /** Concrete craft moves—author executes */
  craftMoves: string[];
};

export type ProseComparisonV1 = {
  version: 1;
  leftLabel: string;
  rightLabel: string;
  leftWordCount: number;
  rightWordCount: number;
  sentencesAdded: number;
  sentencesRemoved: number;
  sentencesUnchanged: number;
  stabilityRatio: number;
  /** Unified diff of sentence lines (human-readable) */
  diffLines: string[];
};

export type AnalyzeProseContext = {
  narrativeVoiceProfile?: Pick<
    NarrativeVoiceProfile,
    | "sentenceRhythm"
    | "dictionStyle"
    | "sensoryBias"
    | "silenceStyle"
    | "memoryStyle"
    | "interiorityStyle"
    | "notes"
  > | null;
  characterVoiceProfile?: Pick<
    CharacterVoiceProfile,
    | "dictionLevel"
    | "rhythmStyle"
    | "metaphorStyle"
    | "dialectNotes"
    | "silencePatterns"
    | "emotionalExpressionStyle"
    | "notes"
  > | null;
  /** Lowercase terms author expects for era/place/material culture */
  historicalAnchorTerms?: string[];
  authorGoals?: AuthorSceneGoals;
};
