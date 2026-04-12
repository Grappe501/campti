import {
  FactAssertionStatus,
  NarrativeDependencyConsumerKind,
  NarrativeDependencyProducerKind,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { SceneGenerationContractV1 } from "@/lib/domain/scene-generation-contract";
import {
  resolveEffectiveWorldStateId,
  worldStatePickFromHierarchy,
} from "@/lib/services/world-state-resolution";

/**
 * Builds the v1 generation contract for a scene: epic/book/chapter context,
 * resolved world state id, places, people, beat plan, linked assertions (via NarrativeDependencyEdge or explicit list).
 */
export async function loadSceneGenerationContract(
  sceneId: string,
  options?: {
    /** If provided, only these assertion ids are embedded (still must belong to slot graph). */
    assertionIds?: string[];
    /** When true (default), attach Phase 6 pins (PINNED cognition, simulations, thought-language slice). */
    includePhase6Augmentations?: boolean;
  }
): Promise<SceneGenerationContractV1> {
  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    include: {
      chapter: {
        include: {
          book: { include: { epic: true } },
        },
      },
      persons: true,
      places: true,
      narrativeBeats: { orderBy: { orderIndex: "asc" } },
    },
  });

  const chapter = scene.chapter;
  const book = chapter.book;
  const epic = book.epic;

  const wsPick = worldStatePickFromHierarchy(
    epic,
    book,
    chapter,
    scene,
    null
  );
  const worldStateId = resolveEffectiveWorldStateId(wsPick);
  const worldStateReference = worldStateId
    ? await prisma.worldStateReference.findUnique({
        where: { id: worldStateId },
      })
    : null;

  const place = scene.places[0] ?? null;

  let assertionIdList = options?.assertionIds;
  if (!assertionIdList?.length) {
    const edges = await prisma.narrativeDependencyEdge.findMany({
      where: {
        consumerKind: NarrativeDependencyConsumerKind.SCENE,
        consumerId: sceneId,
        producerKind: NarrativeDependencyProducerKind.GENEALOGICAL_ASSERTION,
      },
    });
    assertionIdList = edges.map((e) => e.producerId);
  }

  const genealogicalAssertions =
    assertionIdList.length > 0
      ? await prisma.genealogicalAssertion.findMany({
          where: {
            id: { in: assertionIdList },
            status: FactAssertionStatus.ACTIVE,
          },
          include: { slot: true },
        })
      : [];

  const continuityNotes: string[] = [];
  const cn = await prisma.continuityNote.findMany({
    where: { linkedSceneId: sceneId },
    take: 50,
  });
  for (const n of cn) {
    if (n.description) continuityNotes.push(n.description);
  }

  let pinnedCognitionSessions: SceneGenerationContractV1["pinnedCognitionSessions"];
  let pinnedDecisionTraceSessions: SceneGenerationContractV1["pinnedDecisionTraceSessions"];
  let linkedSimulationScenarios: SceneGenerationContractV1["linkedSimulationScenarios"];

  if (options?.includePhase6Augmentations !== false) {
    const [pinnedSessions, simulationRows] = await Promise.all([
      prisma.characterInnerVoiceSession.findMany({
        where: { sceneId: scene.id, canonicalStatus: "PINNED" },
        orderBy: { createdAt: "desc" },
        take: 16,
      }),
      prisma.simulationScenario.findMany({
        where: { sceneId: scene.id },
        orderBy: { updatedAt: "desc" },
        take: 24,
      }),
    ]);

    pinnedCognitionSessions = pinnedSessions
      .filter((s) => s.mode !== "DECISION_TRACE")
      .map((s) => ({
        id: s.id,
        personId: s.personId,
        mode: s.mode,
        canonicalStatus: s.canonicalStatus,
        excerptPreview: s.response.trim().slice(0, 420),
      }));
    pinnedDecisionTraceSessions = pinnedSessions
      .filter((s) => s.mode === "DECISION_TRACE")
      .map((s) => ({
        id: s.id,
        personId: s.personId,
        excerptPreview: s.response.trim().slice(0, 420),
      }));
    linkedSimulationScenarios = simulationRows.map((s) => ({
      id: s.id,
      title: s.title,
      inputHash: null,
    }));
  }

  return {
    contractVersion: "1",
    epic: {
      id: epic.id,
      title: epic.title,
      summary: epic.summary,
      metadataJson: epic.metadataJson ?? null,
    },
    book: {
      id: book.id,
      movementIndex: book.movementIndex,
      title: book.title,
      readerFacingTitle: book.readerFacingTitle,
      summary: book.summary,
    },
    chapter: {
      id: chapter.id,
      title: chapter.title,
      summary: chapter.summary,
      sequenceInBook: chapter.sequenceInBook,
      chapterNumber: chapter.chapterNumber,
    },
    scene: {
      id: scene.id,
      description: scene.description,
      summary: scene.summary,
      narrativeIntent: scene.narrativeIntent,
      emotionalTone: scene.emotionalTone,
      orderInChapter: scene.orderInChapter,
      writingMode: scene.writingMode,
      historicalAnchor: scene.historicalAnchor,
      locationNote: scene.locationNote,
      pov: scene.pov,
      structuredDataJson: scene.structuredDataJson ?? null,
    },
    effectiveWorldState: {
      worldStateId,
      eraId: worldStateReference?.eraId ?? null,
      label: worldStateReference?.label ?? null,
    },
    place: place
      ? {
          id: place.id,
          name: place.name,
          description: place.description,
        }
      : null,
    participatingPeople: scene.persons.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      birthYear: p.birthYear,
      deathYear: p.deathYear,
    })),
    genealogicalAssertions: genealogicalAssertions.map((a) => ({
      id: a.id,
      valueJson: a.valueJson,
      confidence: a.confidence,
      recordType: a.recordType,
      narrativePreferred: a.narrativePreferred,
      slot: {
        predicate: a.slot.predicate,
        subjectType: a.slot.subjectType,
        subjectId: a.slot.subjectId,
      },
    })),
    worldStateReference: worldStateReference
      ? {
          id: worldStateReference.id,
          eraId: worldStateReference.eraId,
          label: worldStateReference.label,
          description: worldStateReference.description,
          certainty: worldStateReference.certainty,
        }
      : null,
    beatPlan: scene.narrativeBeats.map((b) => ({
      orderIndex: b.orderIndex,
      label: b.label,
      intentSummary: b.intentSummary,
      beatPlanJson: b.beatPlanJson ?? null,
      microbeatsJson: b.microbeatsJson ?? null,
    })),
    continuityNotes,
    privateNotes: scene.privateNotes,
    pinnedCognitionSessions,
    pinnedDecisionTraceSessions,
    linkedSimulationScenarios,
  };
}
