export type AuthorCommandCockpitVerificationCommandResult = {
  command: string;
  ok: boolean;
};

export function evaluateAuthorCommandCockpitVerification(input: {
  commandResults: AuthorCommandCockpitVerificationCommandResult[];
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
      "single_authoritative_author_cockpit",
      "scope_switching_coherent_scene_chapter_book_epic",
      "indicator_banks_governed_and_explainable",
      "guided_signals_advisory_only",
      "cockpit_actions_do_not_bypass_governed_state",
    ],
  };
}
