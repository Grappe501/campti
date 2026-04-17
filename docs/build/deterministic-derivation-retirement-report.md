# Deterministic / sample-seeded retirement (Cluster 3 scope)

## Reduced in this pass

- **Narrator → prose**: Regeneration now defers narrator merge until **full** `NarratorPresenceDerivationService` pack (with scene ids) is available via `integration.deferNarratorToCluster3` on `ProseGenerationConstraintDerivationService.derive`, then applies `NarratorPresenceToProseService` inside `CanonicalRuntimeCluster3GovernanceService` (no duplicate empty-`sceneIds` narrator stub on the critical path).

## Still sample-seeded / deterministic (honest residual)

- ENCS / EEGS **pack scaffolding** (anchor registry, attachment profiles, etc.) remains largely deterministic fixtures inside derivation services; **outputs** now bias live chapter/thread/scene inputs and merge into prose constraints.
- Literary device sample pack for Book 1 is unchanged in this pass.
