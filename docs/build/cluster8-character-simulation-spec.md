# Cluster 8 — Character simulation core (spec)

## Intent

Characters become the **primary source of motion**: pressure, conflict, scene necessity, dialogue, interiority, voice, change, memory, and decision. The story engine acts as **assembler, constraint enforcer, and continuity validator**—not the primary generator of motion.

## Domain contracts

| Artifact | Path | Role |
|----------|------|------|
| Mind model | `lib/domain/character-mind.ts` | Long-horizon psychology (desire, fear, wound, identity, biases). |
| Voice engine | `lib/domain/character-voice.ts` | Cognitive voice (thought distortion, silence, stress shifts). **Not** Prisma `CharacterVoiceProfile` (DB texture). |
| Relationships | `lib/domain/character-relationship.ts` | Bond geometry affecting behavior. |
| Scene emergence | `lib/domain/character-scene-emergence.ts` | Necessity / conflict / POV justification per scene. |
| Runtime bundle | `lib/domain/character-simulation-runtime.ts` | Zod-validated payload for prompts + cockpit. |

## Governance integration

`CanonicalNarrativeGovernanceOrchestrationService` derives a **chapter emergence plan** after Cluster 3 packs validate, and stores it on `CanonicalPreGenerationBundle.characterSceneEmergencePlan`. Scene-level runtime merges that plan with **participating people** from the contract.

## Canonical scene generation order

1. Cluster 4 governance bundle (continuity / EEGS / narrator merge).  
2. Cluster 6 human gravity (attachment, stakes, consequence, burden; no-reset truth).  
3. **Cluster 8 character simulation** (mind + voice + relationship + emergence + constraints).  
4. Cluster 5 prose realism (now receives character layer for voice distinctness seeding).  
5. Model prompt (`scene-generation-llm-adapter`) includes `CLUSTER8_CHARACTER_SIMULATION` block.  
6. Post-gen **advisory** validation (`CharacterSimulationValidationService`) adds warnings only (no save block).

## Non-negotiables (enforced in prompts + constraints)

- Scenes justify themselves via **character pressure** (`sceneEmergenceDigest`).  
- **No-reset alignment**: evolution service dampens fear/identity snap-backs when `allowEmotionalReset` is false.  
- **Constraint service** blocks premature intimacy speech, impossible repair, and radical honesty under identity threat.  
- Contract facts, P2-E sources, narrator boundaries, and human-gravity rules remain supreme.

## Author nudge surface

`SceneGenerationInput.characterSimulationAuthorNudge` carries optional deltas (desire/fear, relationship tension, voice stress). Cockpit lists hook strings; callers attach nudge maps on the same canonical path.
