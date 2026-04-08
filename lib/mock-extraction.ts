import type { Source } from "@prisma/client";
import { RecordType, VisibilityStatus } from "@prisma/client";
import type { ExtractionResultShape } from "@/lib/ingestion-contracts";

/**
 * Deterministic fake extraction for pipeline testing (no AI).
 */
export function buildMockExtractionResult(source: Source): ExtractionResultShape {
  const excerpt =
    source.summary?.slice(0, 200) ??
    source.notes?.slice(0, 200) ??
    "No summary or notes on the source; mock still emits sample rows.";

  return {
    summaryDraft: `Mock extraction for “${source.title}”. ${excerpt}`,
    peopleDraft: [
      {
        kind: "person",
        name: "Alexis Grappe",
        summary: "Central family member referenced in this source.",
        confidence: 4,
        sourceExcerpt: excerpt,
        recordTypeSuggestion: source.recordType,
        visibilitySuggestion: VisibilityStatus.PRIVATE,
      },
    ],
    placesDraft: [
      {
        kind: "place",
        name: "Campti",
        summary: "Small Louisiana town; recurring setting.",
        confidence: 5,
        sourceExcerpt: excerpt,
        recordTypeSuggestion: RecordType.HISTORICAL,
        visibilitySuggestion: VisibilityStatus.PUBLIC,
      },
    ],
    eventsDraft: [
      {
        kind: "event",
        title: "Family gathering (mock)",
        description: "Placeholder event derived from source metadata.",
        confidence: 2,
        notes: "Low confidence — verify against primary records.",
        recordTypeSuggestion: RecordType.ORAL_HISTORY,
      },
    ],
    symbolsDraft: [
      {
        kind: "symbol",
        name: "Smoke",
        summary: "Signal and memory across generations (mock).",
        confidence: 3,
        categorySuggestion: "element",
      },
    ],
    claimsDraft: [
      {
        kind: "claim",
        description:
          "Buford Grappe lost his arm in a hunting accident.",
        summary: "Buford Grappe lost his arm in a hunting accident.",
        confidence: 3,
        sourceExcerpt: excerpt,
        recordTypeSuggestion: RecordType.HYBRID,
      },
    ],
    chaptersDraft: [
      {
        kind: "chapter",
        title: "Mock chapter hook",
        summary: "Narrative chapter suggestion from source context.",
        confidence: 2,
      },
    ],
    scenesDraft: [
      {
        kind: "scene",
        title: "Mock scene beat",
        summary: "A single beat suggested for drafting.",
        chapterTitleHint: "Mock chapter hook",
        confidence: 2,
      },
    ],
    questionsDraft: [
      {
        kind: "open_question",
        title: "What primary record confirms the key claim in this source?",
        description: "Trace citations before treating as fact.",
        confidence: 3,
        priority: 2,
      },
    ],
    continuityDraft: [
      {
        kind: "continuity",
        title: "Verify timeline alignment with adjacent chapters",
        description: "Mock continuity check from ingestion.",
        confidence: 2,
        severitySuggestion: "medium",
        statusSuggestion: "open",
      },
    ],
  };
}
