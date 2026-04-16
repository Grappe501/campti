/**
 * Phase 4 / Chunk 9 — final production certification run.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  RUNTIME_ID_REPORT_CERTIFICATION,
  assertRuntimeCanGateReadiness,
  createRuntimeAuthorityStamp,
  getDemoSafetyWarningBanner,
} from "@/lib/services/runtime-authority-registry-service";

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
  writeFileSync(targetPath, `${JSON.stringify(withAuthority(payload), null, 2)}\n`, "utf8");
}

function writeTextArtifact(relativePath: string, contents: string): void {
  const targetPath = path.resolve(process.cwd(), relativePath);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${contents}\n`, "utf8");
}

const runtimeAuthority = createRuntimeAuthorityStamp(RUNTIME_ID_REPORT_CERTIFICATION);
if (runtimeAuthority.requiresNonCanonicalDemoWarningBanner) {
  console.warn(getDemoSafetyWarningBanner(RUNTIME_ID_REPORT_CERTIFICATION));
}

function withAuthority(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      payload,
      runtimeAuthority,
    };
  }
  return {
    ...(payload as Record<string, unknown>),
    runtimeAuthority,
  };
}

function toMarkdownReport(input: {
  executedAtIso: string;
  matrix: CommandExecution[];
  scorecard: unknown;
  riskMap: unknown;
  readinessDecision: { decision: "READY" | "NOT READY"; trueBlockers: string[]; nonBlockingFollowUps: string[] };
}): string {
  const lines: string[] = [];
  lines.push("# Final Production Certification Report (Phase 4)");
  lines.push("");
  lines.push("## Activity Summary");
  lines.push("");
  lines.push(
    "Phase 4 production-layer certification executed across book program modeling, chapter assembly, scene sequencing, bounded author steering, drafting/revision lineage, production branch governance, and manuscript coherence."
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
  lines.push("- `docs/build/final-production-certification-report.md`");
  lines.push("- `reports/final-production-script-execution-matrix.json`");
  lines.push("- `reports/final-production-subsystem-scorecard.json`");
  lines.push("- `reports/final-production-risk-map.json`");
  lines.push("- `reports/final-production-readiness-decision.json`");
  lines.push("");
  lines.push(`Generated at: \`${input.executedAtIso}\``);
  return lines.join("\n");
}

void (async () => {
  assertRuntimeCanGateReadiness(RUNTIME_ID_REPORT_CERTIFICATION);
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
    "npm run verify:book-program",
    "npm run verify:chapter-assembly",
    "npm run verify:scene-sequencing",
    "npm run verify:author-steering",
    "npm run verify:drafting-revision",
    "npm run verify:production-branching",
    "npm run verify:manuscript-coherence",
    "npm run verify:production-layer",
  ];

  const matrix = matrixCommands.map(runCommand);
  const failures = matrix.filter((entry) => entry.status === "fail");
  const decision: "READY" | "NOT READY" = failures.length === 0 ? "READY" : "NOT READY";

  const scorecard = {
    contractVersion: "1",
    scope: "phase4_narrative_production_layer",
    evaluatedAtIso: executedAtIso,
    subsystems: [
      {
        subsystem: "book_program",
        status: failures.some((f) => f.command.includes("verify:book-program")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "chapter_assembly",
        status: failures.some((f) => f.command.includes("verify:chapter-assembly")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "scene_sequencing",
        status: failures.some((f) => f.command.includes("verify:scene-sequencing")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "author_steering",
        status: failures.some((f) => f.command.includes("verify:author-steering")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "drafting_revision",
        status: failures.some((f) => f.command.includes("verify:drafting-revision")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "production_branching",
        status: failures.some((f) => f.command.includes("verify:production-branching")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "manuscript_coherence",
        status: failures.some((f) => f.command.includes("verify:manuscript-coherence")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "production_verification_surface",
        status: failures.some((f) => f.command.includes("verify:production-layer")) ? "blocked" : "acceptable",
      },
    ],
  };

  const riskMap = {
    contractVersion: "1",
    scope: "phase4_narrative_production_layer",
    evaluatedAtIso: executedAtIso,
    risks: [
      {
        riskId: "chapter_brittleness",
        severity: failures.some((f) => f.command.includes("verify:chapter-assembly")) ? "high" : "low",
      },
      {
        riskId: "pressure_drift",
        severity: failures.some((f) => f.command.includes("verify:author-steering")) ? "high" : "low",
      },
      {
        riskId: "branch_explosion",
        severity: failures.some((f) => f.command.includes("verify:production-branching")) ? "high" : "low",
      },
      {
        riskId: "manuscript_contradiction",
        severity: failures.some((f) => f.command.includes("verify:manuscript-coherence")) ? "high" : "low",
      },
    ],
  };

  const readinessDecision = {
    contractVersion: "1",
    scope: "phase4_narrative_production_layer",
    evaluatedAtIso: executedAtIso,
    decision,
    trueBlockers: failures.map((failure) => failure.command),
    nonBlockingFollowUps:
      failures.length === 0
        ? [
            "Expand scenario fixtures for chapter-transition burden edge cases.",
            "Stress-test author steering weight drift under larger command bundles.",
          ]
        : [],
  };

  const executionMatrixArtifact = {
    contractVersion: "1",
    certificationScope: "phase4_chunk9_production_certification_run",
    executedAtIso,
    commands: matrix,
    summary: {
      total: matrix.length,
      passed: matrix.filter((entry) => entry.status === "pass").length,
      failed: failures.length,
      skipped: 0,
    },
    runtimeAuthority,
  };

  writeJsonArtifact("reports/final-production-script-execution-matrix.json", executionMatrixArtifact);
  writeJsonArtifact("reports/final-production-subsystem-scorecard.json", scorecard);
  writeJsonArtifact("reports/final-production-risk-map.json", riskMap);
  writeJsonArtifact("reports/final-production-readiness-decision.json", readinessDecision);

  const report = toMarkdownReport({
    executedAtIso,
    matrix,
    scorecard,
    riskMap,
    readinessDecision,
  });
  writeTextArtifact("docs/build/final-production-certification-report.md", report);

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
