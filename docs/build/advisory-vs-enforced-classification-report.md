# Advisory vs Enforced Classification Report (Cluster 2)

**Generated for Cluster 3 planning.** Source of truth: `lib/services/enforcement-registry-service.ts`.

## Hard-enforced (canonical path)

- `canonical_scene_chapter_pipeline`
- `scene_generation_service`
- `chapter_assembly_service`

## Soft-enforced (canonical path only)

- Only subsystems on the canonical production path may use `soft_enforced_runtime` with valid production-enforced truth (participation + output/block). There are currently **no** non-canonical soft-enforced rows in the registry.

## Advisory (non-canonical gates / soft shaping)

- `regeneration_beat_gating` — **advisory_runtime**; blocks the regeneration branch only; does not gate production `runSceneGeneration`.
- `prose_generation_constraints` — **advisory_runtime**; shapes regeneration/cockpit contexts; not a production hard gate.

## Advisory runtime (major narrative subsystems)

- `scene_generation_engine_bundle`, `book1_regeneration_loop`
- `beat_assembly_chain`, `chapter_state`, `narrative_psychology`, `narrative_threads`, `chapter_composition`, `sequence_architecture`
- `literary_device_controls`
- `epic_narrative_continuity_encs` (ENCS), `epic_emotional_gravity_eegs` (EEGS), `hcel_hook_layer`, `narrator_presence_convergence`
- `route_recurrence_controls`, `callback_reinterpretation_reentry`
- LLM output contract (`scene_generation_llm_output_contract`) — **advisory prose** with persistence side-effect
- Social-pressure and humanization advisories — deterministic, non-blocking

## Cockpit / report / validation-only

- `author_command_cockpit_bundle` — **cockpit_only** (observational aggregate)
- `report_export_certification` — **report_only**
- `verification_script_surface` — **validation_only**
- `book1_outline_draft_generator`, `deterministic_proof_harness` — simulation / proof
- `legacy_scene_generation_aliases`, `deprecated_chapter_generator_script` — **deprecated**

## Highest-value Cluster 3 promotion candidates

**Goal:** move critical narrative governance from **advisory/regeneration** into **`runSceneGeneration` / chapter assembly** where publication truth requires it.

1. **Scene generation engine bundle** — unify structured engine outputs with production orchestration **or** keep explicitly labeled as advisory (current truth).
2. **Beat assembly + chapter state** — wire selected invariants into production scene input loading / validation if they should block invalid scenes.
3. **Narrative threads / sequence architecture** — promote from cockpit-only signals to contract-level scene inputs if thread density must gate generation.
4. **ENCS / EEGS / narrator** — optional integration points on the canonical path once enforcement semantics are required for release.

## Must not promote yet (without design change)

- Anything **`sample_seeded` / regeneration-only** as **hard_enforced** without explicit waiver and product approval.
- **Cockpit aggregates** as enforcement — they remain observational until a separate mutation path exists.
