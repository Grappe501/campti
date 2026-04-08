/**
 * One-off: narrative system document — source + symbols + open questions + continuity notes.
 * Not part of `prisma db seed`. Safe to re-run (idempotent upserts by fixed ids).
 */
import "./load-env";
import {
  RecordType,
  SourceType,
  SymbolCategory,
  VisibilityStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

const SOURCE_ID = "source-narrative-system-subthemes";
const SOURCE_TITLE = "Narrative System – Subthemes, Motifs, and Literary Devices";

const SYMBOL_SPECS: {
  id: string;
  name: string;
  category: SymbolCategory | null;
}[] = [
  { id: "narrative-sys-symbol-gumbo", name: "Gumbo", category: SymbolCategory.CULINARY },
  {
    id: "narrative-sys-symbol-graveyard-line",
    name: "Graveyard Line",
    category: SymbolCategory.LANDSCAPE,
  },
  { id: "narrative-sys-symbol-billy-club", name: "Billy Club", category: null },
  { id: "narrative-sys-symbol-fire", name: "Fire", category: SymbolCategory.ELEMENTAL },
  { id: "narrative-sys-symbol-smoke", name: "Smoke", category: SymbolCategory.ELEMENTAL },
  { id: "narrative-sys-symbol-garden", name: "Garden", category: SymbolCategory.LANDSCAPE },
];

const OPEN_QUESTIONS: { id: string; title: string }[] = [
  {
    id: "narrative-sys-oq-strength",
    title: "What defines strength in the Grappe lineage?",
  },
  {
    id: "narrative-sys-oq-memory-truth",
    title: "Where does memory diverge from truth?",
  },
  {
    id: "narrative-sys-oq-identity",
    title: "What is inherited vs chosen identity?",
  },
  {
    id: "narrative-sys-oq-faith",
    title: "Where does faith heal vs harm?",
  },
  {
    id: "narrative-sys-oq-power",
    title: "Who truly holds power in the family?",
  },
];

const CONTINUITY_NOTES: { id: string; title: string }[] = [
  { id: "narrative-sys-cn-nonlinear", title: "Narrative must remain nonlinear" },
  {
    id: "narrative-sys-cn-memory-contradictions",
    title: "Memory contradictions are intentional",
  },
  {
    id: "narrative-sys-cn-emotional-truth",
    title: "Emotional truth > factual certainty",
  },
  {
    id: "narrative-sys-cn-oral-voice",
    title: "Preserve oral storytelling voice",
  },
];

async function main() {
  await prisma.source.upsert({
    where: { id: SOURCE_ID },
    update: {
      title: SOURCE_TITLE,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      ingestionReady: false,
      ingestionStatus: null,
      notes:
        "Narrative system / craft rules — not factual source material. Do not run extraction; use for themes and constraints only.",
    },
    create: {
      id: SOURCE_ID,
      title: SOURCE_TITLE,
      visibility: VisibilityStatus.PRIVATE,
      recordType: RecordType.HYBRID,
      sourceType: SourceType.NOTE,
      ingestionReady: false,
      notes:
        "Narrative system / craft rules — not factual source material. Do not run extraction; use for themes and constraints only.",
    },
  });

  for (const s of SYMBOL_SPECS) {
    const existingByName = await prisma.symbol.findFirst({
      where: { name: s.name },
      select: { id: true },
    });
    if (existingByName && existingByName.id !== s.id) {
      const prev = await prisma.symbol.findUnique({
        where: { id: existingByName.id },
        select: { sourceTraceNote: true },
      });
      const tag = `Narrative system doc (${SOURCE_ID})`;
      const merged = [prev?.sourceTraceNote?.trim(), tag].filter(Boolean).join(" · ");
      await prisma.symbol.update({
        where: { id: existingByName.id },
        data: { sourceTraceNote: merged },
      });
      console.warn(
        `Symbol "${s.name}" already exists (${existingByName.id}); updated sourceTraceNote.`,
      );
      continue;
    }
    await prisma.symbol.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        visibility: VisibilityStatus.PRIVATE,
        recordType: RecordType.HYBRID,
        category: s.category,
        sourceTraceNote: `Motif/symbol from narrative system doc (${SOURCE_ID}).`,
      },
      create: {
        id: s.id,
        name: s.name,
        visibility: VisibilityStatus.PRIVATE,
        recordType: RecordType.HYBRID,
        category: s.category,
        sourceTraceNote: `Motif/symbol from narrative system doc (${SOURCE_ID}).`,
      },
    });
  }

  for (const q of OPEN_QUESTIONS) {
    await prisma.openQuestion.upsert({
      where: { id: q.id },
      update: {
        title: q.title,
        status: "open",
        linkedSourceId: SOURCE_ID,
        sourceTraceNote: `From narrative system doc (${SOURCE_ID}).`,
      },
      create: {
        id: q.id,
        title: q.title,
        status: "open",
        linkedSourceId: SOURCE_ID,
        sourceTraceNote: `From narrative system doc (${SOURCE_ID}).`,
      },
    });
  }

  for (const n of CONTINUITY_NOTES) {
    await prisma.continuityNote.upsert({
      where: { id: n.id },
      update: {
        title: n.title,
        severity: "high",
        status: "open",
        sourceTraceNote: `Global narrative rule from system doc (${SOURCE_ID}).`,
      },
      create: {
        id: n.id,
        title: n.title,
        severity: "high",
        status: "open",
        sourceTraceNote: `Global narrative rule from system doc (${SOURCE_ID}).`,
      },
    });
  }

  console.log("Done:", {
    sourceId: SOURCE_ID,
    symbols: SYMBOL_SPECS.length,
    openQuestions: OPEN_QUESTIONS.length,
    continuityNotes: CONTINUITY_NOTES.length,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
