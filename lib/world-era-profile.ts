import type { WorldPressureBundle, WorldStateEraProfile } from "@prisma/client";

/** Four-channel weights after era knobs tilt the world pressure bundle (sums to 100). */
export type EffectivePressureWeights = {
  governanceWeight: number;
  economicWeight: number;
  demographicWeight: number;
  familyWeight: number;
};

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Tilts Stage 5 world pressure bundle weights using era knobs (no DB writes).
 * Lower autonomy raises governance tilt; higher economic pressure raises economic tilt; etc.
 */
export function computeEffectivePressureWeights(
  bundle: Pick<WorldPressureBundle, "governanceWeight" | "economicWeight" | "demographicWeight" | "familyWeight"> | null,
  era: WorldStateEraProfile | null,
): EffectivePressureWeights | null {
  if (!bundle || !era) return null;

  const g0 = bundle.governanceWeight;
  const e0 = bundle.economicWeight;
  const d0 = bundle.demographicWeight;
  const f0 = bundle.familyWeight;

  const autonomyGap = (100 - era.knobAutonomyBaseline) / 100;
  const g = g0 * (0.55 + autonomyGap * 0.95);
  const e =
    e0 *
    (0.45 + (era.knobEconomicPressure / 100) * 1.05) *
    (0.65 + (era.knobSystemicExtraction / 100) * 0.7);
  const d = d0 * (0.45 + (era.knobCollectiveCohesion / 100) * 1.05);
  const f = f0 * (0.45 + (era.knobRelationalInterdependence / 100) * 1.05);

  const sum = g + e + d + f;
  if (sum <= 0) {
    return {
      governanceWeight: bundle.governanceWeight,
      economicWeight: bundle.economicWeight,
      demographicWeight: bundle.demographicWeight,
      familyWeight: bundle.familyWeight,
    };
  }

  const raw = {
    governanceWeight: (g / sum) * 100,
    economicWeight: (e / sum) * 100,
    demographicWeight: (d / sum) * 100,
    familyWeight: (f / sum) * 100,
  };

  const gi = clampInt(raw.governanceWeight, 0, 100);
  const ei = clampInt(raw.economicWeight, 0, 100);
  const di = clampInt(raw.demographicWeight, 0, 100);
  let fi = clampInt(raw.familyWeight, 0, 100);
  const total = gi + ei + di + fi;
  if (total !== 100) {
    fi = clampInt(fi + (100 - total), 0, 100);
  }

  return { governanceWeight: gi, economicWeight: ei, demographicWeight: di, familyWeight: fi };
}
