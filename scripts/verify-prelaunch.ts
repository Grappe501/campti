/**
 * P4-I — Quick prelaunch verification.
 */
import { enforceCertificationResults } from "@/lib/certification/certification-enforcement";
import { runMigrationReadinessCertificationCheck } from "@/lib/certification/migration-readiness-check";
import type { CertificationCheckResult } from "@/lib/certification/certification-types";
import { runPrelaunchVerificationHarness } from "@/lib/testing/prelaunch-verification-harness";

void (async () => {
  const harness = await runPrelaunchVerificationHarness();
  const checks: CertificationCheckResult[] = harness.checks.map((check) => ({
    name: check.name,
    ok: check.ok,
    severity: "critical",
    details: check.details,
  }));
  checks.push(runMigrationReadinessCertificationCheck());

  const summary = enforceCertificationResults({ checks });
  console.log(
    JSON.stringify(
      {
        ...summary,
        harness,
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

