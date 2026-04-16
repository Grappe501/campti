import type { ComposedScenePlan } from "@/lib/domain/chapter-composition";

export type ChapterCompositionBeatBiasPlan = {
  chapterId: string;
  sceneBeatBiases: Array<{
    scenePlanId: string;
    beatBias: Record<string, number>;
    proseConstraintHints: string[];
  }>;
  chapterBeatBiasSummary: Record<string, number>;
};

function mergeBias(target: Record<string, number>, delta: Record<string, number>) {
  for (const [key, value] of Object.entries(delta)) {
    target[key] = Number(((target[key] ?? 0) + value).toFixed(3));
  }
}

export class ChapterCompositionToBeatBiasService {
  derive(input: { chapterId: string; sceneSequence: ComposedScenePlan[] }): ChapterCompositionBeatBiasPlan {
    const summary: Record<string, number> = {};
    const sceneBeatBiases = input.sceneSequence.map((scene) => {
      mergeBias(summary, scene.requiredBeatBiases);
      const proseConstraintHints =
        scene.sceneRole === "rumor_scene"
          ? ["Raise social signal texture.", "Keep interpretation deferred for later convergence."]
          : scene.sceneRole === "setting_presence_scene"
            ? ["Increase place immersion and environmental confirmation."]
            : scene.sceneRole === "philosophy_echo_scene"
              ? ["Route worldview through consequence and memory, not declarative statements."]
              : scene.sceneRole === "convergence_scene"
                ? ["Activate callback signals and multi-thread braid pressure."]
                : ["Maintain embodied causality and carry-forward pressure."];
      return {
        scenePlanId: scene.scenePlanId,
        beatBias: scene.requiredBeatBiases,
        proseConstraintHints,
      };
    });
    return {
      chapterId: input.chapterId,
      sceneBeatBiases,
      chapterBeatBiasSummary: summary,
    };
  }
}
