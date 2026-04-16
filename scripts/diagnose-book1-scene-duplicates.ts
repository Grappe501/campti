import "./load-env";
import { prisma } from "@/lib/prisma";

type DuplicateRow = {
  scene_number: number;
  component_type: string;
  component_count: number;
  component_keys: string[];
  source_keys: string[];
  canon_statuses: string[];
  confidence_types: string[];
  functional_tags: unknown[];
};

async function main() {
  const rows = await prisma.$queryRaw<DuplicateRow[]>`
    SELECT
      sa.scene_number,
      sc.component_type::text,
      COUNT(*)::int AS component_count,
      ARRAY_AGG(COALESCE(sc.component_key, sc.id) ORDER BY COALESCE(sc.component_key, sc.id)) AS component_keys,
      ARRAY_AGG(COALESCE(s.source_key, s.id) ORDER BY COALESCE(sc.component_key, sc.id)) AS source_keys,
      ARRAY_AGG(sc.canon_status::text ORDER BY COALESCE(sc.component_key, sc.id)) AS canon_statuses,
      ARRAY_AGG(sc.confidence_type::text ORDER BY COALESCE(sc.component_key, sc.id)) AS confidence_types,
      ARRAY_AGG(sc.functional_tags_json ORDER BY COALESCE(sc.component_key, sc.id)) AS functional_tags
    FROM scene_components sc
    JOIN scene_anchors sa ON sa.id = sc.scene_anchor_id
    JOIN sources s ON s.id = sc.source_id
    GROUP BY sa.scene_number, sc.component_type
    HAVING COUNT(*) > 1
    ORDER BY sa.scene_number, sc.component_type
  `;

  const byScene = new Map<
    number,
    {
      sceneNumber: number;
      layers: string[];
      totalDuplicateComponents: number;
      sourceKeys: string[];
      hasSeededSource: boolean;
      allCanonStatuses: string[];
    }
  >();
  for (const row of rows) {
    const current =
      byScene.get(row.scene_number) ??
      {
        sceneNumber: row.scene_number,
        layers: [],
        totalDuplicateComponents: 0,
        sourceKeys: [],
        hasSeededSource: false,
        allCanonStatuses: [],
      };
    current.layers.push(row.component_type.toLowerCase());
    current.totalDuplicateComponents += row.component_count;
    current.sourceKeys = [...new Set([...current.sourceKeys, ...row.source_keys])];
    current.hasSeededSource = current.hasSeededSource || row.source_keys.includes("book1_scene_01_river_layer_stack");
    current.allCanonStatuses = [...new Set([...current.allCanonStatuses, ...row.canon_statuses])];
    byScene.set(row.scene_number, current);
  }
  const sceneCases = [...byScene.values()].sort((a, b) => a.sceneNumber - b.sceneNumber);

  console.log(
    JSON.stringify(
      {
        ok: true,
        duplicateGroupCount: rows.length,
        sceneDuplicateCaseCount: sceneCases.length,
        sceneCases,
        rows,
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
