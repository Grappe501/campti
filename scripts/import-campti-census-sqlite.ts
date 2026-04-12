/**
 * Imports all tables from `campti_census.sqlite` into Postgres (`CensusResearch*` models).
 * Idempotent per dataset id: replaces child rows on each run.
 *
 *   npx tsx scripts/import-campti-census-sqlite.ts
 *
 *   CAMPTI_CENSUS_SQLITE_PATH="C:\\path\\to\\campti_census.sqlite" npx tsx scripts/import-campti-census-sqlite.ts
 */
import "./load-env";
import { createHash } from "crypto";
import Database from "better-sqlite3";
import { join } from "path";
import { CAMPTI_CENSUS_DATASET_ID } from "../lib/census-research";
import { normalizeCensusLabel } from "../lib/census-research-normalize";
import { prisma } from "../lib/prisma";

const STORY_ASSEMBLY_SUMMARY =
  "French colonial Louisiana census OCR (1699–1732 era excerpts): officers, habitants, household and " +
  "enslavement counts as transcribed from census tables. Names include OCR errors; use normalized labels for " +
  "matching. Historical grounding only — verify against primary sources for publication.";

const DEFAULT_SQLITE = join(
  process.env.USERPROFILE || process.env.HOME || "",
  "Downloads",
  "campti_census.sqlite",
);

function stableUploadSourceId(posixRel: string): string {
  const h = createHash("sha256")
    .update(`campti-upload:${posixRel}`)
    .digest("hex")
    .slice(0, 32);
  return `upload-${h}`;
}

function toBool(v: unknown): boolean {
  return v === 1 || v === true;
}

