import type {
  SceneGenerationLaunchAllowance,
  SceneGenerationReadinessClass,
} from "@/lib/domain/scene-generation-preflight";

/**
 * Launch gate: explicit rules — no hidden optimism.
 * - Any blocker ⇒ `blocked`
 * - No blockers, any downgrade risk ⇒ `allowed_with_risk`
 * - Else ⇒ `allowed`
 */
export function deriveLaunchAllowance(input: { blockerCount: number; downgradeRiskCount: number }): SceneGenerationLaunchAllowance {
  if (input.blockerCount > 0) return "blocked";
  if (input.downgradeRiskCount > 0) return "allowed_with_risk";
  return "allowed";
}

export function deriveOverallReadinessClass(input: {
  launchAllowance: SceneGenerationLaunchAllowance;
  advisoryCount: number;
  observationalOnly: boolean;
}): SceneGenerationReadinessClass {
  if (input.launchAllowance === "blocked") return "blocked";
  if (input.launchAllowance === "allowed_with_risk") return "downgrade_risk";
  if (input.observationalOnly) return "observational_only";
  if (input.advisoryCount > 0) return "ready_with_advisories";
  return "ready";
}
