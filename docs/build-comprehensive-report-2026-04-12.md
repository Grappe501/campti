# Campti — Comprehensive Build Report

**Generated:** 2026-04-12  
**Purpose:** Single downloadable reference for what the Campti codebase is today, how it is structured, what it can do, where the product trajectory points, and what end-user experience it is designed to support.

This document synthesizes the **repository layout** (`app/`, `lib/`, `prisma/`, `scripts/`), **documented build stages** (`lib/campti-build-sequence/stages.ts`), **release notes** (`docs/release-notes/`), and **domain-oriented services** (cognition, simulation, scene generation, population/social field). It is **production-oriented**: it describes implemented or partially implemented systems, not marketing claims.

---

## 1. Executive summary

**Campti** is a **Next.js 16** application with a **large Prisma/Postgres** data model, focused on a **literary historical narrative world** (multi-generational, land- and research-grounded). The system treats narrative as **lawful simulation under constraints**: constitutional rules, ontology, character psychographics, world-era pressure, scene-level legality/readiness, and—on top—**deterministic “mind” composition** for modeled characters plus **LLM-assisted** inner voice, decision explanation, and scene prose generation.

At this point in the build:

- **Authoring & research infrastructure** is deep: sources, chunks, extraction, claims, genealogical slots/assertions, places, events, books/chapters/scenes, world-state references, many character/world profile dimensions, narrative dependencies, prose quality reports, census research hooks, and ingestion scripts.
- **Character cognition (Phase 5)** is implemented as a **deterministic pipeline** (no LLM required) that resolves a `CharacterCognitionFrame` from DB state, then optionally feeds **inner voice** and **decision trace** LLM adapters with structured JSON contracts.
- **Simulation runs (Phase 5E)** apply **explicit override bundles**, diff frames and pressures, and respect **canonical vs exploratory** policy.
- **Scene generation (Phase 6 baseline)** loads a structured **`SceneGenerationInput`**, calls an LLM adapter, can run **deterministic prose QA**, registers **narrative dependencies**, and writes **`Scene.generationText`** only when asked—never silently overwriting authoring or published reader text.
- **Population & social field (Phase 5F)** adds **lightweight census-style entities**, households, presence, optional link to `Person`, **social field context** (density, witness/gossip/authority/kin pressures), wired into cognition resolution and available via server actions—**without** simulating full minds for every person.

**Not yet the focus of the codebase:** a polished consumer-only “finished novel app”; full multi-branch gameplay; automatic promotion of every research row to modeled character; or full wiring of social field into every downstream system (see §9).

---

## 2. Vision: what the program is for

### 2.1 Core intent

Campti is designed to support **long-horizon historical fiction** where:

- **Truth flow is traceable** (research → claims → story objects).
- **Characters behave under era-appropriate limits** (knowledge, desire, law, body, language—not modern therapy voice in premodern heads unless authored).
- **Scenes are lawful before they are pretty** (constraints, readiness, outcome envelopes—not raw prompt improvisation).
- The same historical material can support **multiple narrative layers** (reader experience vs “event truth,” meta-scenes, cinematic passes) without collapsing into a single undifferentiated draft.

### 2.2 End-user experience (aspirational, aligned with the codebase)

**Readers (public `/read` …)**  
Target experience: enter a **story world** with a strong sense of **place, time, and consequence**—read chapters/scenes, browse characters and places, use timeline affordances, and optionally **hands-free / immersive reading** patterns (components exist in `lib/hands-free/` and reader flows). Over time, as content and polish land: **continuity-aware reading** (memory threads, symbols), richer audio/cinematic layers tied to meta-scenes, and **membership/subscribe** surfaces (`/subscribe`, `/membership`) as the product matures.

**Authors / researchers / world-builders (admin `/admin/...`)**  
Target experience: a **single system of record** where they can:

- Ingest and decompose **sources**, manage **fragments** and **clusters**, and merge **extracted entities** into canonical people/places.
- Define **world eras** (`WorldStateReference`) with economic, governance, desire, language, education, health, and relationship **norm profiles**—so generation and cognition pull the same knobs.
- Build the **narrative spine**: Epic → Book → Chapter → Scene, with assembly status and revision jobs.
- Tune **characters** at depth: literary profile, cognition core (`CharacterCoreProfile`), simulation state, relationships, constraints, perception/voice/choice profiles, continuity/education/health envelopes, intelligence/development, etc.
- Run **scene workspace** tooling: drafts, assist runs, brain evaluation hooks, **readiness / Stage 8** panels, optional **scene generation** and **prose quality** passes.
- Run **simulation scenarios** and inspect diffs—**exploratory** by default, with explicit policy for anything that would become “canonical.”

