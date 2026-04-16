import { execSync } from "node:child_process";

import { enforceCertificationResults } from "@/lib/certification/certification-enforcement";
import type { CertificationCheckResult, CertificationCommandResult } from "@/lib/certification/certification-types";
import { evaluateAuthorCockpitConsolidation } from "@/lib/services/author-cockpit-consolidation-service";

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
  const commands = ["npm run verify:author-cockpit-consolidation:test"];
  const commandResults = commands.map(runCommand);
  const consolidation = evaluateAuthorCockpitConsolidation();

  const checks: CertificationCheckResult[] = [
    {
      name: "author_cockpit_consolidation_surface_active",
      ok: true,
      severity: "info",
      details: { commandCount: commands.length },
    },
    {
      name: "single_authoritative_cockpit_enforced",
      ok: consolidation.ok,
      severity: consolidation.ok ? "info" : "critical",
      details: {
        authoritativeRoutes: consolidation.authoritativeRoutes,
        duplicateAuthorities: consolidation.duplicateAuthorities,
        absorbedRoutes: consolidation.absorbedRoutes,
        checkedInvariants: consolidation.checkedInvariants,
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
