import type {
  CharacterSimulationConflict,
  CharacterSimulationDriftSummary,
  CharacterSimulationReadinessImpact,
  CharacterSimulationReadinessImpactLevel,
} from "@/lib/domain/character-simulation-workbench";

export function buildCharacterSimulationDriftSummary(input: {
  conflicts: CharacterSimulationConflict[];
  migrationRequired: boolean;
  authorBundleRowExists: boolean;
  hasAuthorPayload: boolean;
}): CharacterSimulationDriftSummary {
  const unresolved = input.conflicts.filter((c) => !c.acceptedByOperator);
  const blocking = unresolved.filter((c) => c.blocksGenerationReadiness);
  const advisory = unresolved.filter((c) => c.severity === "advisory");
  const warnings = unresolved.filter((c) => c.severity === "warning");
  const acceptedAdvisory = input.conflicts.filter((c) => c.acceptedByOperator && c.severity === "advisory").length;

  const notes: string[] = [];
  if (input.migrationRequired) {
    notes.push("Database migration for CharacterSimulationAuthorBundle / audit tables is not applied — persistence actions will fail until migrate deploy.");
  }
  if (!input.authorBundleRowExists && input.hasAuthorPayload) {
    notes.push("Inconsistent state: author payload reported without bundle row.");
  }
  if (!input.hasAuthorPayload && !input.migrationRequired) {
    notes.push("No author-owned simulation JSON — deterministic seed remains primary truth.");
  }

  return {
    unresolvedContradictionCount: unresolved.length,
    advisoryContradictionCount: advisory.length,
    blockingContradictionCount: blocking.length,
    acceptedAdvisoryCount: acceptedAdvisory,
    migrationRequired: input.migrationRequired,
    authorBundleMissing: !input.authorBundleRowExists,
    notes,
  };
}

export function deriveCharacterSimulationReadinessImpact(input: {
  conflicts: CharacterSimulationConflict[];
  validationOk: boolean;
  migrationRequired: boolean;
}): CharacterSimulationReadinessImpact {
  const reasons: string[] = [];
  const remediation: string[] = [];

  if (input.migrationRequired) {
    reasons.push("Persistence layer incomplete for simulation bundle metadata / audit.");
    remediation.push("Run prisma migrate deploy on this environment, then reload the workbench.");
  }

  if (!input.validationOk) {
    reasons.push("Author mind/voice payload failed validation.");
    remediation.push("Fix validation errors in guided forms before saving.");
  }

  const blocking = input.conflicts.filter((c) => c.blocksGenerationReadiness && !c.acceptedByOperator);
  if (blocking.length) {
    reasons.push(`${blocking.length} blocking simulation contradiction(s) remain unresolved.`);
    remediation.push(...blocking.map((c) => c.recommendedRemediation));
  }

  const heavyWarnings = input.conflicts.filter(
    (c) => c.severity === "warning" && !c.acceptedByOperator && !c.blocksGenerationReadiness
  );
  if (heavyWarnings.length && !blocking.length) {
    reasons.push(`${heavyWarnings.length} warning-level drift signal(s) between author and seed.`);
    remediation.push("Review comparison panel; accept advisory conflicts only when intentional.");
  }

  const advisoryOnly = input.conflicts.filter(
    (c) => c.severity === "advisory" && !c.acceptedByOperator && !c.blocksGenerationReadiness
  );

  let level: CharacterSimulationReadinessImpactLevel = "ready";
  if (blocking.length || !input.validationOk) {
    level = "blocked";
  } else if (heavyWarnings.length) {
    level = "downgrade_risk";
  } else if (advisoryOnly.length || reasons.some((r) => r.includes("incomplete"))) {
    level = "advisory_warning";
  }

  return { level, reasons, remediation };
}

export function readinessImpactToFlags(impact: CharacterSimulationReadinessImpact): string[] {
  const flags: string[] = [`character_simulation_workbench:${impact.level}`];
  return flags;
}