**Operators**  
Migrations, seeds, and many **`npm run db:*` / `report:*` / `verify:*` / `uploads:*` / `research:*`** scripts support repeatable environments and handoff reporting (`scripts/generate-handoff-report.ts`).

---

## 3. Technical architecture

### 3.1 Stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js (App Router), React 19 |
| Language | TypeScript 5 |
| Database ORM | Prisma 6 → PostgreSQL |
| Validation | Zod 4 |
| LLM | OpenAI SDK (`openai` package); `OPENAI_API_KEY` required for LLM features |
| Styling | Tailwind CSS 4 |
| Optional | `@supabase/supabase-js` is listed in `package.json`; **no in-repo TypeScript usage was found** at report time—treat as reserved for future auth/storage workflows unless you add integration. |

### 3.2 Repository scale (indicative)

- **`lib/`**: ~289 TypeScript modules (shared domain logic, engines, services, adapters).
- **`app/`**: 130+ `page.tsx` routes across **admin**, **reader**, and **marketing** surfaces.
- **`prisma/schema.prisma`**: **100+ `model`** declarations (dense narrative/world simulation schema).
- **Migrations**: 28+ SQL migration folders under `prisma/migrations/` (as of this scan).

### 3.3 Execution model

- **Server Actions** under `app/actions/*.ts` encapsulate mutations and orchestration (cognition, simulation, scene generation, ingestion, etc.).
- **Services** under `lib/services/` orchestrate multi-step flows (e.g. `character-cognition-resolver`, `scene-generation-service`, `social-field-context-service`).
- **Deterministic engines** under `lib/*` (cognition compose, decision trace breakdown, scene constraints, prose quality analyzers, simulation diff) keep behavior **testable and reproducible** where possible; LLM calls are **adapters** at the edges.

### 3.4 Build / deploy

- **`npm run build`**: runs `scripts/prisma-generate-optional.mjs` then `next build` (Prisma generate tolerant if locked).
- **Netlify**: `@netlify/plugin-nextjs` present—deployment is Next-on-Netlify oriented; exact env vars are project-specific (`DATABASE_URL`, `OPENAI_API_KEY`, etc.).

---

## 4. Methodology: Campti build sequence (stages 1–15)

The file `lib/campti-build-sequence/stages.ts` defines **CAMPTI_BUILD_STAGES**: an ordered roadmap from **constitutional law** through **simulation runs**. It explicitly warns: *do not build UI-first*—follow **law → ontology → variables → engines → admin → gates → simulation**.

**Stage map (abbreviated):**

| Stage | Name | Focus |
|------:|------|--------|
| 1 | Constitutional core | Narrative rules, continuity, permissions—legal status for narrative objects |
| 2 | Ontology / registry spine | Entity/record/visibility/confidence registries |
| 3 | Character engine | Profiles, state, constraints, triggers, perception/voice/choice |
| 4 | Place / environment | Land, risk, setting profiles, place state |
| 5 | Pressure / historical order | Governance, economic/social pressure bundles |
| 5.5 | Intelligence & maturity | Knowledge/expression profiles; historically bounded cognition |
| 6 | Symbol / motif law | Governed symbols and bindings |
| 6.1 | Relationship, desire & masking | Dyads, desire, disclosure, network summaries (listed as 6.1 in stages file) |
| 6.5 | Trauma, health, rumor, education | Continuity layers |
| 7 | Timeline / anchor | Temporal structure (many models still “future” in stage text) |
| 8 | Scene constraint | **Legality before prose**—readiness, outcome envelopes |
| 9 | Meta-scene / experience | Separate event truth from reader experience |
| 10 | Voice governance | Rule-bound language output |
| 11 | Memory / fragment | Archives, clusters, lawful memory |
| 12 | Branch / determinism | Explicit path space (future admin surfaces) |
| 13 | Research-to-story binding | Traceable research → narrative fuel |
| 14 | Composition readiness | Gates before drafting |
| 15 | Simulation run layer | Runnable scenarios, traces, alternate paths |

**Important:** The **numeric stage labels in code/docs** and **internal phase labels** (e.g. “Phase 5 cognition,” “Phase 6 scene generation,” “Phase 5F population”) are **parallel naming systems**. The stage list is the **strategic skeleton**; “Phase 5/6” tracks **delivered feature verticals** in cognition/generation work.

---

## 5. Data model (Prisma) — what exists in the database

