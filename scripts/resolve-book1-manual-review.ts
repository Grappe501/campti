import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import {
  Book1ManualReviewResolver,
  type ManualReviewResolution,
} from "@/lib/services/book1-manual-review-resolver";

function parseStringFlag(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) return undefined;
  return argv[index + 1];
}

function buildStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

const DEFAULT_TEMPLATE = {
  instructions:
    "Fill resolutions and rerun script. Use set_preferred for scene+layer preference and set_status for explicit one-off promotion/demotion.",
  resolutions: [
    {
      action: "set_preferred",
      sceneNumber: 4,
      layer: "observer_layer",
      preferredComponentKey: "book1-scene4-observer-manual-choice",
      demoteOthersTo: "CANDIDATE",
      note: "Manual curation for scene 4 observer stack.",
    },
    {
      action: "set_preferred",
      sceneNumber: 11,
      layer: "environmental_layer",
      preferredComponentKey: "book1-scene11-environment-manual-choice",
      demoteOthersTo: "CANDIDATE",
      note: "Manual curation for scene 11 environmental stack.",
    },
  ],
};

async function fileExists(absolutePath: string): Promise<boolean> {
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

function coerceResolutions(raw: unknown): ManualReviewResolution[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const action = (item as { action?: string }).action;
      if (action === "set_status") {
        const row = item as {
          componentKey?: string;
          targetStatus?: string;
          note?: string;
        };
        if (!row.componentKey || !row.targetStatus) return null;
        return {
          action,
          componentKey: row.componentKey,
          targetStatus: row.targetStatus.toUpperCase(),
          note: row.note,
        } as ManualReviewResolution;
      }
      if (action === "set_preferred") {
        const row = item as {
          sceneNumber?: number;
          layer?: string;
          preferredComponentKey?: string;
          demoteOthersTo?: string;
          note?: string;
        };
        if (!row.sceneNumber || !row.layer || !row.preferredComponentKey) return null;
        return {
          action,
          sceneNumber: row.sceneNumber,
          layer: row.layer.toLowerCase(),
          preferredComponentKey: row.preferredComponentKey,
          demoteOthersTo: row.demoteOthersTo?.toUpperCase(),
          note: row.note,
        } as ManualReviewResolution;
      }
      if (action === "set_preferred_with_retype") {
        const row = item as {
          sceneNumber?: number;
          layer?: string;
          preferredComponentKey?: string;
          demoteOthersTo?: string;
          note?: string;
        };
        if (!row.sceneNumber || !row.layer || !row.preferredComponentKey) return null;
        return {
          action,
          sceneNumber: row.sceneNumber,
          layer: row.layer.toLowerCase(),
          preferredComponentKey: row.preferredComponentKey,
          demoteOthersTo: row.demoteOthersTo?.toUpperCase(),
          note: row.note,
        } as ManualReviewResolution;
      }
      return null;
    })
    .filter((resolution): resolution is ManualReviewResolution => resolution !== null);
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const relativeResolutionPath =
      parseStringFlag(process.argv, "--resolutions") ?? "reports/book1-manual-review-resolutions.json";
    const absoluteResolutionPath = path.join(process.cwd(), relativeResolutionPath);

    if (!(await fileExists(absoluteResolutionPath))) {
      await mkdir(path.dirname(absoluteResolutionPath), { recursive: true });
      await writeFile(absoluteResolutionPath, `${JSON.stringify(DEFAULT_TEMPLATE, null, 2)}\n`, "utf-8");
      console.log(`Resolution template created at ${relativeResolutionPath}. Edit it and rerun.`);
      return;
    }

    const parsed = JSON.parse(await readFile(absoluteResolutionPath, "utf-8")) as {
      resolutions?: unknown;
    };
    const resolutions = coerceResolutions(parsed.resolutions);
    if (resolutions.length === 0) {
      console.log("No valid resolutions found. Nothing to apply.");
      return;
    }

    const resolver = new Book1ManualReviewResolver(prisma);
    const outcome = await resolver.apply(resolutions);
    const report = {
      generatedAt: new Date().toISOString(),
      resolutionFile: relativeResolutionPath,
      requested: resolutions.length,
      appliedCount: outcome.applied.length,
      skippedCount: outcome.skipped.length,
      failedCount: outcome.failed.length,
      ...outcome,
    };

    const reportsDir = path.join(process.cwd(), "reports");
    await mkdir(reportsDir, { recursive: true });
    const outputPath = path.join(reportsDir, `book1-manual-review-resolution-report-${buildStamp()}.json`);
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");

    console.log(
      JSON.stringify(
        {
          requested: report.requested,
          applied: report.appliedCount,
          skipped: report.skippedCount,
          failed: report.failedCount,
          reportPath: path.relative(process.cwd(), outputPath),
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
  console.error("Manual review resolver failed.");
  console.error(error);
  process.exitCode = 1;
});
