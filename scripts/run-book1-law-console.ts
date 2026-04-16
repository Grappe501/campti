import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  Book1LawConsoleActionSchema,
  Book1LawConsoleGovernancePolicySchema,
  type Book1LawConsoleAction,
} from "@/lib/domain/book1-law-console";
import { Book1LawConsoleService, type Book1LawConsoleSourceState } from "@/lib/services/book1-law-console-service";

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function buildDefaultPolicy() {
  return Book1LawConsoleGovernancePolicySchema.parse({
    allowChapterLawMutation: true,
    allowForeshadowingRetune: true,
    allowVoiceSpecTuning: true,
    allowAnchorMutation: false,
    simulationMode: "counterfactual",
  });
}

function buildDefaultActions(now: string): Book1LawConsoleAction[] {
  const actions: Book1LawConsoleAction[] = [
    {
      actionId: "LAW-1",
      chapter: 1,
      actionType: "adjust_symbolic_emphasis",
      targetKey: "river-oath-symbol",
      rationale: "Increase continuity signaling around ritual witness motif.",
      patch: { motifWeight: 0.74 },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_draft.json#segments[0]"],
    },
    {
      actionId: "LAW-2",
      chapter: 1,
      actionType: "adjust_foreshadowing_intensity",
      targetKey: "FA-2",
      rationale: "Raise chapter-end carry-forward pressure for succession instability.",
      patch: { intensityDelta: 0.18 },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_law.json#futureArcConstraints[1]"],
    },
    {
      actionId: "LAW-3",
      chapter: 1,
      actionType: "change_reveal_imply_balance",
      targetKey: "scene-4-observer-layer",
      rationale: "Shift observer section toward implication to preserve unresolved pressure.",
      patch: { revealRatio: 0.36, implyRatio: 0.64 },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-outline.json#timeline[3]"],
    },
    {
      actionId: "LAW-4",
      chapter: 1,
      actionType: "propose_anchor_mutation",
      targetKey: "H1",
      rationale: "Test locked-anchor governance for chapter law console.",
      patch: { latentEvent: "Mutated opening anchor" },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_epic_simulation.json#hiddenTimeline[0]"],
    },
  ];

  return actions.map((action) => Book1LawConsoleActionSchema.parse(action));
}

async function main() {
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });

  const sourceState: Book1LawConsoleSourceState = {
    chapterLaw: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_law.json")),
    chapterVoiceSpec: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_voice_spec.json")),
    chapterEpicSimulation: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_epic_simulation.json")),
    chapterOutline: await readJson(path.join(reportsDir, "book1-chapter-01-outline.json")),
    chapterDraft: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_draft.json")),
    chapterCharacterHiddenHistories: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_character_hidden_histories.json")),
    provenance: {
      sourceArtifacts: [
        "reports/book1-chapter-01-chapter_law.json",
        "reports/book1-chapter-01-chapter_voice_spec.json",
        "reports/book1-chapter-01-chapter_epic_simulation.json",
        "reports/book1-chapter-01-outline.json",
        "reports/book1-chapter-01-chapter_draft.json",
        "reports/book1-chapter-01-chapter_character_hidden_histories.json",
      ],
      capturedAt: new Date().toISOString(),
    },
  };

  const service = new Book1LawConsoleService();
  const { session, impactReport } = service.runSession({
    sourceState,
    governancePolicy: buildDefaultPolicy(),
    actions: buildDefaultActions(new Date().toISOString()),
  });

  const sessionPath = path.join(reportsDir, "book1-law-console-session.json");
  const impactPath = path.join(reportsDir, "book1-law-console-impact-report.json");
  await writeFile(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf-8");
  await writeFile(impactPath, `${JSON.stringify(impactReport, null, 2)}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        chapter: 1,
        simulationMode: session.governancePolicy.simulationMode,
        outputPaths: [path.relative(process.cwd(), sessionPath).replace(/\\/g, "/"), path.relative(process.cwd(), impactPath).replace(/\\/g, "/")],
        actionTotals: impactReport.actionTotals,
        lockViolations: impactReport.lockViolations,
        highestCanonRisk: impactReport.canonRiskSummary.highest,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Book 1 law console run failed.");
  console.error(error);
  process.exitCode = 1;
});
