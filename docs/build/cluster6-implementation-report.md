# Cluster 6 implementation report

## Summary

Cluster 6 activates **human gravity** on the **existing canonical scene-generation path**: after Cluster 3/4 `canonicalPreGeneration`, the runtime derives a `HumanGravityRuntimeProfile`, injects CLUSTER6 lines into the LLM user message, includes the profile in the canonical hash, biases prose-realism consequence residue, runs deterministic post-gen validation (including the **no-reset** gate that can block `generationText` save), and exposes an author cockpit panel (including Book 1 regeneration).

## Latest hardening pass (2026-04-18)

- **Attachment**: bond-mode and scene-role bias lines feed POV/scene summaries and an explicit `Bond-mode reader gravity` prompt line; profile carries `bondModeSummary`.
- **Relational stakes**: threat map now folds **repair difficulty**, **dependency** (asymmetry/exposure), and **shame** cost; foreground text includes shame, dependency, and repair texture; profile carries `relationalForegroundSummary`.
- **Consequence**: **no-return thresholds** in/near the chapter window become scoped markers; irreversibility summary counts matching thresholds.
- **Generational burden**: **gift mistaken for burden** and **burden mutation** lines merge into `activeBurdenLines` for prompt and validation texture.
- **Truth labeling**: `HumanGravityRuntimeInfluenceTruth.validationFlags` records which dimensions materially participated.
- **Validation bundle**: flattened fields (`humanGravityCanonicalRuntimeActive`, no-reset mirrors, warning arrays, `suggestedHardeningActions`, bundle-level `validationFlags`) for machine consumers while retaining nested `driftReport` / `humanGravityTruth`.
- **Cockpit**: surfaces `bondModeSummary` and `relationalForegroundSummary` alongside existing Cluster 6 indicators.
- **Sample artifact**: `reports/book1-human-gravity-sample-report.json` regenerated from live derivation.

## New files (initial Cluster 6 drop)

- `lib/domain/human-gravity-runtime.ts`
- `lib/services/attachment-runtime-bias-service.ts`
- `lib/services/relational-stakes-runtime-bias-service.ts`
- `lib/services/consequence-persistence-runtime-service.ts`
- `lib/services/generational-burden-runtime-service.ts`
- `lib/services/human-gravity-runtime-derivation-service.ts`
- `lib/services/human-gravity-runtime-influence-truth.ts`
- `lib/services/human-gravity-validation-service.ts`
- `lib/services/human-gravity-cluster6.test.ts`
- `docs/build/cluster6-human-gravity-runtime-spec.md`
- `docs/build/human-gravity-runtime-subsystem-map.md`
- `docs/build/book1-human-gravity-report.md`
- `reports/book1-human-gravity-sample-report.json`

## Updated files (representative)

- `lib/domain/scene-generation-input.ts`, `lib/domain/scene-generation-output.ts`
- `lib/services/scene-generation-service.ts`
- `lib/scene-generation/scene-generation-llm-adapter.ts`
- `lib/scene-generation/canonical-scene-generation-hash.ts`
- `lib/services/prose-realism-derivation-service.ts`
- `lib/domain/author-command-cockpit.ts`, `lib/services/author-command-cockpit-service.ts`
- `lib/services/enforcement-cockpit-truth-service.ts`, `lib/services/enforcement-registry-service.ts`
- `lib/services/book1-regeneration-loop-service.ts`
- `lib/services/canonical-narrative-governance-orchestration-service.ts` (traceability note)
- `components/admin/author-command-cockpit.tsx`
- `lib/services/cluster7-runtime-hardening.test.ts`
- Docs under `docs/build/cluster6-human-gravity-runtime-spec.md`, `book1-human-gravity-report.md`, this file.

## Risks / follow-ups

- Participating character ids on the regeneration path are still **sample ids** in places; DB-backed ids would tighten attachment and unspoken-need scoping.
- Validation heuristics are **intentionally thin**; expand with era-cognition metadata if false positives appear.

## Exact next recommended step

Wire `participatingPeopleIds` for Book 1 cockpit human-gravity derivation from the same character roster used in scene-generation contracts for the chapter’s primary scenes.
