/**
 * Phase 7 / Chunk 8 — operations verification umbrella.
 */
import { execSync } from "node:child_process";

import { enforceCertificationResults } from "@/lib/certification/certification-enforcement";
import type { CertificationCheckResult, CertificationCommandResult } from "@/lib/certification/certification-types";
import { evaluateOperationsLayerVerification } from "@/lib/services/operations-layer-verification-service";

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
    "npm run verify:telemetry-model",
    "npm run verify:reader-analytics",
    "npm run verify:story-health",
    "npm run verify:experimentation",
    "npm run verify:recommendation-layer",
    "npm run verify:live-safety",
    "npm run verify:operator-surfaces",
  ];

  const commandResults = commands.map(runCommand);
  const operationsSummary = evaluateOperationsLayerVerification({
    commandResults: commandResults.map((result) => ({ command: result.command, ok: result.ok })),
  });

  const checks: CertificationCheckResult[] = [
    {
      name: "operations_verification_surface_active",
      ok: true,
      severity: "info",
      details: {
        commandCount: commands.length,
      },
    },
    {
      name: "operations_invariants_hold",
      ok: operationsSummary.ok,
      severity: operationsSummary.ok ? "info" : "critical",
      details: {
        checkedInvariants: operationsSummary.checkedInvariants,
        failedCommands: operationsSummary.failedCommands,
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
