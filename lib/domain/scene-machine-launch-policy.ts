import type { SceneGenerationPreflightViewModel } from "@/lib/domain/scene-generation-preflight";
import { deriveLaunchConfirmationRequired } from "@/lib/domain/scene-launch-guard-policy";
import {
  DEFAULT_SCENE_MACHINE_LAUNCH_POLICY,
  type GuardedSceneLaunchRequest,
  type SceneLaunchClass,
  type SceneLaunchPolicyDecision,
  type SceneLaunchPolicyMode,
  type SceneMachineLaunchPolicy,
} from "@/lib/domain/scene-guarded-launch";

/**
 * True when machine/rehearsal mutating paths need risk elevation (no human in the loop).
 * Mirrors interactive “confirmation required” without claiming a human confirmed.
 */
export function machineLaunchRequiresRiskElevation(vm: SceneGenerationPreflightViewModel): boolean {
  return deriveLaunchConfirmationRequired({
    launchAllowance: vm.summary.launchAllowance,
    overallReadinessClass: vm.summary.overallReadinessClass,
  });
}

export function inferPolicyModeForRequest(
  launchClass: SceneLaunchClass,
  machinePolicy: SceneMachineLaunchPolicy,
  needsElevation: boolean,
  willMutate: boolean,
): SceneLaunchPolicyMode {
  if (launchClass === "rehearsal" && !willMutate) return "rehearsal_non_launch";
  if (launchClass === "rehearsal" && willMutate) return "rehearsal_mutating";
  if (launchClass === "interactive") return "interactive_default";
  if (needsElevation && machinePolicy.allowMachineRiskyLaunch) return "machine_risk_elevation_allowed";
  return "machine_default";
}

/** Interactive path: same rules as pre-unification `executeSceneLaunchAfterGuard`. */
export function decideInteractiveLaunchProceed(
  vm: SceneGenerationPreflightViewModel,
  request: Pick<GuardedSceneLaunchRequest, "riskAcknowledged">,
): SceneLaunchPolicyDecision {
  const policyMode: SceneLaunchPolicyMode = "interactive_default";

  if (vm.summary.launchAllowance === "blocked") {
    return {
      proceed: false,
      code: "launch_blocked",
      message: vm.summary.headline,
      confirmationMode: "human_not_required",
      policyMode,
    };
  }

  if (vm.summary.launchAllowance === "allowed_with_risk") {
    if (!request.riskAcknowledged) {
      return {
        proceed: false,
        code: "confirmation_required",
        message: "Explicit risk acknowledgement is required before launch under allowed-with-risk policy.",
        confirmationMode: "human_not_required",
        policyMode,
      };
    }
    return { proceed: true, confirmationMode: "human_confirmed", policyMode };
  }

  const confirmationRequired = deriveLaunchConfirmationRequired({
    launchAllowance: vm.summary.launchAllowance,
    overallReadinessClass: vm.summary.overallReadinessClass,
  });

  if (confirmationRequired && vm.summary.overallReadinessClass === "rehearsal_incomplete") {
    if (!request.riskAcknowledged) {
      return {
        proceed: false,
        code: "confirmation_required",
        message: "Rehearsal-incomplete readiness requires explicit acknowledgement.",
        confirmationMode: "human_not_required",
        policyMode,
      };
    }
    return { proceed: true, confirmationMode: "human_confirmed", policyMode };
  }

  return { proceed: true, confirmationMode: "human_not_required", policyMode };
}

/** Machine or mutating rehearsal: deny risky elevation by default. */
export function decideMachineLaunchProceed(
  vm: SceneGenerationPreflightViewModel,
  machinePolicy: SceneMachineLaunchPolicy = DEFAULT_SCENE_MACHINE_LAUNCH_POLICY,
): SceneLaunchPolicyDecision {
  if (vm.summary.launchAllowance === "blocked") {
    return {
      proceed: false,
      code: "launch_blocked",
      message: vm.summary.headline,
      confirmationMode: "machine_not_required",
      policyMode: inferPolicyModeForRequest("machine", machinePolicy, false, true),
    };
  }

  const needsElevation = machineLaunchRequiresRiskElevation(vm);
  const policyMode = inferPolicyModeForRequest("machine", machinePolicy, needsElevation, true);

  if (needsElevation && !machinePolicy.allowMachineRiskyLaunch) {
    return {
      proceed: false,
      code: "machine_policy_denied_risk",
      message:
        "Machine launch denied: preflight requires risk elevation. Use interactive launch with human acknowledgement or an explicit machine risk policy.",
      confirmationMode: "machine_policy_denied",
      policyMode,
    };
  }

  if (needsElevation && machinePolicy.allowMachineRiskyLaunch) {
    return { proceed: true, confirmationMode: "machine_policy_allowed", policyMode };
  }

  return { proceed: true, confirmationMode: "machine_not_required", policyMode };
}
