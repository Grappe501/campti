/**
 * P3-M — Deterministic long-session memory compression.
 *
 * This summary is a bounded continuity aid for interaction sessions.
 * It is not canonical truth and does not replace persisted transcript turns.
 */
export type SessionMemorySummary = {
  keyReaderDisclosures: string[];
  keyCharacterDisclosures: string[];
  unresolvedTopics: string[];
  trustMovementSummary: string;
  emotionalBeatSummary: string;
  latestSessionSummaryHash: string;
  builtAtIso: string;
};
