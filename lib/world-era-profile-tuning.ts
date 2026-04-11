import type { WorldPressureBundle, WorldStateEraProfile } from "@prisma/client";

import { computeEffectivePressureWeights, type EffectivePressureWeights } from "@/lib/world-era-profile";

/** Maps each knob to what it weights in `computeEffectivePressureWeights` (keep labels aligned with code). */
export const ERA_KNOB_ENGINE_MAP: {
  key: keyof Pick<
    WorldStateEraProfile,
    | "knobEconomicPressure"
    | "knobRelationalInterdependence"
    | "knobAutonomyBaseline"
    | "knobSystemicExtraction"
    | "knobCollectiveCohesion"
  >;
  label: string;
  tilts: string;
  tieTo: string;
}[] = [
  {
    key: "knobAutonomyBaseline",
    label: "Autonomy baseline",
    tilts: "Lower autonomy increases the governance channel multiplier (constraint from formal/social order).",
    tieTo: "Legal/social room to act without sanction — not a mood slider.",
  },
  {
    key: "knobEconomicPressure",
    label: "Economic pressure",
    tilts: "Scales the economic channel; stacks multiplicatively with systemic extraction.",
    tieTo: "Material squeeze, subsistence risk, and labor-market coercion.",
  },
  {
    key: "knobSystemicExtraction",
    label: "Systemic extraction / coercion climate",
    tilts: "Second multiplier on the economic channel (surveillance, debt, tied labor, extraction).",
    tieTo: "How much surplus is pulled out and how coercively — pairs with economic pressure.",
  },
  {
    key: "knobCollectiveCohesion",
    label: "Collective / community cohesion",
    tilts: "Scales the demographic channel (group belonging, legibility, collective norms).",
    tieTo: "Shared identity and mutual watching — should not erase family unless your bundle already does.",
  },
  {
    key: "knobRelationalInterdependence",
    label: "Relational interdependence",
    tilts: "Scales the family/kin obligation channel.",
    tieTo: "Household and lineage stakes — dependency-heavy worlds stay relational.",
  },
];

const CHANNELS: { key: keyof EffectivePressureWeights; label: string }[] = [
  { key: "governanceWeight", label: "Governance" },
  { key: "economicWeight", label: "Economic" },
  { key: "demographicWeight", label: "Demographic" },
  { key: "familyWeight", label: "Family" },
];

export type PressureChannelDelta = {
  key: keyof EffectivePressureWeights;
  label: string;
  base: number;
  effective: number;
  delta: number;
};

export function computePressureChannelDeltas(
  bundle: Pick<WorldPressureBundle, "governanceWeight" | "economicWeight" | "demographicWeight" | "familyWeight"> | null,
  effective: EffectivePressureWeights | null,
): PressureChannelDelta[] | null {
  if (!bundle || !effective) return null;
  return CHANNELS.map(({ key, label }) => ({
    key,
    label,
    base: bundle[key],
    effective: effective[key],
    delta: effective[key] - bundle[key],
  }));
}

/** Short lines explaining how knobs move weights vs the saved bundle (for the admin preview). */
export function describeEraKnobEffectLines(era: WorldStateEraProfile): string[] {
  const a = era.knobAutonomyBaseline;
  const autonomyGap = (100 - a) / 100;
  return [
    `Autonomy ${a}: governance raw factor ≈ ${(0.55 + autonomyGap * 0.95).toFixed(2)}× bundle gov (lower autonomy → stronger gov tilt).`,
    `Economic ${era.knobEconomicPressure} × extraction ${era.knobSystemicExtraction}: econ raw factor ≈ ${(
      (0.45 + (era.knobEconomicPressure / 100) * 1.05) *
      (0.65 + (era.knobSystemicExtraction / 100) * 0.7)
    ).toFixed(2)}× bundle econ.`,
    `Cohesion ${era.knobCollectiveCohesion}: demo raw factor ≈ ${(0.45 + (era.knobCollectiveCohesion / 100) * 1.05).toFixed(2)}× bundle demo.`,
    `Interdependence ${era.knobRelationalInterdependence}: family raw factor ≈ ${(
      0.45 +
      (era.knobRelationalInterdependence / 100) * 1.05
    ).toFixed(2)}× bundle fam.`,
  ];
}

export type EraTuningSanityItem = { level: "info" | "warn"; text: string };

/** Heuristic checks so knobs stay tied to structure, not vibes-only tuning. */
export function eraTuningSanityNotes(
  bundle: Pick<WorldPressureBundle, "governanceWeight" | "economicWeight" | "demographicWeight" | "familyWeight"> | null,
  era: WorldStateEraProfile | null,
  meaningOfWork: string | null | undefined,
  powerSummary: string | null | undefined,
  evidenceRationale: string | null | undefined,
): EraTuningSanityItem[] {
  const out: EraTuningSanityItem[] = [];
  if (!era) return out;

  const mow = (meaningOfWork ?? "").toLowerCase();
  const pow = (powerSummary ?? "").toLowerCase();

  if (!evidenceRationale?.trim()) {
    out.push({
      level: "info",
      text: "Add evidence / source ties below so future-you remembers why each knob is set.",
    });
  }

  if (era.knobSystemicExtraction >= 75 && era.knobEconomicPressure <= 35) {
    out.push({
      level: "warn",
      text: "High extraction with very low economic pressure is unusual — extraction usually implies material squeeze unless elites capture surplus without broad wage pressure.",
    });
  }

  if (era.knobCollectiveCohesion >= 80 && bundle && bundle.familyWeight >= 30 && era.knobRelationalInterdependence <= 25) {
    out.push({
      level: "warn",
      text: "High cohesion but very low relational interdependence while the bundle still weights family — check that kin obligation is not being starved unintentionally.",
    });
  }

  if (era.knobAutonomyBaseline >= 85 && pow.length < 20) {
    out.push({
      level: "info",
      text: "Very high autonomy: consider naming who still holds leverage in power summary so governance does not read as ‘everyone is free’ by accident.",
    });
  }

  if ((mow.includes("coerc") || mow.includes("enslav")) && era.knobSystemicExtraction <= 30) {
    out.push({
      level: "warn",
      text: "Meaning-of-work stresses coercion but systemic extraction is low — align the knob or narrow the prose.",
    });
  }

  return out;
}

/** Priority eras for deliberate A/B/C tuning (Red River slice, Jim Crow comparative, extraction contrast). */
export const ERA_PROFILE_PRIORITY_ERA_IDS = new Set([
  "WS-09-RED-RIVER-TRADE-ERA",
  "WS-06-JIM-CROW-RURAL",
  "WS-04-EXPANSION-COTTON",
]);

export function summarizeTuningSession(
  bundle: Pick<WorldPressureBundle, "governanceWeight" | "economicWeight" | "demographicWeight" | "familyWeight"> | null,
  era: WorldStateEraProfile | null,
): {
  effective: EffectivePressureWeights | null;
  deltas: PressureChannelDelta[] | null;
  formulaLines: string[];
  sanity: EraTuningSanityItem[];
} {
  const effective = computeEffectivePressureWeights(bundle, era);
  const deltas = computePressureChannelDeltas(bundle, effective);
  const formulaLines = era ? describeEraKnobEffectLines(era) : [];
  const sanity = eraTuningSanityNotes(bundle, era, era?.meaningOfWork, era?.powerSummary, era?.evidenceRationale);
  return { effective, deltas, formulaLines, sanity };
}
