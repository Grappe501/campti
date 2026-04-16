import { ReinterpretationAnchorSchema, type ComposedScenePlan, type ReinterpretationAnchor } from "@/lib/domain/chapter-composition";

export class ChapterReinterpretationAnchorService {
  deriveAnchors(input: {
    chapterId: string;
    sceneSequence: ComposedScenePlan[];
    defaultOriginalPov: string;
    alternatePovCandidates: string[];
  }): ReinterpretationAnchor[] {
    const anchors: ReinterpretationAnchor[] = [];
    for (const scene of input.sceneSequence) {
      const canReinterpret =
        scene.sceneRole === "memory_echo_scene" ||
        scene.sceneRole === "warning_scene" ||
        scene.sceneRole === "rumor_scene" ||
        scene.delayedConvergenceKeys.length > 0;
      if (!canReinterpret) continue;
      const alternates = input.alternatePovCandidates.length > 0 ? input.alternatePovCandidates.slice(0, 3) : [`${input.defaultOriginalPov}:later-reframing`];
      anchors.push(
        ReinterpretationAnchorSchema.parse({
          reinterpretationAnchorId: `${input.chapterId}:${scene.scenePlanId}:reinterpret`,
          sourceSceneId: scene.scenePlanId,
          sourceThreadIds: scene.dominantThreadIds.length > 0 ? scene.dominantThreadIds : scene.secondaryThreadIds,
          originalPovId: scene.povCandidateWeights[0]?.povId ?? input.defaultOriginalPov,
          alternatePovCandidates: alternates,
          reinterpretableElements: [
            `${scene.sceneRole}:surface_action`,
            "partial_visibility",
            ...(scene.delayedConvergenceKeys.length > 0 ? ["hidden_route_link"] : []),
          ],
          likelyMeaningShift: "Initial local reading broadens into system-level continuity pressure.",
          hiddenInformationDelta: "Observed signal later maps to cross-location thread activity.",
          reentryEligibilityWindow: "later_chapter_or_next_book",
          validationFlags: [],
        }),
      );
    }
    return anchors;
  }
}
