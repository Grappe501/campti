/**
 * Phase 6 / Chunk 8 — platform verification at scale.
 */
import { execSync } from "node:child_process";

import { enforceCertificationResults } from "@/lib/certification/certification-enforcement";
import type { CertificationCheckResult, CertificationCommandResult } from "@/lib/certification/certification-types";
import { evaluatePlatformScaleVerification } from "@/lib/services/platform-scale-verification-service";

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
    "npm run verify:multi-book",
    "npm run verify:identity-isolation",
    "npm run verify:library-integrity",
    "npm run verify:session-isolation",
    "npm run verify:versioning-integrity",
  ];

  const commandResults = commands.map(runCommand);
  const scaleSummary = evaluatePlatformScaleVerification({
    commandResults: commandResults.map((result) => ({ command: result.command, ok: result.ok })),
  });

  const checks: CertificationCheckResult[] = [
    {
      name: "platform_scale_surface_active",
      ok: true,
      severity: "info",
      details: {
        commandCount: commands.length,
      },
    },
    {
      name: "platform_scale_invariants_hold",
      ok: scaleSummary.ok,
      severity: scaleSummary.ok ? "info" : "critical",
      details: {
        checkedInvariants: scaleSummary.checkedInvariants,
        failedCommands: scaleSummary.failedCommands,
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
