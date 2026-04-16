import "./load-env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import { Book1BulkIngestionOrchestrator } from "@/lib/services/book1-bulk-ingestion-orchestrator";
import { normalizeChunkLabel } from "@/lib/services/book1-bulk-ingestion-types";

type CliOptions = {
  dryRun: boolean;
  fromChunk: number | null;
  toChunk: number | null;
};

function parseArgs(argv: string[]): CliOptions {
  let dryRun = false;
  let fromChunk: number | null = null;
  let toChunk: number | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if ((arg === "--from" || arg === "--from-chunk") && argv[i + 1]) {
      fromChunk = normalizeChunkLabel(argv[++i]);
      continue;
    }
    if ((arg === "--to" || arg === "--to-chunk") && argv[i + 1]) {
      toChunk = normalizeChunkLabel(argv[++i]);
    }
  }

  if ((fromChunk !== null && !Number.isFinite(fromChunk)) || (toChunk !== null && !Number.isFinite(toChunk))) {
    throw new Error("Invalid chunk range. Use numeric values or labels like chunk5.");
  }
  if (fromChunk !== null && toChunk !== null && fromChunk > toChunk) {
    throw new Error("--from must be less than or equal to --to.");
  }

  return { dryRun, fromChunk, toChunk };
}

async function writeReports(report: unknown, manualReviewQueue: string[]): Promise<{ reportPath: string; queuePath: string }> {
  const reportsDir = path.join(process.cwd(), "reports");
  await mkdir(reportsDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(reportsDir, `book1-bulk-ingestion-report-${stamp}.json`);
  const queuePath = path.join(reportsDir, `book1-manual-review-queue-${stamp}.json`);

  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(
    queuePath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), manualReviewQueue }, null, 2)}\n`,
    "utf8",
  );
  return { reportPath, queuePath };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const orchestrator = new Book1BulkIngestionOrchestrator();
  const report = await orchestrator.run({
    dryRun: options.dryRun,
    range: {
      fromChunk: options.fromChunk,
      toChunk: options.toChunk,
    },
  });

  const manualReviewQueue = report.results.flatMap((row) =>
    row.manualReviewQueue.map((entry) => `${row.chunkFileName}: ${entry}`),
  );
  const reportFiles = await writeReports(report, manualReviewQueue);

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun: options.dryRun,
        range: report.range,
        summary: report.summary,
        reportPath: path.relative(process.cwd(), reportFiles.reportPath).replace(/\\/g, "/"),
        manualReviewQueuePath: path.relative(process.cwd(), reportFiles.queuePath).replace(/\\/g, "/"),
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
