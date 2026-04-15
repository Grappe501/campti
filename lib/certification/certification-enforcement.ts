import type {
  CertificationCheckResult,
  CertificationCommandResult,
  CertificationSummary,
} from "@/lib/certification/certification-types";
import { getCertificationMode, isStrictCertificationMode } from "@/lib/certification/certification-mode";

const DEFAULT_CRITICAL_SKIP_PATTERNS = [
  /p2021/i,
  /does not exist/i,
  /missing table/i,
  /unapplied migration/i,
  /migration drift/i,
  /schema not fully migrated/i,
];

function hasSkippedFlag(details: Record<string, unknown> | undefined): boolean {
  return details?.skipped === true;
}

function extractErrorText(details: Record<string, unknown> | undefined): string {
  const raw = details?.error;
  return typeof raw === "string" ? raw : "";
}

function isCriticalCheck(check: CertificationCheckResult): boolean {
  return (check.severity ?? "critical") === "critical";
}

function skippedCriticalCheckShouldFail(check: CertificationCheckResult): boolean {
  if (!hasSkippedFlag(check.details)) return false;
  if (!isCriticalCheck(check)) return false;
  const errorText = extractErrorText(check.details);
  return (
    errorText.length === 0 ||
    DEFAULT_CRITICAL_SKIP_PATTERNS.some((pattern) => pattern.test(errorText))
  );
}

function failedCriticalCheckMessage(check: CertificationCheckResult): string | null {
  if (check.ok) {
    if (isStrictCertificationMode() && skippedCriticalCheckShouldFail(check)) {
      return `Critical check '${check.name}' was skipped in strict certification mode.`;
    }
    return null;
  }
  return `Critical check '${check.name}' failed.`;
}

function failedCommandMessage(command: CertificationCommandResult): string | null {
  if (command.ok) return null;
  return `Required command '${command.command}' failed.`;
}

export function enforceCertificationResults(args: {
  checks: CertificationCheckResult[];
  commandResults?: CertificationCommandResult[];
}): CertificationSummary {
  const mode = getCertificationMode();
  const failures: string[] = [];

  for (const check of args.checks) {
    const message = failedCriticalCheckMessage(check);
    if (message) failures.push(message);
  }

  for (const command of args.commandResults ?? []) {
    const message = failedCommandMessage(command);
    if (message) failures.push(message);
  }

  return {
    ok: failures.length === 0,
    mode,
    checks: args.checks,
    commandResults: args.commandResults,
    failures,
  };
}
