import { ComposedScenePlanSchema, type ComposedScenePlan, type SceneRole } from "@/lib/domain/chapter-composition";

const ROLE_BEAT_BIAS: Record<SceneRole, Record<string, number>> = {
  grounding_scene: { environmental_confirmation_beat: 0.6, salience_lock_beat: 0.35 },
  route_signal_scene: { social_signal_beat: 0.5, consequence_seed_beat: 0.4 },
  labor_scene: { environmental_confirmation_beat: 0.45, micro_decision_beat: 0.35 },
  relational_scene: { relational_interpretation_beat: 0.6, emotional_appraisal_beat: 0.4 },
  rumor_scene: { social_signal_beat: 0.6, meaning_trace_beat: 0.25 },
  warning_scene: { salience_lock_beat: 0.45, consequence_seed_beat: 0.5 },
  memory_echo_scene: { memory_comparison_beat: 0.7, meaning_trace_beat: 0.2 },
  setting_presence_scene: { environmental_confirmation_beat: 0.7, social_signal_beat: 0.2 },
  philosophy_echo_scene: { meaning_trace_beat: 0.65, emotional_appraisal_beat: 0.2 },
  fracture_scene: { pressure_escalation_beat: 0.65, state_update_beat: 0.2 },
  convergence_scene: { consequence_seed_beat: 0.6, state_update_beat: 0.3 },
  callback_scene: { memory_comparison_beat: 0.4, consequence_seed_beat: 0.4 },
  reentry_scene: { social_signal_beat: 0.35, state_update_beat: 0.45 },
  closure_scene: { state_update_beat: 0.6, meaning_trace_beat: 0.2 },
  displacement_prep_scene: { pressure_escalation_beat: 0.45, micro_decision_beat: 0.35 },
};

export class ChapterCompositionToScenePlanService {
  buildScenePlans(input: {
    chapterId: string;
    sceneCountTarget: number;
    roleSequence: SceneRole[];
    activeThreadIds: string[];
    latentThreadIds: string[];
    philosophyThreadIds: string[];
    requiredLocationIds: string[];
    povCandidates: Array<{ povId: string; weight: number }>;
    delayedConvergenceKeys: string[];
  }): ComposedScenePlan[] {
    const scenes: ComposedScenePlan[] = [];
    for (let index = 0; index < input.sceneCountTarget; index += 1) {
      const role = input.roleSequence[index] ?? "closure_scene";
      const dominantThreadIds = input.activeThreadIds.slice(index % Math.max(1, input.activeThreadIds.length), index % Math.max(1, input.activeThreadIds.length) + 2);
      const secondaryThreadIds = input.activeThreadIds.filter((threadId) => !dominantThreadIds.includes(threadId)).slice(0, 2);
      const latentThreadIds = input.latentThreadIds.slice(0, role === "closure_scene" ? 1 : 2);
      const delayedConvergenceKeys = role === "rumor_scene" || role === "route_signal_scene" ? input.delayedConvergenceKeys.slice(0, 1) : [];
      scenes.push(
        ComposedScenePlanSchema.parse({
          scenePlanId: `${input.chapterId}-scene-${String(index + 1).padStart(2, "0")}`,
          chapterId: input.chapterId,
          sceneOrder: index + 1,
          sceneRole: role,
          povCandidateWeights: input.povCandidates,
          dominantThreadIds,
          secondaryThreadIds,
          latentThreadIds,
          settingBindings: input.requiredLocationIds.slice(index % Math.max(1, input.requiredLocationIds.length), (index % Math.max(1, input.requiredLocationIds.length)) + 1),
          routeBindings: input.requiredLocationIds.slice(0, 2),
          philosophyBindings: role === "philosophy_echo_scene" || role === "warning_scene" ? input.philosophyThreadIds.slice(0, 2) : [],
          callbackSeeds: role === "warning_scene" || role === "rumor_scene" ? [`${input.chapterId}:seed:${index + 1}`] : [],
          delayedConvergenceKeys,
          requiredBeatBiases: ROLE_BEAT_BIAS[role],
          requiredStateBiases: {
            unresolved_pull: role === "closure_scene" ? 0.35 : 0.6,
            relational_heat: role === "relational_scene" ? 0.7 : 0.25,
            external_awareness: role === "route_signal_scene" || role === "rumor_scene" ? 0.75 : 0.3,
          },
          apparentConnectionLevel: delayedConvergenceKeys.length > 0 ? "apparently_isolated" : "indirectly_linked",
          actualConnectionLevel: delayedConvergenceKeys.length > 0 ? "convergent_later" : "hidden_linked",
          transitionStrategy: index === input.sceneCountTarget - 1 ? "close_on_pressure_extension" : "contrast_then_carry",
          carryForwardPressureType: role === "closure_scene" ? "unresolved_external_pressure" : "threaded_pressure",
          sceneClosureType: role === "closure_scene" ? "pressure_forward" : "open_knot",
          validationFlags: [],
        }),
      );
    }
    return scenes;
  }
}
