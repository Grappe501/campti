# Runtime path convergence report (Cluster 4)

## Paths audited

| Path | Canonical / production impact | Cluster 3 governance (post–Cluster 4) |
| --- | --- | --- |
| `book1-regeneration-loop-service` | Primary book1 regeneration; drives canonical artifacts | Via `CanonicalNarrativeGovernanceOrchestrationService` |
| `runSceneGeneration` / `scene-generation-service` | DB-backed scene prose generation | Via `prepareCanonicalPreGenerationBundleForScene` (default on) |
| `SceneGenerationEngineService` | Deterministic chapter/scene bundle (production runtime id) | Consumes `chapterLevelProseConstraints` already merged upstream in regeneration; not the OpenAI DB path |
| `loadSceneGenerationInput` | Contract + voice + social + sources | Supplies base input; governance attached in `runSceneGeneration` |
| `generateSceneProseWithModel` | OpenAI boundary | Consumes `canonicalPreGeneration` in prompt when present |

## Classifications

- **Divergent by design (documented)**: turning off `applyCanonicalNarrativeGovernance` on `runSceneGeneration` yields a non-equivalent prose-constraint path (escape hatch; must not be claimed as production-equivalent).
- **Literary layer**: full book1 regeneration still applies literary-device-to-prose before governance; DB path notes this on the bundle when relevant.
