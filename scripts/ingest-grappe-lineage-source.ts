/**
 * Indexes Grappe lineage + world-building JSON as Sources (search / RAG).
 *
 *   npx tsx scripts/ingest-grappe-lineage-source.ts
 */
import "./load-env";
import {
  RecordType,
  SourceType,
  VisibilityStatus,
} from "@prisma/client";
import {
  getGrappeLineageWorldBuilding,
  getGrappeLineageWorking,
} from "../lib/lineage";
import { prisma } from "../lib/prisma";

const LINEAGE_SOURCE_ID = "source-grappe-lineage-working-v1";
const WORLD_BUILDING_SOURCE_ID = "source-grappe-world-building-v1";

function chunkText(text: string, target = 4000): string[] {
  const t = text.trim();
  if (!t) return [];
  const parts: string[] = [];
  let start = 0;
  while (start < t.length) {
    let end = Math.min(start + target, t.length);
    if (end < t.length) {
      const slice = t.slice(start, end);
      const br = slice.lastIndexOf("\n\n");
      if (br > target * 0.2) end = start + br;
    }
    const piece = t.slice(start, end).trim();
    if (piece) parts.push(piece);
    start = end;
  }
  return parts;
}

async function ingestJsonSource(opts: {
  sourceId: string;
  title: string;
  summary: string;
  raw: string;
  processingNotes: string;
  chunkLabelPrefix: string;
  textStatus: string;
}) {
  await prisma.source.upsert({
    where: { id: opts.sourceId },
    update: {
      title: opts.title,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      ingestionReady: true,
      summary: opts.summary,
      processingNotes: opts.processingNotes,
    },
    create: {
      id: opts.sourceId,
      title: opts.title,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      ingestionReady: true,
      summary: opts.summary,
      processingNotes: opts.processingNotes,
    },
  });

  const textRow = await prisma.sourceText.upsert({
    where: { sourceId: opts.sourceId },
    update: {
      rawText: opts.raw,
      normalizedText: opts.raw,
      textStatus: opts.textStatus,
    },
    create: {
      sourceId: opts.sourceId,
      rawText: opts.raw,
      normalizedText: opts.raw,
      textStatus: opts.textStatus,
    },
  });

  await prisma.sourceChunk.deleteMany({ where: { sourceId: opts.sourceId } });
  const parts = chunkText(opts.raw);
  for (let i = 0; i < parts.length; i++) {
    await prisma.sourceChunk.create({
      data: {
        sourceId: opts.sourceId,
        sourceTextId: textRow.id,
        chunkIndex: i,
        charCount: parts[i].length,
        rawText: parts[i],
        normalizedText: parts[i],
        textStatus: opts.textStatus,
        chunkLabel: `${opts.chunkLabelPrefix} ${i + 1}/${parts.length}`,
      },
    });
  }

  return parts.length;
}

async function main() {
  const data = getGrappeLineageWorking();
  const lineageRaw = JSON.stringify(data, null, 2);

  const wb = getGrappeLineageWorldBuilding();
  const wbRaw = JSON.stringify(wb, null, 2);

  const lineageChunks = await ingestJsonSource({
    sourceId: LINEAGE_SOURCE_ID,
    title: `${data.tree_name} (${data.status})`,
    summary: `${data.people.length} nodes (person + lineage_cluster). File: lib/lineage/grappe-lineage-working.v1.json`,
    raw: lineageRaw,
    processingNotes:
      "Grappe working lineage JSON. entity_type distinguishes documented persons vs lineage_cluster. Fiction layer: lib/lineage/grappe-world-building.v1.json (separate source).",
    chunkLabelPrefix: "lineage",
    textStatus: "lineage_json",
  });

  const wbChunks = await ingestJsonSource({
    sourceId: WORLD_BUILDING_SOURCE_ID,
    title: `Grappe world building (Campti setting) v${wb.version}`,
    summary: `Campti setting + ${wb.grappe_narrative_spine.length} spine beats + ${wb.documents.length} documents. File: lib/lineage/grappe-world-building.v1.json`,
    raw: wbRaw,
    processingNotes:
      "Fiction / simulation: not parish proof. Links to GRP-* ids from lineage file.",
    chunkLabelPrefix: "world_building",
    textStatus: "world_building_json",
  });

  console.log(
    "Ingested:",
    LINEAGE_SOURCE_ID,
    "chunks:",
    lineageChunks,
    "|",
    WORLD_BUILDING_SOURCE_ID,
    "chunks:",
    wbChunks,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
