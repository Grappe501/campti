# Enforcement Registry (Human Summary)

## Location

- **Code:** `lib/services/enforcement-registry-service.ts` — `buildSubsystemEnforcementDeclarations()`, `buildEnforcementRegistry()`.
- **Snapshot:** `reports/enforcement-registry-snapshot.json` (run `npm run verify:enforcement-contract`).

## Canonical runtime id

`scene_chapter_production_runtime` — same as the runtime authority lock.

## Subsystem index (abbreviated)

| subsystemId | enforcementClass | participatesInCanonicalRuntime |
|---------------|------------------|--------------------------------|
| `canonical_scene_chapter_pipeline` | hard_enforced_runtime | yes |
| `scene_generation_service` | hard_enforced_runtime | yes |
| `scene_generation_llm_output_contract` | advisory_runtime | yes |
| `scene_generation_social_pressure_qa` | advisory_runtime | yes |
| `scene_generation_humanization_advisory` | advisory_runtime | yes |
| `chapter_assembly_service` | hard_enforced_runtime | yes |
| `scene_generation_engine_bundle` | advisory_runtime | no |
| `book1_regeneration_loop` | advisory_runtime | no |
| `beat_assembly_chain` … `callback_reinterpretation_reentry` | advisory_runtime | no |
| `regeneration_beat_gating` | soft_enforced_runtime | no |
| `author_command_cockpit_bundle` | cockpit_only | no |
| `report_export_certification` | report_only | no |
| `verification_script_surface` | validation_only | no |

Full rows include authority class, demo safety, deterministic/sample-seeded flags, and notes — see the TypeScript declarations.

## Relationship to runtime authority

Each subsystem lists `primaryRuntimeId` pointing at a `RuntimeAuthorityDeclaration.runtimeId` from `lib/services/runtime-authority-registry-service.ts`. Enforcement semantics refine **what the subsystem does** inside or beside that runtime.
