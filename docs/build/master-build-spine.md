<!--
  CANONICAL LONG-RANGE BUILD SPINE (P2)

  This file is the authoritative product and architecture anchor for multi-phase implementation.
  Future design and code work should stay aligned with it. When reality diverges, record the
  divergence explicitly (ADR, changelog, or update here) and reconcile—do not silently drift.
-->

# Master Build Spine

**Phase:** P2 — Master Build Spine / Product Architecture Canonicalization  
**Audience:** Engineers and architects building Campti  
**Status:** Living document — provisional items are labeled as such.

---

## 1. System mission

Campti is **not** a single novel generator. It is:

1. **A historical simulation and narrative operating system** — structured truth (genealogy, place, time, world state) sits beneath every narrative surface. Expressive output is downstream of that substrate.

2. **A multi-book epic generation system** — long-horizon story is authored and assembled across **books**, **chapters**, and **scenes**, with explicit hierarchy, dependency, and repair semantics.

3. **A future voice-driven reader interaction layer** — the reader experiences narrative as **listened** prose and, where designed, **speaks** with characters who remain bounded by history and knowledge.

4. **Characters as bounded, historically situated agents** — “Character” is not continuous life in a background simulator. It is **reconstructed cognition and voice** invoked under constraints: era, social field, relationship graph, and knowledge boundaries.

5. **Deterministic truth before expressive generation** — facts, dependencies, hashes, contracts, and assembly state **outrank** convenience of generation. Prose is generated; truth is asserted, versioned, and invalidated deliberately.

---

## 2. Core non-negotiables

These rules apply across layers. Violating them breaks author trust and historical integrity.

| Rule | Meaning |
|------|--------|
| **Nothing is “alive” except observed state** | No hidden continuous simulation of inner life. What exists in the DB / contract / frame is what the system can claim. |
| **Reconstruction, not continuous simulation** | Characters are materialized for a scene, run, or session from **bounded inputs** — not an always-on soul loop. |
| **Epistemic horizon** | Characters know only what they could have known **then** (place, role, literacy, news horizon, social field). |
| **No out-of-world teaching** | Readers cannot inject modern facts as truth into the character’s belief state. Relationship memory is **bounded** and policy-governed. |
| **Translation is presentation, not cognition** | English vs. heritage-language **rendering** is a display/voice layer. It does not replace or shortcut in-world reasoning. |
| **Generated text ≠ human-authored text** | Distinct columns, promotion rules, and repair semantics. Never overwrite human prose without explicit, typed workflow. |
| **No backward contamination** | Later-era sources, drafts, or models **cannot** alter earlier world states or locked genealogical truth without explicit migration and audit. |
| **Truth outranks generation** | Genealogy, world-state boundaries, dependency edges, and contract registry versions **beat** model convenience. |

---

## 2a. Global directives (all future systems)

These rules are **binding** for every new subsystem, integration, and refactor. They restate and tighten the spine for implementers.

1. **Respect temporal truth boundaries** — Era/world-state applicability, source windows, and anti–backward-contamination rules are mandatory; no “future” material may ground earlier slices without explicit migration and audit.

2. **Respect character knowledge limits** — Epistemic horizon, literacy, social field, and knowledge-boundary outputs constrain what a character may state as fact or belief.

3. **Never allow omniscient responses** — No narrator-grade, off-stage, or interior-of-others claims unless explicitly supported by bounded inputs (sources, witness, assertions).

4. **Keep reader knowledge bounded per character** — Reader–character memory is interaction-earned, policy-limited, and per dyad; no global reader profile leakage into in-world cognition.

5. **Treat translation as presentation only** — Language toggles and TTS/playbook rendering do not rewrite cognition artifacts or canon.

6. **Preserve deterministic inputs before generation** — Contracts, hashes, dependency plans, and typed loaders outrank convenience; generation consumes stable inputs.

