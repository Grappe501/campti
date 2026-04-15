/**
 * P2-Z — Narration interaction modes (separation scaffolding only).
 *
 * **Bounded character conversation** is the only implemented interaction path today: reader↔character
 * dialogue is driven by {@link ConversationalIdentitySnapshot}-class bundles, registry contracts, P2-F
 * knowledge boundaries, and P2-G relationship memory. The character **cannot** access omniscient interior
 * knowledge of other people, hidden plot facts, or narrator-grade truth **beyond what that snapshot and
 * policy explicitly allow** — there is no back-channel to “everything the author knows.”
 *
 * **Author / God mode** names a **separate future layer** (different contracts, different pipelines) for
 * privileged narrative inspection or authoring aids. It is **not** implemented here; production code must
 * not treat it as a synonym for turning off epistemic limits on the same character chat path.
 *
 * **No omniscient response generation** is implied by these labels — they exist to prevent accidental
 * mixing of bounded and privileged surfaces.
 */

/** Default live reader↔character path (P2-H … P2-Y). */
export const NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION = "bounded_character_conversation" as const;

/**
 * Reserved identifier for a **future** author-facing / privileged narrative mode.
 * Do not branch runtime behavior on this value until the separate layer is specified and implemented.
 */
export const NARRATION_MODE_FUTURE_AUTHOR_GOD_MODE = "future_author_god_mode" as const;

export type NarrationMode =
  | typeof NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION
  | typeof NARRATION_MODE_FUTURE_AUTHOR_GOD_MODE;

export function isBoundedCharacterConversationMode(mode: NarrationMode): boolean {
  return mode === NARRATION_MODE_BOUNDED_CHARACTER_CONVERSATION;
}

export function isFutureAuthorGodModeLabel(mode: NarrationMode): boolean {
  return mode === NARRATION_MODE_FUTURE_AUTHOR_GOD_MODE;
}

/**
 * Guard for call sites that must only run in bounded character pipelines (e.g. conversational assembly).
 * Throws if a future mode is passed before that mode exists.
 */
export function requireBoundedCharacterConversationMode(mode: NarrationMode): void {
  if (!isBoundedCharacterConversationMode(mode)) {
    throw new Error(
      "[narration-modes] This operation is only defined for bounded_character_conversation (author/God mode is not implemented)."
    );
  }
}
