import { CallbackMarkerSchema, type CallbackMarker, type CallbackType, type ComposedScenePlan } from "@/lib/domain/chapter-composition";

function inferCallbackType(scene: ComposedScenePlan): CallbackType {
  if (scene.sceneRole === "rumor_scene" || scene.sceneRole === "route_signal_scene") return "rumor_trade_contact";
  if (scene.sceneRole === "setting_presence_scene") return "location_reference";
  if (scene.sceneRole === "memory_echo_scene") return "line_memory_fragment";
  if (scene.sceneRole === "warning_scene") return "warning_pattern";
  if (scene.sceneRole === "relational_scene") return "relational_gesture";
  return "sensory_marker";
}

export class ChapterCallbackPlanningService {
  deriveCallbackMarkers(sceneSequence: ComposedScenePlan[]): CallbackMarker[] {
    const markers: CallbackMarker[] = [];
    for (const scene of sceneSequence) {
      const sourceThreadId = scene.dominantThreadIds[0] ?? scene.secondaryThreadIds[0];
      if (!sourceThreadId) continue;
      const callbackSeed = scene.callbackSeeds[0] ?? `${scene.scenePlanId}:callback-seed`;
      markers.push(
        CallbackMarkerSchema.parse({
          callbackId: callbackSeed,
          sourceSceneId: scene.scenePlanId,
          sourceThreadId,
          callbackStrength: Number(Math.min(1, 0.38 + scene.latentThreadIds.length * 0.12).toFixed(3)),
          callbackWindow: `chapter+${Math.max(1, Math.ceil(scene.sceneOrder / 2))}..book+1`,
          callbackType: inferCallbackType(scene),
          laterTargetOptions: scene.delayedConvergenceKeys.length > 0 ? scene.delayedConvergenceKeys : [`${sourceThreadId}:reentry`],
        }),
      );
    }
    return markers;
  }
}
