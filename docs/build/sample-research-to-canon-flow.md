# Sample research-to-canon flow (Red River illustration)

This walkthrough matches `reports/ricre-sample-flow.json` and the implemented services.

## 1. Define the research target

Create an `AuthorResearchTarget` with `targetType: route`, `targetName` describing the Red River crossing, and `linkedSceneIds` containing the scene you are grounding.

Use `ResearchSourceIngestionService.createResearchTarget`.

## 2. Ingest a source (author-triggered)

Call `ingestUrlForTarget` with:

- `fetchRemote: true` for a single allowed `http(s)` URL (size- and time-capped), or  
- `fetchRemote: false` / manual path to store metadata without network I/O.

Row stores `provenanceHash`, `ingestMethod`, `rawExcerpt` (bounded).

## 3. Extract structured claims

`ResearchClaimExtractionService.extractClaimsForSource` creates `AuthorResearchEvidence` plus `AuthorResearchClaim` rows (`heuristic_stub`). Replace later with LLM extraction **behind the same persistence gates**.

## 4. Compare to canon

`CanonComparisonService.compareClaimToCanon` then `persistComparisons` writes `AuthorCanonComparison` and moves claim status toward `compared`.

## 5. Surface contradictions

`ResearchContradictionDetectionService.listContradictions` filters rows for author UI.

## 6. Author reconciliation

`CanonReconciliationService.applyAuthorDecision` with e.g. `accept_as_canon`:

- Writes `AuthorCanonDecision`
- Creates `AuthorCanonKnowledgeRecord` with `historicalRealityStatus` / `storyRealityStatus`
- Updates claim to `decided`

Reject path records decision + `claimStatus: rejected` without canon row.

## 7. Downstream consumption

Next `loadSceneGenerationInput` loads active canon lines for the scene’s people/places/chapter/scene id set and injects `ricreAcceptedCanonKnowledge.promptInstructionLines` into the model prompt **only** for accepted rows.

## 8. Verification

- Cockpit Author page shows RICRE summary counts.
- `npm run verify:ricre` for unit/hash coverage.