The schema is too large to enumerate field-by-field here. Conceptual **clusters**:

### 5.1 Research & ingestion

- **`Source`**, **`SourceChunk`**, **`SourceText`**, **`IngestionRun`**, **`ChunkExtractionRun`**, **`ExtractionPacket`**, **`ExtractionResult`**, **`ExtractedEntity`**, **`EntityLink`**, **`Alias`**
- Supports **decomposition**, **review/merge** workflows, and promotion helpers (`lib/promote-extracted.ts`)

### 5.2 Genealogy & claims

- **`GenealogicalFactSlot`**, **`GenealogicalAssertion`**, **`Claim`**
- Feeds narrative dependencies and cognition (assertions surfaced on `CharacterCognitionFrame`)

### 5.3 People & characters

- **`Person`** (canonical human record)
- **`CharacterProfile`**, **`CharacterCoreProfile`**, **`CharacterState`**, **`CharacterStateSnapshot`**
- **`CharacterRelationship`** and many **typed profile** tables (governance, socio-economic, demographic, family pressure, intelligence, development, biological state, relationship, masking, desire, trauma, rumor, education, learning, health, etc.)
- **`CharacterInnerVoiceSession`**, cognition/simulation adjacency

### 5.4 Narrative hierarchy & scenes

- **`Epic`**, **`Book`**, **`Chapter`**, **`Scene`**
- **`NarrativeBeat`**, **`SceneAssistRun`**, **`SceneDraftVersion`**
- **`ProseQualityReport`** (deterministic + metadata scope)

### 5.5 World & place

- **`WorldStateReference`** (+ era/governance/knowledge/expression/education/health/relationship norm profiles)
- **`Place`**, **`SettingProfile`**, **`SettingState`**, **`PlaceEnvironmentProfile`**, **`PlaceState`**, **`EnvironmentNode`**, **`NodeConnection`**, **`RiskRegime`**, etc.

### 5.6 Meta-narrative & media

- **`MetaScene`**, **`MetaSceneNarrativePass`**, **`SceneAudioAsset`**, **`CinematicNarrativePass`**, **`AudioSyncSegment`**, **`VoicePass`**, **`CharacterVoiceAsset`**, **`NarrativeVoiceProfile`**

### 5.7 Simulation & generation dependencies

- **`SimulationScenario`**, **`SimulationRun`**
- Narrative dependency graph (see migrations around `narrative_dep`) links scenes to assertions, people, world state, simulation scenarios, cognition sessions, etc.

### 5.8 Population substrate (Phase 5F)

- **`PopulationHousehold`**, **`PopulationEntity`**, **`PopulationEntityAlias`**, **`PopulationEntityPresence`**
- Optional **`PopulationEntity.personId`** → **`Person`** for promotion path

---

## 6. Major capabilities (implemented behavior)

### 6.1 Deterministic character cognition (Phase 5)

**Entry:** `resolveCharacterCognitionFrame` in `lib/services/character-cognition-resolver.ts`.

**Composes (no LLM):**

- World resolution for the scene (`resolveEffectiveWorldStateForScene`)
- Core/literary profiles, snapshot merge, relationships (with optional simulation patch), genealogical assertions
- Deterministic cognition layer (`composeDeterministicCognitionLayer`)
- Enneagram profile + instinct stacking + inner voice pattern + pressure/integration
- Thought-language frame (era + age band + character profile)
- Desire / attachment / pleasure / sexual constraint shaping
- Embodiment from legacy simulation JSON + scene hints
- Thought realism profiles (fragmentation, distortion, inner voice texture)

**Output:** `CharacterCognitionFrame` (`lib/domain/cognition.ts`) — the unified object for prompts, simulation, and traces.

**Phase 5F extension:** optional **`socialFieldContext`** (witness/gossip/authority/kin/household/taboo/institutional attention scalars + counts), from `buildSocialFieldContextFromQuery` (`lib/services/social-field-context-service.ts`), embedded in **`cognitionFrameToPromptPayload`** under **`socialField`**.

### 6.2 Inner voice (LLM, structured)

- Contracts in `lib/cognition/inner-voice-contract.ts`, domain types in `lib/domain/inner-voice.ts`
- Request build: `lib/inner-voice/build-character-inner-voice-request.ts`
- Adapter: `lib/inner-voice/inner-voice-llm-adapter.ts`
- Server actions in `app/actions/cognition.ts` (resolve frame, build request, run LLM with advisory policy hooks)

### 6.3 Decision trace (deterministic + LLM explanation)

