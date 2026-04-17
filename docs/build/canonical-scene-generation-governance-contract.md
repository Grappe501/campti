# Canonical scene generation governance contract

## Type

`CanonicalPreGenerationBundle` (`lib/domain/canonical-scene-generation-governance.ts`)

## Required semantics (canonical-capable paths)

When `governanceMergeApplied === true`:

| Field | Role |
| --- | --- |
| `proseConstraints` | Post–Cluster-3 merge `ProseGenerationConstraints` (includes `cluster3_*` validation flags when merge ran). |
| `sequenceValidation` | `SequenceValidationReport` including structural weakness flags (e.g. hook pressure). |
| `epicContinuityPack` | ENCS runtime bias source. |
| `epicEmotionalGravityPack` | EEGS runtime bias source. |
| `narratorPresencePack` | Narrator presence pack consumed into prose via governance merge. |
| `packValidations` | ENCS / EEGS / narrator validation snapshots. |
| `cluster3RuntimeActivationTruth` | Operator-facing activation summary. |
| `preparationPath` | `book1_regeneration_orchestration` \| `db_production_scene_governance_adapter` \| `explicit_override`. |
| `literaryLayerParityNote` | Optional honesty note when literary layering differs from regeneration. |
| `validationFlags` | Bundle-level flags including `cluster4_canonical_pre_generation_bundle`. |

## Runtime convergence truth

`RuntimeGovernanceConvergenceTruth` — cockpit-facing summary: governance merge applied, runtime path label, parity satisfaction, divergence warnings, sources consumed, signal activity flags.
