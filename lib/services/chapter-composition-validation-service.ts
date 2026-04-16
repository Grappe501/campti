import { ChapterCompositionPlanSchema, type ChapterCompositionPlan } from "@/lib/domain/chapter-composition";

export type ChapterCompositionValidationResult = {
  passesAll: boolean;
  errors: string[];
  warnings: string[];
};

export class ChapterCompositionValidationService {
  validate(plan: ChapterCompositionPlan): ChapterCompositionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const parsed = ChapterCompositionPlanSchema.safeParse(plan);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`Schema: ${issue.path.join(".")} ${issue.message}`);
      }
      return { passesAll: false, errors, warnings };
    }

    if (plan.sceneSequence.length < 2) errors.push("Chapter composition must include at least two scenes.");
    if (plan.sceneSequence.length > 6) errors.push("Chapter composition exceeds default-capable 2-6 scene envelope.");
    if (plan.routeRequirementStatus.requiredLocationIds.length > 0 && !plan.routeRequirementStatus.recurrenceSatisfied) {
      warnings.push("Route recurrence requirements are not yet fully satisfied.");
    }
    if (plan.philosophyRequirementStatus.activePhilosophyThreadIds.length > 0 && plan.philosophyRequirementStatus.explicitnessCeiling > 0.55) {
      warnings.push("Philosophy explicitness ceiling is high; risk of preachy delivery.");
    }
    if (plan.delayedConvergenceBindings.length === 0) warnings.push("No delayed convergence bindings detected.");
    if (plan.callbackMarkers.length === 0) warnings.push("No callback markers detected.");
    if (plan.reinterpretationAnchors.length === 0) warnings.push("No reinterpretation anchors detected.");
    if (plan.densityScore < 0.4) warnings.push("Density score is low; chapter may read as thin.");

    return { passesAll: errors.length === 0, errors, warnings };
  }
}
