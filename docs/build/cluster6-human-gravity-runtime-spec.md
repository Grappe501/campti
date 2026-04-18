# Cluster 6 — Human-gravity runtime specification

## Purpose

Cluster 6 promotes **attachment**, **relational stakes**, **consequence persistence**, and **generational burden** from the EEGS packs into **canonical scene-generation behavior**: model prompt lines, prose-realism profile seeding, canonical input hashing, and deterministic advisory validation.

This is a **runtime-depth** pass, not a parallel architecture. A single canonical path remains: `runSceneGeneration` → governance prep → human-gravity derivation → prose realism → LLM adapter.

## Truth labeling

**HUMAN-GRAVITY TRUTH RULE (verbatim):** A character/relationship/consequence/burden system may not be labeled runtime-active unless it materially changes canonical scene/chapter generation behavior or canonical runtime validation outcomes.

In code, `runtimeInfluenceTruth.humanGravityCanonicalRuntimeActive` implements that rule: it is true when CLUSTER6 **materially** reaches generation (substantive prompt lines **and** at least one dimension’s prompt material) **or** when the **no-reset** gate participates in canonical validity (so validation outcomes can change). Per-dimension `*PromptMaterial` flags are supplementary; they must not be mistaken alone for “full” runtime activity.

`runtimeInfluenceTruth.validationFlags` lists which material dimensions fired (e.g. `cluster6_attachment_prompt_material`, `cluster6_no_reset_gate_tracks`) for cockpit and artifact audits.

**NO-RESET RULE (verbatim):** A chapter/scene output is invalid if major consequences, threatened bonds, or inherited burdens are modeled in upstream runtime truth but disappear from canonical output without explicit repair, suppression, or transformation explanation.

Operationally: when upstream pressure applies, generated prose must show **behavioral residue** (lexical/gesture cues), **marker echo**, or **explicit** repair/suppression/transformation accounting. Otherwise `humanGravityTruth.sceneOutputValidUnderNoResetRules` is false, continuity flag `cluster6_human_gravity_no_reset_invalid` is set, and `generationText` save is blocked unless `allowSaveOnInvalidHumanGravity` is true (same pattern as realism invalid save).

| Layer | Effect on output |
| --- | --- |
| `HumanGravityRuntimeProfile.promptInstructionLines` | **Material when active** — included in `buildUserPrompt` and hashed when profile present. |
| Prose-realism `consequenceResidueScore` boost | **Material only if** `proseRealismSeedInfluencedByHumanGravity` is true. |
| Shallow / reset drift (`[human_gravity:hard\|soft]`) | **Advisory** — warnings only. |
| No-reset truth | **Canonical validity** — can block DB save of `generationText` like Cluster 5 realism failures. |

## Domain contract

- **Schema**: `lib/domain/human-gravity-runtime.ts`
- **Profile**: `HumanGravityRuntimeProfile` — scene-scoped weights, consequence lines, burden lines, POV/scene/closure summaries, `relationalForegroundSummary`, `bondModeSummary`, `promptInstructionLines`, `runtimeInfluenceTruth`.
- **Validation**: `HumanGravityValidationBundle` — flattened no-reset and drift mirrors (`sceneOutputValidUnderNoResetRules`, warning arrays, `suggestedHardeningActions`, `humanGravityScore`, `validationFlags`) **plus** nested `driftReport` and `humanGravityTruth` for backward-compatible consumers.

## Derivation pipeline

1. **AttachmentRuntimeBiasService** — attachment weights, POV bias text, dominant **reader bond modes** and scene-role hints, fear/desire/vulnerability ids for the scene/chapter window.
2. **RelationalStakesRuntimeBiasService** — relational threat map (threats, break risk, repair difficulty, dependency asymmetry, shame cost) and foreground summary (obligation, unspoken need, shame, dependency, repair texture).
3. **ConsequencePersistenceRuntimeService** — irreversibility markers, identity fractures, loss ledger, no-return thresholds in chapter window, repair difficulty strings scoped to chapter/scene/participants.
4. **GenerationalBurdenRuntimeService** — burden labels, gift/burden confusion lines, burden mutations, transmitted warnings, silence mechanics.
5. **HumanGravityRuntimeDerivationService** — composes the profile, `humanGravityScore`, and CLUSTER6 prompt block.

## Integration points

- `lib/services/scene-generation-service.ts` — derives profile after `canonicalPreGeneration` when governance merged.
- `lib/scene-generation/scene-generation-llm-adapter.ts` — `compactHumanGravityRuntimeLines`.
- `lib/scene-generation/canonical-scene-generation-hash.ts` — hashes `humanGravityRuntime` when present.
- `lib/services/prose-realism-derivation-service.ts` — boosts consequence residue only when `runtimeInfluenceTruth.proseRealismSeedInfluencedByHumanGravity`.
- `lib/services/book1-regeneration-loop-service.ts` — cockpit panel via `buildHumanGravityRuntimeCockpitPanelFromProfile`.
- `components/admin/author-command-cockpit.tsx` — Cluster 6 panel.

## Non-goals

- No melodrama templates; pressure is carried through **implication, residue, obligation, and repair cost**.
- No duplicate generation pipeline; shallow drift advisories remain explicitly labeled separately from no-reset **validity**.
