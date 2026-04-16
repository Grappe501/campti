# Scene Generation Engine (SGE) Spec

## Intent

SGE is the canonical multi-scene runtime layer for chapter generation. It consumes upstream composition, sequence, chapter-state, narrative-psychology, thread, beat, prose, literary-device, route, callback, and reinterpretation truth and emits ordered scene bundles.

## Primary Runtime Objects

- `SceneGenerationRequest`
  - request identity, chapter lineage, composition/sequence lineage
  - scene plan order
  - route ledger snapshot
  - callback/reinterpretation lineage IDs
  - chapter-level prose and literary controls
- `GeneratedSceneArtifact`
  - scene identity/order/role/POV
  - active + latent thread sets
  - route/setting/philosophy bindings
  - applied beat/prose/literary plan IDs
  - explicit transition in/out objects
  - callback seed keys
  - delayed convergence keys
  - reinterpretation anchors
  - generated scene text
  - warning/validation flags
- `GeneratedChapterSceneBundle`
  - ordered scenes
  - thread/route/philosophy/callback/convergence/reinterpretation summaries
  - adjacency summary
  - density summary
  - prose compliance summary
  - warnings and flags

## Runtime Flow

1. Load chapter truth (state, psychology, threads, composition, sequence).
2. Build `SceneGenerationRequest`.
3. Resolve transitions and adjacency via scene grammar.
4. For each composed scene:
   - derive beat packet
   - derive scene prose constraints
   - derive scene literary plan
   - preserve callback / delayed convergence / reinterpretation markers
   - generate scene artifact
5. Assemble bundle-level summaries and density diagnostics.
6. Run scene-bundle validation.
7. Surface cockpit-ready summary payload.

## Scene-Scoped Derivation Rules

- `rumor_scene`: high ambiguity, delayed-bind transition preference
- `setting_presence_scene`: elevated route/place density
- `philosophy_echo_scene`: reduced exposition, increased interpretation allowance
- `convergence_scene`: callback activation + closure-open transition pressure
- `memory_echo_scene`: memory-carry transition and reinterpretation anchor emphasis

## Adjacency / Transition Contract

Every scene boundary must explicitly declare:

- transition strategy (`hard_cut`, `soft_echo`, `route_carry`, etc.)
- carry signals
- withheld signals
- whether link is visible now or deferred

## Validation

Hard failures:

- scene flattening
- callback loss
- delayed convergence loss

Soft warnings:

- missing reinterpretation anchors
- thin scene count
- noncompliant prose coverage
- high flattening risk

