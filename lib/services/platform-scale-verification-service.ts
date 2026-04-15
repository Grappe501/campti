export type ScaleCommandResult = {
  command: string;
  ok: boolean;
};

export function evaluatePlatformScaleVerification(input: {
  commandResults: ScaleCommandResult[];
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
      "multi_story_isolation",
      "reader_identity_isolation",
      "library_state_integrity",
      "session_isolation",
      "release_version_integrity",
    ],
  };
}
