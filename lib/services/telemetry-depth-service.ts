import { TELEMETRY_FORBIDDEN_PAYLOAD_KEYS } from "@/lib/domain/operational-telemetry";
import {
  TELEMETRY_DEPTH_CONTRACT_VERSION,
  TELEMETRY_TAXONOMY,
  type DeepTelemetryEvent,
  type TelemetrySourceTag,
  type TelemetrySurfaceTag,
} from "@/lib/domain/operational-telemetry-depth";

const FORBIDDEN_CONTEXT_KEYS = ["canonicalState", "hiddenArc", "futureOutcome", "authorOnlyState"] as const;

const deepTelemetryEvents: DeepTelemetryEvent[] = [];

function taxonomyEventAllowed(group: keyof typeof TELEMETRY_TAXONOMY, event: string): boolean {
  const allowedEvents = TELEMETRY_TAXONOMY[group] as readonly string[];
  return allowedEvents.includes(event);
}

function assertContextIsUserSafe(userSafeContext: Record<string, string | number | boolean | null>): void {
  const keys = Object.keys(userSafeContext);
  const forbidden = keys.filter(
    (key) =>
      TELEMETRY_FORBIDDEN_PAYLOAD_KEYS.includes(key as (typeof TELEMETRY_FORBIDDEN_PAYLOAD_KEYS)[number]) ||
      FORBIDDEN_CONTEXT_KEYS.includes(key as (typeof FORBIDDEN_CONTEXT_KEYS)[number])
  );
  if (forbidden.length > 0) {
    throw new Error(`[telemetry-depth] forbidden telemetry context keys: ${forbidden.join(", ")}`);
  }
}

export function createDeepTelemetryEvent(input: {
  eventId: string;
  taxonomyGroup: keyof typeof TELEMETRY_TAXONOMY;
  taxonomyEvent: string;
  sourceTag: TelemetrySourceTag;
  surfaceTag: TelemetrySurfaceTag;
  atIso: string;
  correlation: DeepTelemetryEvent["correlation"];
  userSafeContext: DeepTelemetryEvent["userSafeContext"];
}): DeepTelemetryEvent {
  if (!taxonomyEventAllowed(input.taxonomyGroup, input.taxonomyEvent)) {
    throw new Error(
      `[telemetry-depth] taxonomy event '${input.taxonomyEvent}' is not registered for '${input.taxonomyGroup}'.`
    );
  }
  assertContextIsUserSafe(input.userSafeContext);
  return {
    contractVersion: TELEMETRY_DEPTH_CONTRACT_VERSION,
    eventId: input.eventId,
    taxonomyGroup: input.taxonomyGroup,
    taxonomyEvent: input.taxonomyEvent,
    sourceTag: input.sourceTag,
    surfaceTag: input.surfaceTag,
    atIso: input.atIso,
    correlation: { ...input.correlation },
    userSafeContext: { ...input.userSafeContext },
    observedStateOnly: true,
  };
}

export function recordDeepTelemetryEvent(event: DeepTelemetryEvent): void {
  deepTelemetryEvents.push(event);
}

export function summarizeTelemetryDepthCoverage(events: DeepTelemetryEvent[]): {
  eventCount: number;
  byGroup: Record<string, number>;
  bySource: Record<string, number>;
  bySurface: Record<string, number>;
  correlatedSessions: number;
} {
  const byGroup: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const bySurface: Record<string, number> = {};
  const sessionIds = new Set<string>();

  for (const event of events) {
    byGroup[event.taxonomyGroup] = (byGroup[event.taxonomyGroup] ?? 0) + 1;
    bySource[event.sourceTag] = (bySource[event.sourceTag] ?? 0) + 1;
    bySurface[event.surfaceTag] = (bySurface[event.surfaceTag] ?? 0) + 1;
    sessionIds.add(event.correlation.sessionId);
  }

  return {
    eventCount: events.length,
    byGroup,
    bySource,
    bySurface,
    correlatedSessions: sessionIds.size,
  };
}

export function getDeepTelemetryEvents(): DeepTelemetryEvent[] {
  return [...deepTelemetryEvents];
}

export function resetDeepTelemetryForTests(): void {
  deepTelemetryEvents.splice(0, deepTelemetryEvents.length);
}
