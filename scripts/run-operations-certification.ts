/**
 * Phase 7 / Chunk 9 — final live operations certification run.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type CommandExecution = {
  command: string;
  status: "pass" | "fail";
  exitCode: number;
  requiredByChunk9: boolean;
  error?: string;
};

function runCommand(command: string): CommandExecution {
  try {
    execSync(command, { stdio: "pipe", encoding: "utf8" });
    return {
      command,
      status: "pass",
      exitCode: 0,
      requiredByChunk9: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      command,
      status: "fail",
      exitCode: 1,
      requiredByChunk9: true,
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
}): string {
  const lines: string[] = [];
  lines.push("# Final Operations Certification Report (Phase 7)");
  lines.push("");
  lines.push("## Activity Summary");
  lines.push("");
  lines.push(
    "Phase 7 live operations certification executed telemetry modeling, reader analytics, story health monitoring, experimentation governance, explainable recommendations, live moderation/safety operations, operator-author surfaces, and umbrella operations-layer verification."
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
  lines.push("- `docs/build/final-operations-certification-report.md`");
  lines.push("- `reports/final-operations-script-execution-matrix.json`");
  lines.push("- `reports/final-operations-subsystem-scorecard.json`");
  lines.push("- `reports/final-operations-risk-map.json`");
  lines.push("- `reports/final-operations-readiness-decision.json`");
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
    "npm run verify:telemetry-model",
    "npm run verify:reader-analytics",
    "npm run verify:story-health",
    "npm run verify:experimentation",
    "npm run verify:recommendation-layer",
    "npm run verify:live-safety",
    "npm run verify:operator-surfaces",
    "npm run verify:operations-layer",
  ];

  const matrix = matrixCommands.map(runCommand);
  const failures = matrix.filter((entry) => entry.status === "fail");
  const decision: "READY" | "NOT READY" = failures.length === 0 ? "READY" : "NOT READY";

  const scorecard = {
    contractVersion: "1",
    scope: "phase7_live_operations_intelligence_layer",
    evaluatedAtIso: executedAtIso,
    subsystems: [
      {
        subsystem: "operational_telemetry_model",
        status: failures.some((f) => f.command.includes("verify:telemetry-model")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "reader_behavior_analytics",
        status: failures.some((f) => f.command.includes("verify:reader-analytics")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "story_health_monitoring",
        status: failures.some((f) => f.command.includes("verify:story-health")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "experimentation_governance",
        status: failures.some((f) => f.command.includes("verify:experimentation")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "recommendation_intelligence_layer",
        status: failures.some((f) => f.command.includes("verify:recommendation-layer"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "live_safety_moderation_ops",
        status: failures.some((f) => f.command.includes("verify:live-safety")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "operator_author_live_surfaces",
        status: failures.some((f) => f.command.includes("verify:operator-surfaces")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "operations_verification_surface",
        status: failures.some((f) => f.command.includes("verify:operations-layer")) ? "blocked" : "acceptable",
      },
    ],
  };

  const riskMap = {
    contractVersion: "1",
    scope: "phase7_live_operations_intelligence_layer",
    evaluatedAtIso: executedAtIso,
    risks: [
      {
        riskId: "narrative_truth_corruption",
        severity:
          failures.some((f) => f.command.includes("verify:telemetry-model")) ||
          failures.some((f) => f.command.includes("verify:experimentation")) ||
          failures.some((f) => f.command.includes("verify:recommendation-layer"))
            ? "high"
            : "low",
      },
      {
        riskId: "observability_blind_spots",
        severity: failures.some((f) => f.command.includes("verify:operations-layer")) ? "high" : "low",
      },
      {
        riskId: "live_moderation_backlog",
        severity: failures.some((f) => f.command.includes("verify:live-safety")) ? "high" : "low",
      },
      {
        riskId: "operator_visibility_gaps",
        severity: failures.some((f) => f.command.includes("verify:operator-surfaces")) ? "high" : "low",
      },
    ],
  };

  const readinessDecision = {
    contractVersion: "1",
    scope: "phase7_live_operations_intelligence_layer",
    evaluatedAtIso: executedAtIso,
    decision,
    trueBlockers: failures.map((failure) => failure.command),
    nonBlockingFollowUps:
      failures.length === 0
        ? [
            "Add production canary dashboards for telemetry cardinality drift alerts.",
            "Expand operator drill simulations for moderation escalation surge scenarios.",
          ]
        : [],
  };

  const executionMatrixArtifact = {
    contractVersion: "1",
    certificationScope: "phase7_chunk9_live_operations_certification_run",
    executedAtIso,
    commands: matrix,
    summary: {
      total: matrix.length,
      passed: matrix.filter((entry) => entry.status === "pass").length,
      failed: failures.length,
      skipped: 0,
    },
  };

  writeJsonArtifact("reports/final-operations-script-execution-matrix.json", executionMatrixArtifact);
  writeJsonArtifact("reports/final-operations-subsystem-scorecard.json", scorecard);
  writeJsonArtifact("reports/final-operations-risk-map.json", riskMap);
  writeJsonArtifact("reports/final-operations-readiness-decision.json", readinessDecision);

  const report = toMarkdownReport({
    executedAtIso,
    matrix,
    scorecard,
    riskMap,
    readinessDecision,
  });
  writeTextArtifact("docs/build/final-operations-certification-report.md", report);

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
