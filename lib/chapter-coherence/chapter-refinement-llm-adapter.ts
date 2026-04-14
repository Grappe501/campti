import { z } from "zod";

import type { ChapterCoherenceReport } from "@/lib/domain/chapter-coherence";
import type { ChapterRefinementGuidanceV1 } from "@/lib/domain/chapter-coherence";
import { CHAPTER_REFINEMENT_GUIDANCE_VERSION } from "@/lib/domain/chapter-coherence";
import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";

const guidanceSchema = z.object({
  contractVersion: z.literal(CHAPTER_REFINEMENT_GUIDANCE_VERSION),
  explanations: z.array(z.string()),
  suggestedSceneReorderIds: z.array(z.string()).nullable(),
  transitionEmphasis: z.array(
    z.object({
      afterSceneId: z.string(),
      emphasis: z.string(),
    })
  ),
  missingScenePurpose: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  modelNotes: z.string().nullable(),
});

function compactReportForPrompt(report: ChapterCoherenceReport): string {
  return JSON.stringify(
    {
      chapterId: report.chapterId,
      title: report.title,
      sceneCount: report.sceneCount,
      overallCoherenceScore: report.overallCoherenceScore,
      orderedSceneIds: report.sceneOrderSummary.orderedSceneIds,
      issues: report.coherenceIssues.map((i) => ({
        code: i.code,
        severity: i.severity,
        message: i.message,
        sceneIds: i.sceneIds,
      })),
      transitions: report.transitionAssessments.pairs.map((p) => ({
        prev: p.prevSceneId,
        next: p.nextSceneId,
        abrupt: p.abrupt,
        overlap: p.lexicalOverlap,
      })),
      rhythm: {
        beatRun: report.rhythmAssessment.longestRepeatedBeatRun,
        flatTension: report.rhythmAssessment.flatTensionCurve,
      },
      reveal: {
        tooEarly: report.revealAssessment.revealTooEarly,
        crowdedLate: report.revealAssessment.crowdedLateReveals,
      },
      opening: report.openingAssessment,
      ending: report.endingAssessment,
    },
    null,
    0
  );
}

/**
 * Author-facing guidance only. Grounded in the deterministic report; does not rewrite chapter prose.
 * Returns null when no API key (caller should treat as disabled).
 */
export async function explainChapterCoherenceWithModel(
  report: ChapterCoherenceReport
): Promise<ChapterRefinementGuidanceV1 | null> {
  if (!isOpenAIApiKeyConfigured()) return null;

  const client = getOpenAIClient();
  const model = getConfiguredModelName();
  const user = [
    "You are a fiction editor inside an authoring tool.",
    "Given the JSON coherence report, output ONE JSON object matching the schema.",
    "Do not rewrite scene or chapter prose. Suggest structure and transitions only.",
    "Suggested reorder must be a permutation of orderedSceneIds when provided; otherwise null.",
    "No markdown fences.",
    "",
    "REPORT_JSON:",
    compactReportForPrompt(report),
  ].join("\n");

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content: [
          "Output JSON only.",
          `Schema contractVersion must be "${CHAPTER_REFINEMENT_GUIDANCE_VERSION}".`,
          "Fields: explanations[], suggestedSceneReorderIds|null, transitionEmphasis[{afterSceneId, emphasis}], missingScenePurpose|null, confidence 0-1, modelNotes|null.",
        ].join(" "),
      },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      contractVersion: CHAPTER_REFINEMENT_GUIDANCE_VERSION,
      explanations: ["Model returned non-JSON; check logs."],
      suggestedSceneReorderIds: null,
      transitionEmphasis: [],
      missingScenePurpose: null,
      confidence: 0,
      modelNotes: raw.slice(0, 800),
    };
  }

  const parsedGuidance = guidanceSchema.safeParse(parsed);
  if (!parsedGuidance.success) {
    return {
      contractVersion: CHAPTER_REFINEMENT_GUIDANCE_VERSION,
      explanations: ["Model JSON failed validation against the guidance schema."],
      suggestedSceneReorderIds: null,
      transitionEmphasis: [],
      missingScenePurpose: null,
      confidence: 0,
      modelNotes: JSON.stringify(parsedGuidance.error.flatten()).slice(0, 1200),
    };
  }

  return parsedGuidance.data;
}

const summarySchema = z.object({
  contractVersion: z.literal("chapter-summary-rewrite-v1"),
  generatedSummary: z.string().max(12000),
});

/**
 * Produces replacement text for `Chapter.generatedSummary` only (never `humanEditedSummary`).
 */
export async function suggestChapterSummaryRewriteWithModel(input: {
  chapterTitle: string;
  sceneSummaries: string[];
  coherenceReport: ChapterCoherenceReport;
}): Promise<string | null> {
  if (!isOpenAIApiKeyConfigured()) return null;

  const client = getOpenAIClient();
  const model = getConfiguredModelName();
  const user = [
    "Write a concise chapter synopsis (planning copy) from scene summaries and coherence signals.",
    "Do not invent plot facts beyond the inputs. 2–5 short paragraphs max.",
    "Output JSON: { \"contractVersion\": \"chapter-summary-rewrite-v1\", \"generatedSummary\": \"...\" }",
    "",
    JSON.stringify(
      {
        chapterTitle: input.chapterTitle,
        sceneSummaries: input.sceneSummaries,
        coherence: {
          score: input.coherenceReport.overallCoherenceScore,
          issues: input.coherenceReport.coherenceIssues.slice(0, 12).map((i) => i.message),
        },
      },
      null,
      0
    ),
  ].join("\n");

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    messages: [
      { role: "system", content: "Output JSON only. No markdown." },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  try {
    const parsed = summarySchema.parse(JSON.parse(raw));
    return parsed.generatedSummary.trim();
  } catch {
    return null;
  }
}
