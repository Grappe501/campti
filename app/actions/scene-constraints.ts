"use server";

import { assembleSceneConstraintSet, evaluateSceneReadiness } from "@/lib/scene-constraint-engine";
import type { SceneConstraintSet, SceneReadiness } from "@/lib/scene-constraint-types";

export type SceneLegalityView = {
  set: SceneConstraintSet;
  readiness: SceneReadiness;
};

/** Derived Stage 8 legality snapshot for admin (no persistence). */
export async function loadSceneLegalityView(args: {
  sceneId: string;
  worldStateId: string | null;
  focalPersonId: string | null;
  draftTextEmpty: boolean;
}): Promise<SceneLegalityView | null> {
  const set = await assembleSceneConstraintSet(args.sceneId, args.worldStateId, args.focalPersonId);
  if (!set) return null;

  const readiness = evaluateSceneReadiness({
    set,
    hasWorldState: Boolean(args.worldStateId),
    draftTextEmpty: args.draftTextEmpty,
  });

  return { set, readiness };
}
