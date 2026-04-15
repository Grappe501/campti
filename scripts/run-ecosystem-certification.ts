/**
 * Phase 6 / Chunk 9 — final ecosystem certification run.
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
  readinessDecision: { decision: "READY" | "NOT READY"; trueBlockers: string[]; nonBlockingFollowUps: string[] };
}): string {
  const lines: string[] = [];
  lines.push("# Final Ecosystem Certification Report (Phase 6)");
  lines.push("");
  lines.push("## Activity Summary");
  lines.push("");
  lines.push(
    "Phase 6 ecosystem certification executed multi-book architecture, reader identity/account isolation, library/discovery integrity, bounded cross-story continuity, concurrent multi-session safety, author multi-book workflow governance, release version controls, and platform-scale verification."
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
  lines.push("- `docs/build/final-ecosystem-certification-report.md`");
  lines.push("- `reports/final-ecosystem-script-execution-matrix.json`");
  lines.push("- `reports/final-ecosystem-subsystem-scorecard.json`");
  lines.push("- `reports/final-ecosystem-risk-map.json`");
  lines.push("- `reports/final-ecosystem-readiness-decision.json`");
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
    "npm run verify:multi-book-architecture",
    "npm run verify:reader-identity",
    "npm run verify:library-system",
    "npm run verify:cross-story-continuity",
    "npm run verify:multi-session",
    "npm run verify:author-workflow",
    "npm run verify:release-governance",
    "npm run verify:multi-book",
    "npm run verify:identity-isolation",
    "npm run verify:library-integrity",
    "npm run verify:session-isolation",
    "npm run verify:versioning-integrity",
    "npm run verify:platform-scale",
  ];

  const matrix = matrixCommands.map(runCommand);
  const failures = matrix.filter((entry) => entry.status === "fail");
  const decision: "READY" | "NOT READY" = failures.length === 0 ? "READY" : "NOT READY";

  const scorecard = {
    contractVersion: "1",
    scope: "phase6_ecosystem_scale_layer",
    evaluatedAtIso: executedAtIso,
    subsystems: [
      {
        subsystem: "multi_book_architecture",
        status: failures.some((f) => f.command.includes("verify:multi-book-architecture")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "reader_identity_isolation",
        status: failures.some((f) => f.command.includes("verify:reader-identity")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "library_discovery",
        status: failures.some((f) => f.command.includes("verify:library-system")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "cross_story_continuity_bounded",
        status: failures.some((f) => f.command.includes("verify:cross-story-continuity"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "multi_session_scaling",
        status: failures.some((f) => f.command.includes("verify:multi-session")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "author_workflow_multi_book",
        status: failures.some((f) => f.command.includes("verify:author-workflow")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "release_governance",
        status: failures.some((f) => f.command.includes("verify:release-governance")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "platform_scale_verification",
        status: failures.some((f) => f.command.includes("verify:platform-scale")) ? "blocked" : "acceptable",
      },
    ],
  };

  const riskMap = {
    contractVersion: "1",
    scope: "phase6_ecosystem_scale_layer",
    evaluatedAtIso: executedAtIso,
    risks: [
      {
        riskId: "cross_story_contamination",
        severity: failures.some((f) => f.command.includes("multi-book")) ? "high" : "low",
      },
      {
        riskId: "identity_leakage",
        severity: failures.some((f) => f.command.includes("identity")) ? "high" : "low",
      },
      {
        riskId: "session_bleed",
        severity: failures.some((f) => f.command.includes("session")) ? "high" : "low",
      },
      {
        riskId: "draft_leak_to_reader",
        severity: failures.some((f) => f.command.includes("release-governance")) ? "high" : "low",
      },
    ],
  };

  const readinessDecision = {
    contractVersion: "1",
    scope: "phase6_ecosystem_scale_layer",
    evaluatedAtIso: executedAtIso,
    decision,
    trueBlockers: failures.map((failure) => failure.command),
    nonBlockingFollowUps:
      failures.length === 0
        ? [
            "Expand concurrency stress fixtures to higher cardinality multi-user fan-out.",
            "Add production observability probes for cross-story recommendation guardrails.",
          ]
        : [],
  };

  const executionMatrixArtifact = {
    contractVersion: "1",
    certificationScope: "phase6_chunk9_ecosystem_certification_run",
    executedAtIso,
    commands: matrix,
    summary: {
      total: matrix.length,
      passed: matrix.filter((entry) => entry.status === "pass").length,
      failed: failures.length,
      skipped: 0,
    },
  };

  writeJsonArtifact("reports/final-ecosystem-script-execution-matrix.json", executionMatrixArtifact);
  writeJsonArtifact("reports/final-ecosystem-subsystem-scorecard.json", scorecard);
  writeJsonArtifact("reports/final-ecosystem-risk-map.json", riskMap);
  writeJsonArtifact("reports/final-ecosystem-readiness-decision.json", readinessDecision);

  const report = toMarkdownReport({
    executedAtIso,
    matrix,
    scorecard,
    riskMap,
    readinessDecision,
  });
  writeTextArtifact("docs/build/final-ecosystem-certification-report.md", report);

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
