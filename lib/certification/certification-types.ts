import type { CertificationMode } from "@/lib/certification/certification-mode";

export type CertificationSeverity = "info" | "warning" | "critical";

export interface CertificationCheckResult {
  name: string;
  ok: boolean;
  severity?: CertificationSeverity;
  details?: Record<string, unknown>;
}

export interface CertificationCommandResult {
  command: string;
  ok: boolean;
  details?: Record<string, unknown>;
}

export interface CertificationSummary {
  ok: boolean;
  mode: CertificationMode;
  checks: CertificationCheckResult[];
  commandResults?: CertificationCommandResult[];
  failures: string[];
}
