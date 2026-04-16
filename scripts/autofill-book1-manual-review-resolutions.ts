import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { Book1ManualReviewAutofillService } from "@/lib/services/book1-manual-review-autofill-service";

type AutofillMode = "legacy-targets" | "missing-required" | "dynamic-validator";
type TargetLayer = "primary_pov" | "environmental_layer" | "setting_layer" | "observer_layer";
type AutofillTarget = { sceneNumber: number; layer: TargetLayer };

function parseMode(argv: string[]): AutofillMode {
  const index = argv.indexOf("--mode");
  if (index === -1) return "dynamic-validator";
  const value = argv[index + 1];
  if (value === "dynamic-validator") return "dynamic-validator";
  if (value === "missing-required") return "missing-required";
  return "legacy-targets";
}

function isTargetLayer(value: string): value is TargetLayer {
  return value === "primary_pov" || value === "environmental_layer" || value === "setting_layer" || value === "observer_layer";
}

async function findLatestSceneIntegrityReportPath(reportsDir: string): Promise<string | null> {
  const files = await readdir(reportsDir).catch(() => []);
  const candidates = files.filter(
    (file) => file.startsWith("book1-scene-integrity-report-") && file.toLowerCase().endsWith(".json"),
  );
  if (candidates.length === 0) return null;
  const enriched = await Promise.all(
    candidates.map(async (file) => {
      const absolutePath = path.join(reportsDir, file);
      const info = await stat(absolutePath);
      return { absolutePath, modifiedAtMs: info.mtimeMs };
    }),
  );
  enriched.sort((a, b) => b.modifiedAtMs - a.modifiedAtMs);
  return enriched[0]?.absolutePath ?? null;
}

async function loadTargetsFromLatestValidatorReport(reportsDir: string): Promise<AutofillTarget[]> {
  const latestReport = await findLatestSceneIntegrityReportPath(reportsDir);
  if (!latestReport) return [];
  const parsed = JSON.parse(await readFile(latestReport, "utf-8")) as {
    missingLayers?: Array<{ sceneNumber?: number; layers?: string[] }>;
  };
  const targets: AutofillTarget[] = [];
  for (const row of parsed.missingLayers ?? []) {
    if (!row || typeof row.sceneNumber !== "number" || !Array.isArray(row.layers)) continue;
    for (const layer of row.layers) {
      if (!isTargetLayer(layer)) continue;
      targets.push({ sceneNumber: row.sceneNumber, layer });
    }
  }
  return targets;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const mode = parseMode(process.argv);
    const reportsDir = path.join(process.cwd(), "reports");
    const dynamicTargets = mode === "dynamic-validator" ? await loadTargetsFromLatestValidatorReport(reportsDir) : [];
    const service = new Book1ManualReviewAutofillService(prisma);
    const autofill = await service.build({
      mode,
      targetsOverride: dynamicTargets.length > 0 ? dynamicTargets : undefined,
    });

    await mkdir(reportsDir, { recursive: true });
    const outputFileName =
      mode === "dynamic-validator"
        ? "book1-manual-review-resolutions.autofill.dynamic.json"
        : "book1-manual-review-resolutions.autofill.json";
    const outputPath = path.join(reportsDir, outputFileName);
    await writeFile(outputPath, `${JSON.stringify(autofill, null, 2)}\n`, "utf-8");

    const compactSummary = autofill.suggestions.map((suggestion) => ({
      sceneNumber: suggestion.sceneNumber,
      layer: suggestion.layer,
      preferred: suggestion.suggestedPreferredComponentKey,
      backups: suggestion.backupCandidateComponentKeys,
      candidates: suggestion.candidates.map((candidate) => ({
        componentKey: candidate.componentKey,
        score: Number(candidate.score.toFixed(4)),
        preview: candidate.textContent,
        reason: candidate.reasonSummary,
      })),
    }));

    console.log(
      JSON.stringify(
        {
          outputPath: path.relative(process.cwd(), outputPath).replace(/\\/g, "/"),
          generatedAt: autofill.generatedAt,
          mode: autofill.mode,
          targetCount: autofill.targets.length,
          resolutionCount: autofill.resolutions.length,
          targetSource:
            mode === "dynamic-validator"
              ? dynamicTargets.length > 0
                ? "latest_scene_integrity_report"
                : "fallback_live_validator_query"
              : "configured_mode_targets",
          recommendations: compactSummary,
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
  console.error("Manual review autofill failed.");
  console.error(error);
  process.exitCode = 1;
});
