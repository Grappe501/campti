/**
 * Census research bundle — query helpers for story assembly / AI context (alongside SourceChunk RAG).
 */
import { prisma } from "./prisma";
import { CAMPTI_CENSUS_DATASET_ID } from "./census-research";
import { normalizeCensusLabel } from "./census-research-normalize";

export type CensusStoryAssemblyHit = {
  entryId: string;
  externalEntryId: number;
  normalizedLabel: string;
  displayName: string | null;
  docPageCode: string | null;
  pageType: string | null;
  roleGuess: string | null;
  rawEntryExcerpt: string;
};

const DEFAULT_STORY_SUMMARY =
  "French colonial Louisiana census OCR (1699–1732 era excerpts): habitants, officers, household counts, " +
  "and enslaved persons as transcribed from Charles R. Maduell-style tables. Use for historical grounding only; " +
  "verify against primary sources.";

/** Full-text-ish search over structured census rows (normalized + raw). */
export async function searchCensusResearchForStoryAssembly(
  query: string,
  take = 24,
): Promise<CensusStoryAssemblyHit[]> {
  const q = query.trim();
  if (!q) return [];

  const n = normalizeCensusLabel(q);
  const rows = await prisma.censusResearchEntry.findMany({
    where: {
      datasetId: CAMPTI_CENSUS_DATASET_ID,
      OR: [
        { normalizedLabel: { contains: n, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
        { rawEntry: { contains: q, mode: "insensitive" } },
        { roleGuess: { contains: q, mode: "insensitive" } },
      ],
    },
    take,
    orderBy: { externalEntryId: "asc" },
    select: {
      id: true,
      externalEntryId: true,
      normalizedLabel: true,
      displayName: true,
      docPageCode: true,
      pageType: true,
      roleGuess: true,
      rawEntry: true,
    },
  });

  return rows.map((r) => ({
    entryId: r.id,
    externalEntryId: r.externalEntryId,
    normalizedLabel: r.normalizedLabel,
    displayName: r.displayName,
    docPageCode: r.docPageCode,
    pageType: r.pageType,
    roleGuess: r.roleGuess,
    rawEntryExcerpt: excerpt(r.rawEntry, 480),
  }));
}

function excerpt(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/** Compact block for system / tool prompts (deterministic, no model call). */
export async function buildCensusResearchStoryAssemblyContextBlock(options?: {
  maxEntries?: number;
  maxPageSnippets?: number;
  ocrSnippetChars?: number;
}): Promise<string> {
  const maxEntries = options?.maxEntries ?? 40;
  const maxPageSnippets = options?.maxPageSnippets ?? 8;
  const ocrSnippetChars = options?.ocrSnippetChars ?? 600;

  const ds = await prisma.censusResearchDataset.findUnique({
    where: { id: CAMPTI_CENSUS_DATASET_ID },
    select: {
      label: true,
      storyAssemblySummary: true,
      linkedSourceId: true,
    },
  });

  if (!ds) {
    return "[Census research: dataset not imported — run npm run research:census-pipeline]";
  }

  const summary = ds.storyAssemblySummary?.trim() || DEFAULT_STORY_SUMMARY;

  const entries = await prisma.censusResearchEntry.findMany({
    where: { datasetId: CAMPTI_CENSUS_DATASET_ID },
    take: maxEntries,
    orderBy: { externalEntryId: "asc" },
    select: {
      externalEntryId: true,
      normalizedLabel: true,
      displayName: true,
      docPageCode: true,
      pageType: true,
      roleGuess: true,
      rawEntry: true,
    },
  });

  const pages = await prisma.censusResearchPage.findMany({
    where: {
      datasetId: CAMPTI_CENSUS_DATASET_ID,
      ocrText: { not: null },
    },
    take: maxPageSnippets,
    orderBy: { sortOrder: "asc" },
    select: {
      sortOrder: true,
      docPageCode: true,
      pageType: true,
      filename: true,
      ocrText: true,
    },
  });

  const missing = await prisma.censusResearchMissingPage.findMany({
    where: { datasetId: CAMPTI_CENSUS_DATASET_ID },
    orderBy: { insertAfterOrder: "asc" },
    select: {
      missingGroupId: true,
      status: true,
      description: true,
      insertAfterOrder: true,
      expectedSource: true,
      notes: true,
    },
  });

  const lines: string[] = [
    "## Louisiana colony census (structured research)",
    summary,
    ds.linkedSourceId ? `Linked source id: ${ds.linkedSourceId}` : "",
    "",
    "### Sample entries (structured)",
  ];

  for (const e of entries) {
    lines.push(
      `- [${e.externalEntryId}] ${e.normalizedLabel || "(no label)"} | page ${e.docPageCode ?? "?"} | ${e.pageType ?? "?"}${e.roleGuess ? ` | role: ${e.roleGuess}` : ""}`,
    );
    lines.push(`  ${excerpt(e.rawEntry, 320)}`);
  }

  if (missing.length) {
    lines.push("", "### Known gaps in page archive (do not invent OCR for these)");
    for (const m of missing) {
      lines.push(
        `- ${m.missingGroupId}${m.status ? ` [${m.status}]` : ""}: insert after page order ${m.insertAfterOrder ?? "?"}`,
      );
      if (m.description?.trim()) lines.push(`  ${m.description.trim()}`);
      if (m.expectedSource?.trim()) lines.push(`  Expected source: ${m.expectedSource.trim()}`);
      if (m.notes?.trim()) lines.push(`  Notes: ${m.notes.trim()}`);
    }
  }

  if (pages.length) {
    lines.push("", "### Page OCR snippets (verbatim extract)");
    for (const p of pages) {
      const ocr = p.ocrText ? excerpt(p.ocrText, ocrSnippetChars) : "";
      if (!ocr) continue;
      lines.push(`- order ${p.sortOrder} ${p.docPageCode ?? ""} (${p.pageType ?? ""}) ${p.filename}`);
      lines.push(`  ${ocr}`);
    }
  }

  return lines.filter(Boolean).join("\n");
}