- Deterministic pressure breakdown: `lib/decision-trace/decision-trace-deterministic.ts`
- LLM adapter: `lib/decision-trace/decision-trace-llm-adapter.ts`
- Package assembly: `lib/services/decision-trace-service.ts` (uses cognition frame; simulation passed as `{ simulation }` for patch compatibility)

### 6.4 Simulation runs (Phase 5E)

- Types and override keys: `lib/domain/simulation-run.ts` (`SimulationOverrideKey`, patches, scenarios)
- Orchestration: `lib/services/simulation-run-service.ts` (base vs patched frame, diffs, optional decision trace + inner voice)
- Policy: `lib/simulation/simulation-canonical-policy.ts`
- Persistence helpers via `simulation-scenario-service` and related actions `app/actions/simulation-run.ts`

### 6.5 Scene generation (Phase 6 baseline)

- Contracts: `lib/domain/scene-generation-contract.ts`, input/output types (`scene-generation-input.ts`, `scene-generation-output.ts`)
- Loader: `lib/services/scene-generation-input-loader.ts` (assembles contract + cognition/decision payloads when configured)
- Service: `lib/services/scene-generation-service.ts` — **`runSceneGeneration`**: hash input, optional **dependency registration**, LLM generation, optional **deterministic prose quality**, strict text target (`generationText` when saving)
- Adapter: `lib/scene-generation/scene-generation-llm-adapter.ts`
- Dependency registration: `lib/services/scene-generation-dependency-service.ts`
- Actions: `app/actions/scene-generation.ts`

### 6.6 Scene constraints & readiness (Stage 8)

- Documented in `docs/stage-8-scene-legality-layer.md`
- Engine/types: `lib/scene-constraint-engine.ts`, `lib/scene-constraint-types.ts` (per doc)
- Actions: `app/actions/scene-constraints.ts`
- UI: scene workspace integration (`components/scene-readiness-panel.tsx` per doc)
- Verification: `npm run verify:stage8`, `npm run verify:stage8-5` for outcome envelope fixtures

### 6.7 Prose quality (deterministic)

- Core: `lib/prose-quality/` (multiple analyzers—dialogue, n-grams, voice fit, goals, etc.)
- Service wrapper: `lib/services/prose-quality-service.ts`
- Persistence: `ProseQualityReport` model
- Actions: `app/actions/prose-quality.ts`

### 6.8 Population & social field (Phase 5F)

- Domain types: `lib/domain/population-social-field.ts`
- Name normalization: `lib/population/population-name-normalize.ts`
- Ingestion: `lib/services/population-ingest-service.ts` (`ingestPopulationRows` — dedupe by normalized name + birth year + world slice, household keys, aliases, presence windows)
- Social field math: `lib/social-field/social-field-engine.ts`
- Context builder (DB-backed counts): `lib/services/social-field-context-service.ts`
- Promotion: `lib/services/population-promotion-service.ts` (link or create `Person`, preserve provenance notes)
- Actions: `app/actions/population-social-field.ts`

**Explicit non-goal:** **No** full cognition for entire population—only **scalable lightweight** presence and pressures.

### 6.9 Brain assembly & scene intelligence (partial / advanced)

- Brain bundle assembly and scene-time evaluation appear across `lib/services/brain-assembly-engine.ts` (referenced in docs), `app/actions/brain-assembly.ts`, `app/actions/scene-brain-runner.ts`, `lib/scene-brain-runner.ts`
- Scene intelligence AI hooks: `lib/scene-intelligence.ts`, `lib/scene-intelligence-ai.ts`, actions `app/actions/scene-intelligence.ts`

### 6.10 Narrative DNA, constitutional rules, ontology

- Narrative DNA ingest/runners: `lib/narrative-dna-*.ts`, actions `app/actions/narrative-dna*.ts`
- Constitutional rules: `app/actions/constitutional-rules.ts`, `lib/constitutional-rule-*.ts`
- Ontology: `app/actions/ontology.ts`, `lib/ontology.ts`

### 6.11 Census research & Campti-specific pipelines

- Scripts: `db:import-campti-census`, `research:census-pipeline`, history atlas, grappe lineage wiring—see `package.json` scripts and `lib/census-research-*.ts`

---

## 7. Application surfaces

### 7.1 Public / reader (`app/read/`, marketing home)

- **Home** (`app/page.tsx`): literary marketing, entry to `/read`, character/place spotlights from `getPublicHomeData`
- **Reader**: chapters, scenes, characters, places, timeline, symbols—**experience-oriented** routes
- **Hands-free** utilities under `lib/hands-free/` (speech, gaze-edge controller types) for accessibility-forward reading experiments