async function main() {
  const sqlitePath =
    process.env.CAMPTI_CENSUS_SQLITE_PATH?.trim() || DEFAULT_SQLITE;

  const db = new Database(sqlitePath, { readonly: true });

  const pages = db
    .prepare(
      `SELECT "order" AS page_order, filename, pager_raw, clean_len, text_hash, text_preview, ocr_text,
              page_type, doc_page_code, is_duplicate, title_guess FROM pages`,
    )
    .all() as Record<string, unknown>[];

  const entries = db
    .prepare(
      `SELECT entry_id, source_filename, source_order, doc_page_code, page_type, raw_entry, display_name,
              children_count, negro_slaves_count, indian_slaves_count, domestic_count,
              wife_mentioned, widow_mentioned, on_his_land, role_guess FROM entries`,
    )
    .all() as Record<string, unknown>[];

  const nameRows = db
    .prepare(
      `SELECT entry_id, display_name, normalized_name, source_filename, doc_page_code FROM name_index`,
    )
    .all() as Record<string, unknown>[];

  const missing = db
    .prepare(
      `SELECT missing_group_id, status, description, insert_after_order, expected_source, notes FROM missing_pages`,
    )
    .all() as Record<string, unknown>[];

  db.close();

  const normalizedByEntryId = new Map<number, string>();
  for (const r of nameRows) {
    const eid = r.entry_id != null && r.entry_id !== "" ? Number(r.entry_id) : NaN;
    if (Number.isNaN(eid)) continue;
    const nn = String(r.normalized_name ?? "").trim();
    if (!normalizedByEntryId.has(eid) && nn) normalizedByEntryId.set(eid, nn);
  }

  const linkedRel = "uploads/incoming/campti-research/campti_census.sqlite".replace(/\\/g, "/");
  const linkedSourceId = stableUploadSourceId(linkedRel);
  const sourceExists = await prisma.source.findUnique({
    where: { id: linkedSourceId },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.censusResearchPage.deleteMany({
      where: { datasetId: CAMPTI_CENSUS_DATASET_ID },
    });
    await tx.censusResearchEntry.deleteMany({
      where: { datasetId: CAMPTI_CENSUS_DATASET_ID },
    });
    await tx.censusResearchNameRow.deleteMany({
      where: { datasetId: CAMPTI_CENSUS_DATASET_ID },
    });
    await tx.censusResearchMissingPage.deleteMany({
      where: { datasetId: CAMPTI_CENSUS_DATASET_ID },
    });

    await tx.censusResearchDataset.upsert({
      where: { id: CAMPTI_CENSUS_DATASET_ID },
      update: {
        label: "Campti / Louisiana colony census OCR (campti_census.sqlite)",
        sqliteOriginPath: sqlitePath,
        linkedSourceId: sourceExists ? linkedSourceId : null,
        storyAssemblySummary: STORY_ASSEMBLY_SUMMARY,
        notes:
          "Imported by scripts/import-campti-census-sqlite.ts. Pages + OCR text + parsed entries + name index + missing-page tracker. Normalized labels for story assembly / AI search.",
      },
      create: {
        id: CAMPTI_CENSUS_DATASET_ID,
        label: "Campti / Louisiana colony census OCR (campti_census.sqlite)",
        sqliteOriginPath: sqlitePath,
        linkedSourceId: sourceExists ? linkedSourceId : null,
        storyAssemblySummary: STORY_ASSEMBLY_SUMMARY,
        notes:
          "Imported by scripts/import-campti-census-sqlite.ts. Pages + OCR text + parsed entries + name index + missing-page tracker. Normalized labels for story assembly / AI search.",
      },
    });

    if (pages.length) {
      await tx.censusResearchPage.createMany({
        data: pages.map((r) => ({
          datasetId: CAMPTI_CENSUS_DATASET_ID,
          sortOrder: Number(r.page_order),
          filename: String(r.filename ?? ""),
          pagerRaw: r.pager_raw != null ? String(r.pager_raw) : null,
          cleanLen: r.clean_len != null ? Number(r.clean_len) : null,
          textHash: r.text_hash != null ? String(r.text_hash) : null,
          textPreview: r.text_preview != null ? String(r.text_preview) : null,
          ocrText: r.ocr_text != null ? String(r.ocr_text) : null,
          pageType: r.page_type != null ? String(r.page_type) : null,
          docPageCode: r.doc_page_code != null ? String(r.doc_page_code) : null,
          isDuplicate: toBool(r.is_duplicate),
          titleGuess: r.title_guess != null ? String(r.title_guess) : null,
          normalizedTitleGuess: normalizeCensusLabel(
            r.title_guess != null ? String(r.title_guess) : "",
          ),
        })),
      });
    }

    if (entries.length) {
      await tx.censusResearchEntry.createMany({
        data: entries.map((r) => {
          const extId = Number(r.entry_id);
          const display = r.display_name != null ? String(r.display_name) : "";
          const normalizedLabel =
            normalizedByEntryId.get(extId) || normalizeCensusLabel(display);
          return {
          datasetId: CAMPTI_CENSUS_DATASET_ID,
          externalEntryId: extId,
          sourceFilename: String(r.source_filename ?? ""),
          sourceOrder: r.source_order != null ? Number(r.source_order) : null,
          docPageCode: r.doc_page_code != null ? String(r.doc_page_code) : null,
          pageType: r.page_type != null ? String(r.page_type) : null,
          rawEntry: String(r.raw_entry ?? ""),
          displayName: r.display_name != null ? String(r.display_name) : null,
          normalizedLabel,
          childrenCount:
            r.children_count != null && r.children_count !== ""
              ? Number(r.children_count)
              : null,
          negroSlavesCount:
            r.negro_slaves_count != null && r.negro_slaves_count !== ""
              ? Number(r.negro_slaves_count)
              : null,
          indianSlavesCount:
            r.indian_slaves_count != null && r.indian_slaves_count !== ""
              ? Number(r.indian_slaves_count)
              : null,
          domesticCount:
            r.domestic_count != null && r.domestic_count !== ""
              ? Number(r.domestic_count)
              : null,
          wifeMentioned: toBool(r.wife_mentioned),
          widowMentioned: toBool(r.widow_mentioned),
          onHisLand: toBool(r.on_his_land),
          roleGuess: r.role_guess != null ? String(r.role_guess) : null,
          };
        }),
      });
    }

    if (nameRows.length) {
      await tx.censusResearchNameRow.createMany({
        data: nameRows.map((r) => ({
          datasetId: CAMPTI_CENSUS_DATASET_ID,
          externalEntryId:
            r.entry_id != null && r.entry_id !== "" ? Number(r.entry_id) : null,
          displayName: String(r.display_name ?? ""),
          normalizedName: String(r.normalized_name ?? ""),
          sourceFilename: r.source_filename != null ? String(r.source_filename) : null,
          docPageCode: r.doc_page_code != null ? String(r.doc_page_code) : null,
        })),
      });
    }

    if (missing.length) {
      await tx.censusResearchMissingPage.createMany({
        data: missing.map((r) => ({
          datasetId: CAMPTI_CENSUS_DATASET_ID,
          missingGroupId: String(r.missing_group_id ?? ""),
          status: r.status != null ? String(r.status) : null,
          description: r.description != null ? String(r.description) : null,
          insertAfterOrder:
            r.insert_after_order != null ? Number(r.insert_after_order) : null,
          expectedSource: r.expected_source != null ? String(r.expected_source) : null,
          notes: r.notes != null ? String(r.notes) : null,
        })),
      });
    }
  });

  console.log(
    `Imported dataset ${CAMPTI_CENSUS_DATASET_ID} from ${sqlitePath}: ` +
      `${pages.length} pages, ${entries.length} entries, ${nameRows.length} name rows, ${missing.length} missing-page row(s).`,
  );
  if (!sourceExists) {
    console.warn(
      `No Source at ${linkedSourceId} — run npm run uploads:sync-research (or uploads:index) so linkedSourceId can attach to the indexed .sqlite upload.`,
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
