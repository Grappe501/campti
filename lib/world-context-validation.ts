import type { CharacterState } from "@prisma/client";

/**
 * Soft validation (non-blocking): log when a character state lacks world grounding.
 * Future: tighten when simulation runs require worldStateId + context JSON.
 */
export function warnIfCharacterStateMissingWorldContext(state: CharacterState, context: string): void {
  if (state.worldStateId) return;
  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[campti:character-world] CharacterState ${state.id} (${context}) has no worldStateId — future enforcement may require era grounding.`,
    );
  }
}
