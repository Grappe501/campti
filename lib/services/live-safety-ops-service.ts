import { MODERATION_OPS_CONTRACT_VERSION, type ModerationOpsSummary } from "@/lib/domain/moderation-ops";

type ModerationViolationEvent = {
  violationId: string;
  escalated: boolean;
  resolved: boolean;
};

type DegradedOperationEvent = {
  fallbackTriggered: boolean;
  providerFailure: boolean;
};

export function summarizeLiveSafetyOps(input: {
  windowStartIso: string;
  windowEndIso: string;
  moderationEvents: ModerationViolationEvent[];
  degradedEvents: DegradedOperationEvent[];
}): ModerationOpsSummary {
  const escalationsTriggered = input.moderationEvents.filter((event) => event.escalated).length;
  const unresolvedEscalations = input.moderationEvents.filter(
    (event) => event.escalated && !event.resolved
  ).length;
  const degradedFallbackFrequency = input.degradedEvents.filter((event) => event.fallbackTriggered).length;
  const providerFailures = input.degradedEvents.filter((event) => event.providerFailure).length;

  return {
    contractVersion: MODERATION_OPS_CONTRACT_VERSION,
    windowStartIso: input.windowStartIso,
    windowEndIso: input.windowEndIso,
    violationsTracked: input.moderationEvents.length,
    escalationsTriggered,
    unresolvedEscalations,
    degradedFallbackFrequency,
    providerFailures,
  };
}
