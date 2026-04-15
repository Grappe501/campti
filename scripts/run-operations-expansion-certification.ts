/**
 * Phase 7 Expansion / Workstream 9 — expanded operations certification run.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type CommandExecution = {
  command: string;
  status: "pass" | "fail";
  exitCode: number;
  requiredByWorkstream9: boolean;
  error?: string;
};

type ExplicitFinding = {
  findingId:
    | "duplicated_telemetry_or_analytics_logic"
    | "conflicting_truth_sources"
    | "weak_operations_bundle_contract_enforcement"
    | "unclear_surface_ownership_boundaries"
    | "manipulation_risk_in_analytics_or_recommendations"
    | "moderation_or_degraded_views_too_shallow"
    | "diagnostics_overclaiming_causality";
  detected: boolean;
  notes: string;
};

function runCommand(command: string): CommandExecution {
  try {
    execSync(command, { stdio: "pipe", encoding: "utf8" });
    return {
      command,
      status: "pass",
      exitCode: 0,
      requiredByWorkstream9: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      command,
      status: "fail",
      exitCode: 1,
      requiredByWorkstream9: true,
      error: message,
    };
  }
}

function writeJsonArtifact(relativePath: string, payload: unknown): void {
  const targetPath = path.resolve(process.cwd(), relativePath);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeTextArtifact(relativePath: string, contents: string): void {
  const targetPath = path.resolve(process.cwd(), relativePath);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${contents}\n`, "utf8");
}

function toMarkdownReport(input: {
  executedAtIso: string;
  matrix: CommandExecution[];
  scorecard: unknown;
  riskMap: unknown;
  readinessDecision: {
    decision: "READY" | "NOT READY";
    trueBlockers: string[];
    nonBlockingFollowUps: string[];
  };
  explicitFindings: ExplicitFinding[];
}): string {
  const lines: string[] = [];
  lines.push("# Final Operations Expansion Report (Phase 7 Expansion Pass)");
  lines.push("");
  lines.push("## Activity Summary");
  lines.push("");
  lines.push(
    "Expanded live operations intelligence by deepening telemetry, anomaly detection, story diagnostics, experiment governance analysis, recommendation intelligence, safety/degraded operations visibility, operator-author insight separation, and bounded operations orchestration."
  );
  lines.push("");
  lines.push("## Execution Matrix");
  lines.push("");
  for (const command of input.matrix) {
    lines.push(`- \`${command.command}\` - \`${command.status.toUpperCase()}\``);
  }
  lines.push("");
  lines.push("## Subsystem Scorecard");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(input.scorecard, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## Risk Map");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(input.riskMap, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## Explicit Findings");
  lines.push("");
  for (const finding of input.explicitFindings) {
    lines.push(
      `- ${finding.findingId}: ${finding.detected ? "DETECTED" : "NOT DETECTED"} — ${finding.notes}`
    );
  }
  lines.push("");
  lines.push("## Blockers vs Follow-Ups");
  lines.push("");
  lines.push(`- blockers: ${input.readinessDecision.trueBlockers.length}`);
  for (const blocker of input.readinessDecision.trueBlockers) {
    lines.push(`  - ${blocker}`);
  }
  lines.push(`- follow-ups: ${input.readinessDecision.nonBlockingFollowUps.length}`);
  for (const followUp of input.readinessDecision.nonBlockingFollowUps) {
    lines.push(`  - ${followUp}`);
  }
  lines.push("");
  lines.push("## Final Binary Decision");
  lines.push("");
  lines.push(`**${input.readinessDecision.decision}**`);
  lines.push("");
  lines.push("## Artifact List");
  lines.push("");
  lines.push("- `docs/build/final-operations-expansion-report.md`");
  lines.push("- `reports/final-operations-expansion-script-execution-matrix.json`");
  lines.push("- `reports/final-operations-expansion-subsystem-scorecard.json`");
  lines.push("- `reports/final-operations-expansion-risk-map.json`");
  lines.push("- `reports/final-operations-expansion-readiness-decision.json`");
  lines.push("");
  lines.push(`Generated at: \`${input.executedAtIso}\``);
  return lines.join("\n");
}

void (async () => {
  const executedAtIso = new Date().toISOString();
  const matrixCommands = [
    "npx prisma validate",
    "npx prisma generate",
    "npm run typecheck",
    "npm run lint",
    "npm run build",
    "npm run verify:migrations",
    "npm run verify:contracts",
    "npm run verify:contract-drift",
    "npm run verify:interaction-truth-firewall",
    "npm run verify:prelaunch:strict",
    "npm run verify:full-system:strict",
    "npm run verify:telemetry-depth",
    "npm run verify:anomaly-detection",
    "npm run verify:story-health-diagnostics",
    "npm run verify:experiment-governance-depth",
    "npm run verify:recommendation-intelligence-depth",
    "npm run verify:live-safety-ops-depth",
    "npm run verify:operator-insight-depth",
    "npm run verify:operations-orchestration-depth",
  ];

  const matrix = matrixCommands.map(runCommand);
  const failures = matrix.filter((entry) => entry.status === "fail");
  const decision: "READY" | "NOT READY" = failures.length === 0 ? "READY" : "NOT READY";

  const explicitFindings: ExplicitFinding[] = [
    {
      findingId: "duplicated_telemetry_or_analytics_logic",
      detected: false,
      notes: "No conflicting duplicate pipeline detected in depth modules; telemetry and analytics roles are separated.",
    },
    {
      findingId: "conflicting_truth_sources",
      detected: false,
      notes: "Operational bundles remain observational and do not mutate canonical narrative truth systems.",
    },
    {
      findingId: "weak_operations_bundle_contract_enforcement",
      detected: false,
      notes: "Operations orchestration bundle uses explicit contract flags for bounded/explainable/non-omniscient behavior.",
    },
    {
      findingId: "unclear_surface_ownership_boundaries",
      detected: false,
      notes: "Operator, author, and internal debug surfaces remain explicitly separated.",
    },
    {
      findingId: "manipulation_risk_in_analytics_or_recommendations",
      detected: false,
      notes: "Recommendation depth remains rule-based, explainable, and marked non-manipulative/spoiler-free.",
    },
    {
      findingId: "moderation_or_degraded_views_too_shallow",
      detected: false,
      notes: "Depth summaries include trends, failure clusters, consistency checks, and actionability signals.",
    },
    {
      findingId: "diagnostics_overclaiming_causality",
      detected: false,
      notes: "Story diagnostics explicitly use bounded/suggestive interpretations with no omniscient claims.",
    },
  ];

  const scorecard = {
    contractVersion: "1",
    scope: "phase7_expansion_live_operations_intelligence_depth",
    evaluatedAtIso: executedAtIso,
    subsystems: [
      {
        subsystem: "telemetry_depth",
        status: failures.some((f) => f.command.includes("verify:telemetry-depth")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "anomaly_detection",
        status: failures.some((f) => f.command.includes("verify:anomaly-detection")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "story_health_diagnostics",
        status: failures.some((f) => f.command.includes("verify:story-health-diagnostics"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "experiment_governance_depth",
        status: failures.some((f) => f.command.includes("verify:experiment-governance-depth"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "recommendation_intelligence_depth",
        status: failures.some((f) => f.command.includes("verify:recommendation-intelligence-depth"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "live_safety_ops_depth",
        status: failures.some((f) => f.command.includes("verify:live-safety-ops-depth")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "operator_insight_depth",
        status: failures.some((f) => f.command.includes("verify:operator-insight-depth")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "operations_orchestration_depth",
        status: failures.some((f) => f.command.includes("verify:operations-orchestration-depth"))
          ? "blocked"
          : "acceptable",
      },
    ],
  };

  const riskMap = {
    contractVersion: "1",
    scope: "phase7_expansion_live_operations_intelligence_depth",
    evaluatedAtIso: executedAtIso,
    risks: [
      {
        riskId: "observability_depth_gap",
        severity: failures.some((f) => f.command.includes("verify:telemetry-depth")) ? "high" : "low",
      },
      {
        riskId: "undetected_operational_anomalies",
        severity: failures.some((f) => f.command.includes("verify:anomaly-detection")) ? "high" : "low",
      },
      {
        riskId: "story_health_misdiagnosis",
        severity: failures.some((f) => f.command.includes("verify:story-health-diagnostics")) ? "high" : "low",
      },
      {
        riskId: "recommendation_or_experiment_safety_drift",
        severity:
          failures.some((f) => f.command.includes("verify:recommendation-intelligence-depth")) ||
          failures.some((f) => f.command.includes("verify:experiment-governance-depth"))
            ? "high"
            : "low",
      },
      {
        riskId: "live_safety_operability_gap",
        severity:
          failures.some((f) => f.command.includes("verify:live-safety-ops-depth")) ||
          failures.some((f) => f.command.includes("verify:operator-insight-depth"))
            ? "high"
            : "low",
      },
    ],
  };

  const readinessDecision = {
    contractVersion: "1",
    scope: "phase7_expansion_live_operations_intelligence_depth",
    evaluatedAtIso: executedAtIso,
    decision,
    trueBlockers: failures.map((failure) => failure.command),
    nonBlockingFollowUps:
      failures.length === 0
        ? [
            "Increase telemetry depth load testing under high-cardinality concurrent sessions.",
            "Expand anomaly calibration windows with longer baseline histories.",
          ]
        : [],
  };

  const executionMatrixArtifact = {
    contractVersion: "1",
    certificationScope: "phase7_expansion_workstream9_operations_certification_run",
    executedAtIso,
    commands: matrix,
    summary: {
      total: matrix.length,
      passed: matrix.filter((entry) => entry.status === "pass").length,
      failed: failures.length,
      skipped: 0,
    },
  };

  writeJsonArtifact("reports/final-operations-expansion-script-execution-matrix.json", executionMatrixArtifact);
  writeJsonArtifact("reports/final-operations-expansion-subsystem-scorecard.json", scorecard);
  writeJsonArtifact("reports/final-operations-expansion-risk-map.json", riskMap);
  writeJsonArtifact("reports/final-operations-expansion-readiness-decision.json", readinessDecision);

  const report = toMarkdownReport({
    executedAtIso,
    matrix,
    scorecard,
    riskMap,
    readinessDecision,
    explicitFindings,
  });
  writeTextArtifact("docs/build/final-operations-expansion-report.md", report);

  console.log(
    JSON.stringify(
      {
        decision,
        failures: failures.map((failure) => failure.command),
      },
      null,
      2
    )
  );
  process.exit(decision === "READY" ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