7. **Maintain separation between human-authored and generated text** — Distinct storage, promotion paths, and repair semantics; never overwrite human prose without explicit, typed workflow.

**Enforcement:** If an implementation cannot satisfy a directive, it **must** either **fail closed** (throw / reject the operation) or **log a critical warning** at the violation site (not only debug logs). Prefer `lib/governance/global-directives.ts` `reportGlobalDirectiveViolation` so breaches are visible in one format. Silent violation is disallowed for production-grade releases.

| Directive (code id) | Maps to rule |
|---------------------|----------------|
| `TEMPORAL_TRUTH_BOUNDARIES` | 1 |
| `CHARACTER_KNOWLEDGE_LIMITS` | 2 |
| `NO_OMNISCIENT_RESPONSES` | 3 |
| `READER_MEMORY_BOUNDED_PER_CHARACTER` | 4 |
| `TRANSLATION_PRESENTATION_ONLY` | 5 |
| `DETERMINISTIC_INPUTS_BEFORE_GENERATION` | 6 |
| `HUMAN_VS_GENERATED_TEXT_SEPARATION` | 7 |

---

## 2b. Narration interaction modes (P2-Z scaffolding)

The codebase distinguishes **two named interaction modes** in `lib/domain/narration-modes.ts`. This is **separation scaffolding** — not an implementation of privileged tooling.

| Mode (code id) | Meaning |
|----------------|--------|
| **`bounded_character_conversation`** | The implemented path for reader↔character dialogue: identity snapshots, knowledge boundaries (P2-F), relationship memory (P2-G), contracts, guardrails. The character does **not** receive omniscient access to other minds, off-stage truth, or author knowledge **beyond what the allowed snapshot and policy surfaces** — there is no hidden “see everything” channel on this pipe. |
| **`future_author_god_mode`** | **Reserved** for a **separate future layer** (different contracts and pipelines): author-facing or privileged narrative access, if ever built. **Not implemented today.** Must not be conflated with “turning off” bounds on the same character chat stack. |

**Rules**

1. **Bounded mode** — Cannot grant omniscient interior access or narrator-grade truth beyond the bounded snapshot context and global directives; violations are governance failures, not UX toggles.
2. **Author / God mode** — When implemented, must remain a **distinct surface** from bounded conversation (not a flag that silently widens character epistemics).

**Enforcement:** New interactive features default to `bounded_character_conversation` unless explicitly designed for the future layer.

---

## 3. Layered architecture

Layers are **ordered** from substrate to surface. Lower layers constrain higher ones.

1. **Truth / genealogy / source layer** — assertions, evidence, record types, ingestion provenance, dependency on primary material where required.

2. **World state layer** — era-scoped slices, places, population substrate, environmental and institutional facts that bound what “can be true” in a scene.

3. **Character cognition / bounded selfhood layer** — frames, inner voice, decision traces, simulation runs: **invoked** structures, not omniscient minds.

4. **Relationship / social field layer** — witness, gossip, authority, kin visibility: pressures on action and prose without omniscient narration.

5. **Narrative generation / repair layer** — scene contracts, generation input hashing, revision jobs, chapter/book coherence, assembly staleness — **mechanical** narrative pipeline.

6. **Authoring and style layer** — author voice, witness mode, humanization, shaping defaults across epic → book → chapter → scene; metadata-driven defaults with explicit overrides.

7. **Future: conversational character layer** — session-scoped dialogue, identity snapshots, response contracts, **relationship-bounded** memory of the reader.

8. **Future: voice presentation layer** — TTS, pacing, language toggle, **translation as playback**, not as cognition swap.

9. **Future: reader cockpit** — listen, pause, talk, resume; clarity of what is canon vs. generated vs. interactive.

10. **Future: monetization / token economy** — metering, billing, storage caps, fair use — **policy and infra**, not narrative logic.

---

## 4. Build order / phase plan

Major phases in **sequence** (names are architectural; calendar dates are not fixed here).

