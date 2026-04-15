import { spawnSync } from "node:child_process";

import { isStrictCertificationMode } from "@/lib/certification/certification-mode";
import type { CertificationCheckResult } from "@/lib/certification/certification-types";

export type MigrationReadinessResult = {
  ok: boolean;
  command: string;
  details: Record<string, unknown>;
};

function hasUnappliedMigrationOutput(combinedOutput: string): boolean {
  return (
    /following migrations have not yet been applied/i.test(combinedOutput) ||
    /following migration\(s\) have not yet been applied/i.test(combinedOutput) ||
    /unapplied migration/i.test(combinedOutput)
  );
}

function toCombinedOutput(proc: ReturnType<typeof spawnSync>): string {
  return `${String(proc.stdout ?? "")}\n${String(proc.stderr ?? "")}`.trim();
}

export function runMigrationReadinessCheckCommand(): MigrationReadinessResult {
  const command = "npx prisma migrate status";
  const proc = spawnSync("npx", ["prisma", "migrate", "status"], {
    encoding: "utf8",
    shell: true,
  });
  const combined = toCombinedOutput(proc);
  const hasUnapplied = hasUnappliedMigrationOutput(combined);

  if (hasUnapplied) {
    return {
      ok: false,
      command,
      details: {
        reason: "Migration drift detected.",
        output: combined,
      },
    };
  }

  if (proc.status === 0) {
    return {
      ok: true,
      command,
      details: {
        output: combined,
      },
    };
  }

  return {
    ok: false,
    command,
    details: {
      reason: "Unable to verify migration readiness.",
      error: combined,
      exitCode: proc.status,
    },
  };
}

/**
 * Certification-facing migration check result used by prelaunch/full certification flows.
 * Strict mode fails on migration drift; default mode records an explicit skip marker.
 */
export function runMigrationReadinessCertificationCheck(): CertificationCheckResult {
  const strict = isStrictCertificationMode();
  const result = runMigrationReadinessCheckCommand();
  if (result.ok) {
    return {
      name: "migration_readiness",
      ok: true,
      severity: "critical",
      details: { command: result.command, driftDetected: false },
    };
  }

  const errorMessage =
    typeof result.details.reason === "string"
      ? result.details.reason
      : "Migration readiness check failed.";

  if (strict) {
    return {
      name: "migration_readiness",
      ok: false,
      severity: "critical",
      details: {
        command: result.command,
        error: errorMessage,
      },
    };
  }

  return {
    name: "migration_readiness",
    ok: true,
    severity: "critical",
    details: {
      command: result.command,
      skipped: true,
      error: errorMessage,
    },
  };
}
