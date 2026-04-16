import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type CommandExecution = {
  command: string;
  status: "pass" | "fail";
  exitCode: number;
  requiredBySetA: boolean;
  error?: string;
};

function runCommand(command: string): CommandExecution {
  try {
    execSync(command, { stdio: "pipe", encoding: "utf8" });
    return {
      command,
      status: "pass",
      exitCode: 0,
      requiredBySetA: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      command,
      status: "fail",
      exitCode: 1,
      requiredBySetA: true,
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
  lines.push("# Final Creator Publishing Certification Report (Phase 8)");
  lines.push("");
  lines.push("## Activity Summary");
  lines.push("");
  lines.push(
    "Phase 8 certification executed creator/editor role safety, workspace/project isolation, bounded editorial approvals, package assembly governance, asset/metadata controls, multi-creator ownership boundaries, and public publication leakage prevention."
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
  lines.push("- `docs/build/final-creator-publishing-certification-report.md`");
  lines.push("- `reports/final-creator-publishing-script-execution-matrix.json`");
  lines.push("- `reports/final-creator-publishing-subsystem-scorecard.json`");
  lines.push("- `reports/final-creator-publishing-risk-map.json`");
  lines.push("- `reports/final-creator-publishing-readiness-decision.json`");
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
    "npm run verify:creator-identity-roles",
    "npm run verify:workspace-project-model",
    "npm run verify:editorial-workflow",
    "npm run verify:publishing-package",
    "npm run verify:asset-metadata-governance",
    "npm run verify:multi-creator-safety",
    "npm run verify:public-publishing-surfaces",
    "npm run verify:creator-publishing-layer",
  ];

  const matrix = matrixCommands.map(runCommand);
  const failures = matrix.filter((entry) => entry.status === "fail");
  const decision: "READY" | "NOT READY" = failures.length === 0 ? "READY" : "NOT READY";

  const scorecard = {
    contractVersion: "1",
    scope: "phase8_creator_ecosystem_publishing_layer",
    evaluatedAtIso: executedAtIso,
    subsystems: [
      {
        subsystem: "creator_identity_roles",
        status: failures.some((f) => f.command.includes("verify:creator-identity-roles")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "workspace_project_isolation",
        status: failures.some((f) => f.command.includes("verify:workspace-project-model")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "editorial_workflow_approvals",
        status: failures.some((f) => f.command.includes("verify:editorial-workflow")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "publishing_package_governance",
        status: failures.some((f) => f.command.includes("verify:publishing-package")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "asset_metadata_governance",
        status: failures.some((f) => f.command.includes("verify:asset-metadata-governance")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "multi_creator_safety",
        status: failures.some((f) => f.command.includes("verify:multi-creator-safety")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "public_publishing_surfaces",
        status: failures.some((f) => f.command.includes("verify:public-publishing-surfaces")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "creator_publishing_verification_surface",
        status: failures.some((f) => f.command.includes("verify:creator-publishing-layer")) ? "blocked" : "acceptable",
      },
    ],
  };

  const riskMap = {
    contractVersion: "1",
    scope: "phase8_creator_ecosystem_publishing_layer",
    evaluatedAtIso: executedAtIso,
    risks: [
      {
        riskId: "role_leakage",
        severity: failures.some((f) => f.command.includes("creator-identity")) ? "high" : "low",
      },
      {
        riskId: "cross_workspace_contamination",
        severity: failures.some((f) => f.command.includes("workspace-project-model")) ? "high" : "low",
      },
      {
        riskId: "review_gate_bypass",
        severity: failures.some((f) => f.command.includes("editorial-workflow")) ? "high" : "low",
      },
      {
        riskId: "draft_or_candidate_leakage",
        severity: failures.some((f) => f.command.includes("public-publishing-surfaces")) ? "high" : "low",
      },
    ],
  };

  const readinessDecision = {
    contractVersion: "1",
    scope: "phase8_creator_ecosystem_publishing_layer",
    evaluatedAtIso: executedAtIso,
    decision,
    trueBlockers: failures.map((failure) => failure.command),
    nonBlockingFollowUps:
      failures.length === 0
        ? [
            "Expand reviewer/publisher identity concurrency fixtures for larger teams.",
            "Add package governance stress tests for high-volume asset and metadata references.",
          ]
        : [],
  };

  const executionMatrixArtifact = {
    contractVersion: "1",
    certificationScope: "phase8_workstream9_creator_publishing_certification",
    executedAtIso,
    commands: matrix,
    summary: {
      total: matrix.length,
      passed: matrix.filter((entry) => entry.status === "pass").length,
      failed: failures.length,
      skipped: 0,
    },
  };

  writeJsonArtifact("reports/final-creator-publishing-script-execution-matrix.json", executionMatrixArtifact);
  writeJsonArtifact("reports/final-creator-publishing-subsystem-scorecard.json", scorecard);
  writeJsonArtifact("reports/final-creator-publishing-risk-map.json", riskMap);
  writeJsonArtifact("reports/final-creator-publishing-readiness-decision.json", readinessDecision);

  const report = toMarkdownReport({
    executedAtIso,
    matrix,
    scorecard,
    riskMap,
    readinessDecision,
  });
  writeTextArtifact("docs/build/final-creator-publishing-certification-report.md", report);

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
