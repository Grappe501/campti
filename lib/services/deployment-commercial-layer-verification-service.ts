export type DeploymentCommercialVerificationCommandResult = {
  command: string;
  ok: boolean;
};

export function evaluateDeploymentCommercialLayerVerification(input: {
  commandResults: DeploymentCommercialVerificationCommandResult[];
}): {
  ok: boolean;
  failedCommands: string[];
  checkedInvariants: string[];
} {
  const failedCommands = input.commandResults.filter((result) => !result.ok).map((result) => result.command);
  return {
    ok: failedCommands.length === 0,
    failedCommands,
    checkedInvariants: [
      "no_deployment_without_rollback_path",
      "commercial_logic_explainable",
      "entitlements_remain_authoritative",
      "truth_boundary_preservation",
    ],
  };
}
