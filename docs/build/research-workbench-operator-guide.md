# Research workbench — operator guide

## Open the route

- **Nav:** Admin → **Research (RICRE)** → `/admin/research`
- **Author Cockpit:** RICRE panel links to the same route; narrative quick links include it.
- **Scene detail:** stub note points operators to add this scene id on a research target in the workbench.

## Typical loop

1. **Create target** — choose `targetType`, name, optional links (scene/chapter/person/place ids as comma or newline lists). For `other` without links, fill **research intent** (required).
2. **Ingest source**
   - **Manual:** title, trust tier, body (trimmed; whitespace-only rejected).
   - **URL:** optional bounded fetch (timeout/byte caps in `ResearchSourceIngestionService`); uncheck to store metadata only.
3. **Run extraction** on a recent source row — creates evidence + claims (`heuristic_stub`).
4. **Run comparisons** on a claim — refreshes `AuthorCanonComparison` rows (deletes prior rows for that claim first).
5. **Submit decision** — accept / reject / uncertain / divergence (divergence requires override rationale). Set canon target type/id for rows that create canon knowledge.
6. **Downstream impact** — evaluate the selected research target for RICRE bundle eligibility vs primary linked scene.

## Honesty

- Contradiction queue items are **contradiction-shaped** heuristics, not adjudicated legal contradictions.
- Low-trust tiers and fetch failures are visible on source summaries.

## Auth

Server actions assume the **trusted admin** model; `TODO(auth)` remains for future RBAC.
