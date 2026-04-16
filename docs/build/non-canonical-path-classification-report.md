# Non-Canonical Path Classification Report

## Scope

This report classifies major generation/report/runtime paths that are not canonical production authority.

## Classified Paths

### A) Regeneration super-pipeline

- runtime id: `book1_regeneration_super_pipeline`
- class: `advisory_runtime`
- demo: no
- canonical artifacts: no
- readiness influence: no
- runtime decision influence: advisory only

### B) Runner/report generation scripts

- runtime id: `certification_report_pipeline`
- class: `report_only`
- demo: no
- canonical artifacts: no
- readiness influence: yes (`canGateReadiness=true`)
- runtime decision influence: no canonical output mutation

### C) Verification/certification paths

- grouped under `certification_report_pipeline`
- must assert readiness gate rights before emitting decisions

### D) Sample-pack / deterministic proof paths

- runtime id: `deterministic_proof_harness`
- class: `simulation_only`
- demo: no
- canonical artifacts: no
- readiness influence: no

### E) Cockpit-only inspection helpers

- runtime id: `cockpit_inspection_helpers`
- class: `advisory_runtime`
- demo: no
- canonical artifacts: no
- readiness influence: no

### F) Legacy or duplicate generation paths

- runtime id: `legacy_scene_generation_aliases`
- class: `legacy_or_duplicate`
- demo: no
- canonical artifacts: no
- readiness influence: no

### G) Test harness-only paths

- runtime id: `runtime_authority_test_harness`
- class: `test_only`
- demo: no
- canonical artifacts: no
- readiness influence: no

### H) Deprecated paths

- runtime id: `deprecated_chapter_generator`
- class: `deprecated`
- demo: no
- canonical artifacts: no
- readiness influence: no
