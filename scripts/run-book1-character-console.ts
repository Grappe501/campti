import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  Book1CharacterConsoleGovernancePolicySchema,
  Book1CharacterConsoleTurnSchema,
  type Book1CharacterConsoleTurn,
} from "@/lib/domain/book1-character-console";
import {
  Book1CharacterConsoleService,
  type Book1CharacterConsoleSourceState,
} from "@/lib/services/book1-character-console-service";

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function buildDefaultPolicy() {
  return Book1CharacterConsoleGovernancePolicySchema.parse({
    allowCharacterStateMutation: true,
    allowDialogueMutation: true,
    allowActionPathMutation: true,
    allowAnchorMutation: false,
    simulationMode: "god",
  });
}

function buildDefaultTurns(now: string): Book1CharacterConsoleTurn[] {
  const turns: Book1CharacterConsoleTurn[] = [
    {
      turnId: "turn-1",
      chapter: 1,
      scene: 1,
      character: "Alexis",
      actionType: "question",
      content: "Out-of-world: what does Alexis currently know but refuse to say aloud?",
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-chapter_character_hidden_histories.json#characters[0]"],
    },
    {
      turnId: "turn-2",
      chapter: 1,
      scene: 1,
      character: "Alexis",
      actionType: "probe",
      content: "Out-of-world: map Alexis pressure vectors tied to this scene and near-future arc hooks.",
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: [
        "reports/book1-chapter-01-chapter_relationship_pressure_map.json#relationships[0]",
        "reports/book1-chapter-01-chapter_epic_simulation.json#hiddenTimeline[0]",
      ],
    },
    {
      turnId: "turn-3",
      chapter: 1,
      scene: 1,
      character: "Alexis",
      actionType: "intervene",
      content: "Out-of-world intervention: increase dialogue hesitation markers in this scene.",
      proposedMutation: {
        mutationId: "mutation-1",
        mutationKind: "dialogue",
        targetKey: "chapter1.scene1.alexis.dialogue_tone",
        patch: { hesitationWeight: 0.63, assertionWeight: 0.37 },
        rationale: "Expose fear-vs-duty tension without resolving chapter law constraints.",
        provenanceRefs: [
          "reports/book1-chapter-01-chapter_draft.json#segments[0]",
          "reports/book1-chapter-01-chapter_law.json#futureArcConstraints[0]",
        ],
      },
      requestedBy: "chapter1_author_cockpit",
      requestedAt: now,
      provenanceRefs: ["reports/book1-chapter-01-outline.json#timeline[0]"],
    },
  ];
  return turns.map((turn) => Book1CharacterConsoleTurnSchema.parse(turn));
}

async function main() {
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });

  const sourceState: Book1CharacterConsoleSourceState = {
    chapterCharacterHiddenHistories: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_character_hidden_histories.json")),
    chapterRelationshipPressureMap: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_relationship_pressure_map.json")),
    chapterLaw: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_law.json")),
    chapterEpicSimulation: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_epic_simulation.json")),
    chapterOutline: await readJson(path.join(reportsDir, "book1-chapter-01-outline.json")),
    chapterDraft: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_draft.json")),
    chapterEnneagramOperatingLayer: (await exists(path.join(reportsDir, "book1-chapter-01-enneagram-operating-layer.json")))
      ? await readJson(path.join(reportsDir, "book1-chapter-01-enneagram-operating-layer.json"))
      : undefined,
    chapterEnneagramConsciousnessEngine: (await exists(path.join(reportsDir, "book1-chapter-01-enneagram-consciousness-engine.json")))
      ? await readJson(path.join(reportsDir, "book1-chapter-01-enneagram-consciousness-engine.json"))
      : undefined,
    chapterEnneagramMediationLayer: (await exists(path.join(reportsDir, "book1-chapter-01-enneagram-mediation-layer.json")))
      ? await readJson(path.join(reportsDir, "book1-chapter-01-enneagram-mediation-layer.json"))
      : undefined,
    provenance: {
      sourceArtifacts: [
        "reports/book1-chapter-01-chapter_character_hidden_histories.json",
        "reports/book1-chapter-01-chapter_relationship_pressure_map.json",
        "reports/book1-chapter-01-chapter_law.json",
        "reports/book1-chapter-01-chapter_epic_simulation.json",
        "reports/book1-chapter-01-outline.json",
        "reports/book1-chapter-01-chapter_draft.json",
        ...(await exists(path.join(reportsDir, "book1-chapter-01-enneagram-operating-layer.json")))
          ? ["reports/book1-chapter-01-enneagram-operating-layer.json"]
          : [],
        ...(await exists(path.join(reportsDir, "book1-chapter-01-enneagram-consciousness-engine.json")))
          ? ["reports/book1-chapter-01-enneagram-consciousness-engine.json"]
          : [],
        ...(await exists(path.join(reportsDir, "book1-chapter-01-enneagram-mediation-layer.json")))
          ? ["reports/book1-chapter-01-enneagram-mediation-layer.json"]
          : [],
      ],
      capturedAt: new Date().toISOString(),
    },
  };

  const service = new Book1CharacterConsoleService();
  const now = new Date().toISOString();
  const turns = buildDefaultTurns(now);
  const { session, impactReport } = service.runSession({
    sourceState,
    selection: { chapter: 1, scene: 1, character: "Alexis" },
    governancePolicy: buildDefaultPolicy(),
    turns,
  });

  const sessionPath = path.join(reportsDir, "book1-character-console-session.json");
  const impactPath = path.join(reportsDir, "book1-character-console-impact-report.json");
  await writeFile(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf-8");
  await writeFile(impactPath, `${JSON.stringify(impactReport, null, 2)}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        chapter: 1,
        scene: 1,
        character: "Alexis",
        simulationMode: session.governancePolicy.simulationMode,
        outputPaths: [path.relative(process.cwd(), sessionPath).replace(/\\/g, "/"), path.relative(process.cwd(), impactPath).replace(/\\/g, "/")],
        interventionTotals: impactReport.interventionTotals,
        canonicalStateProtected: session.canonicalStateProtected,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Book 1 character console session failed.");
  console.error(error);
  process.exitCode = 1;
});
