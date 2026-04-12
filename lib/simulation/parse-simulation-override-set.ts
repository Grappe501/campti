import type { SimulationOverrideSet, SimulationVariableOverride } from "@/lib/domain/simulation-run";

/**
 * Accepts `SimulationOverrideSet` or a bare override array (legacy).
 */
export function parseSimulationOverrideSet(raw: unknown): SimulationOverrideSet {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (o.contractVersion === "1" && Array.isArray(o.overrides)) {
      return {
        contractVersion: "1",
        overrides: o.overrides as SimulationVariableOverride[],
        label: typeof o.label === "string" ? o.label : undefined,
      };
    }
  }
  if (Array.isArray(raw)) {
    return {
      contractVersion: "1",
      overrides: raw as SimulationVariableOverride[],
    };
  }
  return { contractVersion: "1", overrides: [] };
}
