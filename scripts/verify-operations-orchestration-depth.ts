/**
 * Phase 7 Expansion / Workstream 8 — operations orchestration depth verification.
 */
import { execSync } from "node:child_process";

import { enforceCertificationResults } from "@/lib/certification/certification-enforcement";
import type { CertificationCheckResult, CertificationCommandResult } from "@/lib/certification/certification-types";
import { evaluateOperationsOrchestrationDepthVerification } from "@/lib/services/operations-orchestration-depth-verification-service";

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
    "npm run verify:telemetry-depth",
    "npm run verify:anomaly-detection",
    "npm run verify:story-health-diagnostics",
    "npm run verify:experiment-governance-depth",
    "npm run verify:recommendation-intelligence-depth",
    "npm run verify:live-safety-ops-depth",
    "npm run verify:operator-insight-depth",
  ];

  const commandResults = commands.map(runCommand);
  const summary = evaluateOperationsOrchestrationDepthVerification({
    commandResults: commandResults.map((result) => ({ command: result.command, ok: result.ok })),
  });

  const checks: CertificationCheckResult[] = [
    {
      name: "operations_orchestration_depth_surface_active",
      ok: true,
      severity: "info",
      details: { commandCount: commands.length },
    },
    {
      name: "operations_orchestration_depth_invariants_hold",
      ok: summary.ok,
      severity: summary.ok ? "info" : "critical",
      details: {
        checkedInvariants: summary.checkedInvariants,
        failedCommands: summary.failedCommands,
      },
    },
  ];

  const enforced = enforceCertificationResults({ checks, commandResults });
  console.log(JSON.stringify(enforced, null, 2));
  process.exit(enforced.ok ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
