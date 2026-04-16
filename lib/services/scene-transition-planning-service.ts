import type { ComposedScenePlan } from "@/lib/domain/chapter-composition";
import {
  SceneTransitionPlanSchema,
  type SceneTransitionPlan,
  type SceneTransitionStrategy,
} from "@/lib/domain/scene-generation-engine";
import { SceneOrderGrammarService } from "@/lib/services/scene-order-grammar-service";

function strategyForPair(fromRole: string, toRole: string): SceneTransitionStrategy {
  if (fromRole === "convergence_scene" && toRole === "closure_scene") return "closure_open_cut";
  if (fromRole === "rumor_scene" || toRole === "rumor_scene") return "delayed_bind_cut";
  if (toRole === "memory_echo_scene") return "memory_carry";
  if (toRole === "setting_presence_scene") return "route_carry";
  if (fromRole === "warning_scene") return "warning_carry";
  return "soft_echo";
}

export class SceneTransitionPlanningService {
  private readonly grammar = new SceneOrderGrammarService();

  derive(input: {
    chapterId: string;
    scenes: ComposedScenePlan[];
  }): { transitions: SceneTransitionPlan[]; warnings: string[]; blockedPairs: string[] } {
    const delayedConvergenceKeys = input.scenes.flatMap((scene) => scene.delayedConvergenceKeys);
    const grammarResult = this.grammar.validateAdjacency({
      scenes: input.scenes,
      delayedConvergenceKeys,
    });
    const transitions: SceneTransitionPlan[] = [];
    for (let index = 1; index < input.scenes.length; index += 1) {
      const from = input.scenes[index - 1];
      const to = input.scenes[index];
      if (!from || !to) continue;
      const strategy = strategyForPair(from.sceneRole, to.sceneRole);
      transitions.push(
        SceneTransitionPlanSchema.parse({
          transitionId: `${input.chapterId}:transition:${index}`,
          chapterId: input.chapterId,
          fromScenePlanId: from.scenePlanId,
          toScenePlanId: to.scenePlanId,
          strategy,
          carrySignals: Array.from(new Set(from.dominantThreadIds.concat(from.routeBindings).slice(0, 3))),
          withheldSignals: to.delayedConvergenceKeys.length > 0 ? to.delayedConvergenceKeys : ["full_causal_link"],
          visibleNow: strategy !== "delayed_bind_cut",
          visibleLaterByConvergence: strategy === "delayed_bind_cut" || strategy === "memory_carry",
          rationale: `${from.sceneRole} to ${to.sceneRole} uses ${strategy} to preserve cadence and controlled disclosure.`,
        }),
      );
    }
    return {
      transitions,
      warnings: grammarResult.warnings,
      blockedPairs: grammarResult.blockedPairs,
    };
  }
}

