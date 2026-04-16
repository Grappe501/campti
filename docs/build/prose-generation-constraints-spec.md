# Prose Generation Constraints Spec

## Contract
- Machine object: `ProseGenerationConstraints` (`lib/domain/prose-generation-constraints.ts`)
- Upstream required parents:
  - Narrative psychology chapter profile
  - Chapter state
  - Validated beat assembly chain

## Governing Domains
- Narrative distance (close, observer-bounded)
- Cognition mode (native-relational/place/labor/memory/signal)
- Sentence pressure and paragraph breath
- Sensory density and environmental grounding floor
- Exposition, interpretation, ambiguity, revelation allowances
- Emotional label and meaning reflection ceilings
- Diction/syntax guardrails
- Forbidden/required pattern classes
- Ending momentum profile and unresolved pull targets

## Forbidden Pattern Classes
- Modern self-analysis and therapist-language
- Omniscient leakage
- Exposition-first historical explanation
- Generic scenic summary detached from embodied salience
- Symbol-overexplanation
- Full pressure discharge too early

## Required Pattern Classes
- Material grounding in body/place/work
- Salience-justified noticing
- Relational meaning via behavior/silence
- Memory comparison under signal degradation
- Consequence-seeded and state-updating endings

## Validation
- `ProseGenerationValidationService`
- Hard failures:
  - modern cognition drift,
  - omniscient leakage,
  - exposition-first drift,
  - beat omission in opening.
- Soft failures:
  - weak immersion density,
  - weak carry-forward momentum.