| Order | Phase | Purpose |
|-------|--------|---------|
| 1 | **Prewriting hardening** | Contracts, typed persistence, canonical hashes, revision job execution — truth-safe substrate (P1-class work). |
| 2 | **Master spine / canonicalization** | This document + alignment of code paths to named layers and non-negotiables. |
| 3 | **Temporal source ingestion layer** | Era-scoped sources, applicability windows, truth modes, anti-leak rules across world states. |
| 4 | **Epic timeline / book-spine layer** | Book- and chapter-level narrative assembly, ordering, coherence, explicit breakpoints. |
| 5 | **Character knowledge boundary engine** | Enforce what a character can know, infer, or say by time and role — machine-checkable where possible. |
| 6 | **Conversational identity snapshot builder** | Per-session bundles: voice, memory caps, relationship state — **not** full inner life. |
| 7 | **Reader relationship memory layer** | Durable, policy-bound memory of reader–character interaction (not raw chat logs as canon). |
| 8 | **Response contract layer** | Typed requests/responses for interactive turns; registry-style versioning as in P1. |
| 9 | **Voice presentation integration** | Wire voice layer to narrative and dialogue without collapsing cognition into audio. |
| 10 | **Reader cockpit / pause–talk–resume** | Product shell for listen + interact + return to narrative. |
| 11 | **Token economy / billing / storage controls** | Operational and commercial envelope. |
| 12 | **Operational scaling** — performance, observability, cost controls after the spine is stable. |

Later phases **depend** on earlier truth and contract discipline; skipping hardening to chase features is disallowed for production-grade releases.

---

## 4a. Phase 3 execution index

Use this index as the execution and evidence trail for the Phase 3 storyline build:

1. [Phase 3 - Chunk 1 - Arc Engine Core Inventory](./phase3-chunk1-arc-engine-core-inventory.md)
2. [Phase 3 - Chunk 2 - Chapter / Movement Progression Inventory](./phase3-chunk2-chapter-movement-progression-inventory.md)
3. [Phase 3 - Chunk 3 - Narrative Pressure Engine Inventory](./phase3-chunk3-narrative-pressure-engine-inventory.md)
4. [Phase 3 - Chunk 4 - Branch Governance Core Inventory](./phase3-chunk4-branch-governance-core-inventory.md)
5. [Phase 3 - Chunk 5 - Storyline Orchestrator Integration Inventory](./phase3-chunk5-storyline-orchestrator-integration-inventory.md)
6. [Phase 3 - Chunk 6 - Scene / Interaction Storyline Wiring Inventory](./phase3-chunk6-scene-interaction-storyline-wiring-inventory.md)
7. [Phase 3 - Chunk 7 - Author / Debug Storyline Explainability Inventory](./phase3-chunk7-author-debug-storyline-explainability-inventory.md)
8. [Phase 3 - Chunk 8 - Storyline Verification Surface Inventory](./phase3-chunk8-storyline-verification-surface-inventory.md)
9. [Phase 3 - Chunk 9 - Storyline Certification Run Inventory](./phase3-chunk9-storyline-certification-run-inventory.md)
10. [Final Storyline Certification Report (Phase 3)](./final-storyline-certification-report.md)

Gate rule: do not advance to the next chunk until the current chunk's DoD gate and evidence checklist are fully satisfied.

---

## 5. Temporal source ingestion rules

Sources are not a flat library. They are **anchored in time and world applicability**.

- **Era / world-state scope** — Every ingestible text or writing sample must be tied to an **applicable world state or time range**. Material outside that range does not apply to earlier narratives.

- **No backward leakage** — Later scholarship, memoirs, or AI summaries must not silently update earlier in-world fact unless routed through explicit assertion and migration.

- **Truth modes** — Distinguish at minimum: **authoritative** (primary or accepted fact), **interpretive** (scholarly reading), **fictionalized** (declared narrative license). Ingestion pipelines must preserve mode; generation must not upgrade interpretive to authoritative without audit.

