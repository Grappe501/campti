# RICRE implementation report

## 1. What was audited

Existing `Source` / `SourceText` / `Claim` ingestion, scene generation loader and hash, LLM adapter prompt assembly, Author Cockpit bundle shape, enforcement registry patterns, and Prisma JSON conventions.

## 2. Existing systems reused

`Source` (optional `legacySourceId` bridge), `Scene` participants/places, `loadSceneGenerationInput`, `computeSceneGenerationInputHash`, `AuthorCommandCockpitBundle`, enforcement cockpit mapping, Prisma JSON arrays.

## 3. New files created

**Domain:** `lib/domain/research-ingestion.ts`, `lib/domain/canon-reconciliation.ts`

**Services:** `research-provenance-service.ts`, `research-source-normalization-service.ts`, `research-source-ingestion-service.ts`, `research-claim-extraction-service.ts`, `research-claim-normalization-service.ts`, `canon-comparison-service.ts`, `research-contradiction-detection-service.ts`, `canon-decision-recording-service.ts`, `canon-reconciliation-service.ts`, `ricre-canon-knowledge-loader-service.ts`

**Tests:** `lib/services/ricre-pipeline.test.ts`

**Migration:** `prisma/migrations/20260418120000_ricre_author_research_canon/migration.sql`

**Artifacts:** `reports/ricre-sample-flow.json`

**Docs:** `docs/build/research-ingestion-canon-reconciliation-spec.md`, `research-ingestion-subsystem-map.md`, `sample-research-to-canon-flow.md`, this report.

## 4. Existing files updated

`prisma/schema.prisma`, `lib/domain/scene-generation-input.ts`, `lib/services/scene-generation-input-loader.ts`, `lib/scene-generation/scene-generation-llm-adapter.ts`, `lib/scene-generation/canonical-scene-generation-hash.ts`, `lib/domain/author-command-cockpit.ts`, `lib/services/author-command-cockpit-service.ts`, `lib/services/enforcement-registry-service.ts`, `lib/services/enforcement-cockpit-truth-service.ts`, `app/admin/narrative/page.tsx`, `components/admin/author-command-cockpit.tsx`, `package.json` (`verify:ricre`).

## 5. Research ingestion summary

Single-URL fetch with limits, provenance hash, trust tier inference, optional legacy `Source` link, excerpt storage for audit.

## 6. Claim extraction summary

Heuristic sentence split + keyword routing to `ExtractedClaimType`; dedupe; persists evidence + claims in one transaction.

## 7. Canon comparison / contradiction summary

Token overlap against `AuthorCanonKnowledgeRecord` and linked `Person`/`Place` descriptions; persist comparisons; contradiction filter for cockpit.

## 8. Author reconciliation summary

Explicit decisions create `AuthorCanonDecision` first on accept/uncertain branches, then canon row with `decisionHistory`; reject updates claim flags and still records a decision row at end of flow.

## 9. Canon knowledge storage summary

`AuthorCanonKnowledgeRecord` supports `canonicalStatus`, dual reality statuses, `sourceLinks`, `decisionHistory`, `originatingClaimId`.

## 10. Downstream integration summary

Accepted **active** canon for scene/chapter/person/place ids → `ricreAcceptedCanonKnowledge` → prompt block + canonical hash. Does not alter ENCS/EEGS bundles directly in this pass (future: thread canon ids into governance packs).

## 11. Cockpit research workflow summary

`ricreResearchCanon` panel: targets, open claims, contradictions, accepted records, last decision timestamp; observational-only note.

## 12. Sample research-to-canon flow summary

See `reports/ricre-sample-flow.json` and `docs/build/sample-research-to-canon-flow.md`.

## 13. Risks / deferred items

- Heuristic extraction is not semantic research quality; LLM extraction must reuse decision + comparison gates.
- No dedicated admin CRUD UI yet (use Prisma Studio or future `/admin/research` page).
- `summarizeRicreForScene` scans recent targets (cap 400) — add indexed query when volume grows.
- Merge-with-existing does not yet diff-merge text against a chosen canon row id (v1 creates new row).

## 14. Exact next recommended implementation step

Add **server actions + admin page** (`/admin/research` or tab on Scenes) to run ingest → extract → compare → decision in one guided flow with Zod validation on `AuthorCanonDecisionInputSchema`.
