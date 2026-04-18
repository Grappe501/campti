# Scene Detail Research Tab — Specification

## Purpose

The **Scene Detail Research Tab** (`/admin/scenes/[id]?tab=research`) is the **scene-local operational lens** into RICRE (Research Ingestion & Canon Reconciliation). It answers, for the current scene:

- What research targets, sources, and claims are **linked to this scene graph** (scene, chapter, in-scene people/places)?
- What **accepted canon** is active for generation scope?
- What **open claims** and **contradiction-shaped** comparisons exist?
- How **prompt assembly** and **canonical hash** incorporate `ricreAcceptedCanonKnowledge` when present?

It **does not replace** `/admin/research` (queue governance, bulk review, full workbench UX).

## Non-goals

- No second ingestion or decision backend.
- No unfiltered global research dump.
- No silent canon writes — all writes use the same orchestration and validation as the workbench.

## Relevance model

Items are included only when targets match **scene graph resolution** (`findResearchTargetIdsLinkedToSceneContext`): explicit JSON links on `AuthorResearchTarget` to scene id, chapter id, or person/place ids appearing on the scene.

Each UI row carries a **relevance classification** (`SceneResearchRelevance`) explaining why it appears (e.g. `direct_scene_link`, `chapter_link`, `person_link`, `accepted_scene_canon`).

## Honesty

- Extraction: **heuristic** (`heuristic_stub`) where applicable.
- Contradictions: **approximate contradiction-shape**, not proof.
- Prompt/hash panels mirror `loadAcceptedRicreCanonKnowledgeForScene` and canonical hash input rules — no fake injection claims.

## Deferred

- Full merge-by-id canon row selection.
- LLM extraction replacing heuristics (same persistence gates).
- Bulk multi-claim decisions from the scene tab.
