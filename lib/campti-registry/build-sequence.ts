import { CAMPTI_MASTER_REGISTRIES } from "./definitions";

/** Phases for migrations and Cursor tasks — complete lower phases before upper when possible. */
export const REGISTRY_BUILD_PHASES = [
  {
    phase: 1,
    name: "Foundation",
    summary: "Constitution, ontology, deterministic values — everything else hangs on these.",
  },
  {
    phase: 2,
    name: "Agents & world",
    summary: "Character and environment variable law; pressure fields for simulation.",
  },
  {
    phase: 3,
    name: "Time, symbol, branch",
    summary: "Anchors, symbol law, branch conditions — narrative DNA hardens.",
  },
  {
    phase: 4,
    name: "Scene, voice, reveal",
    summary: "Legal scene fields, voice governance, reader reveal architecture.",
  },
  {
    phase: 5,
    name: "Memory, pipeline, gates",
    summary: "Memory triggers, provenance binding audit, composition readiness gate.",
  },
] as const;

export type CursorBuildTask = {
  phase: number;
  orderInPhase: number;
  registryId: string;
  title: string;
  suggestedOrderLabel: string;
};

/**
 * Flat ordered list for a “Cursor build sequence”: sort by phase, then buildOrderInPhase, then ordinal.
 */
export function getCursorBuildSequence(): CursorBuildTask[] {
  return [...CAMPTI_MASTER_REGISTRIES]
    .sort((a, b) => {
      if (a.buildPhase !== b.buildPhase) return a.buildPhase - b.buildPhase;
      if (a.buildOrderInPhase !== b.buildOrderInPhase) return a.buildOrderInPhase - b.buildOrderInPhase;
      return a.ordinal - b.ordinal;
    })
    .map((r, index) => ({
      phase: r.buildPhase,
      orderInPhase: r.buildOrderInPhase,
      registryId: r.id,
      title: r.title,
      suggestedOrderLabel: `${index + 1}. [P${r.buildPhase}] ${r.title}`,
    }));
}

export function registriesByPhase(phase: number) {
  return CAMPTI_MASTER_REGISTRIES.filter((r) => r.buildPhase === phase).sort(
    (a, b) => a.buildOrderInPhase - b.buildOrderInPhase || a.ordinal - b.ordinal,
  );
}
