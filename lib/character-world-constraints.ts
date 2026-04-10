import type { CharacterState } from "@prisma/client";

/**
 * Hook layer: apply era / place / power constraints before choice evaluation.
 * Scene engine will later combine PlaceState, RiskRegime, and access profiles here.
 *
 * TODO: Apply world constraints to decision engine (deterministic filtering of options).
 */
export function applyWorldConstraints(
  characterState: CharacterState,
  worldContext: unknown,
): { applied: boolean; notes?: string } {
  void characterState;
  void worldContext;
  return { applied: false, notes: "World constraint enforcement not yet implemented." };
}
