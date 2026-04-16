import { execSync } from "node:child_process";

import { enforceCertificationResults } from "@/lib/certification/certification-enforcement";
import type { CertificationCheckResult, CertificationCommandResult } from "@/lib/certification/certification-types";
import { evaluateCreatorPublishingLayerVerification } from "@/lib/services/creator-publishing-layer-verification-service";

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
    "npm run verify:creator-identity-roles",
    "npm run verify:workspace-project-model",
    "npm run verify:editorial-workflow",
    "npm run verify:publishing-package",
    "npm run verify:asset-metadata-governance",
    "npm run verify:multi-creator-safety",
    "npm run verify:public-publishing-surfaces",
  ];

  const commandResults = commands.map(runCommand);
  const summary = evaluateCreatorPublishingLayerVerification({
    commandResults: commandResults.map((result) => ({ command: result.command, ok: result.ok })),
  });

  const checks: CertificationCheckResult[] = [
    {
      name: "creator_publishing_verification_surface_active",
      ok: true,
      severity: "info",
      details: { commandCount: commands.length },
    },
    {
      name: "creator_publishing_invariants_hold",
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
