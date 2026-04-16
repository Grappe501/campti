import {
  PhilosophyPropagationPlanSchema,
  type ComposedScenePlan,
  type PhilosophyCarrierMode,
  type PhilosophyPropagationPlan,
} from "@/lib/domain/chapter-composition";

const DEFAULT_MODES: PhilosophyCarrierMode[] = [
  "action_pattern",
  "consequence_pattern",
  "warning_pattern",
  "memory_comparison",
  "scene_contrast",
];

export class PhilosophyPropagationService {
  derivePlan(input: {
    chapterId: string;
    activePhilosophyThreadIds: string[];
    explicitnessCeiling: number;
    sceneSequence: ComposedScenePlan[];
  }): PhilosophyPropagationPlan {
    const sceneLevelPlacementSuggestions = input.sceneSequence
      .filter((scene) => scene.sceneRole !== "closure_scene")
      .map((scene) => ({
        scenePlanId: scene.scenePlanId,
        suggestion:
          scene.sceneRole === "philosophy_echo_scene"
            ? "Deliver via memory comparison and consequence, avoid declarative thesis lines."
            : scene.sceneRole === "warning_scene"
              ? "Carry worldview through warning pattern and character reaction, not lecture."
              : "Embed idea thread in action timing and what characters notice first.",
      }));

    const nextEchoOpportunities = input.sceneSequence
      .filter((scene) => scene.sceneRole === "warning_scene" || scene.sceneRole === "memory_echo_scene" || scene.sceneRole === "convergence_scene")
      .map((scene) => scene.scenePlanId);

    return PhilosophyPropagationPlanSchema.parse({
      artifact: "philosophy_propagation_plan",
      chapterId: input.chapterId,
      activePhilosophyThreadIds: input.activePhilosophyThreadIds,
      explicitnessCeiling: Number(Math.max(0.05, Math.min(0.5, input.explicitnessCeiling)).toFixed(3)),
      preferredCarrierModes: DEFAULT_MODES,
      nextEchoOpportunities,
      sceneLevelPlacementSuggestions,
      delayedPayoffPotential: Number(Math.min(1, 0.45 + nextEchoOpportunities.length * 0.1).toFixed(3)),
    });
  }
}
