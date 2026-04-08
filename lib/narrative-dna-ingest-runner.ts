import { isNarrativeDnaIngestionEligible } from "@/lib/ingestion-constants";
import {
  isSectionXiiiInternalSourceId,
  SECTION_XIII_ENNEAGRAM_SOURCE_ID,
} from "@/lib/narrative-dna-guide-constants";
import { extractFullNarrativeDna } from "@/lib/narrative-dna-extractor";
import { persistNarrativeDnaExtraction } from "@/lib/narrative-dna-persist";
import {
  applySectionXiiiInternalCharacterGuide,
  extractSectionXiiiCharacterEntries,
} from "@/lib/section-xiii-internal";
import { prisma } from "@/lib/prisma";

export type IngestRunnerResult =
  | { ok: true; mode: "standard_dna" | "section_xiii_internal" }
  | { ok: false; error: string };

/**
 * Shared pipeline for admin + CLI: eligibility, text load, extract, persist.
 */
export async function ingestGuideNarrativeDnaForSource(sourceId: string): Promise<IngestRunnerResult> {
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    include: { sourceText: true },
  });
  if (!source) return { ok: false, error: "Source not found." };
  if (!isNarrativeDnaIngestionEligible(source)) {
    return {
      ok: false,
      error: "Narrative DNA mode requires archive status reviewed and ingestion ready unchecked.",
    };
  }

  const text =
    source.sourceText?.normalizedText?.trim() ||
    source.sourceText?.rawText?.trim() ||
    "";
  if (!text) return { ok: false, error: "No source text to extract." };

  if (isSectionXiiiInternalSourceId(sourceId)) {
    const entries = await extractSectionXiiiCharacterEntries(text);
    const processingNotes = [
      "Section XIII internal character guide (no public DNA rows).",
      entries.length ? `Parsed ${entries.length} character entries.` : "No structured entries returned.",
    ].join("\n");

    await prisma.$transaction(async (tx) => {
      await applySectionXiiiInternalCharacterGuide(tx, SECTION_XIII_ENNEAGRAM_SOURCE_ID, entries);
      await tx.source.update({
        where: { id: sourceId },
        data: {
          ingestionStatus: "dna_section_xiii_internal",
          processingNotes,
        },
      });
    });
    return { ok: true, mode: "section_xiii_internal" };
  }

  const dna = await extractFullNarrativeDna(text, { useOpenAI: true });
  const processingNotes = [`Narrative DNA extraction (${dna.extractionMode}).`, ...dna.warnings].join("\n");

  await prisma.$transaction(async (tx) => {
    await persistNarrativeDnaExtraction(tx, sourceId, source, dna);
    await tx.source.update({
      where: { id: sourceId },
      data: {
        ingestionStatus: "dna_extracted",
        processingNotes,
      },
    });
  });

  return { ok: true, mode: "standard_dna" };
}