### 7.2 Admin (`app/admin/`)

Broad coverage including: dashboard, people, characters (mind, brain, continuity, relationships, intelligence, pressure…), places & environment, world states (profiles, knowledge, education, health, pressure, relationships), narrative (books, assembly), scenes & workspace, meta-scenes (compose, perception, cinematic), sources & ingestion & extracted entities, fragments/clusters, events, continuity, claims, permissions, confidence, readiness, patterns, symbols, motifs, connections, audio-sync, build-sequence viewer (`lib/campti-build-sequence/stages.ts` surfaced in UI), etc.

**This is primarily an author/studio cockpit**, not a single simplified “writer modal.”

---

## 8. Scripts & operator tooling

Not exhaustive—high-value entries from `package.json`:

| Script | Role |
|--------|------|
| `db:validate`, `db:generate`, `db:push`, `db:seed`, `db:studio` | Database lifecycle |
| `db:narrative-system`, `db:narrative-dna`, `db:historical-timeline`, `db:campti-history-atlas`, `db:grappe-lineage-source` | Content/research ingestion |
| `report:handoff`, `report:handoff:full` | JSON handoff reports for AI/docs |
| `verify:stage8`, `verify:stage8-5` | Constraint/outcome regression checks |
| `uploads:index`, `uploads:sync-research` | Local upload indexing / research bundle sync |
| `db:import-campti-census`, `research:census-pipeline` | Census research |

---

## 9. Gaps, follow-ups, and near-term trajectory

### 9.1 Documented near-term (from release notes & roadmap language)

- **Phase 6.1 — Scene generation against live social field:** thread `SocialFieldContext` deeply into generation contracts and prompts (beyond cognition payload embedding).
- **Phase 6.2 — Regeneration / staleness / repair loop:** operationalize stale detection, revision jobs, chapter rollups (`narrativeAssemblyStatus` already exists on entities).
- **Phase 6.3 — Chapter coherence:** cross-scene consistency passes.

### 9.2 Population / social field

- Simulation **override keys** for social-field intensity (compare dense vs thin pressure) may be extended in `SimulationOverrideKey` + resolver.
- Broader **query surfaces** (kin clusters, gossip graph)—domain types allow evolution; not all graph queries are implemented.
- **UI** for population ingest/promotion: explicitly deferred (server actions exist).

### 9.3 Ops / environment

- **`npx prisma generate`** occasionally fails on Windows with **EPERM** (DLL rename)—close locking processes or retry; build uses optional generate script for CI tolerance.
- **Supabase** package unused in TS—if you add auth or object storage, document new env and flows.

### 9.4 Stage roadmap items still “future” in `stages.ts`

Many stage bullets list **admin routes marked `(future)`**—branch tables, simulation anchors UI, voice governors, full run console, etc. The **schema and libraries often anticipate** these; **product completion** means wiring UI + policies + tests per stage.

---

## 10. Long-range vision (multi-year product arc)

Aligned with the stage document and current implementation:

1. **Truth and law first** — Every scene’s permissible outcomes and voice derive from **stored world/character state**, not from a one-shot model mood.
2. **Research-native fiction** — Ingestion pipelines and claims/assertions are **first-class**, so the story can be defended and revised without losing provenance.
3. **Historically bounded minds** — Cognition frames encode **era, body, language, desire, and social field**—so characters stay **situated**.
4. **Separation of layers** — Meta-scenes, cinematic/audio passes, and reader modes can diverge **without breaking canonical event structure**.
5. **Exploration with audit trails** — Simulations and LLM assists are **advisory by default**; promotion to canonical is **explicit** (policies in code and docs).

**End state (experience):** a reader can **live inside** a deeply researched world—reading, listening, optionally navigating threads—while authors maintain **one coherent engine** where prose, cognition, and history **do not silently contradict** each other. The codebase is already structured for that; much of the remaining work is **integration depth, UI polish, and content**.

---

## 11. How to use this report

- **Download:** commit this file from `docs/build-comprehensive-report-2026-04-12.md` or copy from the repository.
- **Refresh:** re-run a repository scan after major milestones; update release notes under `docs/release-notes/` per ship.
- **Machine-readable inventory:** run `npm run report:handoff:full` for filesystem + DB story graph JSON (requires `DATABASE_URL`).

---

*This report is descriptive of the repository at documentation time and does not replace migration logs, seed data, or environment-specific configuration.*
