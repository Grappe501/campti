# Cockpit Readiness Audit

## Surfaces Audited

- Author cockpit route: `app/admin/narrative/page.tsx`
- Cockpit UI component: `components/admin/author-command-cockpit.tsx`
- Cockpit bundle/orchestration services:
  - `lib/services/author-command-cockpit-service.ts`
  - `lib/services/author-cockpit-consolidation-service.ts`
  - `lib/services/cockpit-scope-model-service.ts`
  - `lib/services/tool-rail-system-service.ts`
  - `lib/services/indicator-bank-model-service.ts`
  - `lib/services/guided-signals-service.ts`
- Related evidence: `reports/author-cockpit-wiring-map.json`

## Visibility Assessment

### Visible and working

- Scope switching (`scene/chapter/book/epic`) with context validation.
- Tool rail structure (top/left/right lanes) and action chips.
- Indicator bank display.
- Guided signal display.
- Extended right-rail sections (beat assembly, chapter state, narrative psychology, prose constraints, threads, composition, literary devices) **when supplied by bundle**.

### Partially visible

- Rich runtime subsystems are display-capable, but in main route many fields are not populated (only metrics/context by default).
- Sequence architecture, scene generation details, ENCS/EEGS/narrator summaries are structurally supported but not consistently populated by the default cockpit route.

### Visible but not actionable

- Many displayed actions are labels (`availableActions`) without direct command execution wiring in cockpit component.
- Signals and indicators are advisory; they do not directly trigger governed workflow transitions.

## UI Truthfulness vs Runtime Truth

- `guided-signals-service.ts` explicitly marks signals `advisoryOnly: true`.
- Indicator severities are heuristic transformations over route-scoped metric values.
- Main cockpit route metrics are derived in-page (`deriveScopeMetrics`) from lightweight counts/statuses, not full generation-state synthesis.
- Therefore cockpit is currently a strong **coordination/visibility shell**, not a full decision authority surface.

## Redundant / Stale / Misleading Risk

- Legacy routes are redirected by consolidation service, but one legacy scene workspace page includes redirect plus unreachable legacy body code, increasing maintenance confusion risk.
- Wiring map still lists route capabilities that are now routed through consolidated cockpit, requiring periodic re-audit to avoid stale operator expectations.

## Demonstration Readiness (Cockpit)

### Safe to demo now

- Unified cockpit route and scope switching model.
- Advisory indicator + signal architecture.
- Separation of author vs reader surfaces (ownership boundary model).
- Contract fields (`bounded`, `explainable`, `nonOmniscient`, `mutatesCanonicalTruth: false`) in bundle.

### Risky/misleading in live demo

- Presenting indicators/signals as hard governance outputs (they are advisory).
- Claiming full subsystem control if bundle payload is not actually populated for those sections.
- Claiming old workbench parity while redirect-only behavior remains for legacy routes.

## Cockpit Completeness Rating

- **Structural completeness:** 4/5
- **Operational completeness:** 3/5
- **Execution-readiness for governance demo:** 3/5
- **Execution-readiness for full runtime control demo:** 2/5

Primary gap: converting cockpit from advisory/visibility shell into an authoritative command-and-enforcement surface across all major generation subsystems.
