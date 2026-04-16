# Canonical Runtime Path Map

## Canonical Entry Points

## 1) Production Canonical Path (execution-relevant)

1. `app/actions/scene-generation.ts` / `app/actions/author-workflow.ts`
2. `lib/services/scene-generation-service.ts::runSceneGeneration`
3. `lib/services/scene-generation-input-loader.ts::loadSceneGenerationInput`
4. `lib/scene-generation/scene-generation-llm-adapter.ts::generateSceneProseWithModel`
5. optional persistence/dependency registration in `scene-generation-service`
6. chapter composition/assembly via `lib/services/chapter-assembly-service.ts`
7. optional quality and repair loops:
   - `lib/services/narrative-prose-quality-service.ts`
   - `lib/services/scene-repair-execution-service.ts`
   - `lib/services/chapter-coherence-refinement-service.ts`

This is the most integrated path tied to DB state and operator actions.

## 2) Parallel Scripted Path (book1 regeneration)

1. `scripts/run-book1-chapter-01-regeneration-loop.ts`
2. `lib/services/book1-regeneration-loop-service.ts::run`
3. creates large in-memory derivation chain:
   - chapter state, beat assembly, prose constraints
   - narrative threads, sequence architecture
   - scene generation engine bundle
   - literary device packs
   - epic continuity / emotional gravity / narrator packs
4. writes many artifacts to `reports/*.json`

This path is real and executable, but mostly report/artifact-centric and deterministic/sample-seeded.

## Runtime Decision/Branching Points

- **Generation mode branch** in `scene-generation-service`: `draft | rewrite | repair`.
- **Basis prose branch** in `scene-generation-service`: basis from generation text vs authoring text vs override.
- **Social guidance branch**: optional advisory appenders (social pressure + humanization).
- **Persistence branch**: save vs dry-run in generation and repair services.
- **Beat gate branch** in regeneration loop: blocked path vs ready path.
- **Canonical mutation branch** in regeneration loop: explicitly never overwrites canonical artifacts internally.

## Bypasses and Weak Links

- `scene-generation-engine-service.ts` is used by regeneration loop, not production scene generation path.
- ENCS/EEGS/Narrator derivations are integrated in regeneration loop outputs, but not in production scene-generation enforcement path.
- `SceneGenerationOutput` sets `advisoryOnly: true`; generated prose is not itself canonical truth.
- Several certification services only evaluate command pass/fail summaries; they do not deeply verify generated runtime state.

## Artifact-Only Layers

- Most `book1-chapter-01-*` outputs in `reports/` are artifact emissions from scripts, not persistent runtime decision state.
- `docs/build/*` provides extensive system intention/specification, but docs do not imply runtime enforcement.

## Systems Not Affecting Current Production Generation Decisions

- `NarrativeSequenceDerivationService` (used in regeneration + tests)
- `ChapterStateToBeatAssemblyChainService` (used in regeneration + tests)
- `NarrativeThreadDerivationService` sample pack (`buildBook1SampleThreadPack`)
- `EpicContinuityDerivationService`, `EpicEmotionalGravityDerivationService`, `NarratorPresenceDerivationService` (regeneration-centric integration)

## Demonstration-Oriented Canonical Recommendation

For live execution demos, use the production path (`scene-generation-service` + chapter assembly) as canonical runtime.

For architecture demonstration and subsystem mapping, use regeneration path as secondary proof path, clearly labeled as scripted/simulation-heavy.
