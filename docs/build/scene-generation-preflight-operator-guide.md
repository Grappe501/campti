# Scene Generation Preflight — Operator Guide

## Where to find it

1. Open **Admin → Scenes →** pick a scene.
2. Use the **Preflight** tab for the full panel, or stay on **Details** for a compact launch summary and link.

## Reading the global bar

- **Launch allowed** — No blockers in the preflight snapshot. You may still have **downgrade risks** (then allowance reads **allowed with risk**) or **advisories**.
- **Launch blocked** — At least one **blocker** (e.g. scene input load failure, hash failure, enforcement registry errors, missing `OPENAI_API_KEY`). Resolve before expecting a successful model run.
- **Evaluated time** — ISO timestamp of this server-side evaluation (not cached client fiction).

Use **Re-run preflight** after you change scene linkage, research decisions, simulation bundles, or environment configuration.

## Panels (what to do)

| Panel | Meaning |
|--------|---------|
| **Blockers** | Hard stop — generation should not be attempted until remediated (or policy explicitly overrides outside this subsystem). |
| **Downgrade risks** | Launch may proceed; truth or quality may be weaker — confirm before generating. |
| **Advisories** | Softer signals — governance warnings, thin narrative sources, open research claims, etc. |
| **Observations** | Context only — e.g. final execution row explains that Cluster 7 truth is **after** the run. |

## Common fixes

- **Scene input load failed** — Fix chapter / world-state / contract validation; use **Edit scene** and cockpit scene scope.
- **Canonical hash failed** — Usually serialization or contract shape; fix loader output, then re-run preflight.
- **Governance semantic errors** — Repair enforcement registry data; open **Author cockpit** narrative surface.
- **Human gravity degraded** — Review Cluster 6 merge inputs for the chapter / scene path.
- **Character simulation** — Open **Simulation workbench** for cast members; resolve blocked contradictions.
- **Research contradiction pressure** — Use **Scene Research** tab or **Research workbench** with `sceneId` + contradictions queue.
- **Missing API key** — Configure `OPENAI_API_KEY` on the host running generation.

## What preflight does *not* guarantee

It does not prove the LLM will behave, that post-run certification passes, or that manuscript-level policy approves the scene. It only surfaces **upstream canonical readiness** for the current snapshot.
