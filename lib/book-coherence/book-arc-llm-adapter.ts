import { z } from "zod";

import type { BookCoherenceReport } from "@/lib/domain/book-coherence";
import type { BookArcGuidanceV1 } from "@/lib/domain/book-coherence";
import { BOOK_ARC_GUIDANCE_VERSION } from "@/lib/domain/book-coherence";
import type { MovementCoherenceReport } from "@/lib/domain/book-coherence";
import { getConfiguredModelName, getOpenAIClient, isOpenAIApiKeyConfigured } from "@/lib/openai";

const guidanceSchema = z.object({
  contractVersion: z.literal(BOOK_ARC_GUIDANCE_VERSION),
  explanations: z.array(z.string()),
  restructuringSuggestions: z.array(z.string()),
  missingChapterTypes: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  modelNotes: z.string().nullable(),
});

function compactBookReport(report: BookCoherenceReport): string {
  return JSON.stringify(
    {
      bookId: report.bookId,
      title: report.bookTitle,
      chapterCount: report.chapterCount,
      overallCoherenceScore: report.overallCoherenceScore,
      arcPhaseDistribution: report.arcPhaseDistribution,
      chapterContributions: report.chapterContributions.map((c) => ({
        id: c.chapterId,
        seq: c.sequenceInBook,
        phase: c.classifiedPhase,
        tension: c.tensionMean,
        reveals: c.revealHitsTotal,
        coherence: c.chapterCoherenceScore,
      })),
      tensions: report.tensionCurveSummary,
      reveals: report.revealCurveSummary,
      pacing: report.pacingAssessment,
      issues: report.coherenceIssues.map((i) => ({
        code: i.code,
        severity: i.severity,
        message: i.message,
      })),
    },
    null,
    0
  );
}

/**
 * Advisory narrative guidance only. Does not rewrite chapters or reorder rows.
 */
export async function explainBookArcWithModel(bookReport: BookCoherenceReport): Promise<BookArcGuidanceV1 | null> {
  if (!isOpenAIApiKeyConfigured()) return null;

  const client = getOpenAIClient();
  const model = getConfiguredModelName();
  const user = [
    "You are a fiction editor for multi-chapter books.",
    "Ground every suggestion in the JSON inputs. Do not invent facts.",
    "Output ONE JSON object only. No markdown.",
    "Do not claim to rewrite prose; suggestions are structural.",
    "",
    compactBookReport(bookReport),
  ].join("\n");

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content: `JSON only. Schema: contractVersion "${BOOK_ARC_GUIDANCE_VERSION}", explanations[], restructuringSuggestions[], missingChapterTypes[], confidence 0-1, modelNotes|null.`,
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
      contractVersion: BOOK_ARC_GUIDANCE_VERSION,
      explanations: ["Model returned non-JSON."],
      restructuringSuggestions: [],
      missingChapterTypes: [],
      confidence: 0,
      modelNotes: raw.slice(0, 800),
    };
  }

  const parsedGuidance = guidanceSchema.safeParse(parsed);
  if (!parsedGuidance.success) {
    return {
      contractVersion: BOOK_ARC_GUIDANCE_VERSION,
      explanations: ["Model output failed validation."],
      restructuringSuggestions: [],
      missingChapterTypes: [],
      confidence: 0,
      modelNotes: JSON.stringify(parsedGuidance.error.flatten()).slice(0, 1200),
    };
  }

  return parsedGuidance.data;
}

export async function explainEpicMovementArcWithModel(
  movementReport: MovementCoherenceReport
): Promise<BookArcGuidanceV1 | null> {
  if (!isOpenAIApiKeyConfigured()) return null;

  const client = getOpenAIClient();
  const model = getConfiguredModelName();
  const user = [
    "You are a fiction editor for multi-movement epics.",
    "Each movement is a Book in the data model. Do not invent plot facts.",
    "Output ONE JSON object only. Same schema as book arc guidance.",
    "",
    JSON.stringify(
      {
        scope: movementReport.scope,
        epicId: movementReport.epicId,
        bookId: movementReport.bookId,
        overallScore: movementReport.overallCoherenceScore,
        movements: movementReport.movements.map((m) => ({
          id: m.movementId,
          label: m.label,
          chapterCount: m.chapterCount,
          score: m.overallCoherenceScore,
          phases: m.arcPhaseDistribution,
        })),
        issues: movementReport.coherenceIssues.slice(0, 24),
      },
      null,
      0
    ),
  ].join("\n");

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content: `JSON only. Schema: contractVersion "${BOOK_ARC_GUIDANCE_VERSION}", explanations[], restructuringSuggestions[], missingChapterTypes[], confidence 0-1, modelNotes|null.`,
      },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  try {
    const parsed = guidanceSchema.parse(JSON.parse(raw));
    return parsed;
  } catch {
    return {
      contractVersion: BOOK_ARC_GUIDANCE_VERSION,
      explanations: ["Model returned invalid JSON for epic/movement guidance."],
      restructuringSuggestions: [],
      missingChapterTypes: [],
      confidence: 0,
      modelNotes: raw.slice(0, 800),
    };
  }
}
