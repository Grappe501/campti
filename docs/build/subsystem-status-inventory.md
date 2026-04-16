# Subsystem Status Inventory

Status vocabulary used:

- `docs_only`
- `code_exists_not_wired`
- `partially_wired`
- `runtime_active_advisory`
- `runtime_active_enforced`
- `cockpit_visible_only`
- `test_only`
- `deprecated_or_duplicate`
- `unclear_needs_review`

## Inventory

| Subsystem | Status | Maturity (0-5) | Execution Impact | Hardening Priority | Notes |
|---|---:|---:|---|---|---|
| Scene generation core (`scene-generation-service`) | runtime_active_enforced | 4 | critical | critical | Main production generation path via actions; DB + contract + dependency registration wired. |
| Scene generation LLM adapter | runtime_active_enforced | 4 | critical | high | Enforced contract parsing and API-key guard; output flagged advisory. |
| Scene input loader + temporal source gating | runtime_active_enforced | 4 | high | high | Pulls world-state scoped sources; strong integration with contract loader. |
| Chapter assembly (`assembleChapterReaderText`) | runtime_active_enforced | 4 | critical | critical | Used in workflow/orchestration and refinement paths; updates chapter assembly state. |
| Scene repair execution | runtime_active_enforced | 4 | high | high | Repair mode planner + generator invocation + assembly status updates. |
| Chapter coherence refinement | runtime_active_advisory | 3 | medium | medium | Plans and guidance are strong; write behavior optional and mostly advisory. |
| Book coherence refinement | runtime_active_advisory | 3 | medium | medium | Similar to chapter coherence; mostly guidance-first. |
| Narrative prose quality analysis | runtime_active_advisory | 4 | medium | medium | Deterministic QA and reports; advisory to authoring decisions. |
| Author workflow orchestration | runtime_active_enforced | 4 | high | high | Orchestrates scene/chapter/book packages and checkpoints. |
| Book1 regeneration loop orchestrator | partially_wired | 3 | high | high | Deep stack exists, but integration is script/report-focused vs production runtime authority. |
| Chapter state derivation | runtime_active_advisory | 3 | medium | high | Used in regeneration path; formulaic and deterministic. |
| Beat assembly chain (state-driven) | partially_wired | 3 | high | high | Strong in regeneration, not governing production path directly. |
| Book1 seeded beat assembly | runtime_active_advisory | 2 | medium | high | Uses chapter1 seeded beat templates and fallback chain. |
| Narrative thread derivation | partially_wired | 2 | high | high | `buildBook1SampleThreadPack` indicates sample-seeded core behavior. |
| Narrative psychology derivation | partially_wired | 3 | medium | high | Used in regeneration; not primary production decision authority. |
| Narrative sequence derivation/validation | partially_wired | 2 | medium | medium | Active in regeneration path; not integrated into production generation path. |
| Scene generation engine (chapter bundle) | code_exists_not_wired | 2 | high | high | Used by regeneration service, not by production scene generation runtime. |
| Prose constraint derivation/validation (chapter-level) | partially_wired | 3 | medium | high | Strong regeneration integration; partial production influence. |
| Literary device derivation + cockpit layer | partially_wired | 3 | medium | high | Implemented and tested; currently regeneration-oriented in decision path. |
| ENCS (epic continuity) | partially_wired | 2 | high | high | Code + validation + tests present; mostly regeneration and artifact integration. |
| EEGS (epic emotional gravity) | partially_wired | 2 | high | high | Same pattern as ENCS; pack derivation and cockpit summaries exist. |
| Narrator presence/convergence | partially_wired | 2 | medium | medium | Implemented with validation/tests; consumed heavily in regeneration path. |
| Author command cockpit shell | runtime_active_enforced | 3 | medium | high | Real route + bundle + scope mechanics active. |
| Indicator bank model | runtime_active_advisory | 3 | medium | medium | Metrics derive from heuristics in route context, not hard runtime state. |
| Guided signals | runtime_active_advisory | 3 | low | medium | Explicit `advisoryOnly: true`; not enforcing state transitions. |
| Legacy cockpit/workbench routes | deprecated_or_duplicate | 2 | medium | high | Book/chapter routes redirect; scene workspace contains redirect with unreachable legacy body. |
| Reader cockpit | runtime_active_enforced | 4 | medium | medium | Distinct surface with ownership checks and session routing. |
| Author inspection surface | runtime_active_enforced | 4 | high | medium | Strong separation and permission checks; author-only path guarded. |
| Certification script runners | runtime_active_enforced | 3 | high | high | Execute command matrices and can fail runs. |
| Verification evaluator services (`*-verification-service.ts`) | runtime_active_advisory | 2 | medium | high | Often command-result summarizers, not deep model/runtime semantic checks. |
| Build docs/spec packs (`docs/build`) | docs_only | 2 | low | medium | Rich coverage but non-authoritative relative to runtime behavior. |
| Report artifacts (`reports/*`) | cockpit_visible_only | 3 | medium | high | Operationally useful; many are snapshots and not runtime gating inputs. |
