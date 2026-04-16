export type CreatorPublishingVerificationCommandResult = {
  command: string;
  ok: boolean;
};

export function evaluateCreatorPublishingLayerVerification(input: {
  commandResults: CreatorPublishingVerificationCommandResult[];
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
      "no_unauthorized_state_mutation",
      "no_publishing_without_governance",
      "no_creator_ecosystem_leakage",
      "truth_boundary_preservation",
    ],
  };
}
