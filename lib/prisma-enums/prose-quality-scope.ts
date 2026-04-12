/** Mirrors `ProseQualityAnalysisScope` in schema until `prisma generate` refreshes client types. */
export const ProseQualityAnalysisScopeValues = {
  SCENE: "SCENE",
  CHAPTER_ASSEMBLY: "CHAPTER_ASSEMBLY",
} as const;

export type ProseQualityAnalysisScopeValue =
  (typeof ProseQualityAnalysisScopeValues)[keyof typeof ProseQualityAnalysisScopeValues];
