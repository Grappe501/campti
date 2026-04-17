# Cluster 6 implementation report

## Summary

Cluster 6 activates **human gravity** on the **existing canonical scene-generation path**: after Cluster 3/4 `canonicalPreGeneration`, the runtime derives a `HumanGravityRuntimeProfile`, injects CLUSTER6 lines into the LLM user message, includes the profile in the canonical hash, biases prose-realism consequence residue, runs advisory post-gen validation, and exposes a cockpit panel (including Book 1 regeneration).

## New files

- `lib/domain/human-gravity-runtime.ts`
- `lib/services/attachment-runtime-bias-service.ts`
- `lib/services/relational-stakes-runtime-bias-service.ts`
- `lib/services/consequence-persistence-runtime-service.ts`
- `lib/services/generational-burden-runtime-service.ts`
- `lib/services/human-gravity-runtime-derivation-service.ts`
- `lib/services/human-gravity-validation-service.ts`
- `lib/services/human-gravity-cluster6.test.ts`
- `docs/build/cluster6-human-gravity-runtime-spec.md`
- `docs/build/human-gravity-runtime-subsystem-map.md`
- `docs/build/book1-human-gravity-report.md`
- `reports/book1-human-gravity-sample-report.json`

## Updated files

- `lib/domain/scene-generation-input.ts`, `lib/domain/scene-generation-output.ts`
- `lib/services/scene-generation-service.ts`
- `lib/scene-generation/scene-generation-llm-adapter.ts`
- `lib/scene-generation/canonical-scene-generation-hash.ts`
- `lib/services/prose-realism-derivation-service.ts`
- `lib/domain/author-command-cockpit.ts`, `lib/services/author-command-cockpit-service.ts`
- `lib/services/enforcement-cockpit-truth-service.ts`, `lib/services/enforcement-registry-service.ts`
- `lib/services/book1-regeneration-loop-service.ts`
- `components/admin/author-command-cockpit.tsx`

## Risks / follow-ups

- Participating character ids on the regeneration path are still **sample ids**; DB-backed ids would tighten attachment scoping.
- Validation heuristics are **intentionally thin**; expand with era-cognition metadata if false positives appear.

## Exact next recommended step

Wire `participatingPeopleIds` for Book 1 cockpit human-gravity derivation from the same character roster used in scene-generation contracts for the chapter’s primary scenes.
