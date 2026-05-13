# Sorting rules

## Decision order

1. **Is it narrative prose or scene-shaped?** → likely `story_fragments/` (or chapter `source_matches/` later).
2. **Is it system / rules / how the world works?** → `worldbuilding/`.
3. **Is it about a person or relationship dossier?** → `characters/`.
4. **Is it place-specific texture / map / architecture?** → `settings/`.
5. **Is it chronology, records, myth-as-history?** → `history/`.
6. **Is it motif / object language?** → `symbols/`.
7. **Is it tables, exports, lists, metrics?** → `data/`.

## Canon discipline

- If a chunk **asserts** a fact, tag it in `chunk_index.md` as `draft` or `unknown` until promoted to `01_canon/` as **CONFIRMED**.
- If you **infer** a connection between two chunks, record the inference as **PROPOSED** in the destination file header or in `intake_log.md`.

## Duplication

- Prefer **one** canonical file; link from chapter `source_matches/` rather than copying long excerpts.

## Too big for Git

- If policy requires, store large binaries elsewhere; keep path + summary here and in `chunk_index.md`.
