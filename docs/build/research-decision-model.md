# Research — author decision model

## Workbench intents

| UI intent | Maps to `AuthorCanonDecisionType` | Canon row |
| --- | --- | --- |
| accept | `accept_as_canon` | Creates `AuthorCanonKnowledgeRecord` with status `active` (unless alternate/historical/divergence paths in service) |
| reject | `reject` | Updates claim to `rejected`; records decision |
| uncertain | `mark_as_uncertain` | Creates canon row `uncertain` + `uncertain_story_canon` |
| divergence | `mark_as_intentional_story_divergence` | Creates `divergent_story` canon row; requires override notes in workbench validation |

## Not exposed

- **`merge_with_existing`** — backend would still mint a **new** knowledge row today; true merge-by-target-id is deferred. The workbench schema deliberately excludes this option.

## Required fields for reconciliation

`CanonReconciliationService.applyAuthorDecision` expects canon target type/id and knowledge/reality status strings for non-reject paths. The UI provides defaults operators can edit.

## Persistence

Immutable audit: `AuthorCanonDecision`. Canon truth: `AuthorCanonKnowledgeRecord` when applicable.
