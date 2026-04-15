export const MANUSCRIPT_COHERENCE_CONTRACT_VERSION = "1" as const;

export type ManuscriptCoherenceFinding = {
  findingId: string;
  category:
    | "chapter_to_chapter_continuity"
    | "arc_consistency"
    | "pacing"
    | "contradiction"
    | "character_drift_plausibility"
    | "thematic_recurrence";
  severity: "low" | "moderate" | "high";
  message: string;
};

export type ManuscriptCoherenceReport = {
  contractVersion: typeof MANUSCRIPT_COHERENCE_CONTRACT_VERSION;
  manuscriptId: string;
  findings: ManuscriptCoherenceFinding[];
  chapterBrittlenessRisk: "low" | "moderate" | "high";
  pressureDriftRisk: "low" | "moderate" | "high";
  coherencePass: boolean;
};
