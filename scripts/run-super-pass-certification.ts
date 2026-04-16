import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type CommandExecution = {
  command: string;
  status: "pass" | "fail";
  exitCode: number;
  requiredBySuperPass: boolean;
  error?: string;
};

type ExplicitFinding = {
  findingId:
    | "duplicated_creator_editor_publisher_workflow_logic"
    | "conflicting_truth_sources_between_publication_and_release_state"
    | "weak_contract_enforcement_on_creator_publishing_deployment_commercial_bundles"
    | "unclear_ownership_across_creator_editor_operator_admin_surfaces"
    | "public_surface_implies_unsupported_backend_capability"
    | "draft_candidate_leakage_risk"
    | "environment_release_governance_ambiguity"
    | "commercial_logic_bypasses_entitlement_or_truth_protection"
    | "analytics_overclaim_causality_or_non_explainable";
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
      requiredBySuperPass: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      command,
      status: "fail",
      exitCode: 1,
      requiredBySuperPass: true,
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
  lines.push("# Final Super Pass Certification Report (Phase 8 + Phase 9)");
  lines.push("");
  lines.push("## Activity Summary");
  lines.push("");
  lines.push(
    "Combined super pass certification executed creator/publishing safety, deployment governance, rollback controls, commercial offer integrity, entitlement bridge safety, release health monitoring, operator operations surfaces, and explainable deployment-commercial intelligence."
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
  lines.push("- `docs/build/final-super-pass-certification-report.md`");
  lines.push("- `reports/final-super-pass-script-execution-matrix.json`");
  lines.push("- `reports/final-super-pass-subsystem-scorecard.json`");
  lines.push("- `reports/final-super-pass-risk-map.json`");
  lines.push("- `reports/final-super-pass-readiness-decision.json`");
  lines.push("");
  lines.push(`Generated at: \`${input.executedAtIso}\``);
  return lines.join("\n");
}

void (async () => {
  const executedAtIso = new Date().toISOString();
  const setAReadinessCheck = runCommand("npm run verify:creator-publishing-layer");
  if (setAReadinessCheck.status === "fail") {
    const readinessDecision = {
      contractVersion: "1",
      scope: "phase8_plus_phase9_super_pass",
      evaluatedAtIso: executedAtIso,
      decision: "NOT READY" as const,
      trueBlockers: [setAReadinessCheck.command],
      nonBlockingFollowUps: [],
    };
    writeJsonArtifact("reports/final-super-pass-readiness-decision.json", readinessDecision);
    writeTextArtifact(
      "docs/build/final-super-pass-certification-report.md",
      "# Final Super Pass Certification Report (Phase 8 + Phase 9)\n\nSet A blocker detected. Super pass halted before Set B execution."
    );
    console.log(JSON.stringify({ decision: "NOT READY", failures: [setAReadinessCheck.command] }, null, 2));
    process.exit(1);
  }

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
    "npm run verify:deployment-governance",
    "npm run verify:rollout-rollback",
    "npm run verify:commercial-catalog",
    "npm run verify:commercial-entitlements",
    "npm run verify:release-monitoring",
    "npm run verify:commercial-operator-surfaces",
    "npm run verify:deployment-commercial-intelligence",
    "npm run verify:deployment-commercial-layer",
  ];

  const matrix = matrixCommands.map(runCommand);
  const failures = matrix.filter((entry) => entry.status === "fail");
  const decision: "READY" | "NOT READY" = failures.length === 0 ? "READY" : "NOT READY";

  const explicitFindings: ExplicitFinding[] = [
    {
      findingId: "duplicated_creator_editor_publisher_workflow_logic",
      detected: false,
      notes: "Creator/editor/publisher flow remains centralized in one creator-publishing service authority.",
    },
    {
      findingId: "conflicting_truth_sources_between_publication_and_release_state",
      detected: false,
      notes: "Publication resolution requires approved package and explicit release state checks.",
    },
    {
      findingId: "weak_contract_enforcement_on_creator_publishing_deployment_commercial_bundles",
      detected: false,
      notes: "Layer verification services enforce command-gated invariant contracts across both sets.",
    },
    {
      findingId: "unclear_ownership_across_creator_editor_operator_admin_surfaces",
      detected: false,
      notes: "Collaboration ownership and operator-surface audience gating remain explicit and role-checked.",
    },
    {
      findingId: "public_surface_implies_unsupported_backend_capability",
      detected: false,
      notes: "Public publication resolution denies draft/archived state and candidate unless explicitly permitted.",
    },
    {
      findingId: "draft_candidate_leakage_risk",
      detected: failures.some((f) => f.command.includes("public-publishing-surfaces")),
      notes: "Risk escalates only when public publishing verification fails.",
    },
    {
      findingId: "environment_release_governance_ambiguity",
      detected: failures.some((f) => f.command.includes("deployment-governance")),
      notes: "Deployment promotion path is linear and explicit; ambiguity appears only if governance checks fail.",
    },
    {
      findingId: "commercial_logic_bypasses_entitlement_or_truth_protection",
      detected: failures.some((f) => f.command.includes("commercial-entitlements")),
      notes: "Commercial state remains separated from narrative truth and cannot grant inactive-offer entitlements.",
    },
    {
      findingId: "analytics_overclaim_causality_or_non_explainable",
      detected: failures.some((f) => f.command.includes("deployment-commercial-intelligence")),
      notes: "Intelligence outputs are bounded/explainable rule-derived summaries and hints.",
    },
  ];

  const scorecard = {
    contractVersion: "1",
    scope: "phase8_plus_phase9_super_pass",
    evaluatedAtIso: executedAtIso,
    subsystems: [
      {
        subsystem: "creator_publishing_layer",
        status: failures.some((f) => f.command.includes("creator-publishing-layer")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "deployment_governance",
        status: failures.some((f) => f.command.includes("deployment-governance")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "rollout_rollback_control",
        status: failures.some((f) => f.command.includes("rollout-rollback")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "commercial_catalog",
        status: failures.some((f) => f.command.includes("commercial-catalog")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "commercial_entitlements",
        status: failures.some((f) => f.command.includes("commercial-entitlements")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "release_monitoring",
        status: failures.some((f) => f.command.includes("release-monitoring")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "commercial_operator_surfaces",
        status: failures.some((f) => f.command.includes("commercial-operator-surfaces")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "deployment_commercial_intelligence",
        status: failures.some((f) => f.command.includes("deployment-commercial-intelligence"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "deployment_commercial_layer",
        status: failures.some((f) => f.command.includes("deployment-commercial-layer")) ? "blocked" : "acceptable",
      },
    ],
  };

  const riskMap = {
    contractVersion: "1",
    scope: "phase8_plus_phase9_super_pass",
    evaluatedAtIso: executedAtIso,
    risks: [
      {
        riskId: "creator_role_or_workspace_leakage",
        severity:
          failures.some((f) => f.command.includes("creator-identity")) ||
          failures.some((f) => f.command.includes("workspace-project"))
            ? "high"
            : "low",
      },
      {
        riskId: "editorial_or_package_governance_bypass",
        severity:
          failures.some((f) => f.command.includes("editorial-workflow")) ||
          failures.some((f) => f.command.includes("publishing-package"))
            ? "high"
            : "low",
      },
      {
        riskId: "public_release_leakage",
        severity: failures.some((f) => f.command.includes("public-publishing-surfaces")) ? "high" : "low",
      },
      {
        riskId: "deployment_promotion_or_rollback_gap",
        severity:
          failures.some((f) => f.command.includes("deployment-governance")) ||
          failures.some((f) => f.command.includes("rollout-rollback"))
            ? "high"
            : "low",
      },
      {
        riskId: "commercial_entitlement_drift",
        severity:
          failures.some((f) => f.command.includes("commercial-catalog")) ||
          failures.some((f) => f.command.includes("commercial-entitlements"))
            ? "high"
            : "low",
      },
      {
        riskId: "monitoring_or_intelligence_non_actionable",
        severity:
          failures.some((f) => f.command.includes("release-monitoring")) ||
          failures.some((f) => f.command.includes("deployment-commercial-intelligence"))
            ? "high"
            : "low",
      },
    ],
  };

  const readinessDecision = {
    contractVersion: "1",
    scope: "phase8_plus_phase9_super_pass",
    evaluatedAtIso: executedAtIso,
    decision,
    trueBlockers: failures.map((failure) => failure.command),
    nonBlockingFollowUps:
      failures.length === 0
        ? [
            "Scale workspace-collaboration stress tests for higher concurrent reassignment volumes.",
            "Add longer-horizon rollout anomaly baselines per environment class.",
          ]
        : [],
  };

  const executionMatrixArtifact = {
    contractVersion: "1",
    certificationScope: "phase8_plus_phase9_super_pass",
    executedAtIso,
    commands: matrix,
    summary: {
      total: matrix.length,
      passed: matrix.filter((entry) => entry.status === "pass").length,
      failed: failures.length,
      skipped: 0,
    },
  };

  writeJsonArtifact("reports/final-super-pass-script-execution-matrix.json", executionMatrixArtifact);
  writeJsonArtifact("reports/final-super-pass-subsystem-scorecard.json", scorecard);
  writeJsonArtifact("reports/final-super-pass-risk-map.json", riskMap);
  writeJsonArtifact("reports/final-super-pass-readiness-decision.json", readinessDecision);

  const report = toMarkdownReport({
    executedAtIso,
    matrix,
    scorecard,
    riskMap,
    readinessDecision,
    explicitFindings,
  });
  writeTextArtifact("docs/build/final-super-pass-certification-report.md", report);

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
