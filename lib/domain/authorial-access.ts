/**
 * P3-J — Author / God mode scaffolding (distinct from bounded reader↔character conversation).
 *
 * Bounded character chat must not import these payloads into live reader surfaces. Authorial tools may
 * inspect broader truth for debugging and manuscript work without granting the in-world character
 * omniscience on the bounded pipe.
 */

export const AUTHORIAL_ACCESS_MODE = {
  /** Inspect inner cognition / debug strings separate from reader-facing dialogue. */
  omniscientInteriorInspection: "authorial_omniscient_interior_inspection",
  /** Narrative QA against scene contracts — not a live reader reply path. */
  sceneTruthAudit: "authorial_scene_truth_audit",
} as const;

export type AuthorialAccessMode = (typeof AUTHORIAL_ACCESS_MODE)[keyof typeof AUTHORIAL_ACCESS_MODE];

/**
 * Explicitly separate from {@link CharacterResponse}: may include privileged interior or off-stage notes.
 * Never merge into bounded conversational turns or canon story text automatically.
 */
export type AuthorialOmniscientInteriorPayload = {
  contractVersion: "1";
  characterId: string;
  sceneId: string | null;
  /** Privileged notes for authors — not reader-facing speech. */
  interiorMonologueNotes: string;
  /** Optional broader-world hints for tooling — not character knowledge in dialogue. */
  offstageTruthHints: string[];
};
