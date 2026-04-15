/**
 * Degraded interaction policy when paid unit balance is unavailable.
 */
export const DEGRADED_INTERACTION_POLICIES = [
  "blocked_all",
  "allow_read_only",
  "allow_limited_free_turns",
  "allow_system_fallback_only",
] as const;

export type DegradedInteractionPolicy = (typeof DEGRADED_INTERACTION_POLICIES)[number];

export type DegradedInteractionUnavailableReason =
  | "schema_missing"
  | "provider_failure"
  | "unknown_runtime_unavailable";

export type DegradedInteractionStateSummary = {
  currentPolicy: DegradedInteractionPolicy | null;
  unavailableReason: DegradedInteractionUnavailableReason | null;
  freeTurnCount: number;
  lastTurnUsedDegradedFallback: boolean;
  /**
   * Optional operational classification for the most recent degraded outcome.
   * Keeps failure/degrade provenance explicit for operators without changing policy semantics.
   */
  lastFallbackCause: "balance_unavailable" | "provider_resilience" | "moderation" | "cost_governance" | null;
};
