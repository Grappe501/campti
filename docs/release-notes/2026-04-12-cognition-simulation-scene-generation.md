# Release: Cognition, simulation, scene generation baseline (2026-04-12)

Commit: `77287f0` on `main` (pushed to `origin`).

## Summary

This release lands the **Phase 5** character cognition stack (deterministic composition, inner voice, decision trace, simulation reruns) and **Phase 6 baseline** scene generation (structured contracts, LLM adapter, narrative dependency registration, optional prose QA, staleness design). It also expands the **data model** (narrative hierarchy, prose quality, census research, cognition tables, simulation runs) and adds **admin / reader** surfaces plus ingestion and verification scripts.

## Highlights

### Cognition & mind

- Deterministic cognition layer: world thought style, age bands, Enneagram + instinct shaping, thought-language mediation, embodiment, desire / attachment / pleasure integration, thought realism (fragmentation, distortion, inner-voice texture).
- Inner voice and decision trace with structured JSON contracts, OpenAI adapters, and advisory / PINNED policy hooks.
- **Simulation runs (Phase 5E):** override bundles → patched cognition frames, diffs (including trigger pressures), optional persistence, `inputHash`, canonical policy module.

### Scene generation (Phase 6 baseline)

- Extended **scene generation contract** (pins, thought-language slice, linked simulations).
- **Scene generation service:** draft / rewrite / repair entry points; writes **`Scene.generationText` only** when requested; never overwrites authoring or published reader text.
- **Narrative dependencies:** registers edges for assertions, people, world state, place, hierarchy; optional **SIMULATION_SCENARIO** and **COGNITION_SESSION** producer kinds.
- Optional **deterministic prose quality** pass on generated text.
- **Staleness strategy** documented for later revision jobs and chapter rollups.

### Data & migrations

- Numerous **Prisma migrations** (character state, era profile, census research, genealogical / narrative dependencies, prose quality, epic/book/chapter narrative hierarchy, cognition layer, snapshots, Enneagram, thought language, desire cognition, simulation run metadata, dependency enum extensions).
- Seeds and research/ingestion scripts for Campti / Red River / lineage workflows.

### App & UX

- Admin: dashboard, scene workspace, world-state and narrative assembly pages, character mind / continuity / brain, meta-scene compose helpers, landing splash.
- Reader: hands-free / cockpit-style reading components, scene experience and nav updates.

### Ops

- Root **`middleware.ts` removed** (routing/auth adjusted accordingly in app).
- **`uploads/incoming/**`** ignored except `.gitkeep` for local drop indexing.
- Dependencies and **tsconfig** updated; run **`npx prisma migrate deploy`** and **`npx prisma generate`** on each environment.

## Upgrade steps

1. Pull `main`.
2. `npm ci` (or `npm install`).
3. `npx prisma migrate deploy`
4. `npx prisma generate`
5. Set `OPENAI_API_KEY` for LLM-backed features (inner voice, decision trace, scene generation).

## Known follow-ups

- Phase **6.1–6.3**: scene generation against live social field, regeneration / repair loop, chapter coherence (see product roadmap).
