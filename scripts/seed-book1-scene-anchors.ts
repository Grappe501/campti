import "./load-env";
import { prisma } from "../lib/prisma";

function buildSceneKey(sceneNumber: number): string {
  return `book1_scene_${String(sceneNumber).padStart(2, "0")}`;
}

function buildSceneTitle(sceneNumber: number): string {
  return `Book 1 Anchor Scene ${String(sceneNumber).padStart(2, "0")} (placeholder)`;
}

async function main() {
  for (let sceneNumber = 1; sceneNumber <= 17; sceneNumber++) {
    const sceneKey = buildSceneKey(sceneNumber);
    const title = buildSceneTitle(sceneNumber);
    const stableId = `book1-scene-anchor-${String(sceneNumber).padStart(2, "0")}`;

    await prisma.$executeRaw`
      INSERT INTO "scene_anchors" (
        "id",
        "scene_number",
        "scene_key",
        "title",
        "current_status",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${stableId},
        ${sceneNumber},
        ${sceneKey},
        ${title},
        'STUB',
        NOW(),
        NOW()
      )
      ON CONFLICT ("scene_number")
      DO UPDATE SET
        "scene_key" = EXCLUDED."scene_key",
        "title" = EXCLUDED."title",
        "updated_at" = NOW()
    `;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        seededSceneAnchors: 17,
        sceneRange: "1-17",
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
