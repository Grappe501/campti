import type { ComposedScenePlan } from "@/lib/domain/chapter-composition";
import { ProseGenerationConstraintsSchema, type ProseGenerationConstraints } from "@/lib/domain/prose-generation-constraints";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export class SceneToProseConstraintsService {
  derive(input: {
    chapterConstraints: ProseGenerationConstraints;
    scene: ComposedScenePlan;
  }): ProseGenerationConstraints {
    const role = input.scene.sceneRole;
    const highTensionRole = role === "convergence_scene" || role === "fracture_scene";
    const philosophyRole = role === "philosophy_echo_scene";
    const settingRole = role === "setting_presence_scene" || role === "route_signal_scene";

    return ProseGenerationConstraintsSchema.parse({
      ...input.chapterConstraints,
      proseConstraintId: `${input.chapterConstraints.proseConstraintId}:${input.scene.scenePlanId}`,
      expositionAllowance: clamp01(input.chapterConstraints.expositionAllowance - (philosophyRole ? 0.03 : 0.01)),
      interpretationAllowance: clamp01(input.chapterConstraints.interpretationAllowance + (philosophyRole ? 0.08 : 0.03)),
      ambiguityAllowance: clamp01(input.chapterConstraints.ambiguityAllowance + (role === "rumor_scene" ? 0.12 : 0)),
      emotionalLabelAllowance: clamp01(input.chapterConstraints.emotionalLabelAllowance - (highTensionRole ? 0.02 : 0)),
      placeImmersionTarget: clamp01(input.chapterConstraints.placeImmersionTarget + (settingRole ? 0.1 : 0)),
      literaryDeviceConstraints: {
        ...input.chapterConstraints.literaryDeviceConstraints,
        soundPatternAllowance: highTensionRole ? "minimal" : input.chapterConstraints.literaryDeviceConstraints.soundPatternAllowance,
        callbackPhraseAllowance: role === "convergence_scene" || role === "closure_scene",
      },
      cadenceProfile: input.chapterConstraints.cadenceProfile.concat([
        `scene_role:${role}`,
        highTensionRole ? "suppress ornamental patterns under pressure." : "allow measured sensory rhythm variation.",
      ]),
      validationFlags: input.chapterConstraints.validationFlags.concat("scene_scoped_prose_constraints"),
    });
  }
}

