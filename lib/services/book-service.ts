import { prisma } from "@/lib/prisma";

export async function getBookWithChapters(bookId: string) {
  return prisma.book.findUnique({
    where: { id: bookId },
    include: {
      epic: true,
      defaultWorldState: true,
      chapters: { orderBy: { sequenceInBook: "asc" } },
    },
  });
}
