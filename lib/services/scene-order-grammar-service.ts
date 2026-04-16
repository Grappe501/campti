import type { ComposedScenePlan } from "@/lib/domain/chapter-composition";
import { SceneOrderRulesSchema, type SceneOrderRules } from "@/lib/domain/narrative-sequence";

const DEFAULT_ALLOWED = new Set([
  "grounding_scene->disturbance",
  "grounding_scene->warning_scene",
  "warning_scene->rumor_scene",
  "rumor_scene->setting_presence_scene",
  "setting_presence_scene->philosophy_echo_scene",
  "philosophy_echo_scene->convergence_scene",
  "convergence_scene->closure_scene",
  "memory_echo_scene->convergence_scene",
  "fracture_scene->aftermath",
]);

export class SceneOrderGrammarService {
  buildRules(): SceneOrderRules {
    return SceneOrderRulesSchema.parse({
      allowedTransitions: Array.from(DEFAULT_ALLOWED),
      contrastRules: [
        "relational scenes should not cluster more than two in a row",
        "memory_return follows action pressure before reinterpretation",
      ],
      escalationRules: [
        "convergence scenes require at least two setup scenes with delayed keys",
        "fracture must raise unresolved pressure versus prior scene",
      ],
      interruptionRules: [
        "disturbance to apparently disconnected scene is allowed only when delayed convergence key exists",
        "route_presence interruption must preserve at least one active thread carry",
      ],
      echoPlacementRules: [
        "philosophy echo appears across non-adjacent windows where possible",
        "callback echoes should intensify near convergence windows",
      ],
    });
  }

  validateAdjacency(input: {
    scenes: ComposedScenePlan[];
    delayedConvergenceKeys: string[];
  }): { warnings: string[]; blockedPairs: string[] } {
    const warnings: string[] = [];
    const blockedPairs: string[] = [];
    for (let index = 1; index < input.scenes.length; index += 1) {
      const previous = input.scenes[index - 1];
      const current = input.scenes[index];
      if (!previous || !current) continue;
      const pair = `${previous.sceneRole}->${current.sceneRole}`;
      if (!DEFAULT_ALLOWED.has(pair)) {
        const hasDelayedLink = current.delayedConvergenceKeys.length > 0 || input.delayedConvergenceKeys.length > 0;
        if (!hasDelayedLink) blockedPairs.push(pair);
        else warnings.push(`Allowed disconnected adjacency due to delayed convergence planning: ${pair}`);
      }
      if (current.sceneRole === "memory_echo_scene" && previous.sceneRole === "grounding_scene") {
        warnings.push("Memory scene follows direct grounding; prefer placing action pressure before memory return.");
      }
    }
    return { warnings, blockedPairs };
  }
}

