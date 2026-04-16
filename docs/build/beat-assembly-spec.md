# Beat Assembly Spec (Production Contract)

## Purpose

This spec defines a machine-usable Beat Assembly layer for Book 1 Chapter 1 that is compatible with existing Campti cognition-first generation systems and cockpit governance surfaces.

Core runtime stance:
- Salience-first, observer-bounded narrative cognition
- Perception -> appraisal -> emotion -> intention/decision -> action -> state update
- Memory accumulation and social feedback loops are explicit in beat state
- Meaning traces are scaffolded at low-to-moderate intensity in Chapter 1
- Metaphysical/cosmic simulation concepts are fenced out of runtime beat generation

Primary runtime contract is implemented in:
- `lib/domain/beat-assembly.ts`
- `lib/services/book1-beat-validation-service.ts`
- `lib/services/book1-beat-assembly-service.ts`
- `lib/services/book1-chapter1-beat-chain-generator.ts`

## 1) Beat Ontology

Beat classes:
- `salience_lock_beat`
- `memory_comparison_beat`
- `environmental_confirmation_beat`
- `emotional_appraisal_beat`
- `micro_decision_beat`
- `social_signal_beat`
- `relational_interpretation_beat`
- `pressure_escalation_beat`
- `meaning_trace_beat`
- `consequence_seed_beat`
- `state_update_beat`

Chapter 1 runtime profile emphasizes:
- Work-grounded salience lock
- Early environmental confirmation and memory comparison
- Social/relational interpretation before overt escalation
- Small decisions with delayed impact
- Low-theory meaning traces through continuity action
- Active consequence seed at chapter exit

## 2) Required Beat Fields

Every beat must include:
- `beatId`
- `beatType`
- `beatPurpose`
- `povCharacterId`
- `temporalPosition`
- `locationContext`
- `physicalAction`
- `environmentalSignal`
- `sensorySignal`
- `socialSignal`
- `interpretedMeaning`
- `emotionVector`
- `memoryTriggered`
- `decisionOrAdjustment`
- `downstreamRisk`
- `stateUpdate`
- `salienceReason`
- `visibilityScope`
- `confidence`
- `validationFlags`

Current implementation also includes `pressureLoad` for controlled Chapter 1 escalation grading.

## 3) Beat Transition Rules

Transition maps are runtime constants:
- `BEAT_ALLOWED_TRANSITIONS`
- `BEAT_DISALLOWED_TRANSITIONS`
- `isBeatTransitionAllowed()`

Rules prioritize cognitive realism:
- Salience lock cannot jump directly to consequence or high escalation
- Appraisal should emerge from evidence-bearing beats (environment/social/memory)
- Decision beats should follow perceived pressure, not generic drama ordering
- State updates close local loops and can hand off to next salience cycle

## 4) Beat Validation Rules

Validation is deterministic in `book1-beat-validation-service`:
- Invalid if no physical grounding (`physicalAction`, `sensorySignal`, `environmentalSignal`)
- Invalid if observer boundary is violated by excessive hidden/global POV knowledge
- Invalid if salience is weakly justified
- Invalid if modern abstract cognition leaks dominate
- Invalid if no downstream risk/state consequence
- Invalid if Chapter 1 pressure rises too abruptly
- Invalid if runtime text crosses cosmic/metaphysical boundary fence

Validation output is carried per beat in `validationFlags` and chain-level in `chainValidation`.

## 5) Emotional Progression Rules

Emotion must be generated from appraisal pressure, not free-floating labels:
- `emotionVector` is tied to sensed signal + interpreted meaning + social risk
- Containment is explicit for order-under-pressure dynamics
- Emotion labels are action-adjacent (e.g., contained strain, decisive caution), not clinical abstractions

## 6) Meaning-Generation Scaffolding

Chapter 1 meaning constraints:
- Allow `meaning_trace_beat` only after grounded labor, memory, and social interpretation
- Meaning remains continuity-linked and embodied (gesture, task transfer, lineage action)
- No philosophical monologue expansion at this stage

## 7) Runtime Boundary Rules

Runtime narrative generation must reject:
- cosmic simulation framing
- metaphysical engines as immediate causal beat drivers
- nested simulation language as scene logic

These remain:
- cockpit/research-only concepts
- non-runtime analysis surfaces

## 8) Story and Cognition Non-Negotiables Enforced

The Beat Assembly layer enforces:
- Native cognition first (English output as translation surface)
- No exposition-first construction
- Work before explanation
- Observer-dependent rendering
- Matrilineal continuity as operational social logic
- Pressure thickening before catastrophe

## 9) Machine Artifacts

Primary machine artifact:
- `book1_chapter1_beat_assembly_chain` (`BeatAssemblyChain`)

Cockpit-facing summary artifact:
- `BeatAssemblyCockpitSummary`

Both are schema-validated by zod and safe for runtime/cockpit inspection.
