import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { Book1PreferredNarrativeExtractor } from "@/lib/services/book1-preferred-narrative-extractor";
import type { NarrativeLayer } from "@/lib/services/book1-preferred-narrative-extractor";

function parseIntFlag(argv: string[], flag: string): number | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) return undefined;
  const raw = argv[index + 1];
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseBooleanFlag(argv: string[], flag: string, fallback: boolean): boolean {
  if (argv.includes(flag)) return true;
  if (argv.includes(`--no-${flag.replace(/^--/, "")}`)) return false;
  return fallback;
}

function buildStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function toNarrativeLayer(raw: string): NarrativeLayer {
  const normalized = raw.toLowerCase();
  if (normalized === "setting_layer") return "setting_layer";
  if (normalized === "environmental_layer") return "environmental_layer";
  if (normalized === "primary_pov") return "primary_pov";
  if (normalized === "observer_layer") return "observer_layer";
  if (normalized === "interpretive_layer") return "interpretive_layer";
  return "symbolic_layer";
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const fromScene = parseIntFlag(process.argv, "--from-scene");
    const toScene = parseIntFlag(process.argv, "--to-scene");
    const includeInterpretiveLayer = parseBooleanFlag(process.argv, "--include-interpretive", true);
    const includeSymbolicLayer = parseBooleanFlag(process.argv, "--include-symbolic", true);
    const includeCandidates = parseBooleanFlag(process.argv, "--include-candidates", true);
    const candidateTopN = parseIntFlag(process.argv, "--candidate-top-n") ?? 2;

    const anchors = await prisma.book1SceneAnchor.findMany({
      where: {
        sceneNumber: {
          gte: fromScene,
          lte: toScene,
        },
      },
      select: {
        id: true,
        sceneNumber: true,
        sceneKey: true,
        title: true,
      },
      orderBy: [{ sceneNumber: "asc" }],
    });

    const anchorIds = anchors.map((anchor) => anchor.id);
    if (anchorIds.length === 0) {
      console.log("No scene anchors found for requested range.");
      return;
    }

    const components = await prisma.book1SceneComponent.findMany({
      where: {
        sceneAnchorId: { in: anchorIds },
      },
      select: {
        id: true,
        componentKey: true,
        sceneAnchorId: true,
        componentType: true,
        canonStatus: true,
        confidenceType: true,
        textContent: true,
        summary: true,
        functionInScene: true,
        orderPriority: true,
        source: {
          select: {
            sourceKey: true,
            title: true,
            chunkNumber: true,
          },
        },
      },
      orderBy: [{ sceneAnchorId: "asc" }, { componentType: "asc" }, { orderPriority: "asc" }],
    });

    const anchorById = new Map(anchors.map((anchor) => [anchor.id, anchor]));
    const extractor = new Book1PreferredNarrativeExtractor();
    const result = extractor.extract({
      sceneComponents: components
        .map((component) => {
          const anchor = anchorById.get(component.sceneAnchorId);
          if (!anchor) return null;
          return {
            id: component.id,
            componentKey: component.componentKey,
            sceneAnchorId: component.sceneAnchorId,
            sceneNumber: anchor.sceneNumber,
            sceneKey: anchor.sceneKey,
            sceneTitle: anchor.title,
            componentType: toNarrativeLayer(component.componentType),
            canonStatus: component.canonStatus,
            confidenceType: component.confidenceType,
            textContent: component.textContent,
            summary: component.summary,
            functionInScene: component.functionInScene,
            orderPriority: component.orderPriority,
            sourceKey: component.source?.sourceKey ?? null,
            sourceFileName: component.source?.title ?? null,
            sourceChunkNumber: component.source?.chunkNumber ?? null,
          };
        })
        .filter((row) => row !== null),
      options: {
        includeInterpretiveLayer,
        includeSymbolicLayer,
        includeCandidates,
        candidateTopN: Math.max(0, candidateTopN),
      },
    });

    const reportsDir = path.join(process.cwd(), "reports");
    await mkdir(reportsDir, { recursive: true });
    const stamp = buildStamp();
    const jsonPath = path.join(reportsDir, `book1-preferred-narratives-${stamp}.json`);
    const textPath = path.join(reportsDir, `book1-preferred-narratives-${stamp}.txt`);
    await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`, "utf-8");
    const plainText = result.scenes.map((scene) => scene.plainText).join("\n\n---\n\n");
    await writeFile(textPath, `${plainText}\n`, "utf-8");

    console.log(
      JSON.stringify(
        {
          scenes: result.scenes.length,
          includeCandidates: result.options.includeCandidates,
          candidateTopN: result.options.candidateTopN,
          jsonPath: path.relative(process.cwd(), jsonPath),
          textPath: path.relative(process.cwd(), textPath),
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Preferred narrative extraction failed.");
  console.error(error);
  process.exitCode = 1;
});
