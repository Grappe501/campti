# Literary Device Subsystem Map

## Canonical Flow

1. Upstream narrative systems produce chapter truth envelope:
   - Narrative Psychology
   - Chapter State
   - Narrative Threads
   - Chapter Composition
   - Beat Assembly
2. LDCS derives constrained literary application plan:
   - `LiteraryDeviceDerivationService`
   - `LiteraryDeviceValidationService`
3. LDCS plan is fused into prose constraints:
   - `LiteraryDeviceToProseConstraintsService`
4. Cockpit renders author-facing controls and diagnostics:
   - `LiteraryDeviceCockpitService`
   - `buildAuthorCommandCockpitBundle`
   - `components/admin/author-command-cockpit.tsx`

## Domain Schemas

- `lib/domain/literary-device-control.ts`
  - `LiteraryDeviceDefinition`
  - `LiteraryDeviceControlSetting`
  - `LiteraryDeviceApplicationPlan`
  - `LiteraryDeviceValidationResult`
  - `LiteraryDeviceCockpitSummary`
  - `Book1LiteraryDevicePack`

## Runtime Integrations

- `lib/services/book1-regeneration-loop-service.ts`
  - builds Book 1 literary device pack
  - derives chapter/scene LD application plan
  - validates misuse/overload
  - maps LD plan into prose constraints
  - injects literary section into authoritative cockpit bundle

- `lib/domain/prose-generation-constraints.ts`
  - adds `literaryDeviceConstraints` extension

- `lib/services/prose-generation-constraint-derivation-service.ts`
  - provides LD-safe defaults for base constraints

## Misuse Guardrails

- No floating symbolism (must bind to thread/setting/object/character)
- No force-alliteration in high-tension decision contexts
- No philosophy over-explicitness drift
- Overload detection across active devices and motif density
- Suppression directives emitted as machine-usable diagnostics

## Authoritative Cockpit Principle

No parallel workbench is introduced. LDCS is surfaced only through the existing author command cockpit bundle and panel layout.
