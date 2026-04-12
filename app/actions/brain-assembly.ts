"use server";

import { assembleCharacterBrainState, assembleCharacterSceneBrainState } from "@/lib/brain-assembly-engine";
import { getCharacterBrainBundle } from "@/lib/character-brain-bundle";

export async function getAssembledCharacterBrainState(
  personId: string,
  worldStateId: string,
  sceneId?: string | null,
) {
  const bundle = await getCharacterBrainBundle(personId, worldStateId, sceneId);
  const brain = sceneId
    ? assembleCharacterSceneBrainState(bundle)
    : assembleCharacterBrainState(bundle);

  return {
    bundle,
    brain,
  };
}
