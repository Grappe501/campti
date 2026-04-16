import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  Book1AuthorActionSchema,
  Book1AuthorSimulationGovernancePolicySchema,
  type Book1AuthorAction,
} from "@/lib/domain/book1-author-cockpit-simulation";
import {
  Book1AuthorCockpitSimulationService,
  type Chapter1CanonicalSourceState,
} from "@/lib/services/book1-author-cockpit-simulation-service";

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function buildDefaultPolicy() {
  return Book1AuthorSimulationGovernancePolicySchema.parse({
    allowAnchorMutation: false,
    allowChapterLawMutation: true,
    allowCharacterPsychologyTuning: true,
    allowForeshadowingRetune: true,
    allowTimelineMutation: true,
    allowRelationshipPressureRetune: true,
    allowVoiceSpecTuning: true,
    simulationMode: "counterfactual",
  });
}

function buildDefaultActions(now: string): Book1AuthorAction[] {
  const actions: Book1AuthorAction[] = [
    {
      actionId: "A-1",
      chapter: 1,
      actionType: "update_chapter_law",
      targetKey: "FA-1",
      rationale: "Keep external contact unresolved but raise identity pressure language in future arc constraint.",
      patch: { mustPreserve: "External-contact pressure remains latent and unresolved, with identity strain explicitly escalating." },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_law.json#futureArcConstraints[0]"],
    },
    {
      actionId: "A-2",
      chapter: 1,
      actionType: "adjust_symbolic_emphasis",
      targetKey: "river-oath",
      rationale: "Increase river covenant motif to reinforce faith and survival continuity.",
      patch: { motifWeight: 0.72, motifTag: "river-oath" },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_draft.json#segments"],
    },
    {
      actionId: "A-3",
      chapter: 1,
      actionType: "retune_foreshadowing",
      targetKey: "H4",
      rationale: "Shift foreshadowing toward later authority fracture while preserving latent external contact.",
      patch: { futureArcConstraintLink: "Later authority fracture must feel seeded through oath language drift." },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_epic_simulation.json#hiddenTimeline[3]"],
    },
    {
      actionId: "A-4",
      chapter: 1,
      actionType: "change_relationship_pressure",
      targetKey: "Alexis->Augustin",
      rationale: "Retune pressure toward identity conflict to support early power negotiation.",
      patch: { intensity: 0.74, pressureType: "status_negotiation" },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_relationship_pressure_map.json#relationships[0]"],
    },
    {
      actionId: "A-5",
      chapter: 1,
      actionType: "change_psychological_weighting",
      targetKey: "Alexis",
      rationale: "Increase Alexis fear weighting so duty choices read as constrained, not arbitrary.",
      patch: { fearWeight: 0.68, desireWeight: 0.52 },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_character_hidden_histories.json#characters"],
    },
    {
      actionId: "A-6",
      chapter: 1,
      actionType: "propose_anchor_mutation",
      targetKey: "H1",
      rationale: "Test anchor lock behavior by proposing alternate opening event timing.",
      patch: { latentEvent: "Household oath allocation occurs under visible external emissary pressure." },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_epic_simulation.json#hiddenTimeline[0]"],
    },
    {
      actionId: "A-7",
      chapter: 1,
      actionType: "mutate_timeline",
      targetKey: "H2",
      rationale: "Counterfactual timeline stress test with slight chronology shift inside chapter window.",
      patch: { inferredYear: 1675 },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_epic_simulation.json#hiddenTimeline[1]"],
    },
    {
      actionId: "A-8",
      chapter: 1,
      actionType: "tune_voice_spec",
      targetKey: "voice.dictionProfile.prioritize",
      rationale: "Raise ritual and kinship lexical density while keeping chapter1 voice envelope intact.",
      patch: { prioritize: ["kinship", "ritual", "river", "oath", "witness", "lineage"] },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_voice_spec.json#voiceSpec"],
    },
  ];
  return actions.map((action) => Book1AuthorActionSchema.parse(action));
}

async function main() {
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });

  const chapterEpicSimulationPath = path.join(reportsDir, "book1-chapter-01-chapter_epic_simulation.json");
  const chapterLawPath = path.join(reportsDir, "book1-chapter-01-chapter_law.json");
  const chapterRelationshipPressureMapPath = path.join(reportsDir, "book1-chapter-01-chapter_relationship_pressure_map.json");
  const chapterCharacterHiddenHistoriesPath = path.join(reportsDir, "book1-chapter-01-chapter_character_hidden_histories.json");
  const chapterVoiceSpecPath = path.join(reportsDir, "book1-chapter-01-chapter_voice_spec.json");

  const sourceState: Chapter1CanonicalSourceState = {
    chapterEpicSimulation: await readJson(chapterEpicSimulationPath),
    chapterLaw: await readJson(chapterLawPath),
    chapterRelationshipPressureMap: await readJson(chapterRelationshipPressureMapPath),
    chapterCharacterHiddenHistories: await readJson(chapterCharacterHiddenHistoriesPath),
    chapterVoiceSpec: await readJson(chapterVoiceSpecPath),
    provenance: {
      sourceArtifacts: [
        "reports/book1-chapter-01-chapter_epic_simulation.json",
        "reports/book1-chapter-01-chapter_law.json",
        "reports/book1-chapter-01-chapter_relationship_pressure_map.json",
        "reports/book1-chapter-01-chapter_character_hidden_histories.json",
        "reports/book1-chapter-01-chapter_voice_spec.json",
      ],
      capturedAt: new Date().toISOString(),
    },
  };

  const now = new Date().toISOString();
  const policy = buildDefaultPolicy();
  const actions = buildDefaultActions(now);
  const service = new Book1AuthorCockpitSimulationService();
  const { simulation, impactReport } = service.run({
    sourceState,
    governancePolicy: policy,
    actions,
  });

  const simulationPath = path.join(reportsDir, "book1-author-cockpit-simulation.json");
  const impactReportPath = path.join(reportsDir, "book1-author-cockpit-impact-report.json");
  await writeFile(simulationPath, `${JSON.stringify(simulation, null, 2)}\n`, "utf-8");
  await writeFile(impactReportPath, `${JSON.stringify(impactReport, null, 2)}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        chapter: 1,
        generatedAt: new Date().toISOString(),
        outputPaths: [
          path.relative(process.cwd(), simulationPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), impactReportPath).replace(/\\/g, "/"),
        ],
        actionTotals: impactReport.actionTotals,
        highestCanonRisk: impactReport.canonRiskSummary.highest,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Book 1 author cockpit simulation failed.");
  console.error(error);
  process.exitCode = 1;
});
