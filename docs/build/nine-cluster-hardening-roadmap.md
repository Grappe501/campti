# Nine-Cluster Hardening Roadmap

## Cluster 1 — Canonical Runtime Authority Lock

- **Goal:** Declare and enforce one canonical generation authority for production demos/runs.
- **Core subsystems:** `scene-generation-service`, action entrypoints, chapter assembly, regeneration-path boundaries.
- **Order rationale:** Removes architectural ambiguity before any deeper hardening.
- **Expected artifacts:** runtime-authority spec, routing policy doc, guard checks preventing non-canonical path misuse.
- **Success criteria:** all execution runbooks point to one runtime path; non-canonical paths explicitly labeled simulation/report.
- **Dependencies:** none.

## Cluster 2 — Advisory vs Enforced Contract Hardening

- **Goal:** Make advisory/enforced status explicit and machine-checkable across outputs.
- **Core subsystems:** guided signals, indicator bank, scene generation output contracts, validation payloads.
- **Order rationale:** prevents overclaim before integration work expands.
- **Expected artifacts:** status flags in contracts, enforcement registry, CI checks for contract semantics.
- **Success criteria:** no subsystem can be presented as enforced without runtime gate coverage.
- **Dependencies:** Cluster 1.

## Cluster 3 — Thread/Beat Determinism De-Simulation

- **Goal:** Replace sample-seeded critical derivations with input-driven runtime derivation.
- **Core subsystems:** narrative thread derivation, beat assembly fallback path, chapter-state bridge.
- **Order rationale:** foundational for trustworthy continuity/sequence behavior.
- **Expected artifacts:** sample-pack retirement plan, production derivation adapters, regression fixtures.
- **Success criteria:** no critical path relies on `buildBook1Sample*` seeded packs in production mode.
- **Dependencies:** Clusters 1-2.

## Cluster 4 — Chapter-to-Scene Convergence Wiring

- **Goal:** Bind chapter-level synthesis layers to production scene generation decisions.
- **Core subsystems:** chapter state, beat chain, prose constraints, scene generation runtime.
- **Order rationale:** unifies currently parallel chapter and scene systems.
- **Expected artifacts:** convergence integration service, runtime payload bridge, gating policy.
- **Success criteria:** scene generation reflects chapter-level derived constraints in enforceable path.
- **Dependencies:** Clusters 1-3.

## Cluster 5 — ENCS/EEGS/Narrator Runtime Promotion

- **Goal:** Promote epic continuity, emotional gravity, and narrator presence from pack outputs to active runtime governors.
- **Core subsystems:** ENCS, EEGS, narrator derivation/validation, prose and composition constraint layers.
- **Order rationale:** after chapter/scene convergence exists, higher-order systems can govern safely.
- **Expected artifacts:** downstream enforcement adapters, hard-fail conditions, integration tests.
- **Success criteria:** ENCS/EEGS/narrator constraints measurably alter generation behavior and can block invalid runs.
- **Dependencies:** Clusters 1-4.

## Cluster 6 — Cockpit Truth Binding and Actionability

- **Goal:** Align cockpit indicators/signals/actions with authoritative runtime state and transitions.
- **Core subsystems:** cockpit bundle, indicators, guided signals, action handlers, scope model.
- **Order rationale:** cockpit should represent hardened runtime, not heuristics.
- **Expected artifacts:** runtime-backed cockpit payload schema, actionable command wiring, deprecation cleanup.
- **Success criteria:** cockpit values map to real runtime state; actions trigger governed workflows; advisory surfaces clearly marked.
- **Dependencies:** Clusters 1-5.

## Cluster 7 — Validation and Certification Semantic Depth

- **Goal:** Upgrade command-matrix checks into semantic runtime invariant verification.
- **Core subsystems:** `verify-*` scripts, certification services, invariant evaluators.
- **Order rationale:** validates hardened architecture after core integration.
- **Expected artifacts:** semantic verifier modules, richer certification evidence payloads, strict-mode blockers.
- **Success criteria:** readiness decisions fail on semantic/runtime drift, not only command failures.
- **Dependencies:** Clusters 1-6.

## Cluster 8 — Artifact Canonicalization and Persistence Governance

- **Goal:** Reduce artifact sprawl and enforce canonical persistence/versioning for generated outputs.
- **Core subsystems:** reports pipeline, schema/version governance, persistence strategy.
- **Order rationale:** stabilize operational traceability after behavior is hardened.
- **Expected artifacts:** canonical artifact index, retention strategy, schema drift checks, naming normalization.
- **Success criteria:** operators can identify canonical artifacts unambiguously; drift alarms trigger automatically.
- **Dependencies:** Clusters 1-7.

## Cluster 9 — Demo-Grade Execution Packaging

- **Goal:** Produce one-click, deterministic, operator-safe execution demonstration for hardened system.
- **Core subsystems:** runbooks, scripts, cockpit surfaces, verification pipelines.
- **Order rationale:** final packaging after all hardening complete.
- **Expected artifacts:** execution runbook, demo scenario packs, release checklist, trace bundle template.
- **Success criteria:** repeatable end-to-end run with no misleading advisory/enforced ambiguity.
- **Dependencies:** Clusters 1-8.

## Recommended Immediate Next Cluster

**Start with Cluster 1 (Canonical Runtime Authority Lock).**  
It unlocks all downstream hardening by eliminating path ambiguity and forcing one authoritative production path.
