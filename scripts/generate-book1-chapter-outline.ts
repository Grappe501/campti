import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { Chapter1DeepOutlineGenerator } from "@/lib/services/book1-chapter1-deep-outline-generator";
import type { Book1EpicOutline, Book1OutlinePsychProfile } from "@/lib/services/book1-epic-outline-builder";

function parseChapter(argv: string[]): number {
  const index = argv.indexOf("--chapter");
  if (index === -1) return 1;
  const value = argv[index + 1];
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) throw new Error("Invalid --chapter value. Use a positive integer.");
  return parsed;
}

function resolveSceneForChapter(epicOutline: Book1EpicOutline, chapterNumber: number): number {
  const preCivil = epicOutline.phases.find((phase) => phase.name === "Pre-Civil War");
  const chapter = preCivil?.chapters.find((row) => row.chapter === chapterNumber);
  if (chapter && "connectedScenes" in chapter && chapter.connectedScenes.length > 0) return chapter.connectedScenes[0];
  return Math.min(17, Math.max(1, chapterNumber));
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const chapterNumber = parseChapter(process.argv);
    const epicOutlinePath = path.join(process.cwd(), "reports", "book1-epic-outline.json");
    const epicOutline = JSON.parse(await readFile(epicOutlinePath, "utf-8")) as Book1EpicOutline;
    const sceneNumber = resolveSceneForChapter(epicOutline, chapterNumber);
    const sceneAnchor = await prisma.book1SceneAnchor.findUnique({
      where: { sceneNumber },
      select: { id: true },
    });
    if (!sceneAnchor) throw new Error(`Scene anchor ${sceneNumber} not found for chapter ${chapterNumber}.`);

    const [sceneComponents, knowledgeNodes, timelineEvents, entities, persons] = await Promise.all([
      prisma.book1SceneComponent.findMany({
        where: {
          sceneAnchorId: sceneAnchor.id,
          canonStatus: { in: ["CANON", "CANDIDATE"] },
        },
        select: {
          componentType: true,
          textContent: true,
          summary: true,
          functionInScene: true,
          canonStatus: true,
          confidenceType: true,
        },
      }),
      prisma.book1KnowledgeNode.findMany({
        where: { canonStatus: { in: ["CANON", "CANDIDATE"] } },
        select: {
          nodeType: true,
          title: true,
          canonicalStatement: true,
          summaryShort: true,
          summaryLong: true,
          historicalScope: true,
          narrativeScope: true,
        },
      }),
      prisma.book1TimelineEvent.findMany({
        select: {
          title: true,
          eventType: true,
          dateStart: true,
          dateEnd: true,
          yearLabel: true,
          description: true,
          historicalOrStory: true,
        },
      }),
      prisma.book1Entity.findMany({
        select: {
          displayName: true,
          entityType: true,
          description: true,
          startYear: true,
          endYear: true,
          notes: true,
        },
      }),
      prisma.person.findMany({
        where: { enneagram: { not: null } },
        select: { name: true, enneagram: true, characterCoreProfile: { select: { coreFear: true, coreDesire: true } } },
      }),
    ]);

    const psychProfiles: Book1OutlinePsychProfile[] = persons.map((person) => ({
      name: person.name,
      enneagramType: person.enneagram ? String(person.enneagram) : null,
      coreFear: person.characterCoreProfile?.coreFear ?? null,
      coreDesire: person.characterCoreProfile?.coreDesire ?? null,
    }));

    const outline = new Chapter1DeepOutlineGenerator().generate({
      chapterNumber,
      epicOutline,
      sceneComponents,
      knowledgeNodes,
      timelineEvents,
      entities,
      psychProfiles,
    });

    const reportsDir = path.join(process.cwd(), "reports");
    await mkdir(reportsDir, { recursive: true });
    const outputFileName = `book1-chapter-${String(chapterNumber).padStart(2, "0")}-outline.json`;
    const outputPath = path.join(reportsDir, outputFileName);
    await writeFile(outputPath, `${JSON.stringify(outline, null, 2)}\n`, "utf-8");

    console.log(
      JSON.stringify(
        {
          outputPath: path.relative(process.cwd(), outputPath).replace(/\\/g, "/"),
          chapter: outline.chapter,
          segmentCount: outline.timeline.length,
          sceneNumberUsed: sceneNumber,
          sceneComponents: sceneComponents.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Chapter outline generation failed.");
  console.error(error);
  process.exitCode = 1;
});
