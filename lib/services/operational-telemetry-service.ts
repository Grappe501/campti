import {
  TELEMETRY_EVENT_CONTRACT_VERSION,
  TELEMETRY_FORBIDDEN_PAYLOAD_KEYS,
  type StructuredTelemetryLogEntry,
  type TelemetryClassification,
  type TelemetryEvent,
  type TelemetryEventType,
} from "@/lib/domain/operational-telemetry";

const telemetryLog: StructuredTelemetryLogEntry[] = [];
const telemetryEvents: TelemetryEvent[] = [];

function classifyTelemetryEventType(eventType: TelemetryEventType): TelemetryClassification {
  switch (eventType) {
    case "reader_action":
    case "mode_change":
      return "reader_behavior";
    case "interaction_event":
      return "interaction_runtime";
    case "reentry_event":
      return "reentry_continuity";
    case "degraded_event":
      return "degraded_operations";
    case "session_lifecycle":
      return "session_operations";
    default: {
      const exhaustiveCheck: never = eventType;
      throw new Error(`[telemetry] Unsupported event type: ${String(exhaustiveCheck)}`);
    }
  }
}

function sanitizePayload(payload: Record<string, string | number | boolean | null>): {
  sanitized: Record<string, string | number | boolean | null>;
  droppedForbiddenKeys: string[];
} {
  const sanitized: Record<string, string | number | boolean | null> = {};
  const droppedForbiddenKeys: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (TELEMETRY_FORBIDDEN_PAYLOAD_KEYS.includes(key as (typeof TELEMETRY_FORBIDDEN_PAYLOAD_KEYS)[number])) {
      droppedForbiddenKeys.push(key);
      continue;
    }
    sanitized[key] = value;
  }
  return { sanitized, droppedForbiddenKeys };
}

export function createTelemetryEvent(input: {
  eventId: string;
  eventType: TelemetryEventType;
  sessionId: string;
  readerIdHash: string;
  atIso: string;
  payload: Record<string, string | number | boolean | null>;
}): TelemetryEvent {
  const classification = classifyTelemetryEventType(input.eventType);
  const { sanitized, droppedForbiddenKeys } = sanitizePayload(input.payload);
  if (droppedForbiddenKeys.length > 0) {
    throw new Error(
      `[telemetry] Forbidden narrative payload keys detected: ${droppedForbiddenKeys.join(", ")}.`
    );
  }
  return {
    contractVersion: TELEMETRY_EVENT_CONTRACT_VERSION,
    eventId: input.eventId,
    eventType: input.eventType,
    classification,
    sessionId: input.sessionId,
    readerIdHash: input.readerIdHash,
    atIso: input.atIso,
    payload: sanitized,
    observedStateOnly: true,
  };
}

export function recordTelemetryEvent(input: {
  source: StructuredTelemetryLogEntry["source"];
  event: TelemetryEvent;
}): StructuredTelemetryLogEntry {
  const entry: StructuredTelemetryLogEntry = {
    level: "info",
    source: input.source,
    message: `[telemetry] ${input.event.eventType} observed`,
    event: input.event,
    droppedForbiddenKeys: [],
  };
  telemetryEvents.push(input.event);
  telemetryLog.push(entry);
  return entry;
}

export function getTelemetrySnapshot(): { events: TelemetryEvent[]; logEntries: StructuredTelemetryLogEntry[] } {
  return {
    events: [...telemetryEvents],
    logEntries: [...telemetryLog],
  };
}

export function resetOperationalTelemetryForTests(): void {
  telemetryEvents.splice(0, telemetryEvents.length);
  telemetryLog.splice(0, telemetryLog.length);
}
