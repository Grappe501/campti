import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { Book1DecisionPanelService } from "@/lib/services/book1-decision-panel-service";

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function main() {
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });

  const panel = new Book1DecisionPanelService().build({
    canonicalArtifacts: {
      chapterDraftPath: "reports/book1-chapter-01-chapter_draft.json",
      chapterLawPath: "reports/book1-chapter-01-chapter_law.json",
      chapterVoiceSpecPath: "reports/book1-chapter-01-chapter_voice_spec.json",
      chapterEvidencePackPath: "reports/book1-chapter-01-chapter_evidence_pack.json",
    },
    latestRegeneratedDraftPath: "reports/book1-chapter-01-regenerated-draft.json",
    characterConsoleSession: await readJson(path.join(reportsDir, "book1-character-console-session.json")),
    lawConsoleSession: await readJson(path.join(reportsDir, "book1-law-console-session.json")),
    regenerationSummary: await readJson(path.join(reportsDir, "book1-chapter-01-regeneration-summary.json")),
    regenerationDiff: await readJson(path.join(reportsDir, "book1-chapter-01-regeneration-diff.json")),
    consistencyReport: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_consistency_report.json")),
    voiceReport: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_voice_report.json")),
    gapReport: await readJson(path.join(reportsDir, "book1-chapter-01-chapter_gap_report.json")),
    adversarialSummary: await readJson(path.join(reportsDir, "book1-chapter-01-adversarial-summary.json")),
  });

  const outputPath = path.join(reportsDir, "book1-chapter-01-decision-panel.json");
  await writeFile(outputPath, `${JSON.stringify(panel, null, 2)}\n`, "utf-8");
  const panelRecord = panel as Record<string, unknown>;

  console.log(
    JSON.stringify(
      {
        chapter: 1,
        outputPath: path.relative(process.cwd(), outputPath).replace(/\\/g, "/"),
        chapterStatus: panelRecord.chapterStatus,
        finalRecommendation: panelRecord.finalRecommendation,
        temporalIntegrityRisk: panelRecord.temporalIntegrityRisk,
        voiceIdentityRisk: panelRecord.voiceIdentityRisk,
        characterInteriorBlendingRisk: panelRecord.characterInteriorBlendingRisk,
        abstractionLeakRisk: panelRecord.abstractionLeakRisk,
        enneagramOverexposureRisk: panelRecord.enneagramOverexposureRisk,
        behaviorMediationQuality: panelRecord.behaviorMediationQuality,
        proseTheorizationRisk: panelRecord.proseTheorizationRisk,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Chapter 1 decision panel build failed.");
  console.error(error);
  process.exitCode = 1;
});
