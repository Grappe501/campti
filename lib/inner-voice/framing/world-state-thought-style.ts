import type { WorldStateThoughtStyle } from "@/lib/domain/inner-voice";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Serializable inputs for pure builder (from DB rows or tests). */
export type WorldStateThoughtStyleSource = {
  reference: {
    id: string;
    eraId: string;
    label: string;
    description: string | null;
  } | null;
  eraProfile: {
    coreEconomicDrivers: string[];
    powerSummary: string | null;
    knobEconomicPressure: number;
    knobRelationalInterdependence: number;
    knobAutonomyBaseline: number;
    knobSystemicExtraction: number;
    knobCollectiveCohesion: number;
  } | null;
  governance: {
    controlIntensity: number;
    punishmentSeverity: number;
    enforcementVisibility: number;
    conformityPressure: number;
  } | null;
};

function defaultStyle(): Omit<
  WorldStateThoughtStyle,
  "worldStateId" | "eraId" | "label" | "summaryForModel"
> {
  return {
    honorShameSalience: 55,
    supernaturalSalience: 45,
    lawPunishmentSalience: 50,
    kinDutySalience: 55,
    classStatusSalience: 55,
    bodilySensorySalience: 50,
    publicMoralAbstraction: 45,
    dominantMoralCategories: ["honor", "kin", "survival"],
    forbiddenThoughtZones: ["unchurched_doubt", "desire_across_color_line", "challenge_to_master"],
    acceptableSelfConcepts: ["role_and_place", "lineage_name", "christian_or_civil_condition"],
    avoidModernPsychLabels: true,
  };
}

/**
 * Deterministic mapping from world-state rows to a compact thought-style model.
 * Tuned heuristics: knobs push salience fields; absence of profiles yields moderate defaults.
 */
export function buildWorldStateThoughtStyle(source: WorldStateThoughtStyleSource): WorldStateThoughtStyle {
  const base = defaultStyle();
  const ref = source.reference;
  const gov = source.governance;
  const era = source.eraProfile;

  let honorShame = base.honorShameSalience;
  let lawPunish = base.lawPunishmentSalience;
  let kin = base.kinDutySalience;
  let classStatus = base.classStatusSalience;
  let bodily = base.bodilySensorySalience;
  let abstraction = base.publicMoralAbstraction;
  let supernatural = base.supernaturalSalience;

  if (gov) {
    lawPunish = clamp(Math.round((gov.punishmentSeverity + gov.enforcementVisibility + gov.controlIntensity) / 3), 0, 100);
    honorShame = clamp(Math.round((gov.conformityPressure + gov.controlIntensity) / 2), 0, 100);
  }

  if (era) {
    kin = clamp(45 + Math.round(era.knobRelationalInterdependence / 5), 0, 100);
    classStatus = clamp(40 + Math.round(era.knobSystemicExtraction / 4), 0, 100);
    bodily = clamp(35 + Math.round(era.knobEconomicPressure / 4), 0, 100);
    abstraction = clamp(30 + Math.round(era.knobAutonomyBaseline / 3), 0, 100);
    supernatural = clamp(40 + Math.round(era.knobCollectiveCohesion / 5), 0, 100);
  }

  const drivers = era?.coreEconomicDrivers?.length ? era.coreEconomicDrivers.slice(0, 6) : base.dominantMoralCategories;

  const summaryParts = [
    ref ? `${ref.label} (${ref.eraId})` : "unspecified world state",
    era?.powerSummary ? `Power: ${era.powerSummary}` : null,
    ref?.description ? ref.description.slice(0, 400) : null,
  ].filter(Boolean);

  return {
    worldStateId: ref?.id ?? null,
    eraId: ref?.eraId ?? null,
    label: ref?.label ?? null,
    honorShameSalience: honorShame,
    supernaturalSalience: supernatural,
    lawPunishmentSalience: lawPunish,
    kinDutySalience: kin,
    classStatusSalience: classStatus,
    bodilySensorySalience: bodily,
    publicMoralAbstraction: abstraction,
    dominantMoralCategories: drivers,
    forbiddenThoughtZones: base.forbiddenThoughtZones,
    acceptableSelfConcepts: base.acceptableSelfConcepts,
    avoidModernPsychLabels: true,
    summaryForModel: summaryParts.join(" — "),
  };
}
