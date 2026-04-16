import type { GuidedSignal, ScopeIndicatorBank } from "@/lib/domain/author-command-cockpit";

export function deriveGuidedSignals(input: {
  indicatorBank: ScopeIndicatorBank;
  threshold?: "medium" | "high";
}): GuidedSignal[] {
  const threshold = input.threshold ?? "high";
  const acceptedSeverities = threshold === "high" ? ["high"] : ["high", "medium"];

  return input.indicatorBank.indicators
    .filter((indicator) => acceptedSeverities.includes(indicator.severity))
    .slice(0, 8)
    .map((indicator, index) => ({
      signalId: `${input.indicatorBank.scope}-signal-${index + 1}`,
      summary: buildSignalSummary(indicator.key),
      rationale: `${indicator.label} is ${indicator.severity} from governed indicator state (${String(indicator.value)}).`,
      severity: indicator.severity,
      bounded: true,
      explainable: true,
      advisoryOnly: true,
    }));
}

function buildSignalSummary(key: string): string {
  if (key.includes("transition_brittleness")) return "Chapter transition risk elevated.";
  if (key.includes("relationship_tension")) return "Relationship arc underdeveloped or unstable.";
  if (key.includes("pressure_distribution")) return "Pressure imbalance detected across scope.";
  if (key.includes("continuity_risk") || key.includes("multi_book_continuity")) return "Continuity warning present.";
  if (key.includes("release_readiness")) return "Release readiness blocked.";
  if (key.includes("unresolved_blockers")) return "Unresolved blockers require action.";
  if (key.includes("branch_risk")) return "Branch risk is elevated.";
  return "Indicator risk requires author review.";
}
