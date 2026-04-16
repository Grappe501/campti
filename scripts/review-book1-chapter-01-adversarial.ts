import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Chapter1DeepOutline } from "@/lib/services/book1-chapter1-deep-outline-generator";
import { Book1ChapterAdversarialReviewService } from "@/lib/services/book1-chapter-adversarial-review-service";
import type { ChapterDraft } from "@/lib/services/book1-latent-epic-chapter-service";

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

type RegeneratedDraftLike = {
  chapter: number;
  title: string;
  segmentDrafts: Array<{ segment: number; text: string }>;
  fullText: string;
};

function toChapterDraft(draft: RegeneratedDraftLike): ChapterDraft {
  return {
    artifact: "chapter_draft",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: new Date().toISOString(),
    composerInputs: [
      "chapter_law",
      "chapter_evidence_pack",
      "chapter_voice_contract",
      "chapter_prose_briefs",
      "chapter_lived_history",
      "chapter_cognition_signatures",
      "chapter_segment_simulation_state",
      "chapter_thought_recurrence_guard",
      "chapter_motive_compression",
      "chapter_character_distinction_plan",
      "chapter_enneagram_consciousness_engine",
      "chapter_abstract_fear_suppression",
      "chapter_entry_strategy_plan",
      "chapter_paragraph_shape_plan",
      "chapter_embodiment_assembly_adjustments",
      "chapter_transition_texture_plan",
      "chapter_voice_engine_rulebook",
      "chapter_narrative_distance_plan",
      "chapter_abstraction_suppression",
      "chapter_voice_cognition_map",
      "chapter_perspective_routing_plan",
      "chapter_voice_law_engine",
      "chapter_language_suppression_map",
      "chapter_render_directives",
      "chapter_consciousness_cohesion_router",
      "chapter_voice_identity_stabilizer",
      "chapter_embodied_inner_life_router",
      "chapter_sentence_pattern_plan",
      "chapter_segment_energy",
      "chapter_embodiment_packets",
    ],
    title: draft.title,
    segments: draft.segmentDrafts.map((segment) => ({
      segment: segment.segment,
      objective: "scene embodiment",
      text: segment.text,
      evidenceRefs: [],
    })),
    fullText: draft.fullText,
  };
}

async function main() {
  const reportsDir = path.join(process.cwd(), "reports");
  const chapterDraftPath = path.join(reportsDir, "book1-chapter-01-chapter_draft.json");
  const regeneratedDraftPath = path.join(reportsDir, "book1-chapter-01-regenerated-draft.json");
  const outlinePath = path.join(reportsDir, "book1-chapter-01-outline.json");
  const chapterDraft = (await exists(regeneratedDraftPath))
    ? toChapterDraft(JSON.parse(await readFile(regeneratedDraftPath, "utf-8")) as RegeneratedDraftLike)
    : (JSON.parse(await readFile(chapterDraftPath, "utf-8")) as ChapterDraft);
  const outline = JSON.parse(await readFile(outlinePath, "utf-8")) as Chapter1DeepOutline;

  const review = new Book1ChapterAdversarialReviewService().run({
    chapterDraft,
    outline,
  });

  await mkdir(reportsDir, { recursive: true });
  const voicePath = path.join(reportsDir, "book1-chapter-01-voice-critic.json");
  const historicalPath = path.join(reportsDir, "book1-chapter-01-historical-critic.json");
  const novelPath = path.join(reportsDir, "book1-chapter-01-novel-critic.json");
  const proseShapePath = path.join(reportsDir, "book1-chapter-01-prose-shape-critic.json");
  const proseShapeSummaryPath = path.join(reportsDir, "book1-chapter-01-prose-shape-summary.json");
  const segmentFailureCounts = review.proseShapeCritic.findings
    .filter((row) => row.segment !== null)
    .reduce<Record<string, number>>((acc, row) => {
      const key = String(row.segment);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  const maxSegmentFailures = Math.max(0, ...Object.values(segmentFailureCounts));
  const categoryCounts = review.proseShapeCritic.findings.reduce<Record<string, number>>((acc, row) => {
    const category = row.category ?? "uncategorized";
    acc[category] = (acc[category] ?? 0) + 1;
    return acc;
  }, {});
  const mostCommonFailurePattern =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const segmentsWithMostFailures = Object.entries(segmentFailureCounts)
    .filter(([, count]) => count === maxSegmentFailures && count > 0)
    .map(([segment]) => Number(segment))
    .sort((a, b) => a - b);
  const positionCounts = review.proseShapeCritic.findings.reduce<Record<string, number>>((acc, row) => {
    const position = row.position ?? "unknown";
    acc[position] = (acc[position] ?? 0) + 1;
    return acc;
  }, {});
  const failureCluster =
    (positionCounts.start ?? 0) > (positionCounts.middle ?? 0) && (positionCounts.start ?? 0) > (positionCounts.transition ?? 0)
      ? "starts"
      : (positionCounts.middle ?? 0) > (positionCounts.start ?? 0) && (positionCounts.middle ?? 0) > (positionCounts.transition ?? 0)
        ? "middles"
        : (positionCounts.transition ?? 0) > (positionCounts.start ?? 0) && (positionCounts.transition ?? 0) > (positionCounts.middle ?? 0)
          ? "transitions"
          : "mixed";
  const summaryPath = path.join(reportsDir, "book1-chapter-01-adversarial-summary.json");
  const proseShapeSummary = {
    artifact: "chapter_prose_shape_summary",
    schemaVersion: "1.0.0",
    chapter: 1,
    generatedAt: review.proseShapeCritic.generatedAt,
    mostCommonFailurePattern,
    segmentsWithMostFailures,
    failureCluster,
    totalsByCategory: categoryCounts,
  };
  await Promise.all([
    writeFile(voicePath, `${JSON.stringify(review.voiceCritic, null, 2)}\n`, "utf-8"),
    writeFile(historicalPath, `${JSON.stringify(review.historicalCritic, null, 2)}\n`, "utf-8"),
    writeFile(novelPath, `${JSON.stringify(review.novelCritic, null, 2)}\n`, "utf-8"),
    writeFile(proseShapePath, `${JSON.stringify(review.proseShapeCritic, null, 2)}\n`, "utf-8"),
    writeFile(proseShapeSummaryPath, `${JSON.stringify(proseShapeSummary, null, 2)}\n`, "utf-8"),
    writeFile(summaryPath, `${JSON.stringify(review.summary, null, 2)}\n`, "utf-8"),
  ]);

  console.log(
    JSON.stringify(
      {
        outputs: [
          path.relative(process.cwd(), voicePath).replace(/\\/g, "/"),
          path.relative(process.cwd(), historicalPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), novelPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), proseShapePath).replace(/\\/g, "/"),
          path.relative(process.cwd(), proseShapeSummaryPath).replace(/\\/g, "/"),
          path.relative(process.cwd(), summaryPath).replace(/\\/g, "/"),
        ],
        releaseDecision: review.summary.releaseDecision,
        severityTotals: review.summary.severityTotals,
        rerunChapterReview: review.summary.rerunChapterReview,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Adversarial review failed.");
  console.error(error);
  process.exitCode = 1;
});
