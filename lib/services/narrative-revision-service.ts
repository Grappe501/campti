import {
  DependencyStrength,
  NarrativeAssemblyStatus,
  NarrativeDependencyConsumerKind,
  NarrativeDependencyProducerKind,
  RevisionJobKind,
  RevisionJobStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RegisterEdgeInput = {
  consumerKind: NarrativeDependencyConsumerKind;
  consumerId: string;
  producerKind: NarrativeDependencyProducerKind;
  producerId: string;
  strength?: DependencyStrength;
  inputSnapshotHash?: string | null;
};

/** Idempotent edge insert (same tuple replaces hash/strength). */
export async function registerDependencyEdge(input: RegisterEdgeInput) {
  const strength = input.strength ?? DependencyStrength.HARD;
  const existing = await prisma.narrativeDependencyEdge.findFirst({
    where: {
      consumerKind: input.consumerKind,
      consumerId: input.consumerId,
      producerKind: input.producerKind,
      producerId: input.producerId,
    },
  });
  if (existing) {
    return prisma.narrativeDependencyEdge.update({
      where: { id: existing.id },
      data: {
        strength,
        inputSnapshotHash: input.inputSnapshotHash ?? undefined,
      },
    });
  }
  return prisma.narrativeDependencyEdge.create({
    data: {
      consumerKind: input.consumerKind,
      consumerId: input.consumerId,
      producerKind: input.producerKind,
      producerId: input.producerId,
      strength,
      inputSnapshotHash: input.inputSnapshotHash ?? undefined,
    },
  });
}

/**
 * Replace all edges for one consumer (e.g. after re-running scene composition).
 * Call inside a transaction with other writes if needed.
 */
export async function replaceDependencyEdgesForConsumer(
  consumerKind: NarrativeDependencyConsumerKind,
  consumerId: string,
  edges: Omit<RegisterEdgeInput, "consumerKind" | "consumerId">[]
) {
  await prisma.narrativeDependencyEdge.deleteMany({
    where: { consumerKind, consumerId },
  });
  if (edges.length === 0) return [];
  return prisma.narrativeDependencyEdge.createMany({
    data: edges.map((e) => ({
      consumerKind,
      consumerId,
      producerKind: e.producerKind,
      producerId: e.producerId,
      strength: e.strength ?? DependencyStrength.HARD,
      inputSnapshotHash: e.inputSnapshotHash ?? undefined,
    })),
  });
}

export async function findConsumersForProducer(
  producerKind: NarrativeDependencyProducerKind,
  producerId: string
) {
  return prisma.narrativeDependencyEdge.findMany({
    where: { producerKind, producerId },
  });
}

export type AffectedSceneSummary = {
  sceneId: string;
  edgeIds: string[];
  hasHard: boolean;
};

/**
 * When a genealogical assertion or person fact changes: resolve downstream scene consumers.
 * Only SCENE consumers enqueue revision jobs by default.
 */
export async function summarizeAffectedScenes(
  producerKind: NarrativeDependencyProducerKind,
  producerId: string
): Promise<AffectedSceneSummary[]> {
  const edges = await findConsumersForProducer(producerKind, producerId);
  const byScene = new Map<string, { edgeIds: string[]; hasHard: boolean }>();
  for (const e of edges) {
    if (e.consumerKind !== NarrativeDependencyConsumerKind.SCENE) continue;
    const cur = byScene.get(e.consumerId) ?? { edgeIds: [], hasHard: false };
    cur.edgeIds.push(e.id);
    if (e.strength === DependencyStrength.HARD) cur.hasHard = true;
    byScene.set(e.consumerId, cur);
  }
  return [...byScene.entries()].map(([sceneId, v]) => ({
    sceneId,
    edgeIds: v.edgeIds,
    hasHard: v.hasHard,
  }));
}

export async function enqueueRevisionJobsForScenes(
  sceneIds: string[],
  kind: RevisionJobKind = RevisionJobKind.REEVALUATE_SCENE
) {
  const unique = [...new Set(sceneIds)];
  if (unique.length === 0) return { count: 0 };
  await prisma.revisionJob.createMany({
    data: unique.map((sceneId) => ({
      kind,
      status: RevisionJobStatus.PENDING,
      sceneId,
      payload: { reason: "upstream_producer_changed" } as object,
    })),
    skipDuplicates: false,
  });
  return { count: unique.length };
}

/**
 * After updating a genealogical assertion row: enqueue jobs for dependent scenes (HARD first in payload).
 * Caller runs after DB commit of assertion update.
 */
/**
 * Marks scene/chapter/book cached assembly stale when upstream facts or scene text change.
 */
export async function markNarrativeAssemblyStaleFromSceneIds(
  sceneIds: string[]
): Promise<{ sceneCount: number; chapterCount: number; bookCount: number }> {
  const unique = [...new Set(sceneIds)];
  if (unique.length === 0) {
    return { sceneCount: 0, chapterCount: 0, bookCount: 0 };
  }
  const now = new Date();
  const scenes = await prisma.scene.findMany({
    where: { id: { in: unique } },
    select: { id: true, chapterId: true },
  });
  const chapterIds = [...new Set(scenes.map((s) => s.chapterId))];
  const chapters = await prisma.chapter.findMany({
    where: { id: { in: chapterIds } },
    select: { id: true, bookId: true },
  });
  const bookIds = [...new Set(chapters.map((c) => c.bookId))];

  await prisma.$transaction([
    prisma.scene.updateMany({
      where: { id: { in: unique } },
      data: {
        narrativeAssemblyStatus: NarrativeAssemblyStatus.STALE,
        assemblyInvalidatedAt: now,
      },
    }),
    prisma.chapter.updateMany({
      where: { id: { in: chapterIds } },
      data: {
        narrativeAssemblyStatus: NarrativeAssemblyStatus.STALE,
        assemblyInvalidatedAt: now,
        readerAssembledText: null,
        assemblyContentHash: null,
      },
    }),
    prisma.book.updateMany({
      where: { id: { in: bookIds } },
      data: {
        narrativeAssemblyStatus: NarrativeAssemblyStatus.STALE,
        assemblyInvalidatedAt: now,
      },
    }),
  ]);

  return {
    sceneCount: unique.length,
    chapterCount: chapterIds.length,
    bookCount: bookIds.length,
  };
}

export async function onGenealogicalAssertionChanged(assertionId: string) {
  const affected = await summarizeAffectedScenes(
    NarrativeDependencyProducerKind.GENEALOGICAL_ASSERTION,
    assertionId
  );
  const allSceneIds = affected.map((a) => a.sceneId);
  const hard = affected.filter((a) => a.hasHard).map((a) => a.sceneId);
  const softOnly = affected.filter((a) => !a.hasHard).map((a) => a.sceneId);

  const stale = await markNarrativeAssemblyStaleFromSceneIds(allSceneIds);

  const [hardN, softN] = await Promise.all([
    hard.length
      ? enqueueRevisionJobsForScenes(hard, RevisionJobKind.REGENERATE_SCENE_AI)
      : Promise.resolve({ count: 0 }),
    softOnly.length
      ? enqueueRevisionJobsForScenes(
          softOnly,
          RevisionJobKind.CONTINUITY_CHECK
        )
      : Promise.resolve({ count: 0 }),
  ]);
  return {
    assertionId,
    affectedSceneCount: affected.length,
    jobsEnqueued: hardN.count + softN.count,
    hardSceneIds: hard,
    softSceneIds: softOnly,
    assemblyStale: stale,
  };
}
