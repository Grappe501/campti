import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type CommandExecution = {
  command: string;
  status: "pass" | "fail";
  exitCode: number;
  requiredByInnovationPass: boolean;
  error?: string;
};

type Finding = {
  id:
    | "duplicated_experience_orchestration_logic"
    | "conflicting_truth_sources_experience_vs_continuity"
    | "weak_contract_enforcement_experience_bundle"
    | "unclear_ownership_experience_surfaces"
    | "ux_implies_unsupported_backend_capability"
    | "atmosphere_presence_epistemic_leakage_risk"
    | "reader_features_still_tool_like";
  severity: "low" | "medium" | "high";
  status: "detected" | "not_detected";
  evidence: string;
};

function runCommand(command: string): CommandExecution {
  try {
    execSync(command, { stdio: "pipe", encoding: "utf8" });
    return {
      command,
      status: "pass",
      exitCode: 0,
      requiredByInnovationPass: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      command,
      status: "fail",
      exitCode: 1,
      requiredByInnovationPass: true,
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
  riskMap: { risks: { riskId: string; severity: "low" | "medium" | "high"; source: string }[] };
  readinessDecision: {
    decision: "READY" | "NOT READY";
    trueBlockers: string[];
    nonBlockingFollowUps: string[];
  };
  findings: Finding[];
}): string {
  const lines: string[] = [];
  lines.push("# Final Experience Innovation Report");
  lines.push("");
  lines.push("## Activity Summary");
  lines.push("");
  lines.push(
    "Executed a bounded UX reinvention pass over existing reader surfaces: living entry, layered canvas, mode-lens presentation, voice-first cues, optional resonance overlays, interaction presence framing, transition context, and unified ReaderExperienceBundleV2 orchestration."
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
  for (const finding of input.findings) {
    lines.push(`- ${finding.id}: ${finding.status} (${finding.severity}) - ${finding.evidence}`);
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
  lines.push("Generated artifacts:");
  lines.push("- `docs/build/final-experience-innovation-report.md`");
  lines.push("- `reports/final-experience-innovation-script-execution-matrix.json`");
  lines.push("- `reports/final-experience-innovation-subsystem-scorecard.json`");
  lines.push("- `reports/final-experience-innovation-risk-map.json`");
  lines.push("- `reports/final-experience-innovation-readiness-decision.json`");
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
    "npm run verify:living-entry-experience",
    "npm run verify:experience-canvas",
    "npm run verify:experience-modes-reinvention",
    "npm run verify:voice-presence-upgrade",
    "npm run verify:narrative-overlays",
    "npm run verify:interaction-presence",
    "npm run verify:ambient-transitions",
    "npm run verify:experience-orchestration-v2",
  ];

  const matrix = matrixCommands.map(runCommand);
  const failures = matrix.filter((entry) => entry.status === "fail");
  const decision: "READY" | "NOT READY" = failures.length === 0 ? "READY" : "NOT READY";

  const findings: Finding[] = [
    {
      id: "duplicated_experience_orchestration_logic",
      severity: "medium",
      status: "not_detected",
      evidence:
        "ReaderExperienceBundleV2 fields are assembled in reader-experience-orchestrator-service and consumed by reader surfaces.",
    },
    {
      id: "conflicting_truth_sources_experience_vs_continuity",
      severity: "high",
      status: "not_detected",
      evidence:
        "Continuity remains authority-backed via reader-continuity-service and experience state remains presentation-only.",
    },
    {
      id: "weak_contract_enforcement_experience_bundle",
      severity: "medium",
      status: "not_detected",
      evidence:
        "Bundle has explicit typed sub-states (entry/canvas/mode/voice/overlay/interaction/transition) and targeted verify scripts.",
    },
    {
      id: "unclear_ownership_experience_surfaces",
      severity: "medium",
      status: "not_detected",
      evidence:
        "reader_cockpit and story_reentry actions still enforce reader surface ownership via ui-ownership-service.",
    },
    {
      id: "ux_implies_unsupported_backend_capability",
      severity: "high",
      status: "not_detected",
      evidence:
        "New cues are derived from existing continuity/session/reentry payloads; no fabricated capabilities introduced.",
    },
    {
      id: "atmosphere_presence_epistemic_leakage_risk",
      severity: "high",
      status: "not_detected",
      evidence:
        "Overlays and ambient cues pull from reader-safe traces (mood, reentry rationale, relationship state) without exposing hidden arc internals.",
    },
    {
      id: "reader_features_still_tool_like",
      severity: "medium",
      status: "detected",
      evidence:
        "Reader cockpit still exposes operational metadata and IDs; language shifted toward narrative presence but deeper shell simplification remains follow-up.",
    },
  ];

  const scorecard = {
    contractVersion: "1",
    scope: "experience_innovation_pass",
    evaluatedAtIso: executedAtIso,
    subsystems: [
      {
        subsystem: "living_entry_experience",
        status: failures.some((f) => f.command.includes("verify:living-entry-experience"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "experience_canvas",
        status: failures.some((f) => f.command.includes("verify:experience-canvas")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "mode_reinvention",
        status: failures.some((f) => f.command.includes("verify:experience-modes-reinvention"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "voice_presence",
        status: failures.some((f) => f.command.includes("verify:voice-presence-upgrade"))
          ? "blocked"
          : "acceptable",
      },
      {
        subsystem: "narrative_overlays",
        status: failures.some((f) => f.command.includes("verify:narrative-overlays")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "interaction_presence",
        status: failures.some((f) => f.command.includes("verify:interaction-presence")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "ambient_transitions",
        status: failures.some((f) => f.command.includes("verify:ambient-transitions")) ? "blocked" : "acceptable",
      },
      {
        subsystem: "experience_orchestration_v2",
        status: failures.some((f) => f.command.includes("verify:experience-orchestration-v2"))
          ? "blocked"
          : "acceptable",
      },
    ],
  };

  const riskMap: {
    contractVersion: "1";
    scope: string;
    evaluatedAtIso: string;
    risks: { riskId: string; severity: "low" | "medium" | "high"; source: string }[];
  } = {
    contractVersion: "1",
    scope: "experience_innovation_pass",
    evaluatedAtIso: executedAtIso,
    risks: [
      {
        riskId: "epistemic_leakage_from_presence_layers",
        severity: failures.some((f) => f.command.includes("verify:narrative-overlays")) ? "high" : "low",
        source: "verify:narrative-overlays",
      },
      {
        riskId: "mode_fork_behavioral_divergence",
        severity: failures.some((f) => f.command.includes("verify:experience-modes-reinvention"))
          ? "high"
          : "low",
        source: "verify:experience-modes-reinvention",
      },
      {
        riskId: "voice_presence_regression",
        severity: failures.some((f) => f.command.includes("verify:voice-presence-upgrade")) ? "high" : "low",
        source: "verify:voice-presence-upgrade",
      },
      {
        riskId: "orchestration_state_fragmentation",
        severity: failures.some((f) => f.command.includes("verify:experience-orchestration-v2"))
          ? "high"
          : "low",
        source: "verify:experience-orchestration-v2",
      },
      {
        riskId: "interaction_surface_still_tool_like",
        severity: "medium",
        source: "explicit_finding",
      },
    ],
  };

  const readinessDecision = {
    contractVersion: "1",
    scope: "experience_innovation_pass",
    evaluatedAtIso: executedAtIso,
    decision,
    trueBlockers: failures.map((failure) => failure.command),
    nonBlockingFollowUps:
      failures.length === 0
        ? [
            "Further simplify reader cockpit shell to hide operational IDs and expose a pure narrative conversation shell.",
            "Add browser-level e2e tests for mode transitions and pause/resume continuity cues.",
          ]
        : [],
  };

  const executionMatrixArtifact = {
    contractVersion: "1",
    certificationScope: "experience_innovation_pass",
    executedAtIso,
    commands: matrix,
    summary: {
      total: matrix.length,
      passed: matrix.filter((entry) => entry.status === "pass").length,
      failed: failures.length,
      skipped: 0,
    },
  };

  writeJsonArtifact(
    "reports/final-experience-innovation-script-execution-matrix.json",
    executionMatrixArtifact
  );
  writeJsonArtifact("reports/final-experience-innovation-subsystem-scorecard.json", scorecard);
  writeJsonArtifact("reports/final-experience-innovation-risk-map.json", riskMap);
  writeJsonArtifact("reports/final-experience-innovation-readiness-decision.json", readinessDecision);

  const report = toMarkdownReport({
    executedAtIso,
    matrix,
    scorecard,
    riskMap,
    readinessDecision,
    findings,
  });
  writeTextArtifact("docs/build/final-experience-innovation-report.md", report);

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