- **Anti-drift** — LLM-assisted ingestion must be **scoped** (chunking, retrieval, validation) so model drift does not cross era boundaries. Contract and hash patterns from P1 apply where outputs are stored.

- **Provenance** — Source → assertion → narrative dependency must remain traceable for dispute and repair.

---

## 6. Epic narrative spine (initial)

**Provisional** — book count, internal splits, and exact dates are subject to historical calibration and editorial decision. The **arc** is architectural guidance, not a locked table of contents.

| Book | Arc (working) |
|------|----------------|
| **1** | Pre-contact world through La Salle arrival |
| **2** | Contact deepens; raid on Natchitoches village; French foothold |
| **3** | French arrival through birth of François Grappe |
| **4** | François era into threshold before the Civil War |
| **5+** | **Provisional sweep:** Civil War → Reconstruction / Jim Crow → identity suppression and diaspora → modern fragmentation → death of the last matriarch (2010) → restoration / rediscovery → rise into Arkansas public leadership |

**Calibration rule:** When archival or narrative research contradicts this sweep, **update the spine explicitly** — do not let ad hoc scene text redefine the epic without document and schema alignment.

---

## 7. Thematic spine (story law)

These themes constrain acceptable plot mechanics and endings — they are **architecture-relevant**, not decorative.

- **Marriage and union as transmission of power** — Grappe-line unions carry social and political consequence across cultural boundaries.

- **Power through union across worlds** — Legitimacy and survival flow from alliances across Indigenous, colonial, and diasporic contexts — not from a single monoculture hero arc.

- **Matriarchal continuity** — The deepest continuity is often **women’s lines** — memory, care, naming, and survival across disruption. This is a structural pillar, not a genre flourish.

- **Ending arc: restoration, not mere decay** — Late epic movement is toward **repair, visibility, and public service**, not nihilistic collapse.

- **Modern culmination: people over politics, community over control** — Leadership and voice in the contemporary thread should align with **service and solidarity**, not cynicism or spectacle — as **constraint on allowable resolution**, not as slogan.

---

## 8. Future interactive reader experience (design direction)

- **Listen** — Voiced narrative is the default reading mode for long passages where product supports it.

- **Pause and speak** — The reader can address a character; the system treats input as **in-world dialogue** subject to knowledge and relationship bounds.

- **In-character response** — Replies behave as if the reader were a situated interlocutor, not a tutor from the future.

- **Bounded reader memory** — The character retains only **relationship-scoped**, policy-limited memory of prior exchanges — not omniscient retention.

- **Intimacy over time** — Depth grows through repeated, consenting interaction design — not through breaking historical truth.

- **Native cognition stays authentic** — Reasoning remains tied to era-appropriate frames; English vs. heritage language is **presentation**.

- **Translation toggle in live mode** — Switching language for playback does not rewrite cognition artifacts; it re-renders or re-speaks.

---

## 9. Open questions / deferred decisions

Unresolved by design — **do not treat as implemented** until specified and built.

- Exact **world-state** granularity and migration rules between eras.
- Final **book count**, titles, and **chapter breakpoints** for books 5+.
- **Reader–character memory** storage schema, retention TTL, and legal/privacy bounds.
- **Voice strategy** — cloned voices vs. curated voice library vs. hybrid; licensing and ethics.
- **Token billing** — metering points (tokens, minutes, scenes), tiers, and storage caps.
- **Long-run session retention** — how long interactive threads persist; export and deletion.
- **Cross-book reader identity** — single profile vs. per-epic; portability.
- **Monetization vs. open research** — boundaries for public vs. paid narrative bundles.

---

## Document control

- **Owner:** Product + lead architect (shared).
- **Updates:** Substantive changes should note date and rationale in commit messages or a short changelog entry.
- **Conflict:** If code and this spine disagree, **fix the gap** — update the doc or the code with an explicit rationale.
