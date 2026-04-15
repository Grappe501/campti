/**
 * Phase 4 / Chunk 8 — production verification surface.
 */
import { execSync } from "node:child_process";

import { enforceCertificationResults } from "@/lib/certification/certification-enforcement";
import type { CertificationCheckResult, CertificationCommandResult } from "@/lib/certification/certification-types";

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
    "npm run verify:book-program",
    "npm run verify:chapter-assembly",
    "npm run verify:scene-sequencing",
    "npm run verify:author-steering",
    "npm run verify:drafting-revision",
    "npm run verify:production-branching",
    "npm run verify:manuscript-coherence",
  ];

  const commandResults = commands.map(runCommand);
  const checks: CertificationCheckResult[] = [
    {
      name: "production_verification_surface_active",
      ok: true,
      severity: "info",
      details: {
        commandCount: commands.length,
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
