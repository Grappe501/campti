# Persistence Governance (Cluster 7)

## Service

`decidePersistenceGovernance` in `lib/services/persistence-governance-service.ts` maps:

- Save request + blocked flags + overrides → `PersistedTruthLabel`
- **`mayDescribeAsCanonicalReady`** — `true` only when generation text was saved **and** realism and human-gravity validity flags are both non-failing (invalid persisted only via explicit override is **not** canonical-ready)

## Labels

| Label | Meaning |
|-------|---------|
| `canonical_generation_text_saved` | Saved; valid under both gates (or gates not applicable) |
| `blocked_invalid_realism` | Save requested; blocked by realism |
| `blocked_invalid_human_gravity` | Save requested; blocked by no-reset |
| `no_save_requested` | No DB write |
| `save_overridden_despite_invalid_*` | Operator override persisted invalid output — auditable |

## Scene generation

`runSceneGeneration` attaches `cluster7RuntimeTruth.persistenceGovernance` for every run, aligned with existing `allowSaveOnInvalidRealism` / `allowSaveOnInvalidHumanGravity` behavior.
