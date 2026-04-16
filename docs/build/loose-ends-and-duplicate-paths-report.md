# Loose Ends and Duplicate Paths Report

## Partially Integrated / Loose Ends

## 1) Deterministic + sample-seeded cores in critical chains

- `NarrativeThreadDerivationService.buildBook1SampleThreadPack()` drives thread pack from hardcoded sample data.
- `Book1BeatAssemblyService.buildChapter1BeatAssembly()` is seeded and used as fallback when beat gating blocks.
- Regeneration loop includes many deterministic placeholders and hardcoded fallback structures.

Impact: high risk of overfitting to chapter1 simulation conditions.

## 2) Report-emitting systems that do not enforce production runtime behavior

- Book1 regeneration pipeline writes extensive `reports/book1-chapter-01-*.json` outputs.
- Many packs (sequence, ENCS, EEGS, narrator, literary cockpit summaries) are generated and exported but not governing production `runSceneGeneration` path.

Impact: strong observability, limited runtime authority.

## 3) Advisory-only systems presented near enforcement surfaces

- Guided signals explicitly `advisoryOnly: true`.
- Indicator bank severity is heuristically derived from route-level metrics.
- Scene generation output itself marks `advisoryOnly: true`.

Impact: operator confusion risk if advisory outputs are treated as hard gates.

## 4) Chapter-level integration without scene-level enforcement continuity

- Regeneration chain computes chapter state -> beat -> prose constraints and generates a scene bundle.
- Production scene path is independently driven via scene contract loader and LLM adapter.

Impact: chapter synthesis and scene runtime are parallel systems with weak convergence.

## 5) Validation thresholds not consistently used as blockers

- Some validation layers produce warnings/risks and cockpit summaries without mandatory stop-the-line semantics.
- Several `*-verification-service.ts` files only evaluate command pass/fail inputs, not deep runtime state.

Impact: “READY” decisions can reflect script matrix success while runtime semantic risks persist.

## 6) Persistence and canonical truth gaps

- Regeneration loop explicitly does not perform canonical overwrite (`performed: false`).
- Many outputs remain in reports/artifact space without durable canonical data-model integration.

Impact: high confidence analysis with low canonical state convergence.

## 7) Contract/schema drift risk concentration

- Large generated artifact surface with many independent schemas increases drift potential.
- Missing `book1-chapter-01-prose-output-path-report.json` in reports while regeneration script references expected path patterns indicates artifact naming/contract drift risk.

Impact: moderate-to-high, especially for automation.

## Duplicate / Dead Path Findings

## 1) Legacy workbench redirect + unreachable code

- `app/admin/scenes/[id]/workspace/page.tsx` redirects immediately to cockpit route while retaining substantial legacy workspace body after redirect.

Status: `deprecated_or_duplicate` with dead/unreachable path content.

## 2) Duplicate/parallel authoring action surfaces

- `app/actions/author-workflow.ts` and `app/actions/narrative-workflow.ts` both expose orchestration/assembly-related operations in adjacent domains.
- Multiple operational entry scripts overlap in certification intent (`run-*certification.ts` + `verify-*.ts` wrappers).

Status: partially overlapping; needs consolidation map and ownership tightening.

## 3) Parallel generation architectures

- Production runtime uses `scene-generation-service`.
- Regeneration runtime uses `book1-regeneration-loop-service` + `scene-generation-engine-service` with independent chain.

Status: intentional parallelism today, but execution-readiness blocker if both are framed as equally canonical.

## 4) Stale docs risk

- `docs/build` contains broad architecture/spec/certification narratives that may overstate integration relative to runtime wiring.

Status: docs valuable, but not authoritative unless cross-checked against active path.

## 5) Artifact duplication noise

- Reports include many similarly named chapter1 artifacts across iterations (decision panels, regenerated variants, developmental variants), increasing operator ambiguity on canonical artifact set.

Status: duplication/traceability risk, not immediate runtime failure.
