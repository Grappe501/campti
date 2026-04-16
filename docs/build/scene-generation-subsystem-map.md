# Scene Generation Subsystem Map

## Domain

- `lib/domain/scene-generation-engine.ts`
  - request, transition, scene artifact, bundle, validation report contracts
- `lib/domain/narrative-sequence.ts`
  - epic/book/chapter sequencing and cadence contracts

## Sequence Services

- `narrative-sequence-derivation-service`
- `narrative-sequence-validation-service`
- `thread-cadence-service`
- `route-cadence-service`
- `scene-order-grammar-service`
- `recall-reframing-service`

## Scene Runtime Services

- `scene-generation-request-derivation-service`
- `scene-to-beat-packet-service`
- `scene-to-prose-constraints-service`
- `scene-to-literary-device-plan-service`
- `scene-transition-planning-service`
- `generated-scene-bundle-validation-service`
- `scene-generation-engine-service`

## Canonical Integration Point

- `lib/services/book1-regeneration-loop-service.ts`
  - derives chapter composition plan
  - derives sequence plans + validation
  - runs SGE and captures request/bundle/validation artifacts
  - injects sequence + scene-generation summaries into authoritative author cockpit bundle

## Cockpit Surface Extensions

- `sequenceArchitecture`
  - chapter function role
  - timeline
  - convergence and recall windows
  - sequence score/warnings
- `sceneGeneration`
  - runtime scene counts and role order
  - per-scene thread/route/prose/literary summaries
  - transition strategy list
  - callback/delayed-convergence/reinterpretation markers
  - bundle warnings and density summary

