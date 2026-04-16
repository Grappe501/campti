import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { Book1EpicOutlineBuilder, type Book1OutlinePsychProfile } from "@/lib/services/book1-epic-outline-builder";
import { Book1LatentEpicChapterService } from "@/lib/services/book1-latent-epic-chapter-service";
import { annotateLineageConduitEntities } from "@/lib/services/book1-lineage-conduit-service";

async function main() {
  const prisma = new PrismaClient();
  try {
    const knowledgeNodes = await prisma.book1KnowledgeNode.findMany({
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
    });
    const timelineEvents = await prisma.book1TimelineEvent.findMany({
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
    });
    const entities = await prisma.book1Entity.findMany({
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
    });
    const sceneAnchors = await prisma.book1SceneAnchor.findMany({
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
    });
    const sceneComponents = await prisma.book1SceneComponent.findMany({
      where: {
        sceneAnchor: { sceneNumber: 1 },
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
    });
    if (sceneComponents.length === 0) throw new Error("Scene 1 components not found.");
    const persons = await prisma.person.findMany({
      where: { enneagram: { not: null } },
      select: { name: true, enneagram: true, characterCoreProfile: { select: { coreFear: true, coreDesire: true } } },
    });
    const entityRelationships = await prisma.book1EntityRelationship.findMany({
      select: {
        fromEntityId: true,
        toEntityId: true,
        fromEntity: { select: { entityType: true } },
        toEntity: { select: { entityType: true } },
      },
    });

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

    const epicOutline = new Book1EpicOutlineBuilder().build({
      knowledgeNodes,
      timelineEvents,
      entities: normalizedEntities,
      sceneAnchors,
      enneagramProfiles: psychProfiles,
      thematicVision: ["power", "identity", "faith", "survival"],
    });
    const artifacts = new Book1LatentEpicChapterService().generateChapter1Artifacts({
      epicOutline,
      knowledgeNodes,
      timelineEvents,
      entities: normalizedEntities,
      sceneComponents,
      psychProfiles,
    });

    const reportsDir = path.join(process.cwd(), "reports");
    await mkdir(reportsDir, { recursive: true });
    const outputs = [
      ["book1-chapter-01-chapter_evidence_pack.json", artifacts.chapterEvidencePack],
      ["book1-chapter-01-chapter_epic_simulation.json", artifacts.chapterEpicSimulation],
      ["book1-chapter-01-chapter_character_hidden_histories.json", artifacts.chapterCharacterHiddenHistories],
      ["book1-chapter-01-chapter_relationship_pressure_map.json", artifacts.chapterRelationshipPressureMap],
      ["book1-chapter-01-chapter_law.json", artifacts.chapterLaw],
      ["book1-chapter-01-lineage-conduit-report.json", artifacts.lineageConduitReport],
      ["book1-chapter-01-chapter_voice_spec.json", artifacts.chapterVoiceSpec],
      ["book1-chapter-01-chapter_draft.json", artifacts.chapterDraft],
      ["book1-chapter-01-chapter_consistency_report.json", artifacts.chapterConsistencyReport],
      ["book1-chapter-01-chapter_voice_report.json", artifacts.chapterVoiceReport],
      ["book1-chapter-01-chapter_gap_report.json", artifacts.chapterGapReport],
    ] as const;
    await Promise.all(
      outputs.map(([fileName, payload]) => writeFile(path.join(reportsDir, fileName), `${JSON.stringify(payload, null, 2)}\n`, "utf-8")),
    );

    const draftTextPath = path.join(reportsDir, "book1-chapter-01-chapter_draft.txt");
    await writeFile(draftTextPath, `${artifacts.chapterDraft.fullText}\n`, "utf-8");

    const outputPathList = outputs.map(([fileName]) => path.relative(process.cwd(), path.join(reportsDir, fileName)).replace(/\\/g, "/"));
    console.log(
      JSON.stringify(
        {
          chapter: 1,
          generatedAt: new Date().toISOString(),
          outputCount: outputPathList.length,
          outputPaths: outputPathList,
          prosePath: path.relative(process.cwd(), draftTextPath).replace(/\\/g, "/"),
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
  console.error("Chapter 1 latent epic generation failed.");
  console.error(error);
  process.exitCode = 1;
});
