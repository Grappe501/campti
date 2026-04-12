export type {
  AnalyzeProseContext,
  AuthorSceneGoals,
  ProseComparisonV1,
  ProseQualityReportV1,
  RewriteSuggestion,
} from "@/lib/prose-quality/types";
export { analyzeProseDeterministic } from "@/lib/prose-quality/analyze-deterministic";
export { compareProseDrafts } from "@/lib/prose-quality/compare-drafts";
export { suggestionsFromGoalsAndReport } from "@/lib/prose-quality/goal-suggestions";
export { extractQuotedSegments, dialogueDistinctiveness } from "@/lib/prose-quality/dialogue";
export { splitSentences } from "@/lib/prose-quality/sentence-split";
