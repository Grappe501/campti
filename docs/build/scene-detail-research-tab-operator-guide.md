# Scene Detail Research Tab — Operator Guide

## When to use the tab vs the workbench

| Need | Use |
|------|-----|
| See what canon and research **pressure** apply while editing a scene | **Scene Research tab** |
| Ingest many sources, manage queues, deep inspection | **`/admin/research`** |

## Workflow

1. Open **Admin → Scenes → [scene] → Research** tab.
2. Read **Accepted canon** first — this is the truth bundle eligible for `RICRE_ACCEPTED_CANON` when rows are active.
3. Review **Open claims** and **Contradiction-shaped** rows; use **Re-run comparisons** or jump to the workbench for heavy review.
4. Use **Quick actions** links — stable query params (`sceneId`, `queue=open_claims`, `queue=contradictions`, `personId`, `placeId`).
5. Optional **scene-safe writes**: create a scene-linked target, ingest manual/URL source, extract, compare, submit decision — same server paths as the workbench, with **scene scope checks**.

## Governance reminders

- **Divergence** requires explicit override notes (validated).
- **Bounded URL fetch**: single URL, caps enforced by `ResearchSourceIngestionService` — no crawl.
- **Trusted admin** posture until RBAC is wired (`TODO(auth)` on actions).
