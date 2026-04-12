"use server";

import { assembleCharacterBrainState, assembleCharacterSceneBrainState } from "@/lib/brain-assembly-engine";
import type { ScalarBand, SceneConstraintSummary } from "@/lib/brain-assembly-types";
import { getCharacterBrainBundle } from "@/lib/character-brain-bundle";
import { runSceneTimeBrain } from "@/lib/scene-brain-runner";

function bandFromNumber(value: number | null | undefined): ScalarBand | undefined {
  if (value == null || Number.isNaN(value)) return undefined;
  if (value <= 0) return "none";
  if (value <= 15) return "very_low";
  if (value <= 30) return "low";
  if (value <= 45) return "guarded";
  if (value <= 60) return "mixed";
  if (value <= 75) return "present";
  if (value <= 90) return "high";
  return "acute";
}

function unique(items: Array<string | null | undefined>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item && item.trim())))];
}

function extractSceneConstraints(raw: SceneConstraintSummary | null | undefined) {
  if (!raw) {
    return null;
  }

  return {
    revealBudget: bandFromNumber(raw.revealBudgetScore),
    pressureTags: unique(raw.pressureTags ?? []),
    blockedActions: unique(raw.blockedActions ?? []),
    forcedStillness: Boolean(raw.forcedStillness),
    immediateSignals: unique(raw.immediateSignals ?? []),
    objective: raw.objective ?? null,
    socialExposure: bandFromNumber(raw.socialExposureScore),
    violenceProximity: bandFromNumber(raw.violenceProximityScore),
  };
}

export async function getSceneTimeBrainEvaluation(
  personId: string,
  worldStateId: string,
  sceneId?: string | null,
  counterpartPersonId?: string | null,
) {
  const bundle = await getCharacterBrainBundle(personId, worldStateId, sceneId ?? null, counterpartPersonId ?? null);
  const brain = sceneId
    ? assembleCharacterSceneBrainState(bundle)
    : assembleCharacterBrainState(bundle);

  const evaluation = runSceneTimeBrain({
    personId,
    worldStateId,
    sceneId: sceneId ?? null,
    counterpartPersonId: counterpartPersonId ?? null,
    bundle,
    brain,
    sceneConstraints: extractSceneConstraints(bundle.sceneConstraintSummary),
  });

  return {
    bundle,
    brain,
    evaluation,
  };
}
