/** Mirrors Prisma `CognitionCanonicalStatus` without requiring a fresh client generate. */
export type CognitionCanonicalStatusLabel = "EXPLORATORY" | "PINNED" | "REJECTED";

/**
 * PINNED POLICY (Phase 5B contract)
 *
 * EXPLORATORY
 * - Default for new inner voice sessions (`CharacterInnerVoiceSession.canonicalStatus`).
 * - Stored fields: full prompt, full model response text, `inputContextJson`, optional `outputSummaryJson`.
 * - Does not modify scene text layers or generation contracts.
 * - Treat `CharacterInnerVoiceResponse.advisoryOnly === true` for any consumer of cognition output.
 *
 * PINNED
 * - Author explicitly promotes a session as canonical cognitive reference for this character/scene (or thread).
 * - Same storage shape as exploratory.
 * - Allowed to feed: scene generation input contracts, revision prompts, dependency annotations — only via
 *   explicit application code that reads PINNED rows (Phase 6+). Never auto-merge into reader prose.
 * - `advisoryOnly` should be false on the response object when persisting a PINNED result (set at save time).
 *
 * REJECTED
 * - Author marks output as invalid for canon; retained for audit and comparison, not for generation.
 * - Must not influence generation contracts or default prompts.
 *
 * Implementation note: Prisma enum `CognitionCanonicalStatus` aligns with these three labels.
 */
export function isCanonInfluenceAllowed(status: CognitionCanonicalStatusLabel): boolean {
  return status === "PINNED";
}

export function responseAdvisoryFlagForStatus(status: CognitionCanonicalStatusLabel): boolean {
  return status !== "PINNED";
}
