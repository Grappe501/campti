import type { CharacterState as SimulationCharacterStateRow } from "@prisma/client";

import type { CharacterPhysicalState } from "@/lib/domain/embodiment";

function clamp100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function numFromUnknown(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return clamp100(v);
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    const x = Number(t);
    if (Number.isFinite(x)) return clamp100(x);
  }
  return null;
}

function strFromUnknown(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim();
}

/**
 * Pull optional `embodiment` / top-level keys from scene or simulation JSON.
 */
function mergeJsonPhysical(
  base: CharacterPhysicalState,
  json: unknown
): CharacterPhysicalState {
  if (json == null || typeof json !== "object" || Array.isArray(json)) return base;
  const root = json as Record<string, unknown>;
  const src =
    root.embodiment && typeof root.embodiment === "object" && !Array.isArray(root.embodiment)
      ? (root.embodiment as Record<string, unknown>)
      : root;

  const next = { ...base };
  const g = (k: keyof CharacterPhysicalState) => numFromUnknown(src[k as string]);
  const maybe = {
    fatigue: g("fatigueLevel"),
    pain: g("painLevel"),
    hunger: g("hungerLevel"),
    illness: g("illnessLevel"),
    sensory: g("sensoryDisruptionLevel"),
  };
  if (maybe.fatigue != null) next.fatigueLevel = maybe.fatigue;
  if (maybe.pain != null) next.painLevel = maybe.pain;
  if (maybe.hunger != null) next.hungerLevel = maybe.hunger;
  if (maybe.illness != null) next.illnessLevel = maybe.illness;
  if (maybe.sensory != null) next.sensoryDisruptionLevel = maybe.sensory;

  const inj = strFromUnknown(src.injuryDescription);
  if (inj) next.injuryDescription = inj;
  const mob = strFromUnknown(src.mobilityConstraint);
  if (mob) next.mobilityConstraint = mob;

  return next;
}

export function defaultCharacterPhysicalState(): CharacterPhysicalState {
  return {
    fatigueLevel: 0,
    painLevel: 0,
    hungerLevel: 0,
    illnessLevel: 0,
    injuryDescription: "",
    sensoryDisruptionLevel: 0,
    mobilityConstraint: "",
  };
}

/**
 * Build physical state from simulation `CharacterState` + optional scene JSON overrides.
 * Heuristics: `cognitiveLoad` nudges fatigue; `stabilityLevel` inversely nudges sensory disruption.
 */
export function buildCharacterPhysicalStateFromSources(input: {
  legacySimulationState: SimulationCharacterStateRow | null;
  sceneStructuredDataJson?: unknown;
}): CharacterPhysicalState {
  let state = defaultCharacterPhysicalState();
  const leg = input.legacySimulationState;

  if (leg?.structuredDataJson != null) {
    state = mergeJsonPhysical(state, leg.structuredDataJson);
  }

  if (input.sceneStructuredDataJson != null) {
    state = mergeJsonPhysical(state, input.sceneStructuredDataJson);
  }

  if (leg) {
    state.fatigueLevel = clamp100(
      Math.max(state.fatigueLevel, numFromUnknown(leg.cognitiveLoad) ?? state.fatigueLevel)
    );
    const stability = numFromUnknown(leg.stabilityLevel);
    if (stability != null && stability < 40) {
      state.sensoryDisruptionLevel = clamp100(
        Math.max(state.sensoryDisruptionLevel, 40 - stability)
      );
    }
    const phys = strFromUnknown(leg.physicalState);
    if (phys && !state.injuryDescription) {
      state.injuryDescription = phys;
    }
  }

  return state;
}
