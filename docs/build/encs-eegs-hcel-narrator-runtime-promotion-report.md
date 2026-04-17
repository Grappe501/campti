# ENCS / EEGS / HCEL / Narrator runtime promotion (Cluster 3)

## Summary

| System | Runtime effect |
|--------|----------------|
| **ENCS** | Downstream bias lines → `requiredPatterns`, `continuityEmphasis`, drift from cockpit warnings; validation risks feed sequence layer |
| **EEGS** | `proseConstraintBias` → `dictionGuardrails`; score biases `attachmentTarget` / `relationalSignalDensity`; thin/reset warnings → drift |
| **HCEL** | `EpicContinuityValidationService` risks (incl. ANTI-DROPOFF) → `NarrativeSequenceValidationService` flag `cluster3_hook_continuity_pressure` + prose tension boost when hard hook signal |
| **Narrator** | Full pack `modeProfile` → `NarratorPresenceToProseService` after ENCS/EEGS merge; hard failures → `cluster3_narrator_presence_validation_failed` + drift |

## Files

- `lib/services/canonical-runtime-cluster3-governance-service.ts`
- `lib/services/book1-regeneration-loop-service.ts` (ordering + merge point)
- `lib/services/narrative-sequence-validation-service.ts` (hook risk intake)
- `lib/domain/narrative-sequence.ts` (sequence flag enum)
- `lib/services/enforcement-registry-service.ts` (truthful soft_enforced labels)
