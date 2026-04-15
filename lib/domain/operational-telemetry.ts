/**
 * Phase 7 / Chunk 1 — operational telemetry model.
 * Observational only; must never include canonical narrative truth internals.
 */
export const TELEMETRY_EVENT_CONTRACT_VERSION = "1" as const;

export type TelemetryEventType =
  | "reader_action"
  | "mode_change"
  | "interaction_event"
  | "reentry_event"
  | "degraded_event"
  | "session_lifecycle";

export type TelemetryClassification =
  | "reader_behavior"
  | "interaction_runtime"
  | "reentry_continuity"
  | "degraded_operations"
  | "session_operations";

export type TelemetryEvent = {
  contractVersion: typeof TELEMETRY_EVENT_CONTRACT_VERSION;
  eventId: string;
  eventType: TelemetryEventType;
  classification: TelemetryClassification;
  sessionId: string;
  readerIdHash: string;
  atIso: string;
  payload: Record<string, string | number | boolean | null>;
  /**
   * Explicitly observational to preserve "truth over convenience".
   */
  observedStateOnly: true;
};

export const TELEMETRY_FORBIDDEN_PAYLOAD_KEYS = [
  "canonicalStoryState",
  "forbiddenNarrativeKnowledge",
  "futureArcOutcome",
  "authorOnlyReveal",
  "hiddenContinuityState",
] as const;

export type StructuredTelemetryLogEntry = {
  level: "info" | "warning";
  source: "reader_client" | "orchestrator" | "moderation" | "operator_surface";
  message: string;
  event: TelemetryEvent;
  droppedForbiddenKeys: string[];
};
