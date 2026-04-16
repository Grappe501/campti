# Runtime Authority Registry

Registry source: `lib/services/runtime-authority-registry-service.ts`

## Canonical Runtime Id

`scene_chapter_production_runtime`

## Runtime Declarations

| runtimeId | authorityClass | demo | canonical artifacts | readiness gate | canonical output mutation |
| --- | --- | --- | --- | --- | --- |
| `scene_chapter_production_runtime` | `canonical_production` | yes | yes | yes | yes |
| `book1_regeneration_super_pipeline` | `advisory_runtime` | no | no | no | no |
| `certification_report_pipeline` | `report_only` | no | no | yes | no |
| `book1_outline_draft_generator` | `simulation_only` | no | no | no | no |
| `deterministic_proof_harness` | `simulation_only` | no | no | no | no |
| `cockpit_inspection_helpers` | `advisory_runtime` | no | no | no | no |
| `legacy_scene_generation_aliases` | `legacy_or_duplicate` | no | no | no | no |
| `runtime_authority_test_harness` | `test_only` | no | no | no | no |
| `deprecated_chapter_generator` | `deprecated` | no | no | no | no |

## Duplicate Risks

- scene-generation aliases can be misread as independent runtime authority without labels.
- regeneration output sets can be misread as canonical chapter output without authority stamps.

## Ambiguous Paths

- draft generation scripts historically emitted unlabeled output.
- cockpit payloads historically lacked machine-readable runtime authority.

## Enforcement Rules

1. `single-canonical-runtime`
2. `no-canonical-spoofing`
3. `readiness-gate-authority`
4. `cockpit-authority-visibility`
