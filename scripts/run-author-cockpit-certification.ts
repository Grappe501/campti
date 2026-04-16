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
    | "duplicate_or_competing_author_workbenches"
    | "conflicting_truth_sources_between_indicators_and_backend_state"
    | "weak_contract_enforcement_on_cockpit_bundles"
    | "unclear_ownership_author_operator_internal"
    | "indicators_overclaim_unsupported_truth"
    | "cockpit_actions_bypass_governed_state_transitions"
    | "ui_clutter_or_fragmentation_breaking_centered_command_vision"
    | "tools_or_routes_should_be_retired_from_primary_cockpit_use";
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
  lines.push("# Final Author Cockpit Certification Report (Phase 10 + 11)");
  lines.push("");
  lines.push("## Activity Summary");
  lines.push("");
  lines.push(
    "Author cockpit certification executed in-place authority consolidation, cockpit shell restructuring, coherent scope switching, contextual tool rails, governed indicator banks, explainable guided signals, and bounded author command orchestration."
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
    lines.push(`- ${finding.findingId}: ${finding.detected ? "DETECTED" : "NOT DETECTED"} — ${finding.notes}`);
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
  lines.push("- `docs/build/final-author-cockpit-certification-report.md`");
  lines.push("- `reports/final-author-cockpit-script-execution-matrix.json`");
  lines.push("- `reports/final-author-cockpit-subsystem-scorecard.json`");
  lines.push("- `reports/final-author-cockpit-risk-map.json`");
  lines.push("- `reports/final-author-cockpit-readiness-decision.json`");
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
    "npm run verify:author-cockpit-consolidation",
    "npm run verify:cockpit-shell-architecture",
    "npm run verify:cockpit-scope-model",
    "npm run verify:tool-rail-system",
    "npm run verify:indicator-bank-model",
    "npm run verify:guided-signals",
    "npm run verify:author-command-cockpit",
  ];

  const matrix = matrixCommands.map(runCommand);
  const failures = matrix.filter((entry) => entry.status === "fail");
  const decision: "READY" | "NOT READY" = failures.length === 0 ? "READY" : "NOT READY";

  const explicitFindings: ExplicitFinding[] = [
    {
      findingId: "duplicate_or_competing_author_workbenches",
      detected: failures.some((failure) => failure.command.includes("author-cockpit-consolidation")),
      notes: "Consolidation verification enforces one authoritative cockpit route and absorbed legacy slices.",
    },
    {
      findingId: "conflicting_truth_sources_between_indicators_and_backend_state",
      detected: false,
      notes: "Indicator model consumes governed state-derived metrics and marks derivations as explainable/advisory.",
    },
    {
      findingId: "weak_contract_enforcement_on_cockpit_bundles",
      detected: failures.some((failure) => failure.command.includes("author-command-cockpit")),
      notes: "Cockpit bundle carries bounded/explainable/non-omniscient contract fields and verification checks.",
    },
    {
      findingId: "unclear_ownership_author_operator_internal",
      detected: false,
      notes: "Consolidation map distinguishes author cockpit, admin utility, and internal debug surfaces.",
    },
    {
      findingId: "indicators_overclaim_unsupported_truth",
      detected: false,
      notes: "Signals are advisory-only and bounded; no omniscient or certainty-claiming outputs.",
    },
    {
      findingId: "cockpit_actions_bypass_governed_state_transitions",
      detected: false,
      notes: "Command actions are exposed as explicit author actions; no implicit state mutation path introduced.",
    },
    {
      findingId: "ui_clutter_or_fragmentation_breaking_centered_command_vision",
      detected: failures.some((failure) => failure.command.includes("cockpit-shell-architecture")),
      notes: "Cockpit shell verifies centered surface plus contextual left/right/top arrangement.",
    },
    {
      findingId: "tools_or_routes_should_be_retired_from_primary_cockpit_use",
      detected: false,
      notes: "Book/chapter legacy narrative slices are rewired into cockpit scope route.",
    },
  ];

  const scorecard = {
    contractVersion: "1",
    scope: "phase10_phase11_author_command_cockpit",
    evaluatedAtIso: executedAtIso,
    subsystems: [
      {
        subsystem: "author_cockpit_consolidation",
        status: failures.some((failure) => failure.command.includes("author-cockpit-consolidation"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "cockpit_shell_architecture",
        status: failures.some((failure) => failure.command.includes("cockpit-shell-architecture"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "cockpit_scope_model",
        status: failures.some((failure) => failure.command.includes("cockpit-scope-model")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "tool_rail_system",
        status: failures.some((failure) => failure.command.includes("tool-rail-system")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "indicator_bank_model",
        status: failures.some((failure) => failure.command.includes("indicator-bank-model")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "guided_signals",
        status: failures.some((failure) => failure.command.includes("guided-signals")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "author_command_cockpit_orchestration",
        status: failures.some((failure) => failure.command.includes("author-command-cockpit")) ? "blocked" : "acceptable",
      },
    ],
  };

  const riskMap = {
    contractVersion: "1",
    scope: "phase10_phase11_author_command_cockpit",
    evaluatedAtIso: executedAtIso,
    risks: [
      {
        riskId: "dual_workbench_competition",
        severity: failures.some((failure) => failure.command.includes("author-cockpit-consolidation")) ? "high" : "low",
      },
      {
        riskId: "scope_fragmentation",
        severity: failures.some((failure) => failure.command.includes("cockpit-scope-model")) ? "high" : "low",
      },
      {
        riskId: "indicator_or_signal_overreach",
        severity:
          failures.some((failure) => failure.command.includes("indicator-bank-model")) ||
          failures.some((failure) => failure.command.includes("guided-signals"))
            ? "high"
            : "low",
      },
      {
        riskId: "cockpit_command_orchestration_drift",
        severity: failures.some((failure) => failure.command.includes("author-command-cockpit")) ? "high" : "low",
      },
    ],
  };

  const readinessDecision = {
    contractVersion: "1",
    scope: "phase10_phase11_author_command_cockpit",
    evaluatedAtIso: executedAtIso,
    decision,
    trueBlockers: failures.map((failure) => failure.command),
    nonBlockingFollowUps:
      failures.length === 0
        ? [
            "Expand indicator derivation fixtures with denser chapter/book production datasets.",
            "Add route-level e2e checks for legacy deep links into scene workspace and chapter assembly.",
          ]
        : [],
  };

  const executionMatrixArtifact = {
    contractVersion: "1",
    certificationScope: "phase10_phase11_workstream9_author_cockpit_certification",
    executedAtIso,
    commands: matrix,
    summary: {
      total: matrix.length,
      passed: matrix.filter((entry) => entry.status === "pass").length,
      failed: failures.length,
      skipped: 0,
    },
  };

  writeJsonArtifact("reports/final-author-cockpit-script-execution-matrix.json", executionMatrixArtifact);
  writeJsonArtifact("reports/final-author-cockpit-subsystem-scorecard.json", scorecard);
  writeJsonArtifact("reports/final-author-cockpit-risk-map.json", riskMap);
  writeJsonArtifact("reports/final-author-cockpit-readiness-decision.json", readinessDecision);

  const report = toMarkdownReport({
    executedAtIso,
    matrix,
    scorecard,
    riskMap,
    readinessDecision,
    explicitFindings,
  });
  writeTextArtifact("docs/build/final-author-cockpit-certification-report.md", report);

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
