# Research — downstream impact model

## What the panel shows

`buildResearchDownstreamImpactSummary(researchTargetId)`:

- Counts **active** `AuthorCanonKnowledgeRecord` rows whose `(targetType, targetId)` pairs intersect the target’s linked scene/chapter/person/place ids.
- If the target has a **primary linked scene** (first scene id), calls `loadAcceptedRicreCanonKnowledgeForScene` to mirror prompt bundle size.
- Sets `canonicalHashWouldIncludeRicre` when that bundle has `recordCount > 0` (same condition as hash input presence in generation).

## Honesty notes

The service appends explicit notes when:

- No scene link exists (scene-scoped RICRE bundle not evaluated).
- No active bundle resolves (zero rows) — this does **not** mean decisions failed; it may mean targets/ids do not overlap scene participants.

## Deferred

- Automatic diff of “hash before/after” for a specific scene run is not computed here (would require storing prior hash or re-running generation).
