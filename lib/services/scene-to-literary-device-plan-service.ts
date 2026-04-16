import type { ComposedScenePlan } from "@/lib/domain/chapter-composition";
import type { LiteraryDeviceApplicationPlan, LiteraryDeviceControlSetting } from "@/lib/domain/literary-device-control";
import { LiteraryDeviceDerivationService } from "@/lib/services/literary-device-derivation-service";

export class SceneToLiteraryDevicePlanService {
  private readonly derivation = new LiteraryDeviceDerivationService();

  derive(input: {
    chapterId: string;
    chapterPsychologyMode: string;
    chapterMode: string;
    scene: ComposedScenePlan;
    beatTypes: string[];
    activeThreadIds: string[];
    settingThreadIds: string[];
    philosophyThreadIds: string[];
    compositionMode: string;
    controlSettings: LiteraryDeviceControlSetting[];
  }): LiteraryDeviceApplicationPlan {
    return this.derivation.deriveApplicationPlan({
      chapterId: input.chapterId,
      sceneId: input.scene.scenePlanId,
      chapterPsychologyMode: input.chapterPsychologyMode,
      chapterMode: input.chapterMode,
      psychologyAxes: {
        placeImmersion: input.scene.sceneRole === "setting_presence_scene" ? 0.88 : 0.62,
        unresolvedPull: input.scene.sceneRole === "convergence_scene" ? 0.9 : 0.66,
        signalIntegrity: input.scene.sceneRole === "rumor_scene" ? 0.35 : 0.52,
        relationalHeat: input.scene.sceneRole === "relational_scene" ? 0.82 : 0.56,
        laborPressure: input.scene.sceneRole === "labor_scene" ? 0.86 : 0.58,
      },
      activeThreadIds: input.activeThreadIds,
      settingThreadIds: input.settingThreadIds,
      philosophyThreadIds: input.philosophyThreadIds,
      compositionMode: input.compositionMode,
      sceneRoles: [input.scene.sceneRole],
      beatTypes: input.beatTypes,
      controlSettings: input.controlSettings,
    });
  }
}

