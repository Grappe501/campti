# Scene Research Relevance Model

## Target resolution

`findResearchTargetIdsLinkedToSceneContext` selects `AuthorResearchTarget` rows where **any** of:

- `linkedSceneIds` JSON array contains the scene id  
- `linkedChapterIds` contains the scene’s chapter id  
- `linkedPersonIds` overlaps any **Person** linked to the scene  
- `linkedPlaceIds` overlaps any **Place** linked to the scene  

Thread-only or unrelated targets **do not** appear unless they also hit one of the rules above.

## UI relevance labels

| Label | Meaning |
|-------|---------|
| `direct_scene_link` | Target lists this scene id |
| `chapter_link` | Target lists this chapter id |
| `person_link` | Target lists a person in this scene |
| `place_link` | Target lists a place in this scene |
| `explicit_topic_link` | Fallback when matched through combined rules |
| `accepted_scene_canon` | Active canon row targets this scene id |
| `accepted_chapter_canon` | Active canon row targets this chapter |
| `accepted_entity_canon` | Active canon row targets a person/place in scope |

Canon rows are loaded with the same OR scope as `loadAcceptedRicreCanonKnowledgeForScene` (plus full row metadata for the tab).
