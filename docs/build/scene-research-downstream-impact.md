# Scene Research — Downstream Impact (Prompt & Hash)

## Prompt assembly

`loadAcceptedRicreCanonKnowledgeForScene(sceneId)` builds the **RICRE_ACCEPTED_CANON** instruction bundle when there are **active** `AuthorCanonKnowledgeRecord` rows for:

- the scene  
- its chapter  
- linked persons  
- linked places  

The scene tab’s **Research impact on scene generation** panel reflects:

- whether that bundle is **non-empty** for this scene (`ricrePromptBundleLoaded` / `ricrePromptBlockEligible`)
- **record count** from the bundle

## Canonical hash

`computeSceneGenerationInputHash` includes a stable projection of `ricreAcceptedCanonKnowledge` **only when** that object is present on the `SceneGenerationInput`. The tab’s **hash impact** line is **yes** only when the accepted bundle would be non-empty — aligned with `canonical-scene-generation-hash` behavior.

## Subordination

Accepted canon remains **subordinate** to scene contract facts and **P2-E** narrative sources; the tab states this explicitly.
