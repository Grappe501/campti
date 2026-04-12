import type { AgeMaturityThoughtStyle, CharacterAgeBand } from "@/lib/domain/inner-voice";

const TABLE: Record<
  CharacterAgeBand,
  Omit<AgeMaturityThoughtStyle, "ageBand" | "assumedBand" | "summaryForModel">
> = {
  EARLY_CHILD: {
    abstractionCeiling: 3,
    memoryGranularity: 8,
    emotionalVolatility: 8,
    selfObservationCapacity: 2,
    impulseDominance: 9,
    futurePlanningDepth: 2,
    symbolicThinkingLevel: 6,
    shameSensitivity: 6,
    authorityInternalization: 7,
  },
  LATE_CHILD: {
    abstractionCeiling: 4,
    memoryGranularity: 7,
    emotionalVolatility: 7,
    selfObservationCapacity: 3,
    impulseDominance: 8,
    futurePlanningDepth: 3,
    symbolicThinkingLevel: 6,
    shameSensitivity: 7,
    authorityInternalization: 8,
  },
  ADOLESCENT: {
    abstractionCeiling: 6,
    memoryGranularity: 6,
    emotionalVolatility: 9,
    selfObservationCapacity: 5,
    impulseDominance: 8,
    futurePlanningDepth: 5,
    symbolicThinkingLevel: 7,
    shameSensitivity: 9,
    authorityInternalization: 7,
  },
  YOUNG_ADULT: {
    abstractionCeiling: 7,
    memoryGranularity: 5,
    emotionalVolatility: 7,
    selfObservationCapacity: 6,
    impulseDominance: 6,
    futurePlanningDepth: 6,
    symbolicThinkingLevel: 6,
    shameSensitivity: 7,
    authorityInternalization: 6,
  },
  ADULT: {
    abstractionCeiling: 8,
    memoryGranularity: 5,
    emotionalVolatility: 5,
    selfObservationCapacity: 7,
    impulseDominance: 5,
    futurePlanningDepth: 7,
    symbolicThinkingLevel: 6,
    shameSensitivity: 6,
    authorityInternalization: 7,
  },
  ELDER: {
    abstractionCeiling: 8,
    memoryGranularity: 6,
    emotionalVolatility: 4,
    selfObservationCapacity: 8,
    impulseDominance: 4,
    futurePlanningDepth: 6,
    symbolicThinkingLevel: 7,
    shameSensitivity: 6,
    authorityInternalization: 8,
  },
};

export function buildAgeMaturityThoughtStyle(
  ageBand: CharacterAgeBand,
  assumedBand: boolean
): AgeMaturityThoughtStyle {
  const row = TABLE[ageBand];
  const summaryForModel = [
    `Age band: ${ageBand}${assumedBand ? " (assumed — set birth/story year)" : ""}.`,
    `Abstraction ceiling ~${row.abstractionCeiling}/10; impulse dominance ~${row.impulseDominance}/10.`,
    `Self-observation ~${row.selfObservationCapacity}/10; shame sensitivity ~${row.shameSensitivity}/10.`,
    "Use period-appropriate diction; do not default to modern therapeutic vocabulary unless world state explicitly allows.",
  ].join(" ");

  return {
    ageBand,
    assumedBand,
    ...row,
    summaryForModel,
  };
}
