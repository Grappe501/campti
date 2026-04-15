/**
 * P2-I — Character response contract (interactive / conversational turns).
 *
 * Separates **spoken** surface from **inner** cognition and tags **epistemic stance** so routing,
 * QA, and policy can inspect outputs without parsing prose.
 */

export const CHARACTER_RESPONSE_CONTRACT_VERSION = "1" as const;

/**
 * Bounded-character **epistemic** label (in-world knowledge stance), not prose quality, confidence in
 * wording, or stylistic strength.
 *
 * - **known** — grounded in what the character can know in-world.
 * - **belief** — grounded in interpretation, rumor, gossip, or uncertain social knowledge.
 * - **uncertain** — safe fallback when grounding is weak or policy risk exists.
 *
 * Downstream steps must not treat `known` as “writes well” or “high tone confidence”; it classifies
 * knowledge basis only.
 */
export type CharacterResponseKnowledgeSource = "known" | "belief" | "uncertain";

/**
 * One structured character utterance for a conversational turn (LLM or templated).
 * Persist or log only when product policy allows; defaults are authoring/advisory.
 */
export type CharacterResponse = {
  contractVersion: typeof CHARACTER_RESPONSE_CONTRACT_VERSION;
  /** Reader-facing / voiced line (dialogue or diegetic speech). */
  spokenResponse: string;
  /** Inner monologue or pre-speech cognition (not shown to reader unless UI exposes it). */
  internalThought: string;
  /** See {@link CharacterResponseKnowledgeSource} — epistemic stance only, not literary quality. */
  knowledgeSource: CharacterResponseKnowledgeSource;
  /** Short affect label for routing and analytics (e.g. "guarded", "warm", "flat"). */
  emotionalTone: string;
};
