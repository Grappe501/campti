/**
 * P4-F — Aggregated product engagement metrics (no raw transcript storage).
 */
export type EngagementDropOffPoint =
  | "before_first_turn"
  | "mid_conversation"
  | "after_voice_preview"
  | "completed_session";

export type EngagementMetricEvent =
  | {
      kind: "session_started";
      sessionId: string;
      readerId: string;
      characterId: string;
      atIso: string;
    }
  | {
      kind: "turn_submitted";
      sessionId: string;
      readerId: string;
      atIso: string;
    }
  | {
      kind: "voice_used";
      sessionId: string;
      readerId: string;
      atIso: string;
    }
  | {
      kind: "session_ended";
      sessionId: string;
      readerId: string;
      atIso: string;
      dropOffPoint: EngagementDropOffPoint;
    };

export type EngagementAnalyticsAggregate = {
  dateKey: string;
  sessionsStarted: number;
  sessionsEnded: number;
  turnsSubmitted: number;
  uniqueCharactersInteracted: number;
  voiceUsageCount: number;
  averageSessionLengthSeconds: number;
  dropOffCounts: Partial<Record<EngagementDropOffPoint, number>>;
};

