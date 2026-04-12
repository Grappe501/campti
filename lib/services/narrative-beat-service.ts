import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listNarrativeBeatsForScene(sceneId: string) {
  return prisma.narrativeBeat.findMany({
    where: { sceneId },
    orderBy: { orderIndex: "asc" },
  });
}

export async function upsertNarrativeBeatOrder(
  sceneId: string,
  beats: Array<{
    orderIndex: number;
    label?: string | null;
    intentSummary?: string | null;
    beatPlanJson?: unknown;
    microbeatsJson?: unknown;
    worldStateOverrideId?: string | null;
  }>
) {
  return prisma.$transaction(async (tx) => {
    await tx.narrativeBeat.deleteMany({ where: { sceneId } });
    if (beats.length === 0) return [];
    await tx.narrativeBeat.createMany({
      data: beats.map((b) => ({
        sceneId,
        orderIndex: b.orderIndex,
        label: b.label ?? undefined,
        intentSummary: b.intentSummary ?? undefined,
        beatPlanJson:
          b.beatPlanJson !== undefined
            ? (b.beatPlanJson as Prisma.InputJsonValue)
            : undefined,
        microbeatsJson:
          b.microbeatsJson !== undefined
            ? (b.microbeatsJson as Prisma.InputJsonValue)
            : undefined,
        worldStateOverrideId: b.worldStateOverrideId ?? undefined,
      })),
    });
    return tx.narrativeBeat.findMany({
      where: { sceneId },
      orderBy: { orderIndex: "asc" },
    });
  });
}
