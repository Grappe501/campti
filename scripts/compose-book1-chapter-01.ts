import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";
import type { Book1EpicOutline } from "@/lib/services/book1-epic-outline-builder";
import { Book1OutlineDrivenChapterComposer } from "@/lib/services/book1-outline-driven-chapter-composer";

async function main() {
  const prisma = new PrismaClient();
  try {
    const epicOutlinePath = path.join(process.cwd(), "reports", "book1-epic-outline.json");
    const chapterOutlinePath = path.join(process.cwd(), "reports", "book1-chapter-01-outline.json");
    const epicOutline = JSON.parse(await readFile(epicOutlinePath, "utf-8")) as Book1EpicOutline;
    const chapterOutline = JSON.parse(await readFile(chapterOutlinePath, "utf-8")) as Chapter1DeepOutline;
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
    });

    const draft = new Book1OutlineDrivenChapterComposer().compose({
      chapterOutline,
      epicOutline,
      knowledgeNodes,
    });

    const reportsDir = path.join(process.cwd(), "reports");
    await mkdir(reportsDir, { recursive: true });
    const jsonPath = path.join(reportsDir, "book1-chapter-01-draft.json");
    const textPath = path.join(reportsDir, "book1-chapter-01-draft.txt");
    await writeFile(jsonPath, `${JSON.stringify(draft, null, 2)}\n`, "utf-8");
    await writeFile(textPath, `${draft.fullText}\n`, "utf-8");

    console.log(
      JSON.stringify(
        {
          jsonPath: path.relative(process.cwd(), jsonPath).replace(/\\/g, "/"),
          textPath: path.relative(process.cwd(), textPath).replace(/\\/g, "/"),
          chapter: draft.chapter,
          segmentDrafts: draft.segmentDrafts.length,
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
  console.error("Chapter 1 composition failed.");
  console.error(error);
  process.exitCode = 1;
});
