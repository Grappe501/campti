import { prisma } from "@/lib/prisma";

export async function getSceneWithNarrativeHierarchy(sceneId: string) {
  return prisma.scene.findUnique({
    where: { id: sceneId },
    include: {
      chapter: {
        include: {
          book: { include: { epic: true, defaultWorldState: true } },
        },
      },
      places: true,
      persons: true,
      narrativeBeats: { orderBy: { orderIndex: "asc" } },
    },
  });
}
