import "./load-env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";

const CANONICAL_SCENE_MAX = 17;

async function main() {
  const unexpectedAnchors = await prisma.book1SceneAnchor.findMany({
    where: { sceneNumber: { gt: CANONICAL_SCENE_MAX } },
    orderBy: { sceneNumber: "asc" },
    include: {
      sceneComponents: {
        select: {
          id: true,
          componentKey: true,
          source: {
            select: {
              id: true,
              sourceKey: true,
              fileName: true,
              chunkNumber: true,
              notes: true,
            },
          },
        },
      },
    },
  });

  const anchorSummaries = unexpectedAnchors.map((anchor) => ({
    sceneNumber: anchor.sceneNumber,
    sceneKey: anchor.sceneKey,
    title: anchor.title,
    componentCount: anchor.sceneComponents.length,
    touchedBySources: [
      ...new Map(
        anchor.sceneComponents.map((component) => [
          component.source.id,
          {
            sourceId: component.source.id,
            sourceKey: component.source.sourceKey,
            fileName: component.source.fileName,
            chunkNumber: component.source.chunkNumber,
            componentKey: component.componentKey,
            notes: component.source.notes,
          },
        ]),
      ).values(),
    ],
  }));

  for (const anchor of unexpectedAnchors) {
    const prefixed = anchor.title.startsWith("[OUT_OF_SCOPE] ") ? anchor.title : `[OUT_OF_SCOPE] ${anchor.title}`;
    await prisma.book1SceneAnchor.update({
      where: { id: anchor.id },
      data: {
        title: prefixed,
        functionInBook: [
          anchor.functionInBook ?? "",
          "Out-of-scope anchor for Book 1 canonical guard (allowed range: 1-17).",
        ]
          .filter(Boolean)
          .join(" "),
      },
    });
  }

  const report = {
    ok: true,
    canonicalSceneMax: CANONICAL_SCENE_MAX,
    unexpectedAnchorCount: unexpectedAnchors.length,
    anchors: anchorSummaries,
  };
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(reportsDir, `book1-canonical-scene-anchor-guard-report-${stamp}.json`);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        unexpectedAnchorCount: unexpectedAnchors.length,
        reportPath: path.relative(process.cwd(), reportPath).replace(/\\/g, "/"),
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
