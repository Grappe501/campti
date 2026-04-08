/**
 * Upsert Campti narrative DNA guide Source rows (Phase 9F.1 corpus).
 * Idempotent. Does not attach text — paste in Admin → Source text.
 *
 * Run:
 *   npm run db:narrative-dna-guides
 *   npm run db:narrative-dna-guides -- --extract   (OpenAI + DB; requires DATABASE_URL, keys)
 *   npm run db:narrative-dna-guides -- --consolidate
 *   npm run db:narrative-dna-guides -- --rebind
 */
import "./load-env";
import { RecordType, SourceType, VisibilityStatus } from "@prisma/client";
import {
  autoRebindNarrativeDnaToWorld,
  consolidateNarrativeDnaForSources,
} from "../lib/narrative-dna-consolidation";
import { NARRATIVE_DNA_GUIDE_SOURCES } from "../lib/narrative-dna-guide-constants";
import { ingestGuideNarrativeDnaForSource } from "../lib/narrative-dna-ingest-runner";
import { prisma } from "../lib/prisma";

function mapSourceType(t: "NOTE" | "DOCX"): SourceType {
  return t === "DOCX" ? SourceType.DOCX : SourceType.NOTE;
}

async function upsertGuideSources() {
  for (const s of NARRATIVE_DNA_GUIDE_SOURCES) {
    await prisma.source.upsert({
      where: { id: s.id },
      update: {
        title: s.title,
        sourceType: mapSourceType(s.sourceType),
        archiveStatus: "reviewed",
        ingestionReady: false,
      },
      create: {
        id: s.id,
        title: s.title,
        visibility: VisibilityStatus.PRIVATE,
        recordType: RecordType.HYBRID,
        sourceType: mapSourceType(s.sourceType),
        archiveStatus: "reviewed",
        ingestionReady: false,
        ingestionStatus: "dna_guide_corpus",
      },
    });
  }
  console.log("Upserted guide sources:", NARRATIVE_DNA_GUIDE_SOURCES.map((x) => x.id).join(", "));
}

async function main() {
  const args = process.argv.slice(2);
  const doExtract = args.includes("--extract");
  const doConsolidate = args.includes("--consolidate");
  const doRebind = args.includes("--rebind");

  await upsertGuideSources();

  if (doExtract) {
    let ok = 0;
    let fail = 0;
    for (const s of NARRATIVE_DNA_GUIDE_SOURCES) {
      const r = await ingestGuideNarrativeDnaForSource(s.id);
      if (r.ok) {
        ok++;
        console.log(`Extract OK: ${s.id} (${r.mode})`);
      } else {
        fail++;
        console.warn(`Extract skip/fail ${s.id}: ${r.error}`);
      }
    }
    console.log(`Extraction pass: ${ok} ok, ${fail} skipped/failed (missing text is expected until pasted).`);
  }

  if (doConsolidate) {
    const ids = NARRATIVE_DNA_GUIDE_SOURCES.map((x) => x.id);
    const r = await consolidateNarrativeDnaForSources(ids);
    console.log("Consolidation:", JSON.stringify(r, null, 2));
  }

  if (doRebind) {
    const r = await autoRebindNarrativeDnaToWorld();
    console.log("Rebind:", r);
  }

  if (!doExtract && !doConsolidate && !doRebind) {
    console.log("Tip: add --extract, --consolidate, and/or --rebind for full pipeline.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
