import type { ReaderCockpitPayload } from "@/lib/domain/reader-cockpit-payload";

export type UnifiedDegradedUxState =
  | {
      state: "healthy";
      headline: string;
      detail: string;
      severity: "info";
    }
  | {
      state: "provider_failure";
      headline: string;
      detail: string;
      severity: "warning";
    }
  | {
      state: "moderation_block";
      headline: string;
      detail: string;
      severity: "warning";
    }
  | {
      state: "entitlement_limit";
      headline: string;
      detail: string;
      severity: "warning";
    }
  | {
      state: "read_only_fallback";
      headline: string;
      detail: string;
      severity: "warning";
    };

export function resolveUnifiedDegradedUxState(input: {
  cockpit: ReaderCockpitPayload | null;
  lastErrorMessage?: string | null;
}): UnifiedDegradedUxState {
  const errorMessage = input.lastErrorMessage?.toLowerCase() ?? "";
  if (errorMessage.includes("safety policy") || errorMessage.includes("refuses this line of inquiry")) {
    return {
      state: "moderation_block",
      headline: "Interaction blocked by safety policy",
      detail: "This line cannot continue. Story truth and safety constraints remain enforced.",
      severity: "warning",
    };
  }
  const degraded = input.cockpit?.degradedInteraction;
  const policy = degraded?.currentPolicy ?? null;
  if (degraded?.unavailableReason === "provider_failure" || policy === "allow_system_fallback_only") {
    return {
      state: "provider_failure",
      headline: "Provider degraded mode active",
      detail: "Replies may use bounded fallback until provider health recovers.",
      severity: "warning",
    };
  }
  if (policy === "allow_read_only" || policy === "blocked_all") {
    return {
      state: "read_only_fallback",
      headline: "Read-only fallback active",
      detail: "Interaction is paused to preserve narrative integrity in degraded conditions.",
      severity: "warning",
    };
  }
  if (errorMessage.includes("insufficient_balance") || errorMessage.includes("not enough interaction units")) {
    return {
      state: "entitlement_limit",
      headline: "Interaction limit reached",
      detail: "Your entitlement currently blocks new turns; reading remains available.",
      severity: "warning",
    };
  }
  return {
    state: "healthy",
    headline: "Interaction healthy",
    detail: "Narrative and interaction systems are operating normally.",
    severity: "info",
  };
}
