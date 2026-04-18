# Scene Generation Remediation Map

Cross-reference from subsystem symptoms to surfaces in the app.

| Subsystem | Symptom | Where to work |
|-----------|---------|----------------|
| scene_input | Loader error, missing contract fields | `/admin/scenes/[id]` (Details), Author cockpit `?scope=scene&sceneId=` |
| canonical_hash | Hash error | Fix underlying `SceneGenerationInput` shape; then Preflight **Re-run** |
| governance | Registry semantic errors / warnings | `/admin/narrative` cockpit, enforcement registry maintenance |
| human_gravity | Degraded influence truth or missing runtime | Cockpit scene scope, chapter / pre-generation merge inputs |
| character_simulation | Blocked or non-ready cast | Per-person `/admin/people/[id]/simulation-workbench` (links from workbench rollup when present) |
| research_canon | Contradictions or open claims | `/admin/scenes/[id]?tab=research`, `/admin/research?sceneId=` |
| prompt_assembly | Canon rows without RICRE bundle on input | Scene Research tab — entity linkage and accepted rows |
| execution_environment | Missing API key | Deployment environment / `.env` |
| final_execution_truth | (Observational) need post-run truth | After `runSceneGeneration`, cockpit Cluster 7 / reports (not preflight) |

Remediation URLs on the view model prefer stable admin routes; some environment issues have no deep link by design.
