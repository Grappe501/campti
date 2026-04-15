import {
  AUTHOR_INTENT_CONTRACT_VERSION,
  type AuthorIntent,
  type AuthorSteeringResult,
} from "@/lib/domain/author-intent";

function clampSteeringDelta(value: number): number {
  return Math.max(-25, Math.min(25, Math.round(value)));
}

function mergeSignals(signals: AuthorIntent["emphasisSignals"]): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const signal of signals) {
    const key = signal.signalId.trim();
    if (!key) continue;
    merged[key] = (merged[key] ?? 0) + signal.weightDelta;
  }
  return merged;
}

export function createAuthorIntent(input: Omit<AuthorIntent, "contractVersion">): AuthorIntent {
  return {
    contractVersion: AUTHOR_INTENT_CONTRACT_VERSION,
    ...input,
  };
}

export function applyBoundedAuthorSteering(input: {
  intent: AuthorIntent;
  legalSignalIds: string[];
  illegalSignalIds: string[];
}): AuthorSteeringResult {
  const legal = new Set(input.legalSignalIds.map((id) => id.trim()).filter(Boolean));
  const illegal = new Set(input.illegalSignalIds.map((id) => id.trim()).filter(Boolean));

  const aggregated = mergeSignals([
    ...input.intent.emphasisSignals,
    ...input.intent.suppressionSignals,
    ...input.intent.pressureAdjustments,
  ]);

  const appliedWeightDeltas: Record<string, number> = {};
  const rejectedSignals: string[] = [];

  for (const [signalId, delta] of Object.entries(aggregated)) {
    if (!legal.has(signalId) || illegal.has(signalId)) {
      rejectedSignals.push(signalId);
      continue;
    }
    appliedWeightDeltas[signalId] = clampSteeringDelta(delta);
  }

  return {
    appliedWeightDeltas,
    rejectedSignals,
    forceOverrideApplied: false,
  };
}
