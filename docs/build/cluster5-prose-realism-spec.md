# Cluster 5 — Prose & Narrative Realism Specification

## Purpose

Cluster 5 strengthens **believable scene life** on the **canonical scene generation path** (`runSceneGeneration` → `generateSceneProseWithModel`) without weakening Clusters 1–4 truth layers. Realism is **craft shaping + post-validation**, not a parallel generator.

### REALISM TRUTH RULE

A prose or realism improvement counts as **successful** only if it improves **generated runtime scene behavior** on the canonical path: the model must run on the hashed input, post-validation must execute, and `realismTruth.sceneOutputValidUnderRealismRules` may be true. **Reports, sample packs, or advisory-only profiles alone do not constitute success.**

### ANTI-MECHANICAL RULE

Scene output is **invalid** under realism rules when literary/emotional/narrator/structural signals read as **template-like, repetitive, or visibly system-driven** without enough **scene-native variation** (deterministic anti-mechanical gate). Invalid output sets `continuityFlags` `cluster5_realism_scene_output_invalid`, surfaces `realismTruth`, and **does not persist** `generationText` unless `allowSaveOnInvalidRealism` is set.

## Contract (human)

- **Era truth**: Diction, moral framing, and social reasoning must fit the resolved world-state horizon; no smuggled modern psych vocabulary unless era-sourced material licenses it.
- **Cognition truth**: Thought is embodied and social—not contemporary analytic self-report.
- **Narrator boundary**: Narrator may frame; character interiority owns lived inference; first-person only when convergence rules allow (from narrator pack).
- **Emotional credibility**: Prefer behavioral residue, silence, proximity, and timing over direct emotion naming; EEGS carry-forward informs **texture**, not melodrama.
- **Sensory / place embodiment**: Ground in material labor, weather, tools, and route memory consistent with place immersion targets.
- **Voice distinctness**: Scene role (grounding vs pressure vs closure) changes entry texture and closure pressure—scenes must not share one mechanical scaffold.
- **Consequence residue**: Avoid emotional “reset” endings when gravity packs flag carry-forward.
- **Literary naturalness**: Devices (sound, symbol, echo) bind to anchors already in the scene—never announce themselves as checklist items.
- **Anti-template / anti-system**: Prose must not echo tooling vocabulary, identical cadence stacks, or constraint language.

## Machine contract

- Domain types: `lib/domain/prose-realism.ts`
  - `ProseRealismProfile` — dimension scores 0–1 + flags.
  - `ProseRealismDriftReport` — failure modes, warnings, hard failures, suggested corrections.
  - `ProseRealismLayerArtifact` — `promptInstructionLines` + `profileSeed` (pre-generation).
  - `ProseRealismValidationBundle` — post-generation profile + drift report + **`realismTruth`** (canonical observation + validity).

## Runtime integration

1. **Derive** `proseRealismLayer` via `ProseRealismDerivationService.derive` on the final `SceneGenerationInput` (default on).
2. **Hash** includes `proseRealismLayer` when present (`canonical-scene-generation-hash.ts`).
3. **Prompt** appends `PROSE_REALISM_CLUSTER5` block (`compactProseRealismLines` in `scene-generation-llm-adapter.ts`).
4. **Validate** output with `ProseRealismValidationService.validate`; warnings surface as `[prose_realism:*]` on `SceneGenerationOutputV1.warnings`.
5. **Cockpit** (chapter scope): `buildProseRealismCockpitPanelFromGovernance` aggregates governance-linked scores for the authoritative author cockpit bundle.

## Services

| Concern | Service |
|--------|---------|
| Orchestration (pre-gen) | `prose-realism-derivation-service.ts` |
| Post-gen validation | `prose-realism-validation-service.ts` |
| Scene voice / role | `scene-voice-differentiation-service.ts` |
| Era / cognition | `era-cognition-realism-service.ts` |
| EEGS residue | `emotional-residue-prose-service.ts` |
| Literary naturalization | `literary-naturalization-service.ts` |
| Anti-mechanical heuristics | `anti-mechanical-prose-validation-service.ts` |

## Non-goals

- Replacing Cluster 3 governance merges or ENCS/EEGS truth.
- A second LLM path or “prettier prose” mode without governance alignment.
