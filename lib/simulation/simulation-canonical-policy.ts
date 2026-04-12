/**
 * Phase 5E / 6 — Canonical vs exploratory semantics (authoring pipeline).
 *
 * - **EXPLORATORY (default):** Simulation runs, inner voice, and decision traces are advisory.
 *   They do not mutate `Scene` prose, `CharacterStateSnapshot` canonical rows, or world truth.
 *
 * - **PINNED:** A specific persisted session or run is marked as the author’s working reference for
 *   tooling; still not automatically “published truth” until promoted elsewhere.
 *
 * - **REJECTED:** Discarded exploratory output (audit trail may remain in DB).
 *
 * - **Promotion (Phase 6+):** Explicit workflow copies structured outputs into generation inputs or
 *   snapshots, then triggers dependency invalidation for affected scenes/chapters — never implicit
 *   reruns from exploratory artifacts.
 *
 * Simulation outputs may *inform* scene generation as inputs to generator contracts; they never
 * rewrite scenes without an explicit promotion / approval step.
 */
export const SIMULATION_CANONICAL_RULES_DOC = "lib/simulation/simulation-canonical-policy.ts";
