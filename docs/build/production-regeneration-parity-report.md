# Production vs regeneration parity (Cluster 4)

## Shared merge

Both paths use **`CanonicalNarrativeGovernanceOrchestrationService.orchestrate`** → **`CanonicalRuntimeCluster3GovernanceService.applyToProseConstraints`**.

## Base prose before merge

| Aspect | Regeneration | DB production (`prepareCanonicalPreGenerationBundleForScene`) |
| --- | --- | --- |
| Chapter state | `deriveChapterState` from simulation/outline | `deriveChapterState` with governance-default axes |
| Beat chain | Beat assembly from chapter state | `ChapterStateToBeatAssemblyChainService` |
| Narrator deferral | `deferNarratorToCluster3` in prose derivation | Same |
| Literary devices | Literary merge into prose before orchestration | Not applied; optional `literaryLayerParityNote` on bundle |
| Composition | Rich `ChapterCompositionPlan` from outline | `buildChapterCompositionPlanFromDbScenes` (flags synthetic min-pair when needed) |

## Parity checker

`RuntimeGovernanceParityValidationService` — asserts expected Cluster 3 flags on merged prose / bundle when governance is required.

## Operator truth

When literary parity differs, `regenerationProductionParitySatisfied` on `RuntimeGovernanceConvergenceTruth` may be false and `divergenceWarnings` populated.
