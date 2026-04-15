import {
  READER_BEHAVIOR_SUMMARY_CONTRACT_VERSION,
  type ReaderBehaviorSummary,
} from "@/lib/domain/reader-behavior-summary";
import type { TelemetryEvent } from "@/lib/domain/operational-telemetry";

export function summarizeReaderBehavior(input: {
  dateKey: string;
  events: TelemetryEvent[];
}): ReaderBehaviorSummary {
  const modeUsage: Record<string, number> = {};
  const sessionStarts = new Map<string, number>();
  const sessionDurations: number[] = [];
  let interactionEvents = 0;
  let reentryEvents = 0;
  let droppedSessions = 0;

  for (const event of input.events) {
    if (event.eventType === "mode_change") {
      const mode = String(event.payload.mode ?? "unknown");
      modeUsage[mode] = (modeUsage[mode] ?? 0) + 1;
    }

    if (event.eventType === "interaction_event") {
      interactionEvents += 1;
      if (event.payload.outcome === "abandoned") {
        droppedSessions += 1;
      }
    }

    if (event.eventType === "reentry_event") {
      reentryEvents += 1;
    }

    if (event.eventType === "session_lifecycle" && event.payload.phase === "started") {
      sessionStarts.set(event.sessionId, Date.parse(event.atIso));
    }
    if (event.eventType === "session_lifecycle" && event.payload.phase === "ended") {
      const start = sessionStarts.get(event.sessionId);
      if (typeof start === "number") {
        sessionDurations.push(Math.max(0, Math.floor((Date.parse(event.atIso) - start) / 1000)));
      }
    }
  }

  const sessionsObserved = Math.max(
    sessionStarts.size,
    new Set(input.events.filter((event) => event.eventType === "session_lifecycle").map((event) => event.sessionId))
      .size
  );
  const averageSessionDurationSeconds =
    sessionDurations.length > 0
      ? Math.floor(sessionDurations.reduce((sum, seconds) => sum + seconds, 0) / sessionDurations.length)
      : 0;

  const dropOffRate =
    sessionsObserved > 0 ? Number((Math.min(droppedSessions, sessionsObserved) / sessionsObserved).toFixed(3)) : 0;
  const interactionsPerSession =
    sessionsObserved > 0 ? Number((interactionEvents / sessionsObserved).toFixed(3)) : 0;
  const reentryRate = sessionsObserved > 0 ? Number((reentryEvents / sessionsObserved).toFixed(3)) : 0;

  return {
    contractVersion: READER_BEHAVIOR_SUMMARY_CONTRACT_VERSION,
    dateKey: input.dateKey,
    sessionsObserved,
    averageSessionDurationSeconds,
    dropOffRate,
    modeUsage,
    interactionsPerSession,
    reentryRate,
    containsSensitiveInference: false,
  };
}
