# Character Simulation — validation rules

## Shape validation (Zod)

Implemented in `lib/domain/character-simulation-workbench-validation.ts`:

- `AuthorMindPartialSchema` — `CharacterMindProfileSchema.partial()`
- `AuthorVoicePartialSchema` — `CharacterVoiceProfileSchema.partial()`
- `CharacterSimulationWorkbenchMetaSchema` — strict object for `authorNotes` / `acceptedConflictIds`
- `CharacterSimulationPreviewRequestSchema` — `mode` enum + `stimulus` length 3–2000

Invalid numeric ranges (for example `changeResistance` outside 0–1, `fearActivationThreshold` outside 0–1) are **errors** and block save.

## Semantic validation (domain helpers)

Examples:

- **Memory weights:** values outside 0–1 produce **warnings** (stability of runtime geometry).
- **Belief overlap:** identical strings in `coreBeliefs` and `brittleAssumptions` → **warning**.
- **Temperament:** explosive conflict style + avoidant attachment → **warning** (narrative volatility).
- **Voice register:** taboo text referencing animals while `metaphorDomain` emphasizes animals → **warning**.

Semantic issues do not always block save unless paired with Zod errors.

## Save pipeline

`saveCharacterSimulationWorkbenchAuthorProfile`:

1. Validates incoming partials.
2. Merges with existing bundle JSON so empty tabs do not erase prior author work.
3. Re-validates merged payload.
4. Upserts Prisma row.
5. Appends audit log when available.
