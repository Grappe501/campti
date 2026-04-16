import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";
import { Book1OutlineReviewEngine } from "@/lib/services/book1-outline-review-engine";
import type { OutlineDrivenChapterDraft } from "@/lib/services/book1-outline-driven-chapter-composer";

async function main() {
  const chapterOutlinePath = path.join(process.cwd(), "reports", "book1-chapter-01-outline.json");
  const chapterDraftPath = path.join(process.cwd(), "reports", "book1-chapter-01-draft.json");
  const outline = JSON.parse(await readFile(chapterOutlinePath, "utf-8")) as Chapter1DeepOutline;
  const draft = JSON.parse(await readFile(chapterDraftPath, "utf-8")) as OutlineDrivenChapterDraft;

  const report = new Book1OutlineReviewEngine().review({
    outline,
    chapterDraft: draft,
  });
  const reviewSummary = {
    chapter: outline.chapter,
    generatedAt: report.generatedAt,
    scores: report.chapter1Summary,
  };

  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });
  const outputPath = path.join(reportsDir, "book1-chapter-01-review-report.json");
  const summaryPath = path.join(reportsDir, "book1-chapter-01-review-summary.json");
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  await writeFile(summaryPath, `${JSON.stringify(reviewSummary, null, 2)}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        outputPath: path.relative(process.cwd(), outputPath).replace(/\\/g, "/"),
        summaryPath: path.relative(process.cwd(), summaryPath).replace(/\\/g, "/"),
        chapterScores: report.chapter,
        chapter1Summary: report.chapter1Summary,
        sceneCount: report.scenes.length,
        paragraphCount: report.paragraphs.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Chapter 1 review failed.");
  console.error(error);
  process.exitCode = 1;
});
