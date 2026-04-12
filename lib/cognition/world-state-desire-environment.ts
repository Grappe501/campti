import type { WorldStateDesireEnvironment } from "@/lib/domain/desire-cognition";

export function defaultWorldStateDesireEnvironment(input: {
  worldStateId: string | null;
  eraId: string | null;
  label: string | null;
}): WorldStateDesireEnvironment {
  return {
    worldStateId: input.worldStateId,
    eraId: input.eraId,
    eroticTabooSeverity: 55,
    kinshipProhibitionSeverity: 50,
    femaleDesireSuppression: 55,
    maleDesireEntitlementPressure: 45,
    religiousGuiltIntensity: 50,
    propertyMarriagePressure: 55,
    fertilityReproductionPressure: 45,
    householdDutyOverride: 50,
    visibilityRiskForDesire: 60,
    punishmentSeverityForForbiddenDesire: 55,
    notes: input.label
      ? `Desire environment not authored for "${input.label}" — using era-default pressures.`
      : "Desire environment unset — using defaults.",
  };
}

function num(v: unknown, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.min(100, Math.max(0, v));
}

/**
 * Merge `WorldStateReference.desireEnvironmentJson` when present.
 */
export function buildWorldStateDesireEnvironment(input: {
  worldStateId: string | null;
  eraId: string | null;
  label: string | null;
  desireEnvironmentJson: unknown;
}): WorldStateDesireEnvironment {
  const base = defaultWorldStateDesireEnvironment(input);
  const raw = input.desireEnvironmentJson;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;

  const o = raw as Record<string, unknown>;
  return {
    worldStateId: input.worldStateId,
    eraId: typeof o.eraId === "string" ? o.eraId : input.eraId,
    eroticTabooSeverity: num(o.eroticTabooSeverity, base.eroticTabooSeverity),
    kinshipProhibitionSeverity: num(o.kinshipProhibitionSeverity, base.kinshipProhibitionSeverity),
    femaleDesireSuppression: num(o.femaleDesireSuppression, base.femaleDesireSuppression),
    maleDesireEntitlementPressure: num(o.maleDesireEntitlementPressure, base.maleDesireEntitlementPressure),
    religiousGuiltIntensity: num(o.religiousGuiltIntensity, base.religiousGuiltIntensity),
    propertyMarriagePressure: num(o.propertyMarriagePressure, base.propertyMarriagePressure),
    fertilityReproductionPressure: num(o.fertilityReproductionPressure, base.fertilityReproductionPressure),
    householdDutyOverride: num(o.householdDutyOverride, base.householdDutyOverride),
    visibilityRiskForDesire: num(o.visibilityRiskForDesire, base.visibilityRiskForDesire),
    punishmentSeverityForForbiddenDesire: num(
      o.punishmentSeverityForForbiddenDesire,
      base.punishmentSeverityForForbiddenDesire
    ),
    notes: typeof o.notes === "string" ? o.notes : base.notes,
  };
}
