# Book 1 Research Normalization and Catalog Runbook

This runbook operationalizes Book 1 research ingestion from `docs/book1/chunk 1.txt` into normalized source storage and story-ready catalog rows.

## Goals

- Store raw + normalized text in the database for traceability.
- Re-chunk content for retrieval-friendly search and filtering.
- Promote stable research facts into catalog entities (`Claim`, `Event`, `Place`, `Fragment`, `OpenQuestion`).
- Preserve source lineage so every story-core assertion maps back to evidence.

## Scripts Added

- `scripts/normalize-book1-research.ts`
  - Reads Book 1 source file.
  - Removes image/link artifacts and conversational scaffolding.
  - Writes:
    - `Source`
    - `SourceText.rawText`
    - `SourceText.normalizedText`
    - regenerated `SourceChunk` rows
- `scripts/catalog-book1-core-story.ts`
  - Reads normalized corpus from source.
  - Creates/updates deterministic story-core records:
    - claims
    - events
    - places
    - fragments
    - open questions

## NPM Commands

- `npm run db:book1-normalize`
- `npm run db:book1-catalog`

Optional source override:

- `npx tsx scripts/normalize-book1-research.ts --source-id <id> --file "docs/book1/chunk 1.txt" --title "Book 1 Research Chunk 1"`
- `npx tsx scripts/catalog-book1-core-story.ts --source-id <id>`

## Execution Order

1. Normalize and chunk:
   - `npm run db:book1-normalize`
2. Catalog story-core entities:
   - `npm run db:book1-catalog`

## Data Contract Notes

- Normalization status:
  - `source.ingestionStatus = "normalized_script_book1"`
  - `sourceText.textStatus = "normalized_script_book1"`
- Archive tag:
  - `source.archiveStatus = "book1-script-normalized"`
- Catalog run marker:
  - notes/trace fields include `[book1-catalog-v1]`

## Retrieval and Core Story Assembly Pattern

Use retrieval in this order for chapter design:

1. **Claims first**: establish non-negotiable truth scaffolding.
2. **Events second**: anchor chronology and transitions.
3. **Places third**: anchor environment, mobility, and social pressure.
4. **Fragments fourth**: enforce continuity constraints for scene legality.
5. **Open questions last**: identify research gaps before drafting irreversible beats.

## Recommended Query Shapes

- Claims by confidence and review status for “core truth set”.
- Events sorted by `startYear` for chronology spine.
- Places + linked source trace for setting legitimacy.
- Fragments with `fragmentType = CONTINUITY_CONSTRAINT` for scene guardrails.
- Open questions by priority for next research passes.

## Core Story Governance Rule

Only promote a beat to “core story” when:

- at least one supporting `Claim` exists,
- chronology is anchored by `Event` or explicitly unresolved by `OpenQuestion`,
- and a continuity constraint (`Fragment`) does not conflict with the beat.
