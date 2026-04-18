import type { FinalExecutionPackage } from "@/lib/domain/final-execution-package";

export type FinalDemoRunbook = {
  title: string;
  operatorSteps: string[];
  inspectFirst: string[];
  ifBlockedOrDowngraded: string[];
  safeOutputsToPresent: string[];
  advisorySurfaces: string[];
  exportPrintNotes: string[];
};

/**
 * Structured operator runbook (canonical path only — no alternate demo runtime).
 */
export function buildFinalDemoRunbook(input: { executionPackage: FinalExecutionPackage }): FinalDemoRunbook {
  const p = input.executionPackage;
  return {
    title: "Campti canonical operator runbook (Cluster 9)",
    operatorSteps: [
      "Open Admin → Author Cockpit (`/admin/narrative`) and pick scene/chapter/book/epic scope.",
      "Read Operator execution summary (canonical runtime id vs cockpit inspection runtime).",
      "Review Cluster 7 certification strip: save eligibility, artifact id, semantic hard failures, overrides.",
      "Scan enforcement semantic truth panel for advisory vs hard-enforced subsystems.",
      "Inspect human gravity, prose realism, narrator, continuity, and character simulation panels in that order for demos.",
      "For regeneration or prose, use the same canonical scene generation services as production (`runSceneGeneration`).",
      "After a run, open Scenes admin to save or copy outputs; never present model JSON as reader-canonical.",
    ],
    inspectFirst: [
      "Certification & validation truth (Cluster 7) — save blocked reasons and remediation targets.",
      "Character simulation profile truth — persisted author vs deterministic seed.",
      "Human gravity — no-reset gate participation and shallow/reset warnings.",
    ],
    ifBlockedOrDowngraded: [
      `This package readiness: ${p.readinessStatus}. Reasons: ${p.blockedOrDowngradedReasons.join("; ") || "none listed"}.`,
      "If save is blocked, fix realism or human-gravity truth before toggling overrides (audited in artifact stamp).",
      "If semantic invariants hard-fail, follow remediation targets before re-running.",
    ],
    safeOutputsToPresent: p.exportableOutputs,
    advisorySurfaces: [
      "Cockpit bundle is observational-only and may use cockpit_inspection_helpers runtime — label as non-mutating.",
      "Guided signals and several metrics are advisory; Cluster 7 strip states what may count as execution-ready evidence.",
      "Social field QA scalars and humanization advisories are post-gen advisory unless wired otherwise in registry.",
    ],
    exportPrintNotes: [
      "Write `reports/final-execution-package.json` and `reports/final-readiness-scorecard.json` via `scripts/cluster9-final-dry-run.ts`.",
      "Browser print: use cockpit page print; generated prose lives on Scene rows (`generationText` / `authoringText`).",
    ],
  };
}
