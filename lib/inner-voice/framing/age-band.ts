import type { CharacterAgeBand } from "@/lib/domain/inner-voice";

/** Map numeric age to band; thresholds are project defaults (tunable per epic later). */
export function resolveCharacterAgeBand(ageYears: number | null): {
  band: CharacterAgeBand;
  assumed: boolean;
} {
  if (ageYears == null || !Number.isFinite(ageYears) || ageYears < 0) {
    return { band: "ADULT", assumed: true };
  }
  const a = Math.floor(ageYears);
  if (a <= 7) return { band: "EARLY_CHILD", assumed: false };
  if (a <= 12) return { band: "LATE_CHILD", assumed: false };
  if (a <= 17) return { band: "ADOLESCENT", assumed: false };
  if (a <= 25) return { band: "YOUNG_ADULT", assumed: false };
  if (a <= 64) return { band: "ADULT", assumed: false };
  return { band: "ELDER", assumed: false };
}

/**
 * Infer story year hints from scene authoring metadata (no LLM).
 * Extend keys as your `structuredDataJson` schema evolves.
 */
export function inferApproximateStoryYearFromScene(
  structuredDataJson: unknown,
  historicalAnchor: string | null | undefined
): number | null {
  if (structuredDataJson && typeof structuredDataJson === "object" && !Array.isArray(structuredDataJson)) {
    const o = structuredDataJson as Record<string, unknown>;
    for (const key of ["storyYear", "approximateYear", "year", "calendarYear", "sceneYear"]) {
      const v = o[key];
      if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
      if (typeof v === "string" && /^\s*\d{3,4}\s*$/.test(v)) return parseInt(v.trim(), 10);
    }
  }
  if (historicalAnchor) {
    const m = historicalAnchor.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

export function computeCharacterAgeYears(input: {
  birthYear: number | null | undefined;
  deathYear: number | null | undefined;
  approximateStoryYear: number | null;
}): number | null {
  const { birthYear, approximateStoryYear } = input;
  if (birthYear == null || !Number.isFinite(birthYear) || approximateStoryYear == null) {
    return null;
  }
  const story = Math.round(approximateStoryYear);
  const birth = Math.round(birthYear);
  const age = story - birth;
  if (age < 0 || age > 130) return null;
  if (input.deathYear != null && story > input.deathYear) return null;
  return age;
}
