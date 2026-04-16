import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";
import { Book1RenderStabilityService } from "@/lib/services/book1-render-stability-service";

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });

  const chapterOutline = await readJson<Chapter1DeepOutline>(path.join(reportsDir, "book1-chapter-01-outline.json"));
  const chapterEvidencePack = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_evidence_pack.json"));
  const chapterLaw = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_law.json"));
  const chapterVoiceSpec = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_voice_spec.json"));
  const chapterCharacterHiddenHistories = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_character_hidden_histories.json"));
  const chapterEpicSimulation = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_epic_simulation.json"));
  const previousDraft = await readJson(path.join(reportsDir, "book1-chapter-01-draft.json"));
  const previousConsistencyReport = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_consistency_report.json"));
  const previousVoiceReport = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_voice_report.json"));
  const previousGapReport = await readJson(path.join(reportsDir, "book1-chapter-01-chapter_gap_report.json"));
  const previousAdversarialSummary = await readJson(path.join(reportsDir, "book1-chapter-01-adversarial-summary.json"));
  const characterConsoleSession = await readJson(path.join(reportsDir, "book1-character-console-session.json"));
  const lawConsoleSession = await readJson(path.join(reportsDir, "book1-law-console-session.json"));
  const feedbackMapPath = path.join(reportsDir, "book1-chapter-01-critic-feedback-map.json");
  const highFindingPlanPath = path.join(reportsDir, "book1-chapter-01-high-finding-reduction-plan.json");

  const canonicalInput = {
    chapterOutline,
    chapterEvidencePack,
    chapterLaw,
    chapterVoiceSpec,
    chapterCharacterHiddenHistories,
    chapterEpicSimulation,
    previousDraft,
    previousConsistencyReport,
    previousVoiceReport,
    previousGapReport,
    previousAdversarialSummary,
    characterConsoleSession,
    lawConsoleSession,
    ...(await exists(feedbackMapPath) ? { criticFeedbackMap: await readJson(feedbackMapPath) } : {}),
    ...(await exists(highFindingPlanPath) ? { highFindingReductionPlan: await readJson(highFindingPlanPath) } : {}),
    commitCanonical: false,
  };

  const report = new Book1RenderStabilityService().measure({
    canonicalInput,
    runCount: 4,
  });
  const outputPath = path.join(reportsDir, "book1-chapter-01-render-stability.json");
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");

  console.log(
    JSON.stringify(
      {
        chapter: 1,
        outputPath: path.relative(process.cwd(), outputPath).replace(/\\/g, "/"),
        runCount: report.runCount,
        stabilityScore: report.stabilityScore,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Chapter 1 render stability run failed.");
  console.error(error);
  process.exitCode = 1;
});
