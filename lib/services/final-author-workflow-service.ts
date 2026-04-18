import type { FinalExecutionPackage } from "@/lib/domain/final-execution-package";

export type FinalAuthorWorkflowStep = {
  step: number;
  title: string;
  action: string;
  adminHref: string | null;
};

/**
 * Ordered author workflow on the canonical path (inspection → adjust → rerun → certify → export).
 */
export function buildFinalAuthorWorkflowReport(input: { executionPackage: FinalExecutionPackage }): {
  sceneId: string;
  chapterId: string | null;
  steps: FinalAuthorWorkflowStep[];
  closureNotes: string[];
} {
  const p = input.executionPackage;
  return {
    sceneId: p.sceneId,
    chapterId: p.chapterId,
    steps: [
      {
        step: 1,
        title: "Select scene or chapter scope",
        action: "Use Author Cockpit scope chips to anchor inspection to a scene or chapter.",
        adminHref: "/admin/narrative",
      },
      {
        step: 2,
        title: "Inspect continuity, emotional gravity, narrator, hooks",
        action: "Use Epic continuity / Emotional gravity / Narrator panels; cross-check Continuity admin for notes.",
        adminHref: "/admin/continuity",
      },
      {
        step: 3,
        title: "Inspect prose realism and human gravity",
        action: "Read Cluster 5 and Cluster 6 panels; treat warnings as refinement targets, not soft canon.",
        adminHref: "/admin/narrative",
      },
      {
        step: 4,
        title: "Inspect character simulation and profile truth",
        action:
          "Confirm profileTruth label. Author mind/voice JSON on Person via CharacterSimulationAuthorBundle (Prisma) when stable identity is required.",
        adminHref: "/admin/people",
      },
      {
        step: 5,
        title: "Apply nudges or constraints",
        action: "Use API-level characterSimulationAuthorNudge on SceneGenerationInput or DB simulation JSON — never silent demo flags.",
        adminHref: "/admin/scenes",
      },
      {
        step: 6,
        title: "Rerun canonical generation",
        action: "Trigger `runSceneGeneration` from admin tooling / actions with documented overrides only.",
        adminHref: "/admin/scenes",
      },
      {
        step: 7,
        title: "Review validation / certification outcomes",
        action: "Use Cluster 7 strip on cockpit or cluster7 envelope on run result for execution-ready gating.",
        adminHref: "/admin/narrative",
      },
      {
        step: 8,
        title: "Save, export, or print",
        action: "Save only when saveEligible; export JSON reports; print cockpit or scene prose as needed.",
        adminHref: "/admin/scenes",
      },
    ],
    closureNotes: [
      `Latest readiness status for this assembly: ${p.readinessStatus}.`,
      `Character simulation inputs: ${p.characterSimulationProfileTruth}.`,
    ],
  };
}
