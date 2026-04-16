import {
  ChapterCompositionDensitySchema,
  type ChapterCompositionDensity,
  type ComposedScenePlan,
} from "@/lib/domain/chapter-composition";

export class ChapterCompositionDensityService {
  analyze(input: {
    sceneSequence: ComposedScenePlan[];
    activeThreadIds: string[];
    latentThreadIds: string[];
    callbackMarkersCount: number;
    hasRoutePresence: boolean;
    hasUnresolvedCarryForward: boolean;
    hasDelayedConvergence: boolean;
  }): ChapterCompositionDensity {
    const warnings: string[] = [];
    const sceneRoles = new Set(input.sceneSequence.map((scene) => scene.sceneRole));
    const dominantFamiliesByScene = input.sceneSequence.map((scene) => scene.dominantThreadIds.length);
    const singleDominantFamilyAcrossChapter = new Set(input.activeThreadIds).size <= 1;
    const noLatentCallbackMarker = input.callbackMarkersCount === 0;
    const noRoutePresence = !input.hasRoutePresence;
    const noCarryForward = !input.hasUnresolvedCarryForward;
    const repetitiveRoles = sceneRoles.size <= 1;
    const noConvergenceOrEcho = !input.hasDelayedConvergence;

    if (singleDominantFamilyAcrossChapter) warnings.push("Only one dominant thread family detected across chapter scenes.");
    if (noLatentCallbackMarker) warnings.push("No latent callback markers detected.");
    if (noRoutePresence) warnings.push("No setting/route presence detected.");
    if (noCarryForward) warnings.push("No unresolved carry-forward pressure detected.");
    if (repetitiveRoles) warnings.push("All scenes serve the same role; contrast is weak.");
    if (noConvergenceOrEcho) warnings.push("No delayed convergence/echo path detected.");
    if (dominantFamiliesByScene.some((count) => count === 0)) warnings.push("At least one scene lacks a dominant thread anchor.");

    const warningPenalty = warnings.length * 0.12;
    const roleDiversityBonus = Math.min(0.2, sceneRoles.size * 0.04);
    const latentBonus = input.latentThreadIds.length > 0 ? 0.08 : 0;
    const convergenceBonus = input.hasDelayedConvergence ? 0.1 : 0;
    const base = 0.55;
    const densityScore = Number(Math.max(0, Math.min(1, base + roleDiversityBonus + latentBonus + convergenceBonus - warningPenalty)).toFixed(3));
    const hardThinChapterFlag = warnings.length >= 4 || (warnings.length >= 3 && input.sceneSequence.length <= 2);

    return ChapterCompositionDensitySchema.parse({
      densityScore,
      densityWarnings: warnings,
      hardThinChapterFlag,
    });
  }
}
