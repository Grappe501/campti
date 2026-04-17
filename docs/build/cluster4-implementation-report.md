# Cluster 4 implementation report

## Summary

Runtime convergence wires DB production scene generation through the same Cluster 3 narrative governance orchestration used on book1 regeneration, exposes governance in the LLM prompt and hash, adds parity validation, cockpit visibility, and documentation.

## Key files

- `lib/services/canonical-narrative-governance-orchestration-service.ts` — shared orchestration.
- `lib/services/scene-generation-governance-input-adapter.ts` — DB → governance bundle.
- `lib/domain/canonical-scene-generation-governance.ts` — contracts.
- `lib/services/runtime-governance-parity-validation-service.ts` — parity checks.
- `lib/services/runtime-governance-convergence-truth-builder.ts` — cockpit convergence summary.
- `lib/services/scene-generation-service.ts` — default governance on `runSceneGeneration`.
- `lib/scene-generation/scene-generation-llm-adapter.ts` — `compactCanonicalGovernanceLines`.
- `lib/scene-generation/canonical-scene-generation-hash.ts` — hash includes `canonicalPreGeneration`.
- `lib/services/book1-regeneration-loop-service.ts` — uses orchestration service.

## Tests

- `canonical-narrative-governance-orchestration-service.test.ts`
- `runtime-governance-parity-validation-service.test.ts`
- `canonical-scene-generation-hash.test.ts` (governance hash sensitivity)
- Existing: `canonical-runtime-cluster3-governance-service.test.ts`, `book1-regeneration-loop-service.test.ts`

## Deferred / risks

- DB composition plan uses placeholders when thread data is sparse; flags mark synthetic rows.
- Full literary-device parity with regeneration may require future shared literary prep on the DB path.
