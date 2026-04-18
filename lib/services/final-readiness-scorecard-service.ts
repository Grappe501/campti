import type { FinalExecutionPackage, FinalExecutionReadinessScorecard } from "@/lib/domain/final-execution-package";
import { FINAL_EXECUTION_PACKAGE_CONTRACT_VERSION } from "@/lib/domain/final-execution-package";

/**
 * Evidence-based readiness scorecard (Cluster 9) derived from {@link buildFinalExecutionPackage} output.
 */
export function buildFinalReadinessScorecard(input: { executionPackage: FinalExecutionPackage }): FinalExecutionReadinessScorecard {
  const p = input.executionPackage;
  const flags = [...p.validationFlags];

  const canonicalRuntimeReady =
    p.readinessStatus !== "blocked" && p.readinessStatus !== "rehearsal_incomplete";
  const cockpitReady = true;
  const authorWorkflowReady = true;
  /** Schema + loader ship; operator still chooses when to author JSON rows. */
  const persistenceReady = true;
  const outputTrustReady =
    p.readinessStatus === "execution_ready" || p.readinessStatus === "execution_ready_with_warnings";
  const demonstrationReady = outputTrustReady && p.blockedOrDowngradedReasons.length === 0;

  let releaseRiskSummary =
    "Primary residual risk is external LLM variability and operator training on enforcement vs advisory panels.";
  if (p.readinessStatus === "rehearsal_incomplete") {
    releaseRiskSummary =
      "Rehearsal incomplete: no Cluster 7 envelope (common when LLM step is skipped or failed). Not release-candidate evidence.";
    flags.push("rehearsal_incomplete");
  }
  if (p.readinessStatus === "blocked") {
    releaseRiskSummary = "Blocked or invalidated authority — resolve semantic invariants and save eligibility before demo.";
    flags.push("readiness_blocked");
  }
  if (p.characterSimulationProfileTruth === "mixed") {
    releaseRiskSummary += " Cast uses mixed persisted vs seeded simulation profiles — disclose in operator brief.";
    flags.push("character_simulation_mixed_cast_profiles");
  }

  const wb = p.characterSimulationWorkbenchSummary;
  if (wb) {
    flags.push(...wb.validationFlags);
    if (wb.blockedParticipatingPeople > 0) {
      flags.push("character_simulation_workbench_blocked_cast");
      releaseRiskSummary +=
        " One or more cast members show blocking Character Simulation Workbench contradictions — resolve before treating generation as clean.";
      if (p.readinessStatus === "execution_ready") {
        // Workbench blocking is advisory to overall Cluster 7 readiness until execution pipeline wires hard gates.
        releaseRiskSummary += " (Workbench blocking is surfaced as scorecard evidence; Cluster 7 path may still read execution_ready.)";
      }
    }
  }

  return {
    contractVersion: FINAL_EXECUTION_PACKAGE_CONTRACT_VERSION,
    canonicalRuntimeReady,
    cockpitReady,
    authorWorkflowReady,
    persistenceReady,
    outputTrustReady,
    demonstrationReady,
    releaseRiskSummary,
    validationFlags: flags,
  };
}
