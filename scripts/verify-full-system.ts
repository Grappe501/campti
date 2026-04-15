/**
 * P4-I — Full-system verification runner for controlled release readiness.
 */
import { execSync } from "node:child_process";

import { enforceCertificationResults } from "@/lib/certification/certification-enforcement";
import { isStrictCertificationMode } from "@/lib/certification/certification-mode";
import type { CertificationCheckResult, CertificationCommandResult } from "@/lib/certification/certification-types";

function runCommand(command: string): CertificationCommandResult {
  try {
    const output = execSync(command, { stdio: "pipe", encoding: "utf8" });
    return { command, ok: true, details: output ? { output } : undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    let stderr = "";
    if (error && typeof error === "object" && "stderr" in error) {
      stderr = String((error as { stderr?: unknown }).stderr ?? "");
    }
    return {
      command,
      ok: false,
      details: { error: stderr || message },
    };
  }
}

void (async () => {
  const strict = isStrictCertificationMode();
  // Umbrella runner: composes subsystem proof-point commands; does not replace local verify:* ownership.
  const commands: string[] = [
    "npm run verify:contracts",
    "npm run verify:contract-drift",
    "npm run verify:narrative-emergence",
    "npm run verify:chronology",
    "npm run verify:epic-mapping",
    "npm run verify:certification-consistency",
    "npm run verify:runtime-dependency-consistency",
    "npm run verify:interaction-truth-firewall",
    "npm run verify:storyline",
    "npm run verify:production-layer",
    "npm run verify:prelaunch",
    "npm run verify:story-reentry-continuity",
    "npm run verify:conversation-quality-review",
    "npm run verify:reader-entitlement",
    "npm run verify:provider-resilience",
    "npm run verify:moderation-service",
    "npm run verify:degraded-interaction-policy",
    "npm run verify:reader-cockpit-command",
    "npm run verify:platform-scale",
    "npm run verify:operations-layer",
  ];
  if (strict) {
    commands.unshift("npm run verify:migrations");
  }

  const results = commands.map(runCommand);
  const checks: CertificationCheckResult[] = [
    {
      name: "full_system_runner_active",
      ok: true,
      severity: "info",
      details: { strictMode: strict },
    },
  ];
  const summary = enforceCertificationResults({ checks, commandResults: results });

  console.log(
    JSON.stringify(
      {
        ...summary,
      },
      null,
      2
    )
  );
  process.exit(summary.ok ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

