import { execSync } from "node:child_process";

import { enforceCertificationResults } from "@/lib/certification/certification-enforcement";
import type { CertificationCheckResult, CertificationCommandResult } from "@/lib/certification/certification-types";
import { evaluateAuthorCommandCockpitVerification } from "@/lib/services/author-command-cockpit-verification-service";

function runCommand(command: string): CertificationCommandResult {
  try {
    const output = execSync(command, { stdio: "pipe", encoding: "utf8" });
    return { command, ok: true, details: { output } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { command, ok: false, details: { error: message } };
  }
}

void (async () => {
  const commands = [
    "npm run verify:author-cockpit-consolidation",
    "npm run verify:cockpit-shell-architecture",
    "npm run verify:cockpit-scope-model",
    "npm run verify:tool-rail-system",
    "npm run verify:indicator-bank-model",
    "npm run verify:guided-signals",
    "npm run verify:author-command-cockpit:test",
  ];

  const commandResults = commands.map(runCommand);
  const cockpitSummary = evaluateAuthorCommandCockpitVerification({
    commandResults: commandResults.map((result) => ({ command: result.command, ok: result.ok })),
  });

  const checks: CertificationCheckResult[] = [
    {
      name: "author_command_cockpit_surface_active",
      ok: true,
      severity: "info",
      details: { commandCount: commands.length },
    },
    {
      name: "author_command_cockpit_invariants_hold",
      ok: cockpitSummary.ok,
      severity: cockpitSummary.ok ? "info" : "critical",
      details: {
        checkedInvariants: cockpitSummary.checkedInvariants,
        failedCommands: cockpitSummary.failedCommands,
      },
    },
  ];

  const summary = enforceCertificationResults({ checks, commandResults });
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.ok ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
