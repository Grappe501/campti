export type OperationsVerificationCommandResult = {
  command: string;
  ok: boolean;
};

export function evaluateOperationsLayerVerification(input: {
  commandResults: OperationsVerificationCommandResult[];
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
      "observed_state_only",
      "epistemic_boundaries",
      "no_backward_contamination",
      "no_silent_fallbacks",
      "truth_over_convenience",
    ],
  };
}
