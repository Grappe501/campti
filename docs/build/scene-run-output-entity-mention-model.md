# Scene-linked entity mention model

## Purpose

Support bounded statements such as: “**Cheesa** appears in run B but not A” or “**Jacksonville** count increased” **without** general-purpose NLP.

## Lexicon source

`loadSceneEntityLexiconForOutputDelta` (`lib/services/scene-run-output-delta-service.ts`):

- **People** attached to the scene (`prisma.scene.persons` names).
- **Places** attached to the scene (`prisma.scene.places` names).

No speculative entities; names not in the lexicon are ignored.

## Matching

- Case-insensitive substring counts via escaped regex (`entityMentionDeltas`).
- Counts are **approximate** (substring overlap, duplicate mentions in long tokens, etc.) — still useful for operator triage.

## Output shape

**`SceneRunOutputEntityMentionDelta`:**

- `entityId`, `kind` (`person` | `place` | reserved `canon_label` for future canon bundles)
- `label`, `countA`, `countB`, `delta`
- `kind_note: "fact"` (counts are deterministic given lexicon + text)

## Limits

- Caps at 24 entities per diff to keep UI and payloads bounded.

## Future extension

Canon labels already loaded for a scene could append to the lexicon with `kind: "canon_label"` when a stable loader exists — still substring-based, not semantic inference.
