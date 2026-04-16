import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { Book1EpicOutlineBuilder, type Book1OutlinePsychProfile } from "@/lib/services/book1-epic-outline-builder";
import { annotateLineageConduitEntities } from "@/lib/services/book1-lineage-conduit-service";

async function main() {
  const prisma = new PrismaClient();
  try {
    const [knowledgeNodes, timelineEvents, entities, sceneAnchors, persons, entityRelationships] = await Promise.all([
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
        orderBy: [{ createdAt: "asc" }],
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
        orderBy: [{ dateStart: "asc" }, { createdAt: "asc" }],
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
        orderBy: [{ displayName: "asc" }],
      }),
      prisma.book1SceneAnchor.findMany({
        where: { sceneNumber: { gte: 1, lte: 17 } },
        select: {
          sceneNumber: true,
          sceneKey: true,
          title: true,
          eraLabel: true,
          functionInBook: true,
          summary: true,
        },
        orderBy: [{ sceneNumber: "asc" }],
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

    const outline = new Book1EpicOutlineBuilder().build({
      knowledgeNodes,
      timelineEvents,
      entities: normalizedEntities,
      sceneAnchors,
      enneagramProfiles: psychProfiles,
      thematicVision: ["power", "identity", "faith", "survival"],
    });

    const reportsDir = path.join(process.cwd(), "reports");
    await mkdir(reportsDir, { recursive: true });
    const outputPath = path.join(reportsDir, "book1-epic-outline.json");
    await writeFile(outputPath, `${JSON.stringify(outline, null, 2)}\n`, "utf-8");

    console.log(
      JSON.stringify(
        {
          outputPath: path.relative(process.cwd(), outputPath).replace(/\\/g, "/"),
          phases: outline.phases.length,
          preCivilChapters: outline.phases[0]?.chapters.length ?? 0,
          postCivilChapters: outline.phases[1]?.chapters.length ?? 0,
          dataCoverage: {
            knowledgeNodes: knowledgeNodes.length,
            timelineEvents: timelineEvents.length,
            entities: normalizedEntities.length,
            sceneAnchors: sceneAnchors.length,
            enneagramProfiles: psychProfiles.length,
          },
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
  console.error("Epic outline build failed.");
  console.error(error);
  process.exitCode = 1;
});
