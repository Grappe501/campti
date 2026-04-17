# Cluster 6 — Human-gravity runtime specification

## Purpose

Cluster 6 promotes **attachment**, **relational stakes**, **consequence persistence**, and **generational burden** from the EEGS packs into **canonical scene-generation behavior**: model prompt lines, prose-realism profile seeding, canonical input hashing, and deterministic advisory validation.

This is a **runtime-depth** pass, not a parallel architecture. A single canonical path remains: `runSceneGeneration` → governance prep → human-gravity derivation → prose realism → LLM adapter.

## Truth labeling

**Human-gravity truth rule:** `runtimeInfluenceTruth.humanGravityCanonicalRuntimeActive` is true only when CLUSTER6 prompt assembly is substantive **and** at least one of attachment/relational/consequence/burden dimensions contributed materially, **or** when the no-reset gate applies (upstream pressure that can invalidate output). Subsystems are **not** labeled prompt-material unless their derived lines actually inform the assembled block (`computeHumanGravityRuntimeInfluenceTruth`).

**No-reset rule:** When upstream models major consequence load (≥2 active markers), threatened bonds (relational threat ≥0.6), and/or inherited burdens, generated prose must show **behavioral residue** (lexical/gesture cues), **marker echo**, or **explicit** repair/suppression/transformation accounting. Otherwise `humanGravityTruth.sceneOutputValidUnderNoResetRules` is false, continuity flag `cluster6_human_gravity_no_reset_invalid` is set, and `generationText` save is blocked unless `allowSaveOnInvalidHumanGravity` is true (same pattern as realism invalid save).

| Layer | Effect on output |
| --- | --- |
| `HumanGravityRuntimeProfile.promptInstructionLines` | **Material when active** — included in `buildUserPrompt` and hashed when profile present. |
| Prose-realism `consequenceResidueScore` boost | **Material only if** `proseRealismSeedInfluencedByHumanGravity` is true. |
| Shallow / reset drift (`[human_gravity:hard\|soft]`) | **Advisory** — warnings only. |
| No-reset truth | **Canonical validity** — can block DB save of `generationText` like Cluster 5 realism failures. |

## Domain contract

- **Schema**: `lib/domain/human-gravity-runtime.ts`
- **Profile**: `HumanGravityRuntimeProfile` — scene-scoped weights, consequence lines, burden lines, POV/scene/closure summaries, `promptInstructionLines`, `runtimeInfluenceTruth`.
- **Validation**: `HumanGravityValidationBundle` — drift report, shallow heuristic flag, and `humanGravityTruth` (no-reset validity).

## Derivation pipeline

1. **AttachmentRuntimeBiasService** — attachment weights, POV bias text, fear/desire/vulnerability ids for the scene/chapter window.
2. **RelationalStakesRuntimeBiasService** — relational threat map and foreground summary from `RelationalStakeProfile`.
3. **ConsequencePersistenceRuntimeService** — irreversibility markers, identity fractures, loss ledger, repair difficulty strings scoped to chapter/scene/participants.
4. **GenerationalBurdenRuntimeService** — burden labels, transmitted warnings, silence mechanics.
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
