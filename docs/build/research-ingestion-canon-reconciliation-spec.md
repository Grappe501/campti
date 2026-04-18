# Research Ingestion & Canon Reconciliation Engine (RICRE)

## Mission

RICRE lets authors **research** from the internet and other sources, **ingest** material with full provenance, **extract** structured claims, **compare** them to existing canon and runtime anchors, **surface contradictions**, and **decide** what becomes machine-usable story or historical knowledge—**without** silent overwrite of narrative truth.

## Design rules (normative)

1. **Author is final authority** — no web text auto-promotes to `Scene`, `Person`, or `Claim` rows.
2. **Provenance is mandatory** — `provenanceHash`, `ingestMethod`, `accessDate`, optional `rawExcerpt` / `rawContentRef`.
3. **Contradictions are explicit** — `AuthorCanonComparison` rows carry `comparisonResult` and optional `contradictionType`.
4. **History ≠ story** — `historicalRealityStatus` and `storyRealityStatus` on `AuthorCanonKnowledgeRecord` model intentional divergence.
5. **Structured claims** — `AuthorResearchClaim` with `claimType`, scopes, `contradictionPotential`.
6. **Auditability** — `AuthorCanonDecision` is append-only; canon rows carry `decisionHistory` and `sourceLinks`.
7. **No broad crawling** — `ResearchSourceIngestionService.ingestUrlForTarget` is single-URL, author-triggered, capped fetch.
8. **Copyright discipline** — prefer short `rawExcerpt` + hash; do not mirror whole sites.

## Domain contracts

- `lib/domain/research-ingestion.ts` — targets, sources, evidence, claims, enums.
- `lib/domain/canon-reconciliation.ts` — comparisons, decisions, canon records, reality statuses, `RicreAcceptedCanonKnowledgeBundle`.

## Persistence (Prisma)

- `AuthorResearchTarget`, `AuthorResearchSource` (+ optional `legacySourceId` → `Source`), `AuthorResearchEvidence`, `AuthorResearchClaim`, `AuthorCanonComparison`, `AuthorCanonDecision`, `AuthorCanonKnowledgeRecord`.
- Migration: `20260418120000_ricre_author_research_canon`.

## Services

| Service | Role |
|---------|------|
| `research-provenance-service` | SHA-256 provenance digest + default trust tier |
| `research-source-normalization-service` | Wire → domain record validation flags |
| `research-source-ingestion-service` | Create target; ingest URL (optional fetch) |
| `research-claim-extraction-service` | Heuristic structured claims (`heuristic_stub`) |
| `research-claim-normalization-service` | Dedupe seeds |
| `canon-comparison-service` | Overlap vs canon rows + person/place descriptions; persist comparisons |
| `research-contradiction-detection-service` | Filter contradiction-shaped rows |
| `canon-decision-recording-service` | Persist `AuthorCanonDecision` |
| `canon-reconciliation-service` | Apply author choice → canon row + claim status |
| `ricre-canon-knowledge-loader-service` | `loadAcceptedRicreCanonKnowledgeForScene`, cockpit `summarizeRicreForScene` |

## Downstream integration

- `loadSceneGenerationInput` attaches `ricreAcceptedCanonKnowledge` when **active** `AuthorCanonKnowledgeRecord` rows match scene/chapter/person/place targets.
- `scene-generation-llm-adapter` emits `RICRE_ACCEPTED_CANON` block (subordinate to contract + P2-E sources).
- `canonical-scene-generation-hash` includes `ricreAcceptedCanonKnowledge` when present.

## Cockpit

- `AuthorCommandCockpitBundle.ricreResearchCanon` — counts + workflow note (observational only).

## Tests & sample

- `npm run verify:ricre`
- `reports/ricre-sample-flow.json` — human + machine-readable walkthrough.
