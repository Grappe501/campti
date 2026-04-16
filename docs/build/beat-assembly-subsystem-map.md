# Beat Assembly Subsystem Mapping

## Scope

This map shows how Beat Assembly integrates with current Campti architecture without creating parallel authoring workbenches.

Primary integration node:
- `lib/services/book1-beat-assembly-service.ts`

Primary contracts:
- `lib/domain/beat-assembly.ts`
- `lib/services/book1-beat-validation-service.ts`
- `lib/services/book1-chapter1-beat-chain-generator.ts`

Cockpit visibility integration:
- `lib/domain/author-command-cockpit.ts`
- `lib/services/author-command-cockpit-service.ts`
- `components/admin/author-command-cockpit.tsx`

## Subsystem Connections

### Author Cockpit
- Consumes: `BeatAssemblyCockpitSummary` (beat count, validation status, salience coverage, pressure peak, social/memory counts)
- Provides back: operator visibility and command context for revision loops
- Connection mode: cockpit-only visibility now; runtime-adjacent
- Reuse status: existing authoritative cockpit reused; no new workbench added

### Character Console
- Consumes from Character Console: character pressure and behavior patterns as future adapter input
- Provides back: observer-bounded beat targets for interventions
- Connection mode: runtime-critical in next hardening phase; mapped now
- Reuse status: existing `Book1CharacterConsoleService` reused conceptually; adapter deferred

### Decision Panel
- Consumes: beat chain validation pass/fail and pressure progression summaries
- Provides back: chapter readiness signal contribution
- Connection mode: runtime-critical for chapter release governance (deferred adapter)
- Reuse status: existing `Book1DecisionPanelService` reused; explicit hook deferred

### Chapter Voice / Cognition Map
- Consumes: cognition signatures and voice cognition routing outputs (as provenance source for beat assembly)
- Provides back: per-beat cognition-constrained action sequencing
- Connection mode: runtime-critical
- Reuse status: reuses existing chapter cognition/voice artifacts; no duplicate planning layer

### Consciousness Engine
- Consumes: attention/silence/embodiment priorities from existing cohesion router lineage
- Provides back: beat-level observer-dependent visibility scope and appraisal progression
- Connection mode: runtime-critical
- Reuse status: existing consciousness services reused as upstream source model

### Regeneration Loop
- Consumes: beat assembly chain as optional deterministic scene-construction substrate
- Provides back: chapter-grade beat validation outcomes for regeneration risk assessment
- Connection mode: runtime-critical, adapter deferred
- Reuse status: existing `Book1RegenerationLoopService` retained untouched to avoid drift in this pass

### Scene Generation
- Consumes: ordered beat chain as pre-prose structural input
- Provides back: scene-level grounded action/memory/social checkpoints
- Connection mode: runtime-critical, adapter deferred
- Reuse status: existing scene generation stack reused; no duplicate generator created

### Memory / State Accumulation
- Consumes: `memoryTriggered`, `stateUpdate`, `downstreamRisk`
- Provides back: continuity-relevant state deltas and carry-forward hooks
- Connection mode: runtime-critical
- Reuse status: existing memory/state oriented services and schemas reused as conceptual substrate

### World State / Era / Pressure Models
- Consumes: era window, environmental pressure, chapter law constraints
- Provides back: pressure load progression and chapter-one-safe escalation gating
- Connection mode: runtime-critical
- Reuse status: existing Book 1 law/pressure ecosystem reused

### Law / Rule / Validation Systems
- Consumes: chapter law invariants and governance boundaries
- Provides back: beat validity and transition legality reports
- Connection mode: runtime-critical
- Reuse status: existing law-first governance approach reused; no new rule console

### Runtime Orchestration / Workflow Layer
- Consumes: machine beat chain artifact for controlled assembly
- Provides back: inspectable artifact + cockpit summary + validation signal
- Connection mode: runtime-critical once adapter is connected to generation loop
- Reuse status: existing workflow architecture retained; adapter intentionally incremental

## Structural Guarantees

### Salience Budget and Beat Ordering
- Salience reason is mandatory on every beat
- Ordering begins with `salience_lock_beat`
- Validation rejects weak salience justification

### Memory Accumulation Effect
- Every beat carries `memoryTriggered` + `stateUpdate`
- Chapter chain increments pressure and memory directives across beats

### Observer-Dependent Rendering
- Every beat has `visibilityScope.locallyKnown` and `globallyKnownButHiddenFromPov`
- Validation enforces bounded hidden/global knowledge load

### Social Feedback Loop Representation
- Explicit `social_signal_beat` and `relational_interpretation_beat`
- `socialSignal` required on every beat to avoid isolated interior monologue drift

### Meaning Trace Without Overpowering Realism
- `meaning_trace_beat` occurs after grounded labor/social/memory sequence
- Chapter 1 chain includes one constrained meaning trace beat

## Gap Analysis

1. **Runtime adapter gap (high priority):**
   Beat chain is not yet injected into `Book1RegenerationLoopService` segment assembly call path.
2. **Decision panel ingestion gap (medium):**
   `Book1DecisionPanelService` does not yet score beat validation directly.
3. **Character/Law console feedback gap (medium):**
   Mutation simulations do not yet auto-project beat-level downstream change previews.
4. **Persistence gap (medium):**
   Beat chain currently generated in service memory; no persistence table/writeback path added in this pass.
5. **Auto-refresh cockpit feed gap (low):**
   Cockpit supports beat summary payload but orchestration path wiring is pending.

## Files Changed

- `lib/domain/beat-assembly.ts`
- `lib/services/book1-beat-validation-service.ts`
- `lib/services/book1-beat-assembly-service.ts`
- `lib/services/book1-chapter1-beat-chain-generator.ts`
- `lib/domain/author-command-cockpit.ts`
- `lib/services/author-command-cockpit-service.ts`
- `components/admin/author-command-cockpit.tsx`
- `lib/services/author-command-cockpit-service.test.ts`
- `lib/services/book1-beat-assembly-service.test.ts`
- `docs/build/beat-assembly-spec.md`
- `docs/build/beat-assembly-subsystem-map.md`
- `docs/build/book1-chapter1-machine-beat-chain.md`
- `docs/build/beat-assembly-implementation-report.md`

## Files Intentionally Left Untouched

- `lib/services/book1-regeneration-loop-service.ts` (large production path; adapter deferred to reduce immediate regression risk)
- `lib/services/book1-decision-panel-service.ts` (kept stable pending explicit beat risk metric integration task)
- `lib/services/book1-character-console-service.ts` (kept stable pending beat-diff projection design)
- `lib/services/book1-author-cockpit-simulation-service.ts` (kept stable; no duplicate simulation layer introduced)
- `lib/services/scene-generation-service.ts` (kept stable; beat injection planned as follow-up adapter)

## Risk Notes

- **Duplication risk:** controlled; this implementation extends existing cockpit and Book 1 service patterns rather than adding a new authoring surface.
- **Drift risk:** moderate until regeneration loop and decision panel consume beat artifact directly.
- **Validation hardening risk:** lexical modern-cognition boundary checks are deterministic but should be expanded with project-specific lexicon over time.
- **Operational risk:** low for current pass; new contracts are additive and not yet mutating canonical generation flow.
