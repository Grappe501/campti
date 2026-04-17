# Cluster 5 Implementation Report — Prose & Narrative Realism

## Summary

Implemented Cluster 5 on the **canonical** `runSceneGeneration` path: deterministic prose-realism **prompt shaping**, **post-generation validation**, **hash inclusion** for reproducibility, **author cockpit** visibility, and **Book 1 regeneration** cockpit wiring. No parallel LLM path was added.

**Realism truth:** `realismTruth` on the validation bundle and run result records that validation ran against **live** model output; `sceneOutputValidUnderRealismRules` is the gate for treating a generation as successful. **Invalid** anti-mechanical or cognition/narrator failures set `continuityFlags` and **block** `generationText` persistence unless `allowSaveOnInvalidRealism` is set.

## What was audited

- `scene-generation-service.ts` — primary runtime orchestration.
- `scene-generation-llm-adapter.ts` — prompt assembly for the model.
- `scene-generation-governance-input-adapter.ts` — Cluster 4 bundle for DB-backed scenes.
- `prose-generation-constraint-derivation-service.ts` / `prose-generation-validation-service.ts` — existing prose envelopes (reused patterns; Cluster 5 extends with realism-specific validation).
- `narrator-presence-to-prose-service.ts`, `literary-device-to-prose-constraints-service.ts` — upstream governance (unchanged; Cluster 5 consumes merged constraints when present).
- `author-command-cockpit` domain + UI — extended for `proseRealism` panel.
- `book1-regeneration-loop-service.ts` — cockpit bundle construction.

## New files

- `lib/domain/prose-realism.ts`
- `lib/services/prose-realism-derivation-service.ts`
- `lib/services/prose-realism-validation-service.ts`
- `lib/services/scene-voice-differentiation-service.ts`
- `lib/services/era-cognition-realism-service.ts`
- `lib/services/emotional-residue-prose-service.ts`
- `lib/services/literary-naturalization-service.ts`
- `lib/services/anti-mechanical-prose-validation-service.ts`
- `lib/services/prose-realism-cluster5.test.ts`
- `docs/build/cluster5-prose-realism-spec.md`
- `docs/build/prose-realism-subsystem-map.md`
- `docs/build/prose-realism-quality-report.md`
- `reports/book1-prose-realism-sample-report.json`

## Updated files (non-exhaustive)

- `lib/services/scene-generation-service.ts` — derivation + validation + result field.
- `lib/scene-generation/scene-generation-llm-adapter.ts` — `compactProseRealismLines`, system prompt note.
- `lib/scene-generation/canonical-scene-generation-hash.ts` — optional `proseRealismLayer` in hash payload.
- `lib/domain/scene-generation-input.ts` / `scene-generation-output.ts`
- `lib/domain/author-command-cockpit.ts`, `lib/services/author-command-cockpit-service.ts`, `components/admin/author-command-cockpit.tsx`
- `lib/services/enforcement-registry-service.ts`, `lib/services/enforcement-cockpit-truth-service.ts`
- `lib/services/book1-regeneration-loop-service.ts`

## Risks / deferred

- Cross-scene cadence correlation across a full chapter batch (requires multi-scene buffer).
- Stronger era detection beyond blocklists (could consume P2-E source excerpts with care).
- Optional promotion of `[prose_realism:hard]` to blocking gates (currently advisory warnings).

## Next recommended step

Add deterministic **callback half-echo** scoring (thread phrase overlap vs. contract anchors) inside `ProseRealismValidationService`, gated so it remains advisory-only.
