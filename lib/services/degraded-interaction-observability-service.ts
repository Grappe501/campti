/**
 * Observability helper for degraded interaction session metadata.
 */
import type { Prisma } from "@prisma/client";

import type {
  DegradedInteractionPolicy,
  DegradedInteractionStateSummary,
  DegradedInteractionUnavailableReason,
} from "@/lib/domain/degraded-interaction-policy";

function parseRootMetadata(json: Prisma.JsonValue | null): Record<string, unknown> {
  if (json != null && typeof json === "object" && !Array.isArray(json)) {
    return { ...(json as Record<string, unknown>) };
  }
  return {};
}

function asPolicy(value: unknown): DegradedInteractionPolicy | null {
  if (
    value === "blocked_all" ||
    value === "allow_read_only" ||
    value === "allow_limited_free_turns" ||
    value === "allow_system_fallback_only"
  ) {
    return value;
  }
  return null;
}

function asReason(value: unknown): DegradedInteractionUnavailableReason | null {
  if (
    value === "schema_missing" ||
    value === "provider_failure" ||
    value === "unknown_runtime_unavailable"
  ) {
    return value;
  }
  return null;
}

export function summarizeDegradedInteractionState(
  sessionMetadata: Prisma.JsonValue | null
): DegradedInteractionStateSummary {
  const root = parseRootMetadata(sessionMetadata);
  const degraded = root.degradedInteraction;
  if (!degraded || typeof degraded !== "object" || Array.isArray(degraded)) {
    return {
      currentPolicy: null,
      unavailableReason: null,
      freeTurnCount: 0,
      lastTurnUsedDegradedFallback: false,
      lastFallbackCause: null,
    };
  }
  const d = degraded as Record<string, unknown>;
  const fallbackCause =
    d.lastFallbackCause === "balance_unavailable" ||
    d.lastFallbackCause === "provider_resilience" ||
    d.lastFallbackCause === "moderation" ||
    d.lastFallbackCause === "cost_governance"
      ? d.lastFallbackCause
      : null;
  return {
    currentPolicy: asPolicy(d.currentPolicy),
    unavailableReason: asReason(d.unavailableReason),
    freeTurnCount:
      typeof d.freeTurnCount === "number" && Number.isFinite(d.freeTurnCount) && d.freeTurnCount >= 0
        ? Math.floor(d.freeTurnCount)
        : 0,
    lastTurnUsedDegradedFallback: d.lastTurnUsedDegradedFallback === true,
    lastFallbackCause: fallbackCause,
  };
}
