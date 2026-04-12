/**
 * Narrative unit responsibilities (domain boundaries)
 *
 * Epic — Container for the entire saga; holds default world-era pointer, movement count,
 *   export/spine metadata. Does not hold scene prose.
 *
 * Book — One movement (e.g. 1–8); stable movementIndex; default world-era for its chapters;
 *   reader-facing title optional. Assembly invalidation rolls up here.
 *
 * Chapter — Ordered block within a book (sequenceInBook); optional world-era override;
 *   caches reader-assembled text from ordered scenes; holds chapter-level summaries (gen vs human).
 *
 * Scene — Atomic narrative unit for drafting/generation; holds generation vs authoring vs
 *   published reader slices; registers dependency edges; drives revision jobs.
 *
 * NarrativeBeat — Planning scaffold inside a scene (intent, beatPlanJson, microbeatsJson);
 *   optional per-beat world override; not required for reader export when prose lives on Scene.
 */

export type NarrativeUnitRole =
  | "epic"
  | "book"
  | "chapter"
  | "scene"
  | "narrative_beat";
