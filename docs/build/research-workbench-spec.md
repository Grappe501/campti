# Research and Canon workbench — specification

## Purpose

`/admin/research` is the **operator control surface** for RICRE (Research Ingestion and Canon Reconciliation). It wraps the existing persistence and services:

- `ResearchSourceIngestionService` — targets, URL/manual ingestion (bounded URL fetch)
- `ResearchClaimExtractionService` — heuristic claim extraction
- `CanonComparisonService` — overlap comparisons (persisted to `AuthorCanonComparison`)
- `CanonReconciliationService` — author decisions into `AuthorCanonDecision` / `AuthorCanonKnowledgeRecord`
- `loadAcceptedRicreCanonKnowledgeForScene` — downstream prompt bundle

## Non-goals

- No crawl expansion, no hidden network behavior beyond the existing single-URL fetch contract.
- No LLM extraction in v1 (extraction remains `heuristic_stub` unless a future adapter is added behind the same gates).
- `merge_with_existing` is **not** exposed in the workbench UI: reconciliation today creates a **new** canon row for merge-like enum values rather than patching an existing row by id.

## View models

Defined in `lib/domain/research-workbench.ts` (`ResearchWorkbenchDashboardViewModel`, claim/contradiction summaries, downstream impact, etc.).

## Write path

All mutations go through `app/actions/research-workbench.ts` → `research-workbench-orchestration-service.ts` with Zod validation in `lib/domain/research-workbench-validation.ts`.
