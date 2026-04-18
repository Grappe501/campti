import type { SceneGenerationLaunchAllowance, SceneGenerationReadinessClass } from "@/lib/domain/scene-generation-preflight";
import type { SceneLaunchAllowance } from "@/lib/domain/scene-launch-guard";

/**
 * Central policy: when explicit operator confirmation is required before calling the LLM path.
 * Maps preflight-derived allowance + overall readiness — no parallel scoring.
 */
export function deriveLaunchConfirmationRequired(input: {
  launchAllowance: SceneLaunchAllowance | SceneGenerationLaunchAllowance;
  overallReadinessClass: SceneGenerationReadinessClass;
}): boolean {
  const allowance = input.launchAllowance;
  if (allowance === "blocked") return false;
  if (allowance === "allowed_with_risk") return true;
  if (input.overallReadinessClass === "rehearsal_incomplete") return true;
  return false;
}
