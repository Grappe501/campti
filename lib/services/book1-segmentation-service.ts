import { evaluateBoundary } from "@/lib/services/book1-boundary-enforcement-service";
import type { Book1ProvisionalSegment } from "@/lib/services/book1-ingestion-scaffold";

const CATEGORY_ORDER: Book1ProvisionalSegment["category"][] = [
  "timeline_fact",
  "lineage_fact",
  "symbolic_motif",
  "observer_passage",
  "interpretive_passage",
  "setting_passage",
  "scene_fragment",
  "atomic_claim",
];

function normalizeParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/g)
    .map((block) => block.trim())
    .filter(Boolean);
}

function categoryLabel(category: Book1ProvisionalSegment["category"]): string {
  return category.replace(/_/g, " ");
}

export class DeterministicBook1SegmentationPipeline {
  async segment(input: { sourceId: string; sourceText: string }): Promise<Book1ProvisionalSegment[]> {
    const paragraphs = normalizeParagraphs(input.sourceText);
    const provisional: Book1ProvisionalSegment[] = [];
    let offsetCursor = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const text = paragraphs[i];
      const boundary = evaluateBoundary(text);
      const category = boundary.inferredCategory;
      const startOffset = input.sourceText.indexOf(text, offsetCursor);
      const endOffset = startOffset >= 0 ? startOffset + text.length : undefined;
      if (startOffset >= 0) offsetCursor = endOffset ?? offsetCursor;

      provisional.push({
        provisionalKey: `${input.sourceId}-seg-${String(i + 1).padStart(3, "0")}`,
        category,
        textContent: text,
        startOffset: startOffset >= 0 ? startOffset : undefined,
        endOffset,
        label: `${categoryLabel(category)} (${boundary.confidenceBand})`,
      });
    }

    if (provisional.length === 0) {
      provisional.push({
        provisionalKey: `${input.sourceId}-seg-001`,
        category: "atomic_claim",
        textContent: input.sourceText.trim(),
        label: "atomic claim",
      });
    }

    provisional.sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
        (a.startOffset ?? 0) - (b.startOffset ?? 0),
    );
    return provisional;
  }
}
