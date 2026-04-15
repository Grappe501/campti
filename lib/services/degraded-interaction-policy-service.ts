/**
 * Resolve degraded interaction behavior when balance gating is unavailable.
 */
import type { DegradedInteractionPolicy } from "@/lib/domain/degraded-interaction-policy";
import type { ReaderInteractionBalanceUnavailableReason } from "@/lib/services/reader-interaction-balance-service";

export type ReaderEntitlementTier = "free" | "standard" | "premium" | "admin";
export type RuntimeEnvironment = "development" | "test" | "production";

function parseOverride(raw: string | undefined): DegradedInteractionPolicy | null {
  const normalized = raw?.trim().toLowerCase();
  if (!normalized) return null;
  if (
    normalized === "blocked_all" ||
    normalized === "allow_read_only" ||
    normalized === "allow_limited_free_turns" ||
    normalized === "allow_system_fallback_only"
  ) {
    return normalized;
  }
  return null;
}

export function resolveDegradedInteractionPolicy(input: {
  unavailableReason: ReaderInteractionBalanceUnavailableReason;
  readerEntitlement: ReaderEntitlementTier;
  environment: RuntimeEnvironment;
}): DegradedInteractionPolicy {
  const override = parseOverride(process.env.DEGRADED_INTERACTION_POLICY_OVERRIDE);
  if (override && input.environment !== "production") {
    return override;
  }

  if (input.unavailableReason === "schema_missing") {
    return "allow_read_only";
  }
  if (input.unavailableReason === "provider_failure") {
    return "allow_system_fallback_only";
  }

  if (input.readerEntitlement === "free") {
    return "allow_read_only";
  }

  if (input.readerEntitlement === "admin" && input.environment !== "production") {
    return "allow_limited_free_turns";
  }
  return "blocked_all";
}
