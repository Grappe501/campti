import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";
import type { Book1EpicOutline } from "@/lib/services/book1-epic-outline-builder";
import { Book1OutlineDrivenChapterComposer } from "@/lib/services/book1-outline-driven-chapter-composer";
import {
  RUNTIME_ID_BOOK1_OUTLINE_DRAFT,
  assertClaimedAuthorityClass,
  createRuntimeAuthorityStamp,
  getDemoSafetyWarningBanner,
} from "@/lib/services/runtime-authority-registry-service";

function parseChapter(argv: string[]): number {
  const index = argv.indexOf("--chapter");
  if (index === -1) return 1;
  const value = argv[index + 1];
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) throw new Error("Invalid --chapter value. Use a positive integer.");
  return parsed;
}

async function main() {
  assertClaimedAuthorityClass(RUNTIME_ID_BOOK1_OUTLINE_DRAFT, "simulation_only");
  const runtimeAuthority = createRuntimeAuthorityStamp(RUNTIME_ID_BOOK1_OUTLINE_DRAFT);
  if (runtimeAuthority.requiresNonCanonicalDemoWarningBanner) {
    console.warn(getDemoSafetyWarningBanner(RUNTIME_ID_BOOK1_OUTLINE_DRAFT));
  }
  const prisma = new PrismaClient();
  try {
    const chapter = parseChapter(process.argv);
    const epicOutlinePath = path.join(process.cwd(), "reports", "book1-epic-outline.json");
    const chapterOutlinePath = path.join(process.cwd(), "reports", `book1-chapter-${String(chapter).padStart(2, "0")}-outline.json`);
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
    const chapterLabel = String(chapter).padStart(2, "0");
    const jsonPath = path.join(reportsDir, `book1-chapter-${chapterLabel}-draft.json`);
    const textPath = path.join(reportsDir, `book1-chapter-${chapterLabel}-draft.txt`);
    const authorityPath = path.join(reportsDir, `book1-chapter-${chapterLabel}-runtime-authority.json`);
    await writeFile(jsonPath, `${JSON.stringify(draft, null, 2)}\n`, "utf-8");
    await writeFile(textPath, `${draft.fullText}\n`, "utf-8");
    await writeFile(
      authorityPath,
      `${JSON.stringify(
        {
          runtimeAuthority,
          artifactScope: "draft_generation_output",
          canonicalArtifact: false,
        },
        null,
        2,
      )}\n`,
      "utf-8",
    );

    console.log(
      JSON.stringify(
        {
          chapter,
          jsonPath: path.relative(process.cwd(), jsonPath).replace(/\\/g, "/"),
          textPath: path.relative(process.cwd(), textPath).replace(/\\/g, "/"),
          authorityPath: path.relative(process.cwd(), authorityPath).replace(/\\/g, "/"),
          segmentDrafts: draft.segmentDrafts.length,
          title: draft.title,
          runtimeAuthority,
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
  console.error("Chapter generation failed.");
  console.error(error);
  process.exitCode = 1;
});
