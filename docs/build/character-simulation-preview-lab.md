# Character Simulation — Preview Lab

## What it is

The Preview Lab (`buildCharacterSimulationPreview`) emits **deterministic, non-LLM** text that explains how merged mind/voice would posture under a stimulus. It is explicitly **not** `runSceneGeneration` and not canonical prose.

## Modes

- `inner_monologue`
- `spoken_response`
- `stress_response`
- `decision_bias`
- `interpersonal_reaction`

## Outputs

Each preview returns:

- `text` — synthesized explanation string
- `completeness` / `confidenceLabel` — degrade on structural holes, blocking drift warnings, or advisory drift volume
- `truthBasis` — `derived` when no author overlay keys exist; `merged` when author partials exist
- `influences` — weighted rationale tied to coarse field groups
- `deterministicPreviewId` — SHA-256 prefix over `{mode, stimulus, mergedMind, mergedVoice}` payload

## Honesty rules

- If merged profiles lose required nested structures, confidence drops to **low**.
- If drift warnings include the substring `blocking`, confidence becomes **low** regardless of other signals.

## Operator expectation

Use Preview Lab to **inspect posture**, not to preview final scene text. Scene generation still flows through the canonical pipeline after the bundle is saved.
