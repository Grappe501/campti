import "./load-env";
import type { Book1SceneComponentType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resolveSceneLayerPreference } from "@/lib/services/book1-scene-layer-resolution-service";

type GroupRow = {
  scene_anchor_id: string;
  component_type: Book1SceneComponentType;
  component_count: number;
};

async function main() {
  const duplicateGroups = await prisma.$queryRaw<GroupRow[]>`
    SELECT
      sc.scene_anchor_id,
      sc.component_type,
      COUNT(*)::int AS component_count
    FROM scene_components sc
    GROUP BY sc.scene_anchor_id, sc.component_type
    HAVING COUNT(*) > 1
  `;

  const actions: Array<{
    sceneAnchorId: string;
    componentType: string;
    preferredComponentId: string;
    preferredComponentKey: string | null;
    demotedCount: number;
    supersededCount: number;
    totalInLayer: number;
  }> = [];

  for (const group of duplicateGroups) {
    const resolved = await resolveSceneLayerPreference({
      db: prisma,
      sceneAnchorId: group.scene_anchor_id,
      componentType: group.component_type,
    });
    if (!resolved) continue;
    actions.push({
      sceneAnchorId: group.scene_anchor_id,
      componentType: group.component_type,
      preferredComponentId: resolved.preferredComponentId,
      preferredComponentKey: resolved.preferredComponentKey,
      demotedCount: resolved.demotedComponentIds.length,
      supersededCount: resolved.supersededComponentIds.length,
      totalInLayer: resolved.totalInLayer,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        duplicateGroupsScanned: duplicateGroups.length,
        groupsReconciled: actions.length,
        totalDemoted: actions.reduce((sum, row) => sum + row.demotedCount, 0),
        totalSuperseded: actions.reduce((sum, row) => sum + row.supersededCount, 0),
        actions,
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
