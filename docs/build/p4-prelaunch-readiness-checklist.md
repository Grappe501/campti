# P4 Prelaunch Readiness Checklist

This checklist certifies P4 production hardening across monetization, governance, resilience, and safety.

## End-to-End Verification

- [ ] Run `npm run verify:prelaunch`
- [ ] Run `npm run verify:full-system`
- [ ] Confirm deterministic harness completes conversation lifecycle without policy violations
- [ ] Confirm token depletion / entitlement boundaries are enforced
- [ ] Confirm provider fallback paths trigger safe degraded outputs
- [ ] Confirm moderation triggers block or degrade unsafe reader inputs
- [ ] Confirm drift and re-entry continuity checks pass

## Product Truth Separation

- [ ] Canonical story truth remains isolated from product/account writes
- [ ] Reader interaction memory remains separate from canonical truth
- [ ] Product/account entitlement logic does not enter character cognition payloads
- [ ] Translation remains presentation-only
- [ ] Voice remains downstream of bounded response generation

## Safety & Leakage Guards

- [ ] No role leakage from reader mode into author/admin capabilities
- [ ] No internal-thought leakage in reader-visible voice/text surfaces
- [ ] No silent provider failure (fallback state is explicit in payload/telemetry)
- [ ] Cost governance ceilings trigger explicit fallback or read-only behavior

## Operational Checks

- [ ] Background maintenance script executes cleanly (`npm run ops:background-maintenance`)
- [ ] Cockpit cache invalidation paths validated after mutating commands
- [ ] Payment webhook dedupe and entitlement updates validated in test mode

