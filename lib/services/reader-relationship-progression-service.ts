/**
 * P3-N — Reader relationship progression derivation service.
 *
 * Derived-only by default. No required persistence.
 */
import type { CharacterReaderMemory } from "@/lib/domain/character-reader-memory";
import type { SessionMemorySummary } from "@/lib/domain/session-memory-summary";
import type { ReaderRelationshipProgression, ReaderRelationshipState } from "@/lib/domain/reader-relationship-progression";

function inferDisclosureCount(memory: CharacterReaderMemory | null, summary: SessionMemorySummary | null): number {
  const memoryCount =
    memory?.knownFacts && typeof memory.knownFacts === "object" && !Array.isArray(memory.knownFacts)
      ? Object.keys(memory.knownFacts as Record<string, unknown>).length
      : 0;
  const summaryCount = summary?.keyReaderDisclosures.length ?? 0;
  return Math.max(memoryCount, summaryCount);
}

function deriveState(input: {
  familiarityLevel: number;
  interactionCount: number;
  keyDisclosureCount: number;
  summary: SessionMemorySummary | null;
}): ReaderRelationshipState {
  const trustBoost =
    input.summary?.trustMovementSummary === "high_trust_stability" ||
    input.summary?.trustMovementSummary === "growing_familiarity";
  if (input.familiarityLevel >= 80 || (input.interactionCount >= 18 && input.keyDisclosureCount >= 6)) {
    return "confidant";
  }
  if (input.familiarityLevel >= 60 || (trustBoost && input.interactionCount >= 10)) {
    return "trusted";
  }
  if (input.familiarityLevel >= 35 || input.interactionCount >= 6 || input.keyDisclosureCount >= 2) {
    return "familiar";
  }
  if (input.familiarityLevel >= 12 || input.interactionCount >= 2) {
    return "recognized";
  }
  return "stranger";
}

function mapBehaviorOutputs(state: ReaderRelationshipState): Pick<
  ReaderRelationshipProgression,
  "directnessLevel" | "vulnerabilityAllowance" | "disclosureComfortBand" | "greetingStyleHint"
> {
  switch (state) {
    case "stranger":
      return {
        directnessLevel: "guarded",
        vulnerabilityAllowance: "minimal",
        disclosureComfortBand: "none",
        greetingStyleHint: "formal distance",
      };
    case "recognized":
      return {
        directnessLevel: "measured",
        vulnerabilityAllowance: "limited",
        disclosureComfortBand: "basic",
        greetingStyleHint: "cautious recognition",
      };
    case "familiar":
      return {
        directnessLevel: "measured",
        vulnerabilityAllowance: "moderate",
        disclosureComfortBand: "personal",
        greetingStyleHint: "warm familiarity",
      };
    case "trusted":
      return {
        directnessLevel: "open",
        vulnerabilityAllowance: "high",
        disclosureComfortBand: "personal",
        greetingStyleHint: "trusted warmth",
      };
    case "confidant":
      return {
        directnessLevel: "frank",
        vulnerabilityAllowance: "high",
        disclosureComfortBand: "intimate",
        greetingStyleHint: "intimate confidence",
      };
  }
}

export function deriveReaderRelationshipProgression(input: {
  readerMemory: CharacterReaderMemory | null;
  sessionMemorySummary?: SessionMemorySummary | null;
}): ReaderRelationshipProgression {
  const familiarityLevel = input.readerMemory?.familiarityLevel ?? 0;
  const interactionCount = input.readerMemory?.interactionCount ?? 0;
  const keyDisclosureCount = inferDisclosureCount(
    input.readerMemory,
    input.sessionMemorySummary ?? null
  );
  const relationshipState = deriveState({
    familiarityLevel,
    interactionCount,
    keyDisclosureCount,
    summary: input.sessionMemorySummary ?? null,
  });
  const behavior = mapBehaviorOutputs(relationshipState);
  return {
    relationshipState,
    familiarityLevel,
    interactionCount,
    keyDisclosureCount,
    ...behavior,
  };
}
