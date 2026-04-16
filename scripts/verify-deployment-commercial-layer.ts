import { execSync } from "node:child_process";

import { enforceCertificationResults } from "@/lib/certification/certification-enforcement";
import type { CertificationCheckResult, CertificationCommandResult } from "@/lib/certification/certification-types";
import { evaluateDeploymentCommercialLayerVerification } from "@/lib/services/deployment-commercial-layer-verification-service";

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
    "npm run verify:deployment-governance",
    "npm run verify:rollout-rollback",
    "npm run verify:commercial-catalog",
    "npm run verify:commercial-entitlements",
    "npm run verify:release-monitoring",
    "npm run verify:commercial-operator-surfaces",
    "npm run verify:deployment-commercial-intelligence",
  ];

  const commandResults = commands.map(runCommand);
  const summary = evaluateDeploymentCommercialLayerVerification({
    commandResults: commandResults.map((result) => ({ command: result.command, ok: result.ok })),
  });

  const checks: CertificationCheckResult[] = [
    {
      name: "deployment_commercial_verification_surface_active",
      ok: true,
      severity: "info",
      details: { commandCount: commands.length },
    },
    {
      name: "deployment_commercial_invariants_hold",
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
