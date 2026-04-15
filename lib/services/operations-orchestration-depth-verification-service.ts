export type OperationsOrchestrationDepthCommandResult = {
  command: string;
  ok: boolean;
};

export function evaluateOperationsOrchestrationDepthVerification(input: {
  commandResults: OperationsOrchestrationDepthCommandResult[];
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
      "bounded_orchestration_bundle",
      "surface_ownership_separation",
      "explainable_non_omniscient_intelligence",
      "truth_boundary_preservation",
    ],
  };
}
