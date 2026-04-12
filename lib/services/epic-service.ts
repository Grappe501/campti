import { prisma } from "@/lib/prisma";

export async function getEpicWithBooks(epicId: string) {
  return prisma.epic.findUnique({
    where: { id: epicId },
    include: {
      books: { orderBy: { movementIndex: "asc" } },
      defaultWorldState: true,
    },
  });
}

export async function listEpics() {
  return prisma.epic.findMany({ orderBy: { updatedAt: "desc" } });
}
