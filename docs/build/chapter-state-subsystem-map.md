# Chapter State Subsystem Map

## Integration intent

Chapter State is a state layer between world pressure inputs and beat assembly behavior.
It extends existing systems instead of creating parallel planning tracks.

## Subsystem connections

| Subsystem | Consumes from Chapter State | Provides to Chapter State | Connection type | Status |
|---|---|---|---|---|
| Beat Assembly (`book1-beat-assembly-service`) | `recommendedBeatWeights`, `beatTransitionBiases`, `allowedMeaningIntensity` | Beat taxonomy + transition constraints | Runtime-critical | Extend existing (adapter-ready) |
| Beat Validation (`book1-beat-validation-service`) | State-conditioned expected emphasis checks (deferred direct wiring) | Existing guardrails reused | Runtime-critical | Existing; direct integration deferred |
| Segment Simulation (`book1-segment-simulation-state-builder`) | N/A | Material, social, hidden-change signals for axis derivation | Runtime-critical | Extended in regeneration loop |
| Consciousness / Cognition routers | `memoryAccessProfile`, `visibilityRules`, `decisionUrgencyProfile` | Character cognition signatures and mediation patterns | Runtime-critical | Adapter-ready |
| World State / Era resolution | N/A | Era + locale grounding for state provenance | Runtime-critical | Existing, reused |
| Pressure models (`narrative-pressure-engine`) | Optional chapter-state override target (future) | Pressure indicators that can map to axis seeds | Runtime-critical | Deferred adapter |
| Scene generation and chapter composer | `allowedMeaningIntensity`, visibility constraints, pressure emphasis | Scene-level evidence of state performance | Runtime-critical | Deferred adapter |
| Chapter planning (`book1-epic-outline-builder`, latent chapter services) | State progression targets by phase | Outline timeline and pressure hints | Authoring + runtime | Extend existing |
| Regeneration loop (`book1-regeneration-loop-service`) | N/A | Produces `chapterState` and `chapterBeatProfileRecommendation` artifacts | Runtime-critical | Implemented |
| Author command cockpit bundle | `chapterState` summary metrics, validation/risk status | Inspection controls and indicator display | Cockpit-only | Implemented |
| Character console / decision panel | Potential future chapter-state adjustments with guardrails | Approved mutations and pressure rationale | Authoring-only | Deferred |
| Law / boundary / adversarial systems | Validation flags and risk markers | Chronology and policy constraints | Runtime-critical | Reused via validation rules |

## Roll-forward model

State roll-forward is handled by sequence-aware validation:
- chapter-by-chapter axis trend (`falling` / `flat` / `rising`)
- progression compatibility (`phase_a`..`phase_f`)
- movement spike and meaning-load continuity checks

The sample generator (`buildBook1ChapterStateSamplePack`) validates sequence coherence before emitting pack output.

## Cockpit inspectability and guardrails

Cockpit bundle now accepts:
- chapter mode
- dominant/suppressed pressures
- movement / decision / meaning metrics
- validation pass/fail and risk flags

Guardrails:
- state validation flags are produced by the chapter-state layer
- cockpit remains advisory and non-canonical-mutation by default

## Gap analysis

1. Beat assembly currently has a chapter-1 fixed chain generator; direct state-conditioned chain assembly adapter is still to be implemented.
2. Scene generation does not yet consume chapter-state visibility and meaning intensity controls directly.
3. Pressure engine and chapter-state axis mapping are parallel today; a unified pressure-to-axis translator should be added.
4. Book 1 state is generated for chapter 1 in regeneration runtime and for chapters 1-8 in sample generator; persistent per-chapter storage is next.

## Duplication risk analysis

Primary duplication risks:
- multiple chapter artifact schemas in regeneration stack
- separate cockpit contracts (generic cockpit vs book1 simulation cockpit)
- repeated pressure semantics across pressure engine and chapter-state axis layer

Mitigation in this change:
- chapter-state domain created as canonical typed contract
- regeneration now emits chapter-state artifacts instead of ad hoc pressure summaries
- cockpit bundle reuses state summary rather than creating another pressure summary schema

## File impact

Changed files:
- `lib/services/book1-regeneration-loop-service.ts`
- `lib/domain/author-command-cockpit.ts`
- `lib/services/author-command-cockpit-service.ts`
- `components/admin/author-command-cockpit.tsx`
- `lib/services/book1-regeneration-loop-service.test.ts`
- `lib/services/author-command-cockpit-service.test.ts`

New files:
- `lib/domain/chapter-state.ts`
- `lib/chapter-state/chapter-state-derivation.ts`
- `lib/chapter-state/chapter-state-validation.ts`
- `lib/chapter-state/chapter-state-to-beat-profile.ts`
- `lib/chapter-state/book1-state-pack-generator.ts`
- `lib/chapter-state/book1-state-pack-generator.test.ts`

Left untouched intentionally:
- `lib/services/book1-beat-assembly-service.ts`
- `lib/services/book1-beat-validation-service.ts`
- `lib/services/book1-latent-epic-chapter-service.ts`

## Future hardening notes

- Add `ChapterState -> BeatAssemblyChain` builder that replaces fixed chapter chain seeds.
- Persist chapter state artifacts and compare against actual generated chapter outcomes.
- Bind chapter-state rules into decision panel and law console with explicit mutation policy.
- Add policy tests ensuring phase fit and movement-pressure progression across full Book 1 plan.
