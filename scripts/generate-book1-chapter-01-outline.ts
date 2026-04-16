import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { Chapter1DeepOutlineGenerator } from "@/lib/services/book1-chapter1-deep-outline-generator";
import type { Book1EpicOutline, Book1OutlinePsychProfile } from "@/lib/services/book1-epic-outline-builder";
import { annotateLineageConduitEntities } from "@/lib/services/book1-lineage-conduit-service";

async function main() {
  const prisma = new PrismaClient();
  try {
    const epicOutlinePath = path.join(process.cwd(), "reports", "book1-epic-outline.json");
    const epicOutline = JSON.parse(await readFile(epicOutlinePath, "utf-8")) as Book1EpicOutline;
    const scene1 = await prisma.book1SceneAnchor.findUnique({
      where: { sceneNumber: 1 },
      select: { id: true },
    });
    if (!scene1) throw new Error("Scene anchor 1 not found.");

    const [sceneComponents, knowledgeNodes, timelineEvents, entities, persons, entityRelationships] = await Promise.all([
      prisma.book1SceneComponent.findMany({
        where: {
          sceneAnchorId: scene1.id,
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
          id: true,
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
      prisma.book1EntityRelationship.findMany({
        select: {
          fromEntityId: true,
          toEntityId: true,
          fromEntity: { select: { entityType: true } },
          toEntity: { select: { entityType: true } },
        },
      }),
    ]);

    const lineageLinkedPersonIds = new Set<string>();
    for (const relationship of entityRelationships) {
      const fromType = String(relationship.fromEntity.entityType);
      const toType = String(relationship.toEntity.entityType);
      if (fromType === "PERSON" && toType === "LINEAGE") lineageLinkedPersonIds.add(relationship.fromEntityId);
      if (toType === "PERSON" && fromType === "LINEAGE") lineageLinkedPersonIds.add(relationship.toEntityId);
    }
    const normalizedEntities = annotateLineageConduitEntities(
      entities.map((entity) => ({
        ...entity,
        entityType: String(entity.entityType),
        lineageLinked: lineageLinkedPersonIds.has(entity.id),
      })),
    );

    const psychProfiles: Book1OutlinePsychProfile[] = persons.map((person) => ({
      name: person.name,
      enneagramType: person.enneagram ? String(person.enneagram) : null,
      coreFear: person.characterCoreProfile?.coreFear ?? null,
      coreDesire: person.characterCoreProfile?.coreDesire ?? null,
    }));

    const outline = new Chapter1DeepOutlineGenerator().generate({
      epicOutline,
      sceneComponents,
      knowledgeNodes,
      timelineEvents,
      entities: normalizedEntities,
      psychProfiles,
    });

    const reportsDir = path.join(process.cwd(), "reports");
    await mkdir(reportsDir, { recursive: true });
    const outputPath = path.join(reportsDir, "book1-chapter-01-outline.json");
    await writeFile(outputPath, `${JSON.stringify(outline, null, 2)}\n`, "utf-8");

    console.log(
      JSON.stringify(
        {
          outputPath: path.relative(process.cwd(), outputPath).replace(/\\/g, "/"),
          chapter: outline.chapter,
          segmentCount: outline.timeline.length,
          scene1Components: sceneComponents.length,
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
  console.error("Chapter 1 deep outline generation failed.");
  console.error(error);
  process.exitCode = 1;
});
