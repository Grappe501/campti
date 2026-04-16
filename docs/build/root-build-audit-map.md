# Root Build Audit Map

## Audit Scope

This pass audited repository truth across:

- Runtime entrypoints (`scripts`, `app/actions`, service orchestration)
- Domain and service layers (`lib/domain`, `lib/services`, `lib/chapter-state`, `lib/scene-generation`)
- Operator surfaces (`app/admin`, `app/read`, cockpit services/components)
- Validation and certification surfaces (`*.test.ts`, `verify:*` scripts, certification wrappers)
- Artifact outputs (`reports/*`, `docs/build/*`)

This map intentionally distinguishes **implemented** from **integrated** and **enforced**.

## Repository Architecture (High-Level)

### 1) Production Runtime Path (DB-backed, interactive)

- UI/action boundary: `app/actions/scene-generation.ts`, `app/actions/narrative-workflow.ts`, `app/actions/author-workflow.ts`
- Core generation path: `lib/services/scene-generation-service.ts`
  - Input loading and contract shaping: `lib/services/scene-generation-input-loader.ts`
  - Contract validation: `lib/contracts/contract-registry`
  - Truth checks: `lib/services/world-book-mapper.ts`
  - LLM execution: `lib/scene-generation/scene-generation-llm-adapter.ts`
  - Dependency registration: `lib/services/scene-generation-dependency-service.ts`
- Post-generation composition/QA:
  - chapter assembly: `lib/services/chapter-assembly-service.ts`
  - prose QA: `lib/services/narrative-prose-quality-service.ts`, `lib/services/prose-quality-service.ts`
  - repair workflows: `lib/services/scene-repair-execution-service.ts`
  - coherence planning: `lib/services/chapter-coherence-refinement-service.ts`, `lib/services/book-coherence-refinement-service.ts`

Status: **runtime_active_enforced** for core generation/assembly/repair flows.

### 2) Book1 Regeneration Pipeline (simulation-heavy scripted flow)

- Entrypoint: `scripts/run-book1-chapter-01-regeneration-loop.ts`
- Orchestrator: `lib/services/book1-regeneration-loop-service.ts`
- Builds many derived packs/artifacts:
  - chapter state, beat chain, prose constraints
  - literary devices
  - sequence architecture
  - scene generation engine bundle
  - ENCS/EEGS/Narrator packs
  - cockpit bundle

Status: **runtime_active_advisory** for most downstream packs; **partially_wired** to real production runtime.

### 3) Certification/Verification Layer

- Script orchestration: `scripts/verify-*.ts`, `scripts/run-*-certification.ts`, `scripts/verify-full-system.ts`
- Enforcement utility: `lib/certification/certification-enforcement.ts`
- Many layer verifiers are command-result evaluators (e.g. `platform-scale-verification-service.ts`, `operations-layer-verification-service.ts`) rather than deep runtime assertions.

Status: mixed:
- command execution + gating: **runtime_active_enforced**
- many invariant evaluators: **runtime_active_advisory**

### 4) Cockpit and Operator Surfaces

- Author cockpit route: `app/admin/narrative/page.tsx`
- Cockpit bundle builder: `lib/services/author-command-cockpit-service.ts`
- Cockpit composition utilities:
  - `author-cockpit-consolidation-service.ts`
  - `cockpit-scope-model-service.ts`
  - `tool-rail-system-service.ts`
  - `indicator-bank-model-service.ts`
  - `guided-signals-service.ts`
- Reader cockpit remains separate: `app/read/cockpit/page.tsx`

Status:
- shell/framework: **runtime_active_enforced**
- indicators/signals: **runtime_active_advisory** (explicitly advisory-only)

## Root-Level Runtime Families

- **Family A: Production authoring/runtime** (scene generation + chapter assembly)
- **Family B: Book1 scripted regeneration** (artifact-rich simulation path)
- **Family C: Certification wrappers** (verify commands and readiness artifacts)
- **Family D: Admin/cockpit surfaces** (author, reader, observer/debug, operational dashboards)

## Root Truth Findings

- Repo has broad implementation coverage; many systems exist and execute.
- A significant subset is still **sample-seeded**, **artifact-oriented**, or **advisory-only** rather than hard runtime governors.
- The strongest integration today is in the production scene-generation + chapter-assembly stack.
- The Book1 regeneration stack is deeply implemented but currently more of a deterministic simulation/report pipeline than a production generation authority.
