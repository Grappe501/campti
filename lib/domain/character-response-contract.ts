/**
 * P2-I — Character response contract (interactive / conversational turns).
 *
 * Separates **spoken** surface from **inner** cognition and tags **epistemic stance** so routing,
 * QA, and policy can inspect outputs without parsing prose.
 */

export const CHARACTER_RESPONSE_CONTRACT_VERSION = "1" as const;

/** How the character is treating the informational basis of the spoken line (inspectable, not legal truth). */
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
  /** Epistemic tagging — aligns with P2-F knowledge boundary buckets. */
  knowledgeSource: CharacterResponseKnowledgeSource;
  /** Short affect label for routing and analytics (e.g. "guarded", "warm", "flat"). */
  emotionalTone: string;
};
