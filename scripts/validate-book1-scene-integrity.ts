import "./load-env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import {
  Book1SceneIntegrityValidator,
  type SceneAnchorRow,
  type SceneComponentRow,
} from "@/lib/services/book1-scene-integrity-validator";

function normalizeComponentType(raw: string): SceneComponentRow["componentType"] {
  return raw.toLowerCase() as SceneComponentRow["componentType"];
}

const CANONICAL_SCENE_MIN = 1;
const CANONICAL_SCENE_MAX = 17;

async function main() {
  const tableRows = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('scene_anchors', 'scene_components')
  `;
  const found = new Set(tableRows.map((row) => row.table_name));
  const missingTables = ["scene_anchors", "scene_components"].filter((tableName) => !found.has(tableName));

  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(reportsDir, `book1-scene-integrity-report-${stamp}.json`);

  if (missingTables.length > 0) {
    const diagnostics = {
      ok: false,
      reason: "missing_scene_tables",
      missingTables,
      suggestion: "Run Book 1 ingestion migration before scene validation.",
      generatedAt: new Date().toISOString(),
    };
    await writeFile(outPath, `${JSON.stringify(diagnostics, null, 2)}\n`, "utf8");
    console.log(
      JSON.stringify(
        {
          ...diagnostics,
          reportPath: path.relative(process.cwd(), outPath).replace(/\\/g, "/"),
        },
        null,
        2,
      ),
    );
    return;
  }

  const sceneAnchors = await prisma.$queryRaw<Array<{ id: string; scene_number: number; scene_key: string; title: string }>>`
    SELECT "id", "scene_number", "scene_key", "title"
    FROM "scene_anchors"
    ORDER BY "scene_number" ASC
  `;
  const sceneComponents = await prisma.$queryRaw<
    Array<{
      id: string;
      scene_anchor_id: string;
      component_key: string | null;
      component_type: string;
      component_subtype: string | null;
      confidence_type: string;
      canon_status: string;
      source_key: string | null;
      text_content: string;
    }>
  >`
    SELECT
      sc."id",
      sc."scene_anchor_id",
      sc."component_key",
      sc."component_type",
      sc."component_subtype",
      sc."confidence_type",
      sc."canon_status",
      s."source_key",
      sc."text_content"
    FROM "scene_components" sc
    JOIN "sources" s ON s."id" = sc."source_id"
  `;

  const canonicalAnchors = sceneAnchors.filter(
    (row) => row.scene_number >= CANONICAL_SCENE_MIN && row.scene_number <= CANONICAL_SCENE_MAX,
  );
  const unexpectedAnchors = sceneAnchors.filter(
    (row) => row.scene_number < CANONICAL_SCENE_MIN || row.scene_number > CANONICAL_SCENE_MAX,
  );
  const canonicalAnchorIds = new Set(canonicalAnchors.map((row) => row.id));
  const canonicalSceneComponents = sceneComponents.filter((row) => canonicalAnchorIds.has(row.scene_anchor_id));

  const validator = new Book1SceneIntegrityValidator();
  const report = validator.evaluate({
    sceneAnchors: canonicalAnchors.map<SceneAnchorRow>((row) => ({
      id: row.id,
      sceneNumber: row.scene_number,
      sceneKey: row.scene_key,
      title: row.title,
    })),
    sceneComponents: canonicalSceneComponents.map<SceneComponentRow>((row) => ({
      id: row.id,
      sceneAnchorId: row.scene_anchor_id,
      componentKey: row.component_key,
      componentType: normalizeComponentType(row.component_type),
      componentSubtype: row.component_subtype,
      confidenceType: row.confidence_type,
      canonStatus: row.canon_status,
      sourceKey: row.source_key,
      textContent: row.text_content,
    })),
  });

  const reportWithDiagnostics = {
    ...report,
    diagnostics: {
      totalSceneAnchorsInDb: sceneAnchors.length,
      canonicalSceneAnchorCount: canonicalAnchors.length,
      unexpectedSceneAnchorCount: unexpectedAnchors.length,
      unexpectedSceneAnchors: unexpectedAnchors.map((row) => ({
        sceneNumber: row.scene_number,
        sceneKey: row.scene_key,
        title: row.title,
      })),
    },
  };

  await writeFile(outPath, `${JSON.stringify(reportWithDiagnostics, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        sceneCount: report.sceneDiagnostics.length,
        totalSceneAnchorsInDb: sceneAnchors.length,
        canonicalSceneAnchorCount: canonicalAnchors.length,
        unexpectedSceneAnchorCount: unexpectedAnchors.length,
        scenesWithMissingLayers: report.missingLayers.length,
        scenesWithDuplicateLayers: report.duplicateLayers.length,
        lowConfidenceAssignments: report.lowConfidenceAssignments.length,
        reportPath: path.relative(process.cwd(), outPath).replace(/\\/g, "/"),
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
