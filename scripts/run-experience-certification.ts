/**
 * Phase 5 / Chunk 9 — final reader experience certification run.
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
  lines.push("# Final Experience Certification Report (Phase 5)");
  lines.push("");
  lines.push("## Activity Summary");
  lines.push("");
  lines.push(
    "Phase 5 reader experience certification executed continuity unification, first-class session orchestration, story reentry surfacing, interaction productization, mode consolidation, degraded UX alignment, ownership consolidation, and bounded bundle orchestration."
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
  lines.push("- `docs/build/final-experience-certification-report.md`");
  lines.push("- `reports/final-experience-script-execution-matrix.json`");
  lines.push("- `reports/final-experience-subsystem-scorecard.json`");
  lines.push("- `reports/final-experience-risk-map.json`");
  lines.push("- `reports/final-experience-readiness-decision.json`");
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
    "npm run verify:continuity-unification",
    "npm run verify:reader-session",
    "npm run verify:story-reentry",
    "npm run verify:interaction-ux",
    "npm run verify:reader-modes",
    "npm run verify:degraded-ux",
    "npm run verify:ui-ownership",
    "npm run verify:reader-experience",
  ];

  const matrix = matrixCommands.map(runCommand);
  const failures = matrix.filter((entry) => entry.status === "fail");
  const decision: "READY" | "NOT READY" = failures.length === 0 ? "READY" : "NOT READY";

  const scorecard = {
    contractVersion: "1",
    scope: "phase5_reader_experience",
    evaluatedAtIso: executedAtIso,
    subsystems: [
      {
        subsystem: "continuity_unification",
        status: failures.some((f) => f.command.includes("verify:continuity-unification"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "reader_session_model",
        status: failures.some((f) => f.command.includes("verify:reader-session")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "story_reentry_surface",
        status: failures.some((f) => f.command.includes("verify:story-reentry")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "interaction_productization",
        status: failures.some((f) => f.command.includes("verify:interaction-ux")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "reader_modes",
        status: failures.some((f) => f.command.includes("verify:reader-modes")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "degraded_ux",
        status: failures.some((f) => f.command.includes("verify:degraded-ux")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "ui_ownership",
        status: failures.some((f) => f.command.includes("verify:ui-ownership")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "reader_experience_bundle",
        status: failures.some((f) => f.command.includes("verify:reader-experience"))
          ? "blocked"
          : "acceptable",
      },
    ],
  };

  const riskMap = {
    contractVersion: "1",
    scope: "phase5_reader_experience",
    evaluatedAtIso: executedAtIso,
    risks: [
      {
        riskId: "continuity_authority_split",
        severity: failures.some((f) => f.command.includes("verify:continuity-unification"))
          ? "high"
          : "low",
      },
      {
        riskId: "hidden_reentry_paths",
        severity: failures.some((f) => f.command.includes("verify:story-reentry")) ? "high" : "low",
      },
      {
        riskId: "degraded_state_silence",
        severity: failures.some((f) => f.command.includes("verify:degraded-ux")) ? "high" : "low",
      },
      {
        riskId: "interaction_truth_override",
        severity: failures.some((f) => f.command.includes("verify:interaction-truth-firewall"))
          ? "high"
          : "low",
      },
    ],
  };

  const readinessDecision = {
    contractVersion: "1",
    scope: "phase5_reader_experience",
    evaluatedAtIso: executedAtIso,
    decision,
    trueBlockers: failures.map((failure) => failure.command),
    nonBlockingFollowUps:
      failures.length === 0
        ? [
            "Add end-to-end browser automation for continuity reconciliation and reentry routing.",
            "Expand degraded-policy regression fixtures for entitlement transitions.",
          ]
        : [],
  };

  const executionMatrixArtifact = {
    contractVersion: "1",
    certificationScope: "phase5_chunk9_experience_certification_run",
    executedAtIso,
    commands: matrix,
    summary: {
      total: matrix.length,
      passed: matrix.filter((entry) => entry.status === "pass").length,
      failed: failures.length,
      skipped: 0,
    },
  };

  writeJsonArtifact("reports/final-experience-script-execution-matrix.json", executionMatrixArtifact);
  writeJsonArtifact("reports/final-experience-subsystem-scorecard.json", scorecard);
  writeJsonArtifact("reports/final-experience-risk-map.json", riskMap);
  writeJsonArtifact("reports/final-experience-readiness-decision.json", readinessDecision);

  const report = toMarkdownReport({
    executedAtIso,
    matrix,
    scorecard,
    riskMap,
    readinessDecision,
  });
  writeTextArtifact("docs/build/final-experience-certification-report.md", report);

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
